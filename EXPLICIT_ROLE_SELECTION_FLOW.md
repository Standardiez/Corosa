# EXPLICIT ROLE-SELECTION LOGIN FLOW
## Implementation Complete ✅

---

## Overview

The system now implements an **explicit role-selection authentication flow** where users must actively choose their role ("Book a Ride" or "Offer a Ride") before authentication. This allows users registered for multiple roles to select which role to use during that session.

### Key Principle
**User Intent + Role Validation = Session Role Assignment**

The button clicked at `index.html` determines the intended role, then the server validates that the user is actually registered for that role.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. INDEX.HTML - EXPLICIT ROLE SELECTION                          │
│    • "Book a Ride" → flowIntent='passenger' → login.html         │
│    • "Offer a Ride" → flowIntent='driver' → login.html           │
└─────────────────────┬──────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. LOGIN.HTML & LOGIN.JS - AUTHENTICATION                        │
│    • User submits email/password                                 │
│    • Backend validates and returns user's actual role            │
│    • Frontend compares flowIntent with actual role               │
└─────────────────────┬──────────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │ Role Validation Check       │
        └─────────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
        ▼                            ▼
   MATCH                        MISMATCH
   (User has role)              (User lacks role)
        │                            │
        ▼                            ▼
   REDIRECT TO          REDIRECT TO
   HOMEPAGE             REGISTRATION
        │                            │
        ▼                            ▼
   Driver:              ┌──────────────────────────────────┐
   driver-Homepage.html │ REGISTRATION FORM                │
                        │ • driver-registration.html       │
   Passenger:           │ • File upload                    │
   landing-page.html    │ • Vehicle details                │
                        │ • Driver license                 │
                        └──────────────────────────────────┘
                                     │
                                     ▼
                        ┌──────────────────────────────────┐
                        │ DRIVER REGISTRATION BACKEND      │
                        │ • driver-registration-handler.php│
                        │ • Validates user                 │
                        │ • Creates driver profile         │
                        │ • Creates vehicle profile        │
                        └──────────────────────────────────┘
                                     │
                                     ▼
                        User can now log in as driver
```

---

## User Scenarios

### Scenario 1: User Registered ONLY as Passenger

**Situation:** User account exists only in `users` table, not in `driver` table

**Flow:**
1. Click "Book a Ride" → `flowIntent='passenger'`
2. Login → Server: `role='passenger'` ✓
3. Match found → Redirect to `landing-page.html` ✅

**If clicks "Offer a Ride":**
1. Click "Offer a Ride" → `flowIntent='driver'`
2. Login → Server: `role='passenger'` (no driver record)
3. Mismatch detected → Redirect to `driver-registration.html`
4. Complete driver registration form
5. Backend creates driver profile and vehicle
6. User can now log in as driver ✅

---

### Scenario 2: User Registered ONLY as Driver

**Situation:** User account exists in `driver` table, created through driver registration

**Flow (Intended Use):**
1. Click "Offer a Ride" → `flowIntent='driver'`
2. Login → Server: `role='driver'` ✓
3. Match found → Redirect to `driver-Homepage.html` ✅

**If clicks "Book a Ride":**
1. Click "Book a Ride" → `flowIntent='passenger'`
2. Login → Server: `role='driver'` (no passenger profile)
3. Mismatch detected → Message shown
4. Proceeds to passenger side (driver can use app as passenger)
5. Passengers are created during account signup, drivers opt-in

---

### Scenario 3: User Registered as BOTH

**Situation:** User has both passenger and driver roles

**Flow:**
1. Can click either button and will be authenticated as that role
2. "Book a Ride" → `flowIntent='passenger'` → `landing-page.html`
3. "Offer a Ride" → `flowIntent='driver'` → `driver-Homepage.html`
4. Session role matches button clicked ✅

---

## Implementation Details

### Files Created/Modified

#### 1. **public/shared/pages/driver-registration.html** (NEW)
- Separate driver registration form
- Fields:
  - Driver license image (file upload)
  - Plate number
  - Vehicle model
  - Seat capacity
- Validates file type and size (max 5MB)
- Reads user email from localStorage (read-only)
- Submits to `driver-registration-handler.php`

**Key Features:**
```javascript
// Initialize form with user's email
const userData = JSON.parse(localStorage.getItem("userData"));
emailInput.value = userData.email;

// Submit with file upload
const submitData = new FormData();
submitData.append("email", email);
submitData.append("driverLicenseImage", driverLicenseFile);
submitData.append("plateNumber", plateNumber);
submitData.append("vehicleModel", vehicleModel);
submitData.append("seatCapacity", seatCapacity);
```

#### 2. **backend/api/driver/driver-registration-handler.php** (NEW)
- Backend handler for driver profile creation
- Validates inputs (email, file, plate number, vehicle info)
- Checks user exists in database
- Checks user isn't already registered as driver
- Handles file upload to `/assets/driver-licenses/`
- Creates entries in:
  - `driver` table (with driver_license_image path)
  - `vehicle` table (with plate_number as primary key)

**Request Format:**
```php
POST /Corosa/backend/api/driver/driver-registration-handler.php
Content-Type: multipart/form-data

