# Driver-Side Ride Management - Testing Guide

## Prerequisites

1. Backend Node.js server running on `http://localhost:3000`
2. Frontend served from `http://localhost` via WAMP
3. User logged in as a driver

## Test Scenario 1: Create a Ride

### Step 1: Navigate to Offer a Ride

1. Click **"Offer a Ride"** in the sidebar
2. Should load `/driver/pages/driver-makeride.html`

### Step 2: Fill Pickup Location

1. In the "Starting Location" field, type: **"Makati City"**
2. Pickup status should show: **"✓ Selected"**
3. Field should have green border

### Step 3: Fill Dropoff Location

1. In the "Destination" field, type: **"BGC, Taguig"**
2. Dropoff status should show: **"✓ Selected"**
3. Field should have green border
4. **"Step 2: Trip Details"** section should now appear
5. Departure Time and Available Seats inputs should be enabled

### Step 4: Fill Departure Time

1. Click on "Departure Time" input
2. Select a date/time in the future (e.g., tomorrow at 10:00 AM)

### Step 5: Select Available Seats

1. Click on "Available Seats" dropdown
2. Select **"4 seats"**

### Step 6: Submit the Ride

1. "Create Ride" button should now be enabled (not grayed out)
2. Click "Create Ride" button
3. Spinner should appear with "Creating your ride..."
4. On success: **✅ Ride created successfully!**
5. Should redirect to `driver-ridestatus.html`

### Expected Database Entry

Check `trips` table:

```sql
SELECT * FROM trips WHERE driver_id = [YOUR_ID];
-- Should see new row with:
-- start_address: 'Makati City'
-- end_address: 'BGC, Taguig'
-- available_seats: 4
-- trip_status: 'available'
```

---

## Test Scenario 2: View Booking Requests

### Step 1: Create a Test Booking

_This requires a passenger user. For testing, you may need to:_

1. Create a booking record in the database manually:

```sql
INSERT INTO bookings (trip_id, passenger_id, seats_requested, status)
VALUES ([TRIP_ID], [PASSENGER_ID], 2, 'pending');
```

Or use the passenger app to create a booking request.

### Step 2: Navigate to Booking Requests

1. Click **"Booking Requests"** in the sidebar
2. Should load `/driver/pages/driver-requests.html`

### Step 3: View Requests

1. Page should show loading spinner briefly
2. Then display booking request cards (if any exist)
3. Each card should show:
   - Passenger name and phone
   - "⏳ Pending" status badge
   - Route (pickup → dropoff)
   - Trip date/time
   - Number of seats requested
   - Passenger points

### Step 4: Filter Requests

1. Dropdown at top right has filters: "All Requests", "Pending", "Confirmed", "Rejected"
2. Selecting different filters should update the view

### Step 5: Accept a Request

1. Click **"Accept Request"** button on a pending request
2. Confirmation dialog should appear: "Accept this booking request?"
3. Click OK
4. Success message: **✅ Booking request accepted! Seats remaining: 3**
5. Request card status should change to **"✓ Confirmed"**
6. Buttons should change to disabled "Confirmed" state

### Step 6: Verify Database

Check `bookings` and `trips` tables:

```sql
-- Check booking status changed
SELECT * FROM bookings WHERE booking_id = [BOOKING_ID];
-- Status should be 'confirmed'

-- Check available seats decreased
SELECT available_seats FROM trips WHERE trip_id = [TRIP_ID];
-- Should be 3 (was 4, -1 for accepted booking)
```

---

## Test Scenario 3: Sidebar Persistence

### Step 1: Test Sidebar Toggle

1. Click the menu toggle icon (☰) in sidebar
2. Sidebar should collapse
3. Content should expand to fill space
4. Reload page (F5)
5. Sidebar should still be collapsed (state persisted)

### Step 2: Test Active Page Highlighting

1. Currently on driver-makeride.html
2. Sidebar should show **"Offer a Ride"** as active (highlighted)
3. Click **"My Rides"** link
4. Should navigate to driver-ridestatus.html
5. Sidebar should now highlight **"My Rides"** instead
6. Reload page
7. **"My Rides"** should still be highlighted

### Step 3: Test Sidebar Toggle Button

1. Click toggle again to open sidebar
2. Sidebar should expand
3. Reload page
4. Sidebar should still be open (state persisted)

---

## Test Scenario 4: Form Data Persistence

### Step 1: Enter Ride Details

1. Go to "Offer a Ride"
2. Enter:
   - Pickup: "Quezon City"
   - Dropoff: "Manila"
   - Time: Tomorrow at 2:00 PM
   - Seats: 5

### Step 2: Navigate Away

1. Click "Back" button or navigate to another page
2. Form should still show your entered data (from sessionStorage)

### Step 3: Reload Page

