# Driver Flow - Complete Test Scenarios

## Test Setup
- ✅ Both WAMP and Node.js running
- ✅ Database connected and accessible
- ✅ Driver account with valid credentials exists
- Browser DevTools open (F12) for debugging

---

## Test Scenario 1: Complete Driver Flow (Happy Path)

**Objective**: Verify the entire "Offer a Ride" flow works end-to-end.

### Step 1: Login as Driver
1. Visit: `http://localhost/Corosa/public/shared/pages/index.html`
2. Click "Offer a Ride"
3. Redirected to login.html ✓
4. Sign in with driver credentials
5. **Expected Redirect**: `driver-Homepage.html`
6. **Verify**: URL shows `/driver/pages/driver-Homepage.html` ✓

### Step 2: Start Ride Offering
1. On driver-Homepage.html, click "Offer a Ride" button (header)
2. **Expected**: Navigate to `select-pickup.html`
3. **Verify**: 
   - [ ] Page loads without 404
   - [ ] "Select pickup location" heading visible
   - [ ] Map placeholder displayed

### Step 3: Select Pickup Location
1. Enter location: "123 Main Street" in the input field
2. Click "Next" button
3. **Expected**: Navigate to `select-dropoff.html`
4. **Verify**:
   - [ ] Page loads without 404
   - [ ] Pickup location shows: "123 Main Street"
   - [ ] "Select drop-off location" heading visible

### Step 4: Select Dropoff Location
1. Enter location: "Downtown Station" in the input field
2. Click "Next" button
3. **Expected**: Navigate to `driver-makeride.html`
4. **Verify**:
   - [ ] Page loads without 404
   - [ ] Pickup field is prepopulated with "123 Main Street"
   - [ ] Dropoff field is prepopulated with "Downtown Station"
   - [ ] Form is ready to edit

### Step 5: Complete Ride Form
1. Verify prepopulated fields (already done in Step 4)
2. Select date: Tomorrow
3. Select time: 14:00 (2 PM)
4. Adjust seats: 3 (using +/- buttons)
5. Enter price: 150
6. Click "Post Ride" button
7. **Expected**: Alert showing "Ride Posted Successfully"
8. **Verify**:
   - [ ] Alert shows correct pickup, dropoff, and fare
   - [ ] Form clears after submission
   - [ ] Seat counter resets to 1

---

## Test Scenario 2: Navigation Link Verification

**Objective**: Verify all sidebar and dropdown links work correctly.

### From driver-Homepage.html:
| Link | Expected Destination | Status |
|------|----------------------|--------|
| Offer a Ride (nav) | select-pickup.html | [ ] |
| Ride Requests (sidebar) | driver-rideconfirmation.html | [ ] |
| Active Trip (sidebar) | driver-passengerstatus.html | [ ] |
| Trip History (sidebar) | driver-history.html | [ ] |
| Ratings (sidebar) | driver-passengerfeedback.html | [ ] |
| Settings (sidebar) | driver-settings.html | [ ] |
| Profile (dropdown) | user-profile.html | [ ] |
| Settings (dropdown) | driver-settings.html | [ ] |

---

## Test Scenario 3: Data Persistence (sessionStorage)

**Objective**: Verify location data persists correctly through the flow.

### After select-pickup.html:
1. Open DevTools → Application → sessionStorage
2. **Check for**:
   - [ ] Key: `driverPickupLocation` exists
   - [ ] Value: "123 Main Street" (or selected location)
   - [ ] No key: `pickupLocation` (passenger key should not exist)

### After select-dropoff.html:
1. Open DevTools → Application → sessionStorage
2. **Check for**:
   - [ ] Key: `driverPickupLocation` still exists
   - [ ] Key: `driverDropoffLocation` exists
   - [ ] Value: "Downtown Station" (or selected location)

### On driver-makeride.html (after navigation):
1. Open DevTools → Application → sessionStorage
2. **Check for**:
   - [ ] Both `driverPickupLocation` and `driverDropoffLocation` still exist
   - [ ] Form fields are prepopulated with these values
   - [ ] Can edit fields without losing other data

---

## Test Scenario 4: Authentication Check

**Objective**: Verify only logged-in drivers can access driver pages.

### Test 4A: Direct Access Without Login
1. Clear localStorage: DevTools → Application → localStorage → Clear All
2. Visit: `http://localhost/Corosa/public/driver/pages/driver-makeride.html` directly
3. **Expected**: Redirect to `login.html`
4. **Verify**: 
   - [ ] No blank page
   - [ ] No errors in console
   - [ ] Redirects immediately

