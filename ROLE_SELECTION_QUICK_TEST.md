# ROLE-SELECTION FLOW - IMPLEMENTATION GUIDE
## Quick Start for Testing

---

## What Changed?

The authentication system now explicitly separates **user intent** (button clicked) from **role validation** (what they're registered as). This allows:

- ✅ Users to choose which role to use, even if registered for multiple roles
- ✅ Users registered as one role to register for another role on-demand
- ✅ Clear error messages when trying to use a role they haven't registered for

---

## Quick Test (5 minutes)

### Test Case: Register as Driver

#### Step 1: Create a Passenger Account (or use existing)
- Go to `localhost/Corosa` (index.html)
- Click "Book a Ride"
- Create account via signup.html (if needed)
- Login and verify you land on passenger pages

#### Step 2: Become a Driver
1. On `localhost/Corosa` (index.html)
2. Click "Offer a Ride"
3. Login with the same email/password as your passenger account
4. **Expected Behavior:** Instead of driver homepage, you should see...
   ```
   ↓ (redirected to driver-registration.html)
   ```

5. Fill out the driver registration form:
   - **Driver License Image:** Upload any JPG/PNG image (test file)
   - **Plate Number:** Type anything like `ABC1234`
   - **Vehicle Model:** Type `Honda Civic 2020`
   - **Seat Capacity:** Select `5 seats`

6. Click "Complete Registration"
7. **Expected Behavior:**
   ```
   ↓ Success message
   ↓ Redirected back to login.html with flowIntent='driver'
   ```

8. Login again with same credentials
9. **Expected Behavior:**
   ```
   ↓ Lands on driver-Homepage.html (NOT select-pickup.html)
   ```

✅ **Test Passed!**

---

## File Locations & Changes

### New Files
```
📁 public/shared/pages/
   └─ driver-registration.html          ← User registration form for drivers

📁 backend/api/driver/
   └─ driver-registration-handler.php   ← Backend API to process registration
```

### Modified Files
```
📁 public/shared/js/
   └─ login.js                           ← Now validates role + redirects to registration if needed

📁 public/shared/pages/
   └─ index.html                         ← Already had flowIntent setting (confirmed working)
```

---

## How It Works (Simple Version)

```
1. Click Button at index.html
   ├─ "Book a Ride" → flowIntent = 'passenger'
   └─ "Offer a Ride" → flowIntent = 'driver'
                               ↓
2. Login with email/password
   ├─ Server checks users table
   ├─ Server checks driver table (if exists)
   └─ Returns: role = 'passenger' OR 'driver'
                               ↓
3. Frontend Compares
   ├─ IF flowIntent === role → PROCEED
   │  ├─ 'driver' === 'driver' → driver-Homepage.html ✅
   │  └─ 'passenger' === 'passenger' → landing-page.html ✅
   │
   └─ IF flowIntent !== role → NEED REGISTRATION
      ├─ 'driver' !== 'passenger' → driver-registration.html
      └─ User fills registration form
```

---

## Key Points to Understand

### Point 1: sessionStorage.flowIntent
- Set **before** redirect to login.html (at index.html)
- Persists **only** during the current browser tab
- Used to remember which button the user clicked
- Cleared when tab closes

### Point 2: localStorage.userData
- Set **after** successful login
- Persists even after closing browser
- Contains: userId, email, role, firstName, lastName
- The `role` comes from the server (database)

### Point 3: Role Validation
- The database role is "what they're registered as"
- The flowIntent is "what they're trying to do"
- If they don't match:
  - Driver registration: Take them to registration form
  - Passenger registration: Show message (happens during signup only)

---

## Testing Checklist

### ✅ Pre-Test Requirements
- [ ] WAMP server running (Apache + MySQL)
- [ ] Node.js server running (`node server.js`)
- [ ] Database populated with schema
- [ ] Browser cache cleared

### ✅ Test Scenarios

**Scenario A: New Driver Registration**
- [ ] Create passenger account via signup
- [ ] Login as passenger ("Book a Ride")
- [ ] Logout or go back to index.html
- [ ] Click "Offer a Ride"
- [ ] Login with same email
- [ ] Redirected to driver-registration.html
- [ ] Fill form and submit
- [ ] See success message
- [ ] Redirected back to login
- [ ] Login again
- [ ] Land on driver-Homepage.html ✅

**Scenario B: User with Both Roles**
- [ ] Complete Scenario A first
- [ ] Go back to index.html
- [ ] Click "Book a Ride"
- [ ] Login
- [ ] Land on landing-page.html (passenger)
- [ ] Go back to index.html
- [ ] Click "Offer a Ride"
- [ ] Login
- [ ] Land on driver-Homepage.html (driver) ✅

**Scenario C: File Upload Validation**
- [ ] Try uploading non-image file → Error
- [ ] Try uploading huge image (>5MB) → Error
- [ ] Try uploading valid image → Success ✅

---

## Common Issues & Fixes

### Issue: "User not found" on driver registration

**Problem:** Backend can't find the user
**Check:**
1. Is the email correct?
2. Did the user actually log in?
3. Is userData in localStorage?

**Fix:**
```javascript
// In browser console
localStorage.getItem('userData')  // Should show user object with userId and email
```

### Issue: "User already registered as driver"

**Problem:** They already completed driver registration before
**Solution:** They're already a driver. Next login should land on driver-Homepage directly.

### Issue: Image not uploading

**Problem:** Could be file size, type, or permissions
**Check:**
1. File is JPG/PNG/GIF?
2. File is < 5MB?
3. Is `/Corosa/assets/driver-licenses/` folder writable?

**Fix:**
```bash
# Check folder permissions
ls -la /path/to/Corosa/assets/driver-licenses/

# Should show rwx (read/write/execute)
# If not: chmod 755 driver-licenses/
```

### Issue: Stuck in login loop

**Problem:** redirects keep happening
**Check:**
1. Is JavaScript enabled?
2. Are localStorage/sessionStorage accessible?
3. Check DevTools Console for errors

**Debug:**
```javascript
// Open DevTools → Console
sessionStorage.getItem('flowIntent')   // Should be 'driver' or 'passenger'
localStorage.getItem('userData')       // Should be user object after login
```

---

## Browser DevTools Inspection

### Check if flowIntent is Set
```javascript
// Open DevTools (F12) → Console tab
sessionStorage.getItem('flowIntent')

// Output should be:
// "driver" or "passenger"
```

### Check if User Data is Stored
```javascript
// In Console
localStorage.getItem('userData')

// Should output something like:
// {"userId":123,"email":"user@slu.edu.ph","role":"driver",...}
```

### Check Network Requests
```
1. Open DevTools → Network tab
2. Perform login
3. Look for POST to /Corosa/backend/api/shared/php/login.php
4. Check Response tab to see what server returned
```

---

## Expected Server Responses

### Successful Login
```json
{
  "success": true,
  "userId": 123,
  "role": "passenger",
  "firstName": "John",
  "lastName": "Doe",
  "message": "Logged in"
}
```

### Driver Registration Success
```json
{
  "success": true,
  "driverId": 456,
  "vehicleId": "ABC1234",
  "message": "Driver profile created successfully. You can now log in as a driver."
}
```

### Driver Registration Error (Already Driver)
```json
{
  "success": false,
  "message": "User is already registered as a driver",
  "errors": {
    "driver": "already_driver"
  }
}
```

---

## Next Steps After Testing

### If All Tests Pass ✅
- Announce feature to users
- Monitor driver registrations
- Gather feedback on UX
- Plan enhancements (email verification, license verification, etc.)

### If Issues Found ❌
1. Check error in DevTools Console
2. Check PHP error logs: `/Corosa/backend/logs/` (if exists)
3. Check MySQL error logs
4. Refer to troubleshooting section above

---

## Reference Files

| File | Purpose | Location |
|------|---------|----------|
| Driver Registration Form | User fills in driver details | `public/shared/pages/driver-registration.html` |
| Driver Registration Handler | Backend processes registration | `backend/api/driver/driver-registration-handler.php` |
| Login Handler | Validates credentials & role | `public/shared/js/login.js` |
| Database Schema | Tables and structure | `backend/database/schema.sql` |
| Full Documentation | Complete implementation details | `EXPLICIT_ROLE_SELECTION_FLOW.md` |

---

**Testing Duration:** 5-10 minutes  
**Complexity:** Medium  
**Status:** Ready for QA ✅
