# Request Ride Page - Function Trace Documentation

## Overview
This document traces the source and flow of functions for the three main tasks on `request-ride.html`:
1. Fetch available rides (GET /api/trip.php?action=getAvailableTrips)
2. Display driver and vehicle info dynamically
3. Store selected ride info in sessionStorage for next page

---

## Task 1: Fetch Available Rides

### Frontend Entry Point
**File:** `public/js/request-ride.js`  
**Function:** `fetchAvailableRides()` (lines 133-167)

```javascript
function fetchAvailableRides() {
    fetch('/Corosa/backend/api/trip.php?action=getAvailableTrips')
        .then(response => response.json())
        .then(result => {
            if (result.success && Array.isArray(result.data)) {
                availableRides = result.data.map(trip => ({
                    id: trip.trip_id,
                    tripId: trip.trip_id,
                    driverId: trip.driver_id,
                    driver: {
                        firstName: trip.first_name || '',
                        middleInitial: trip.middle_initial || '',
                        lastName: trip.last_name || '',
                        employmentStatus: trip.employment_status || ''
                    },
                    vehicle: {
                        model: trip.vehicle_model || '',
                        year: trip.vehicle_year || '',
                        availableSeats: trip.available_seats,
                        totalCapacity: trip.seat_capacity
                    },
                    rideStatus: trip.ride_status,
                    createdAt: trip.created_at
                }));
                displayAvailableRides();
            }
        })
        .catch(error => {
            console.error('Error fetching available rides:', error);
        });
}
```

**Called from:** `initialize()` function (line 258) when page loads

### API Endpoint
**File:** `backend/api/trip.php`  
**Location:** Lines 30-41

```php
if (isset($_GET['action']) && $_GET['action'] === 'getAvailableTrips') {
    $stmt = $trip->getTripAvailableTripData();
    $trips = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $trips[] = $row;
    }
    echo json_encode(array(
        "success" => true,
        "message" => "Available trips retrieved successfully",
        "data" => $trips
    ));
}
```

**Flow:**
1. Checks for `action=getAvailableTrips` in GET parameters
2. Calls `$trip->getTripAvailableTripData()` method
3. Fetches all rows from the PDO statement
4. Returns JSON response with success status and trip data

### Database Query Method
**File:** `backend/classes/Trip.php`  
**Method:** `getTripAvailableTripData()` (lines 120-155)

```php
public function getTripAvailableTripData() {
    $query = "SELECT 
        t.trip_id,
        t.driver_id,
        t.start_lat,
        t.start_long,
        t.end_lat,
        t.end_long,
        t.available_seats,
        t.ride_distance,
        t.ride_status,
        t.created_at,
        u.first_name,
        u.middle_initial,
        u.last_name,
        u.employment_status,
        v.vehicle_model,
        v.seat_capacity
    FROM trips t
    LEFT JOIN driver d ON t.driver_id = d.driver_id
    LEFT JOIN users u ON d.user_id = u.user_id
    LEFT JOIN vehicle v ON v.driver_id = d.driver_id
    LEFT JOIN (
        SELECT trip_id, COUNT(*) AS confirmed_count
        FROM trip_assignment
        WHERE assignment_status = 'confirmed'
        GROUP BY trip_id
    ) ta ON t.trip_id = ta.trip_id
    WHERE t.ride_status IN ('available', 'scheduled')
    AND t.available_seats > 0
    ORDER BY t.created_at DESC";

    $stmt = $this->conn->prepare($query);
    $stmt->execute();
    return $stmt;
}
```

**What it does:**
- Joins `trips` table with `driver`, `users`, and `vehicle` tables
- Filters for trips with status 'available' or 'scheduled'
- Only returns trips with `available_seats > 0`
- Orders by creation date (newest first)
- Returns driver info (name, employment status) and vehicle info (model, capacity)

**Database Tables Accessed:**
- `trips` - Main trip data
- `driver` - Links trips to users
- `users` - Driver personal information
- `vehicle` - Vehicle details
- `trip_assignment` - Confirmed bookings count (subquery)

---

## Task 2: Display Driver and Vehicle Info Dynamically

### Display Function
**File:** `public/js/request-ride.js`  
**Function:** `displayAvailableRides()` (lines 217-226)