### Test 4B: Logged in as Passenger
1. Login as a passenger account (user WITHOUT driver entry in database)
2. Visit: `http://localhost/Corosa/public/driver/pages/driver-makeride.html` directly
3. **Expected**: Redirect to `index.html` (not allowed)
4. **Verify**:
   - [ ] Page redirects
   - [ ] No access to driver page

### Test 4C: Logged in as Driver
1. Login as driver account
2. Visit: `http://localhost/Corosa/public/driver/pages/driver-makeride.html` directly
3. **Expected**: Page loads successfully
4. **Verify**:
   - [ ] Page displays
   - [ ] All form fields visible
   - [ ] No console errors

---

## Test Scenario 5: Role-Based Redirect (Comparative)

**Objective**: Verify drivers and passengers follow different paths from shared location pickers.

### Test 5A: Passenger Flow (Baseline)
1. Login as passenger
2. Click "Book a Ride" (from index.html)
3. Select pickup and dropoff locations
4. **Expected Final Page**: `request-ride.html`
5. **Verify**:
   - [ ] Redirects to request-ride, NOT driver-makeride

### Test 5B: Driver Flow (New)
1. Login as driver
2. Click "Offer a Ride" (from index.html or driver-Homepage)
3. Select pickup and dropoff locations
4. **Expected Final Page**: `driver-makeride.html`
5. **Verify**:
   - [ ] Redirects to driver-makeride, NOT request-ride

---

## Test Scenario 6: Error Handling

**Objective**: Verify graceful error handling.

### Test 6A: Form Validation
1. On driver-makeride.html, try to submit with empty fields
2. **Expected**: Alert "Please fill in all details"
3. **Verify**: Form does not submit

### Test 6B: Back Button Behavior
1. On select-dropoff.html, click "Back" button
2. **Expected**: Navigate back to select-pickup.html
3. **Verify**: 
   - [ ] Page loads
   - [ ] Pickup location is still in sessionStorage (persist)

### Test 6C: Browser Back Button
1. Complete flow up to driver-makeride.html
2. Click browser back button
3. **Expected**: Go back to select-dropoff.html with data intact
4. **Verify**: 
   - [ ] Location data still shows
   - [ ] No errors in console

---

## Test Scenario 7: Responsive Design

**Objective**: Verify mobile experience works.

### Test 7A: Mobile Viewport
1. Open DevTools → Device Toolbar
2. Select "iPhone SE" or similar mobile device
3. Redo Test Scenario 1 (complete flow)
4. **Verify**:
   - [ ] All buttons are clickable
   - [ ] Text is readable (not cramped)
   - [ ] Forms don't overflow
   - [ ] Map placeholder scales appropriately

### Test 7B: Landscape Orientation
1. In DevTools Device Toolbar, rotate to landscape
2. Verify form fields are still accessible
3. **Verify**: [ ] No horizontal scrolling needed

---

## Console Error Checklist

While testing, monitor the Browser Console (F12 → Console tab):

- [ ] No 404 errors
- [ ] No undefined reference errors
- [ ] No localStorage/sessionStorage errors
- [ ] No CORS errors (fetch failures)
- [ ] No JavaScript syntax errors
- [ ] All redirects happen without errors

---

## Network Tab Checklist

While testing, monitor the Network tab:

- [ ] No failed requests (red status)
- [ ] login.php: Status 200 ✓
- [ ] select-pickup.html: Status 200 ✓
- [ ] select-dropoff.html: Status 200 ✓
- [ ] driver-makeride.html: Status 200 ✓
- [ ] All JS files load (200 OK)
- [ ] All CSS files load (200 OK)

---

## Summary Report

After completing all tests, create a summary:

```
PASS: [ ] Scenario 1 (Complete Flow)
PASS: [ ] Scenario 2 (Navigation Links)
PASS: [ ] Scenario 3 (Data Persistence)
PASS: [ ] Scenario 4 (Authentication)
PASS: [ ] Scenario 5 (Role-Based Redirect)
PASS: [ ] Scenario 6 (Error Handling)
PASS: [ ] Scenario 7 (Responsive Design)

CONSOLE: [ ] No errors detected
NETWORK: [ ] All requests successful

ISSUES FOUND:
- (none expected if all tests pass)
```

---

## If Tests Fail

Report:
1. Which test scenario failed?
2. What was expected vs. actual?
3. Any error messages in console?
4. What's the URL in address bar?
5. Screenshot of the issue (if possible)