Fields:
- userId: int (user ID from localStorage)
- email: string (user email)
- driverLicenseImage: file (JPG/PNG, max 5MB)
- plateNumber: string (uppercase, e.g., "ABC 1234")
- vehicleModel: string (e.g., "Honda Civic 2020")
- seatCapacity: int (2-8)
```

**Response (Success):**
```json
{
  "success": true,
  "driverId": 456,
  "vehicleId": "ABC 1234",
  "message": "Driver profile created successfully. You can now log in as a driver."
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "User already registered as a driver",
  "errors": {
    "driver": "already_driver"
  }
}
```

#### 3. **public/shared/js/login.js** (MODIFIED)
- Implements role validation logic after authentication
- Compares `flowIntent` (user's button choice) with actual `role` from server
- Three main scenarios:

**Scenario A: flowIntent='driver' && role='driver'**
```javascript
// Match found - proceed as driver
window.location.href = '../../driver/pages/driver-Homepage.html';
```

**Scenario B: flowIntent='driver' && role!='driver'**
```javascript
// Mismatch - user selected driver but isn't registered
// Redirect to registration form
sessionStorage.setItem('registrationPending', 'driver');
window.location.href = '../pages/driver-registration.html';
```

**Scenario C: flowIntent='passenger' && role any value**
```javascript
// Passenger flow is default
// Users registering as passengers do so during signup
window.location.href = '../../passenger/pages/landing-page.html';
```

#### 4. **public/shared/pages/index.html** (ALREADY CORRECT)
- Two action buttons:
  - "Book a Ride" → Sets `flowIntent='passenger'`
  - "Offer a Ride" → Sets `flowIntent='driver'`
- Maintains sessionStorage across page navigations
- Each button sets intent BEFORE redirect to login

```javascript
// Book a Ride button
sessionStorage.setItem('flowIntent', 'passenger');
window.location.href = "login.html";

// Offer a Ride button
sessionStorage.setItem('flowIntent', 'driver');
window.location.href = "login.html";
```

---

## Data Flow

### Successful Driver Registration Example

```
1. User has passenger account, wants to become driver
   ├─ Clicks "Offer a Ride" on index.html
   ├─ sessionStorage.flowIntent = 'driver'
   └─ Redirects to login.html

2. User logs in with email/password
   ├─ Frontend: POST to /api/shared/php/login.php
   ├─ Backend: Checks users table, finds user
   ├─ Backend: Checks driver table, no record found
   ├─ Returns: { success: true, userId: 123, role: 'passenger' }
   └─ Frontend: Receives response

3. Frontend (login.js) validates role
   ├─ flowIntent = 'driver'
   ├─ userData.role = 'passenger'
   ├─ Mismatch detected!
   └─ Redirects to driver-registration.html

4. User completes driver registration form
   ├─ Uploads driver license image
   ├─ Enters vehicle details
   ├─ Submits to driver-registration-handler.php
   └─ File: DL_123_1702700800.jpg saved

5. Backend (driver-registration-handler.php) processes
   ├─ Verifies user exists (userId 123, email)
   ├─ Checks NOT already a driver
   ├─ Creates driver record in DB
   │  └─ INSERT INTO driver (user_id=123, driver_license_image='DL_123_1702700800.jpg')
   ├─ Creates vehicle record in DB
   │  └─ INSERT INTO vehicle (plate_number='ABC1234', driver_id=456, ...)
   └─ Returns: { success: true, driverId: 456, message: "..." }

6. Frontend (driver-registration.html) handles success
   ├─ Shows success message
   ├─ Redirects to login.html with flowIntent='driver'
   └─ User can now log in as driver

7. Next login attempt
   ├─ Clicks "Offer a Ride" (flowIntent='driver')
   ├─ Backend: Finds driver record now
   ├─ Returns: { success: true, userId: 123, role: 'driver' }
   └─ Frontend: Match! Redirect to driver-Homepage.html ✅