```javascript
function displayAvailableRides() {
    const container = document.getElementById('ride-list');
    if (!container) return;

    container.innerHTML = '';
    availableRides.forEach(ride => {
        const card = createRideCard(ride);
        container.appendChild(card);
    });
}
```

**Called from:** `fetchAvailableRides()` after data is mapped (line 159)

### Card Creation Function
**File:** `public/js/request-ride.js`  
**Function:** `createRideCard(ride)` (lines 170-214)

```javascript
function createRideCard(ride) {
    const card = document.createElement('div');
    card.className = 'ride-card';

    // Driver avatar
    const avatar = document.createElement('div');
    avatar.className = 'driver-avatar';
    // ... SVG icon code ...

    // Driver and vehicle metadata
    const meta = document.createElement('div');
    meta.className = 'ride-meta';
    meta.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:var(--spacing-md);">
            <div>
                <div style="font-weight:700">${ride.driver.firstName} ${ride.driver.lastName}</div>
                <div class="employment-status">${ride.driver.employmentStatus}</div>
            </div>
        </div>
        <div class="vehicle-row" style="margin-top:var(--spacing-sm);">
            <div>${ride.vehicle.model} ${ride.vehicle.year}</div>
            <div style="width:1px; height:16px; background:var(--color-border);"></div>
            <div class="capacity"><span>${ride.vehicle.availableSeats}/${ride.vehicle.totalCapacity}</span> seats left</div>
        </div>`;

    // Request button
    const actionCol = document.createElement('div');
    actionCol.className = 'request-col';
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = ride.vehicle.availableSeats > 0 ? 'Request Ride' : 'Fully Booked';
    btn.disabled = ride.vehicle.availableSeats <= 0;
    if (!btn.disabled) {
        btn.addEventListener('click', () => requestRide(ride.id));
    }
    actionCol.appendChild(btn);

    card.appendChild(avatar);
    card.appendChild(meta);
    card.appendChild(actionCol);

    return card;
}
```

**What it displays:**
- **Driver Name:** `${ride.driver.firstName} ${ride.driver.lastName}` (from `trip.first_name` and `trip.last_name`)
- **Employment Status:** `${ride.driver.employmentStatus}` (from `trip.employment_status`)
- **Vehicle Model:** `${ride.vehicle.model} ${ride.vehicle.year}` (from `trip.vehicle_model` and `trip.vehicle_year`)
- **Seat Availability:** `${ride.vehicle.availableSeats}/${ride.vehicle.totalCapacity}` (from `trip.available_seats` and `trip.seat_capacity`)

**HTML Container:**
**File:** `public/pages/request-ride.html`  
**Element:** `<div class="ride-list" id="ride-list">` (line 57)

---

## Task 3: Store Selected Ride Info in sessionStorage

### Storage Function
**File:** `public/js/request-ride.js`  
**Function:** `requestRide(rideId)` (lines 229-244)

```javascript
window.requestRide = function (rideId) {
    // Find the ride object
    const ride = availableRides.find(r => r.id === rideId);
    if (!ride) {
        alert('Selected ride not found.');
        return;
    }

    // Save selected ride to sessionStorage for the confirmation page
    sessionStorage.setItem('selectedRide', JSON.stringify(ride));
    sessionStorage.setItem('selectedTripId', ride.tripId || ride.id);
    sessionStorage.setItem('selectedTripCreatedAt', ride.createdAt || '');

    // Navigate to confirmation page
    window.location.href = 'ride-confirmation.html';
};
```

**Called from:** Click event on "Request Ride" button (line 205)

**What it stores:**
1. **`selectedRide`** - Complete ride object as JSON string containing:
   - `id`, `tripId`, `driverId`
   - `driver` object (firstName, middleInitial, lastName, employmentStatus)
   - `vehicle` object (model, year, availableSeats, totalCapacity)
   - `rideStatus`, `createdAt`

2. **`selectedTripId`** - Trip ID for easy access

3. **`selectedTripCreatedAt`** - Creation timestamp

**Next Page Usage:**
The stored data is used in `ride-confirmation.html` to:
- Display selected driver and vehicle information
- Create booking with the correct trip_id
- Show ride details to the passenger

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Page Load (request-ride.html)                           │
│    └─> initialize() called                                  │
│         └─> fetchAvailableRides() called                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend API Call                                        │
│    fetch('/Corosa/backend/api/trip.php?action=getAvailableTrips')
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend API Handler (trip.php)                           │
│    Checks: $_GET['action'] === 'getAvailableTrips'          │
│    Calls: $trip->getTripAvailableTripData()                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Database Query (Trip.php)                                │
│    Executes SQL JOIN query across:                          │
│    - trips, driver, users, vehicle tables                   │
│    Returns: PDO statement with trip data                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. JSON Response                                            │
│    {                                                        │
│      "success": true,                                       │
│      "data": [array of trip objects with driver/vehicle]   │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Frontend Data Processing                                 │
│    Maps API response to ride objects                        │
│    Stores in: availableRides array                          │
│    Calls: displayAvailableRides()                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Dynamic Display                                          │
│    For each ride:                                           │
│    - createRideCard(ride) creates DOM elements             │
│    - Displays driver name, employment status                │
│    - Displays vehicle model, seat availability              │
│    - Adds "Request Ride" button with click handler          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. User Clicks "Request Ride"                               │
│    └─> requestRide(rideId) called                           │
│         └─> Stores in sessionStorage:                       │
│              - selectedRide (full object)                   │
│              - selectedTripId                              │
│              - selectedTripCreatedAt                       │
│         └─> Navigates to: ride-confirmation.html            │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Files Summary

| File | Purpose | Key Functions/Methods |
|------|---------|----------------------|
| `public/pages/request-ride.html` | HTML page structure | Container: `#ride-list` |
| `public/js/request-ride.js` | Frontend logic | `fetchAvailableRides()`, `displayAvailableRides()`, `createRideCard()`, `requestRide()` |
| `backend/api/trip.php` | API endpoint | GET handler for `action=getAvailableTrips` |
| `backend/classes/Trip.php` | Database operations | `getTripAvailableTripData()` |

---

## Data Flow Summary

1. **Database → Backend:** SQL JOIN query retrieves trip, driver, user, and vehicle data
2. **Backend → Frontend:** JSON response with structured trip data
3. **Frontend Processing:** Maps API data to JavaScript objects with nested driver/vehicle properties
4. **Frontend Display:** Dynamically creates DOM elements showing driver and vehicle info
5. **User Selection:** Stores complete ride object in sessionStorage for next page

---

## Notes

- The `vehicle_year` field is referenced in the frontend (line 152) but is **not** included in the SQL query in `Trip.php`. This may cause `undefined` to display. Consider adding `v.vehicle_year` to the SELECT statement if this field exists in the database.
- The query uses LEFT JOINs, so trips without associated drivers/vehicles will still be returned (with NULL values).
- Only trips with `available_seats > 0` are returned, ensuring users only see bookable rides.

---

## Debugging: How to Verify GET Request Status in Chrome DevTools

### Step-by-Step Guide

1. **Open Chrome DevTools** (F12 or Right-click → Inspect)
2. **Go to Network Tab**
3. **Reload the page** or trigger the request
4. **Find the API Request:**
   - Look for: `trip.php?action=getAvailabl...` in the request list
   - It should be under "Fetch/XHR" filter (click the "Fetch/XHR" button to filter)
5. **Click on the `trip.php` request** (NOT `request-ride.js`)
6. **Check the Right Panel:**

   **Headers Tab → General Section:**
   ```
   Request URL: http://localhost/Corosa/backend/api/trip.php?action=getAvailableTrips
   Request Method: GET
   Status Code: 200 OK (or other status)
   ```
   
   **Response Tab:**
   - Should show JSON response like:
   ```json
   {
     "success": true,
     "message": "Available trips retrieved successfully",
     "data": [...]
   }
   ```

   **Preview Tab:**
   - Shows formatted JSON (easier to read)

### Common Status Codes

- **200 OK** - Request successful, data returned
- **404 Not Found** - API endpoint not found (check URL path)
- **500 Internal Server Error** - Backend PHP error (check server logs)
- **400 Bad Request** - Missing or invalid parameters

### What to Check if Status is Not 200

1. **Check Request URL** - Ensure it matches: `/Corosa/backend/api/trip.php?action=getAvailableTrips`
2. **Check Response Tab** - Look for error messages from PHP
3. **Check Console Tab** - JavaScript errors may prevent the request
4. **Check Network Timing** - Red bars indicate slow/failed requests