1. Reload the page (F5)
2. Your form data should be restored:
   - Pickup location still shows "Quezon City"
   - Status indicators show "✓ Selected"
   - Departure time still shows
   - Seats still set to 5

### Step 4: Submit Successfully

1. Click "Create Ride"
2. After success, form data should be cleared
3. sessionStorage keys should be removed:
   - `driverPickupLocation`
   - `driverDropoffLocation`
   - `driverDepartureTime`
   - `driverAvailableSeats`

---

## Test Scenario 5: Error Handling

### Test 5A: Network Error

1. Stop the Node.js backend server
2. Try to create a ride or load requests
3. Error message should appear: **"Error: Network error"** or similar
4. No crash, form should still be functional

### Test 5B: Backend Validation Error

1. Manually modify form to send invalid data:
   - Open browser DevTools (F12)
   - Console > driver-makeride.js
   - Modify `rideData.availableSeats = -1`
2. Try to submit
3. Backend should reject with error message
4. Error should display on page

### Test 5C: Database Error

1. Try to create ride with unavailable database
2. Should show appropriate error message
3. No generic "Server error" - should be specific

---

## Test Scenario 6: Mobile Responsiveness

### Step 1: Test on Mobile Device

1. Open Chrome DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select "iPhone 12" or similar

### Step 2: Ride Creation Form

1. Form should be single column (not 2-column grid)
2. All fields visible and usable
3. Buttons should be full width
4. Sidebar should be hidden or collapsed

### Step 3: Booking Requests

1. Request cards should stack vertically
2. Action buttons should wrap if needed
3. Status badge should still be visible

---

## Test Scenario 7: Validation Flow

### Test Location Validation (Non-Blocking)

1. Enter Pickup: "test"
2. No error message during typing
3. Click outside field
4. Status updates to "✓ Selected"
5. Time/Seats fields enable

### Test Submit Validation (Blocking)

1. Clear all fields
2. "Create Ride" button should be **disabled**
3. Try clicking (should not respond)
4. Fill pickup only
5. Button still **disabled**
6. Fill dropoff
7. Button still **disabled** (time/seats not filled)
8. Fill time
9. Button still **disabled** (seats not filled)
10. Fill seats
11. Button now **enabled**

---

## Debugging Checklist

### If Form Won't Submit

- [ ] Check browser console (F12) for JavaScript errors
- [ ] Verify backend server is running on port 3000
- [ ] Check CORS settings in server.js
- [ ] Verify network tab shows POST request to `/api/driver/rides`
- [ ] Check backend logs for error messages

### If Requests Won't Load

- [ ] Verify driver_id is correctly retrieved from localStorage
- [ ] Check browser console for fetch errors
- [ ] Verify bookings exist in database for this driver
- [ ] Check network tab shows GET request to `/api/driver/bookings/:id`

### If Sidebar Won't Persist

- [ ] Check localStorage in DevTools (F12 > Application > Local Storage)
- [ ] Look for `driverSidebarOpen` key
- [ ] Verify value is "true" or "false"

### If Active Page Not Highlighted

- [ ] Check current window.location.pathname
- [ ] Verify sidebar links have correct href values
- [ ] Check if element has `active` class after page load

---

## Quick Commands

### Check if Server is Running

```bash
curl http://localhost:3000/api/driver/rides/1
```

Should return JSON (may be empty, but no "Connection refused")

### Check Database

```sql
-- See all trips created by a driver
SELECT * FROM trips WHERE driver_id = [YOUR_ID];

-- See all booking requests for a driver's trips
SELECT b.* FROM bookings b
JOIN trips t ON b.trip_id = t.trip_id
WHERE t.driver_id = [YOUR_ID];
```

---

## Success Criteria

✅ **Ride Creation Works**

- [ ] Can create ride with all 4 fields
- [ ] Data persists to database
- [ ] Form clears after submission
- [ ] Redirects to ride status page

✅ **Booking Requests Work**

- [ ] Can load requests from database
- [ ] Can accept/reject requests
- [ ] Seat count updates correctly
- [ ] Status changes immediately in UI

✅ **Sidebar Works**

- [ ] State persists across page reloads
- [ ] Active page highlighted correctly
- [ ] Toggle button works
- [ ] Persists across navigation

✅ **Form Validation Works**

- [ ] Submit button disabled when incomplete
- [ ] No errors during field entry
- [ ] Errors only on submit
- [ ] Time/Seats fields conditional

✅ **Error Handling Works**

- [ ] Network errors caught and displayed
- [ ] Validation errors shown to user
- [ ] No page crashes
- [ ] User can recover from errors

---

## Notes

- Ensure database tables have all required columns
- Coordinates (lat/long) currently use placeholders
- Google Maps integration needed for real route visualization
- Consider adding real-time WebSocket updates for instant booking notifications