```

---

## Security Considerations

### File Upload Validation
- ✅ File size limit: 5MB
- ✅ Allowed types: JPG, JPEG, PNG, GIF
- ✅ Filename sanitization: `DL_{userId}_{timestamp}.{ext}`
- ✅ Stored outside web root (if possible)
- ❌ TODO: Virus scanning integration

### Database Validation
- ✅ User existence verified before driver creation
- ✅ Duplicate driver check (prevent multiple driver profiles)
- ✅ Duplicate plate number check (ensure unique vehicles)
- ✅ PDO prepared statements (prevent SQL injection)

### Session Security
- ✅ flowIntent stored in sessionStorage (cleared on tab close)
- ✅ Sensitive data (passwords) never stored in storage
- ✅ User role validated on every login
- ❌ TODO: Rate limiting on registration attempts
- ❌ TODO: Email verification for driver registration

---

## Testing Checklist

### Test Case 1: Register as Passenger, Then as Driver
```
1. ✅ Create new account via signup.html (creates passenger)
2. ✅ Login with "Book a Ride" → lands on landing-page.html
3. ✅ Logout
4. ✅ Click "Offer a Ride" → login.html
5. ✅ Login with same credentials
6. ✅ Redirected to driver-registration.html (role mismatch)
7. ✅ Fill driver registration form
8. ✅ Submit → Success message
9. ✅ Redirected to login.html with flowIntent='driver'
10. ✅ Login again → Lands on driver-Homepage.html
```

### Test Case 2: User Registered as Both Roles
```
1. ✅ User with both passenger and driver profiles
2. ✅ Click "Book a Ride" → login → landing-page.html
3. ✅ Go back, click "Offer a Ride" → login → driver-Homepage.html
4. ✅ Verify different flows work seamlessly
```

### Test Case 3: Driver Registration Error Handling
```
1. ✅ Attempt registration with invalid file type → Error shown
2. ✅ Attempt registration with file > 5MB → Error shown
3. ✅ Attempt registration with duplicate plate number → Error shown
4. ✅ Attempt registration for already-driver user → Error shown
```

### Test Case 4: Edge Cases
```
1. ✅ User clears localStorage during login → Redirect to login
2. ✅ User disables JavaScript → Form submission fails gracefully
3. ✅ Network error during driver registration → Show error, allow retry
4. ✅ File upload interrupted → Allow retry
```

---

## Database Schema Impact

### Updated Tables

**driver** table (new column used):
```sql
CREATE TABLE driver (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,          -- Links to users table
    driver_license_image VARCHAR(255),    -- Path to uploaded image
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

**vehicle** table (no changes needed):
```sql
CREATE TABLE vehicle (
    plate_number VARCHAR(20) PRIMARY KEY,  -- Unique, required
    driver_id INT,                         -- Links to driver
    vehicle_model VARCHAR(100),
    seat_capacity INT,
    vehicle_status VARCHAR(50) DEFAULT 'available',
    FOREIGN KEY (driver_id) REFERENCES driver(driver_id)
);
```

---

## Migration Path

### For Existing Users

**Passenger-only users:** No changes needed
- Can continue to login with "Book a Ride"
- If they click "Offer a Ride", they'll be prompted to register

**Driver-only users:** May need re-onboarding
- If registered before this update, they may lack a complete driver profile
- Could add a "Complete Profile" flow to gather missing vehicle/license info
- TODO: Create migration script to populate driver-licenses for existing drivers

---

## Future Enhancements

### Recommended Next Steps

1. **Email Verification for Driver Registration**
   - Send confirmation email with driver license verification link
   - Ensure email ownership before allowing driver access

2. **Plate Number Validation**
   - Validate format against Philippine LTO standards
   - Check if plate number is genuinely registered

3. **Driver License Verification**
   - Integrate with LTO or OCR service
   - Extract and validate license number
   - Automatic expiration date tracking

4. **Admin Dashboard**
   - Review pending driver registrations
   - Verify uploaded documents
   - Approve/reject driver applications
   - Manage driver suspensions

5. **Driver Preferences**
   - Allow switching between passenger/driver modes without re-login
   - Session role switching (if user has both roles)

6. **Audit Logging**
   - Track all driver registration attempts
   - Log file uploads and deletions
   - Monitor failed authentication attempts

---

## Troubleshooting

### Issue: User redirected to login instead of driver registration

**Possible causes:**
1. localStorage cleared (session lost)
2. userId not set in userData
3. flowIntent not persisting

**Solution:**
- Check DevTools → Storage → localStorage for userData
- Verify userId is populated: `JSON.parse(localStorage.userData).userId`
- Check sessionStorage for flowIntent persistence

### Issue: Driver registration form shows empty email

**Possible causes:**
1. userData not in localStorage
2. User logged out before accessing form
3. Email field readonly attribute preventing display

**Solution:**
- Ensure user is logged in before accessing registration form
- Check localStorage.userData exists and is valid JSON
- Verify email field is properly initialized in form setup

### Issue: File upload fails silently

**Possible causes:**
1. File size > 5MB
2. Invalid file type (not JPG/PNG/GIF)
3. Uploads folder not writable
4. Temporary file upload issue

**Solution:**
- Check error message in DevTools console
- Verify file is < 5MB and correct type
- Check server logs: `/assets/driver-licenses/` folder permissions
- Try different file/smaller size

### Issue: Plate number already exists error

**Possible causes:**
1. Plate number genuinely registered to another driver
2. Duplicate entry in vehicle table (data error)

**Solution:**
- User must use different plate number
- Admin can check: `SELECT * FROM vehicle WHERE plate_number = 'ABC1234'`
- If duplicate from system error, delete and retry

---

## Support & Documentation

For questions or issues, refer to:
1. This document (EXPLICIT_ROLE_SELECTION_FLOW.md)
2. Backend API documentation: `/backend/api/driver/driver-registration-handler.php`
3. Frontend form documentation: `/public/shared/pages/driver-registration.html`
4. Database schema: `/backend/database/schema.sql`

---

**Last Updated:** December 14, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅
