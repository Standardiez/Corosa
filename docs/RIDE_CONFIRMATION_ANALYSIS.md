# Ride Confirmation System - Complete Technical Analysis

## Table of Contents
1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow Diagram](#data-flow-diagram)
4. [Session Storage Management](#session-storage-management)
5. [Frontend Analysis](#frontend-analysis)
6. [Backend API Analysis](#backend-api-analysis)
7. [Database Operations](#database-operations)
8. [Code Walkthrough](#code-walkthrough)
9. [Error Handling](#error-handling)
10. [Security Considerations](#security-considerations)
11. [Testing Scenarios](#testing-scenarios)

---

## 1. Overview

### Purpose
The ride confirmation page is the **critical decision point** where a passenger:
1. Reviews the complete trip details
2. Sees driver and vehicle information
3. Views fare breakdown calculation
4. Selects payment method
5. Confirms the booking (creates database records)

### User Journey Context
```
[Previous] request-ride.html → [CURRENT] ride-confirmation.html → [Next] ride-status.html
```

### Technologies Used
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: PHP 7.4+, PDO for database
- **Database**: MySQL (with PostgreSQL compatibility)
- **Data Transfer**: JSON over HTTP (RESTful API)
- **Storage**: sessionStorage for temporary data

---

## 2. Component Architecture

### 2.1 File Structure
```
Corosa/
├── public/
│   ├── pages/
│   │   └── ride-confirmation.html     ← HTML structure & UI
│   └── js/
│       └── ride-confirmation.js       ← Client-side logic
│
└── backend/
    ├── api/
    │   ├── bookings.php               ← Booking API endpoint
    │   └── trip_assignment.php        ← Assignment API endpoint
    └── classes/
        ├── Bookings.php               ← Booking database operations
        └── TripAssignment.php         ← Assignment database operations
```

### 2.2 Component Interaction Map
```
┌─────────────────────────────────────────────────────────────────────┐
│                    RIDE CONFIRMATION SYSTEM                          │
└─────────────────────────────────────────────────────────────────────┘

USER INTERFACE (ride-confirmation.html)
    │
    ├─ Display Components:
    │   ├─ Trip summary (pickup/dropoff)
    │   ├─ Driver card (name, employment, vehicle)
    │   ├─ Fare breakdown table
    │   └─ Payment method selector
    │
    └─ Action Buttons:
        ├─ Back button → window.history.back()
        └─ Confirm button → triggers confirmRide()
                │
                ▼
        CLIENT LOGIC (ride-confirmation.js)
                │
                ├─ Load Data Functions:
                │   ├─ loadData() → Read from sessionStorage
                │   ├─ haversineDistance() → Calculate trip distance
                │   └─ currencyFormat() → Format prices
                │
                └─ Confirmation Process:
                    ├─ Validate user is logged in
                    ├─ Create booking payload
                    ├─ POST to bookings.php API
                    │       │
                    │       ▼
                    │   API LAYER (bookings.php)
                    │       │
                    │       ├─ Validate input
                    │       ├─ Instantiate Bookings class
                    │       └─ Call create() method
                    │               │
                    │               ▼
                    │       DATABASE LAYER (Bookings.php)
                    │               │
                    │               ├─ Prepare SQL INSERT
                    │               ├─ Bind parameters
                    │               ├─ Execute query
                    │               └─ Return booking_id
                    │                       │
                    │                       ▼
                    │       ┌───────────────────────┐
                    │       │   bookings TABLE      │
                    │       │   - booking_id (PK)   │
                    │       │   - passenger_id      │
                    │       │   - start_lat/long    │
                    │       │   - end_lat/long      │
                    │       │   - payment_type      │
                    │       │   - total_cost        │
                    │       │   - confirmation      │
                    │       └───────────────────────┘
                    │
                    ├─ Store bookingId in sessionStorage
                    │
                    ├─ Create assignment payload
                    ├─ POST to trip_assignment.php API
                    │       │
                    │       ▼
                    │   API LAYER (trip_assignment.php)
                    │       │
                    │       ├─ Validate input
                    │       ├─ Instantiate TripAssignment class
                    │       └─ Call create() method
                    │               │
                    │               ▼
                    │       DATABASE LAYER (TripAssignment.php)
                    │               │
                    │               ├─ Prepare SQL INSERT
                    │               ├─ Bind parameters
                    │               ├─ Execute query
                    │               ├─ Decrement available_seats in trips table
                    │               └─ Return assignment_id
                    │                       │
                    │                       ▼
                    │       ┌──────────────────────────┐
                    │       │ trip_assignment TABLE    │
                    │       │ - assignment_id (PK)     │
                    │       │ - booking_id (FK)        │
                    │       │ - trip_id (FK)           │
                    │       │ - assignment_status      │
                    │       │ - payment_type           │
                    │       │ - total_cost             │
                    │       └──────────────────────────┘
                    │
                    └─ Navigate to ride-status.html
```

---

## 3. Data Flow Diagram

### 3.1 Input Data Sources

#### Data from Previous Pages (sessionStorage)
```javascript
// Set by select-pickup.html
sessionStorage.getItem('pickupCoords')     // {"lat": 16.4023, "lng": 120.5960}
sessionStorage.getItem('pickupLocation')   // "Session Road, Baguio City"

// Set by select-dropoff.html
sessionStorage.getItem('dropoffCoords')    // {"lat": 16.4080, "lng": 120.5969}
sessionStorage.getItem('dropoffLocation')  // "SM Baguio"

// Set by request-ride.html
sessionStorage.getItem('selectedRide')     // Complete ride object (see below)
sessionStorage.getItem('selectedTripId')   // Trip database ID

// Set by login.html
sessionStorage.getItem('userId')           // Logged-in user's ID
```

#### selectedRide Object Structure
```javascript
{
    id: 789,                    // Trip ID
    tripId: 789,                // Same as id
    driverId: 1,                // Driver's database ID
    driver: {
        firstName: "John",
        middleInitial: "A",
        lastName: "Doe",
        employmentStatus: "Student"
    },
    vehicle: {
        model: "Toyota Vios",
        year: "2018",
        availableSeats: 3,
        totalCapacity: 4
    },
    rideStatus: "available",
    createdAt: "2025-11-17 10:30:00"
}
```

### 3.2 Data Transformation Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 1: PAGE LOAD - Load and Display Data                            │
└──────────────────────────────────────────────────────────────────────┘

sessionStorage (Raw Data)
    ↓
loadData() function
    ↓
    ├─ Parse JSON strings → JavaScript objects
    ├─ Validate all required data exists
    └─ Return data object or redirect if missing
        ↓
render() function
    ↓
    ├─ Display pickup/dropoff locations
    ├─ Format driver name with middle initial
    ├─ Calculate trip distance using Haversine formula
    ├─ Calculate fare: BASE + (DISTANCE × RATE_PER_KM)
    └─ Display all information in HTML elements

┌──────────────────────────────────────────────────────────────────────┐
│ STEP 2: USER CONFIRMS - Create Database Records                      │
└──────────────────────────────────────────────────────────────────────┘

User clicks "Confirm ride" button
    ↓
confirmRide() function
    ↓
    ├─ Validate userId exists (user is logged in)
    ├─ Validate tripId exists
    └─ Get payment method from dropdown
        ↓
        ├─ Build bookingPayload object:
        │   {
        │     passenger_id: 123,
        │     start_lat: 16.4023,
        │     start_long: 120.5960,
        │     end_lat: 16.4080,
        │     end_long: 120.5969,
        │     payment_type: "cash",
        │     total_cost: 70.00,
        │     booking_confirmation: true
        │   }
        │
        ├─ POST to /api/bookings.php
        │       ↓
        │   [Backend creates booking record]
        │       ↓
        │   Returns: { success: true, data: { booking_id: 456 } }
        │
        ├─ Store bookingId in sessionStorage
        │
        ├─ Build tripAssignmentPayload object:
        │   {
        │     booking_id: 456,
        │     trip_id: 789,
        │     seat_number: null,
        │     assignment_status: "confirmed",
        │     payment_type: "cash",
        │     total_cost: 70.00,
        │     booking_confirmation: true
        │   }
        │
        ├─ POST to /api/trip_assignment.php
        │       ↓
        │   [Backend creates assignment record]
        │   [Backend decrements available_seats in trips table]
        │       ↓
        │   Returns: { success: true, data: { assignment_id: 101 } }
        │
        └─ Navigate to ride-status.html
```

---

## 4. Session Storage Management

### 4.1 Data Read (On Page Load)

```javascript
// ride-confirmation.js - loadData() function

// Required data that MUST exist
const pickupCoords = JSON.parse(sessionStorage.getItem('pickupCoords'));
const dropoffCoords = JSON.parse(sessionStorage.getItem('dropoffCoords'));
const selectedRide = JSON.parse(sessionStorage.getItem('selectedRide'));

// If any critical data is missing → redirect to start
if (!pickupCoords || !dropoffCoords || !selectedRide) {
    alert('Missing trip or ride data. Please start over.');
    window.location.href = 'select-pickup.html';
    return null;
}
```

**Why this validation is critical:**
- Prevents errors from undefined data
- Ensures user followed proper booking flow
- Handles cases where user refreshed page or jumped directly to URL

### 4.2 Data Write (After Confirmation)

```javascript
// ride-confirmation.js - confirmRide() function

// Store booking information for ride-status.html
sessionStorage.setItem('bookingId', bookingId);
sessionStorage.setItem('assignmentId', assignmentId);
sessionStorage.setItem('bookingConfirmed', 'true');
sessionStorage.setItem('confirmedPaymentMethod', paymentMethod);
sessionStorage.setItem('fareTotal', fare.total.toString());
```

**Purpose of each stored value:**
| Key | Purpose | Used By |
|-----|---------|---------|
| `bookingId` | Database reference for this booking | ride-status.html, reviews |
| `assignmentId` | Links booking to specific trip | Future cancellation feature |
| `bookingConfirmed` | Flag that booking is finalized | ride-status.html validation |
| `confirmedPaymentMethod` | Record of payment choice | ride-status.html display |
| `fareTotal` | Amount to be collected | ride-status.html, receipts |

---

## 5. Frontend Analysis

### 5.1 HTML Structure (ride-confirmation.html)

#### Page Layout Breakdown
```html
<!DOCTYPE html>
<html>
<head>
    <!-- Standard meta tags, title, CSS links -->
    <link rel="stylesheet" href="../styles/styles.css">
    <link href='https://cdn.boxicons.com/3.0.3/fonts/basic/boxicons.min.css'>

    <!-- Page-specific styles -->
    <style>
        .confirm-card { /* Main container */ }
        .trip-summary { /* Pickup/dropoff display */ }
        .driver-card { /* Driver info display */ }
        .fare-breakdown { /* Fare calculation table */ }
        .confirm-actions { /* Button container */ }
    </style>
</head>

<body>
    <!-- Header with logo and user menu -->
    <header class="header">...</header>

    <main>
        <section class="card">
            <!-- Title and description -->
            <h2>Confirm your ride</h2>
            <p>Review trip and driver details...</p>

            <!-- Trip Summary Block -->
            <div class="trip-summary">
                <div class="trip-block">
                    <small>Pickup</small>
                    <div id="pickup-location">Loading...</div>
                </div>
                <div class="trip-block">
                    <small>Drop-off</small>
                    <div id="dropoff-location">Loading...</div>
                </div>
            </div>

            <!-- Driver Information Card -->
            <div class="driver-card">
                <div class="driver-avatar">
                    <svg><!-- User icon --></svg>
                </div>
                <div>
                    <div id="driver-name">Loading...</div>
                    <div id="driver-employment"></div>
                    <div id="driver-vehicle"></div>
                </div>
                <div>
                    <div>Seats</div>
                    <div id="driver-capacity"></div>
                </div>
            </div>

            <!-- Fare Breakdown Table -->
            <div class="fare-breakdown">
                <h4>Fare breakdown</h4>
                <div class="fare-row">
                    <div>Base fare</div>
                    <div id="fare-base">—</div>
                </div>
                <div class="fare-row">
                    <div>Distance</div>
                    <div id="fare-distance">—</div>
                </div>
                <div class="fare-row">
                    <div>Per-km charge</div>
                    <div id="fare-perkm">—</div>
                </div>
                <div class="fare-row">
                    <div>Total</div>
                    <div id="fare-total">—</div>
                </div>
            </div>

            <!-- Payment Method Selector -->
            <div>
                <label>Payment method</label>
                <select id="payment-method">
                    <option value="cash">Cash</option>
                    <option value="card">Card (on-file)</option>
                </select>
            </div>

            <!-- Action Buttons -->
            <div class="confirm-actions">
                <button id="back-btn">Back</button>
                <button id="confirm-btn">Confirm ride</button>
            </div>
        </section>
    </main>

    <!-- JavaScript -->
    <script src="../js/ride-confirmation.js"></script>
    <script src="../js/header-auth.js"></script>
</body>
</html>
```

**Key UI Elements:**
1. **Trip Summary**: Side-by-side pickup/dropoff display
2. **Driver Card**: Avatar, name, employment, vehicle info, seat availability
3. **Fare Breakdown**: Transparent pricing calculation
4. **Payment Selector**: Choice between payment methods
5. **Action Buttons**: Back (navigation) and Confirm (submission)

---

### 5.2 JavaScript Logic (ride-confirmation.js)

#### Complete Code Structure with Annotations

```javascript
/*
 * IIFE (Immediately Invoked Function Expression)
 * Wraps all code to avoid polluting global scope
 */
(function () {
    'use strict';  // Enforces stricter JavaScript rules

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================

    /**
     * Format GPS coordinates as string
     * @param {Object} latLng - {lat: number, lng: number}
     * @returns {string} - "16.402300, 120.596000"
     */
    function fmtLatLng(latLng) {
        return latLng.lat.toFixed(6) + ', ' + latLng.lng.toFixed(6);
    }

    /**
     * Calculate distance between two GPS points using Haversine formula
     *
     * HAVERSINE FORMULA EXPLANATION:
     * - Calculates "great-circle distance" between two points on a sphere
     * - Accounts for Earth's curvature (not flat-map distance)
     * - Returns result in kilometers
     *
     * MATH BREAKDOWN:
     * 1. Convert latitude/longitude differences to radians
     * 2. Calculate angular distance using haversine function
     * 3. Multiply by Earth's radius (6371 km) to get distance
     *
     * @param {Object} a - Start point {lat, lng}
     * @param {Object} b - End point {lat, lng}
     * @returns {number} - Distance in kilometers
     */
    function haversineDistance(a, b) {
        const toRad = x => x * Math.PI / 180;  // Degrees to radians converter
        const R = 6371; // Earth's radius in kilometers

        // Calculate latitude and longitude differences in radians
        const dLat = toRad(b.lat - a.lat);
        const dLng = toRad(b.lng - a.lng);
        const lat1 = toRad(a.lat);
        const lat2 = toRad(b.lat);

        // Haversine formula calculation
        const sinDLat = Math.sin(dLat / 2);
        const sinDLng = Math.sin(dLng / 2);
        const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
        const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

        return R * c;  // Distance in km
    }

    /**
     * Load and validate data from sessionStorage
     *
     * DATA SOURCES:
     * - pickupCoords/Location: Set by select-pickup.html
     * - dropoffCoords/Location: Set by select-dropoff.html
     * - selectedRide: Set by request-ride.html
     *
     * ERROR HANDLING:
     * - Missing data → Alert + redirect to start
     * - Invalid JSON → Caught by try-catch, same behavior
     *
     * @returns {Object|null} - Data object or null if missing
     */
    function loadData() {
        try {
            // Parse JSON strings from sessionStorage
            const pickupCoords = JSON.parse(sessionStorage.getItem('pickupCoords'));
            const pickupAddress = sessionStorage.getItem('pickupLocation');
            const dropoffCoords = JSON.parse(sessionStorage.getItem('dropoffCoords'));
            const dropoffAddress = sessionStorage.getItem('dropoffLocation');
            const selectedRide = JSON.parse(sessionStorage.getItem('selectedRide'));

            // Validate critical data exists
            if (!pickupCoords || !dropoffCoords || !selectedRide) {
                alert('Missing trip or ride data. Please start over.');
                window.location.href = 'select-pickup.html';
                return null;
            }

            // Return all data as object
            return { pickupCoords, pickupAddress, dropoffCoords, dropoffAddress, selectedRide };

        } catch (e) {
            // JSON parsing failed or other error
            console.error('Error reading session data', e);
            alert('Missing trip or ride data. Please start over.');
            window.location.href = 'select-pickup.html';
            return null;
        }
    }

    /**
     * Format number as Philippine Peso currency
     * @param {number} n - Amount
     * @returns {string} - "₱70.00"
     */
    function currencyFormat(n) {
        return '₱' + n.toFixed(2);
    }

    // ========================================================================
    // MAIN RENDER FUNCTION - Displays all data on page
    // ========================================================================
    function render() {
        // Load data from sessionStorage
        const data = loadData();
        if (!data) return;  // Exit if data missing (already redirected)

        const { pickupCoords, pickupAddress, dropoffCoords, dropoffAddress, selectedRide } = data;

        // ------------------------------------------------------------------------
        // STEP 1: Display Trip Locations
        // ------------------------------------------------------------------------
        // Use human-readable address if available, otherwise show coordinates
        document.getElementById('pickup-location').textContent =
            pickupAddress || fmtLatLng(pickupCoords);
        document.getElementById('dropoff-location').textContent =
            dropoffAddress || fmtLatLng(dropoffCoords);

        // ------------------------------------------------------------------------
        // STEP 2: Display Driver Information
        // ------------------------------------------------------------------------
        // Format driver's full name with middle initial
        const driverMid = selectedRide.driver.middleInitial
            ? selectedRide.driver.middleInitial + '. '
            : '';
        const driverFullName = `${selectedRide.driver.firstName} ${driverMid}${selectedRide.driver.lastName}`.trim();

        document.getElementById('driver-name').textContent = driverFullName;
        document.getElementById('driver-employment').textContent =
            selectedRide.driver.employmentStatus || '';

        // Format vehicle display: "Toyota Vios 2018"
        const vehicleDisplay = [selectedRide.vehicle.model, selectedRide.vehicle.year || '']
            .join(' ')
            .trim();
        document.getElementById('driver-vehicle').textContent = vehicleDisplay;

        // Format seat availability: "3/4"
        document.getElementById('driver-capacity').textContent =
            `${selectedRide.vehicle.availableSeats}/${selectedRide.vehicle.totalCapacity}`;

        // ------------------------------------------------------------------------
        // STEP 3: Calculate and Display Fare
        // ------------------------------------------------------------------------

        // FARE CALCULATION ALGORITHM:
        // Total = Base Fare + (Distance in km × Rate per km)

        const distanceKm = haversineDistance(pickupCoords, dropoffCoords);
        const base = 20.00;        // Base fare: ₱20.00
        const perKm = 8.00;        // Per-kilometer charge: ₱8.00/km
        const distanceCharge = perKm * distanceKm;
        const total = parseFloat((base + distanceCharge).toFixed(2));

        // Display fare breakdown
        document.getElementById('fare-base').textContent = currencyFormat(base);
        document.getElementById('fare-distance').textContent = distanceKm.toFixed(2) + ' km';
        document.getElementById('fare-perkm').textContent = currencyFormat(perKm) + ' / km';
        document.getElementById('fare-total').textContent = currencyFormat(total);

        // ------------------------------------------------------------------------
        // STEP 4: Setup Event Handlers
        // ------------------------------------------------------------------------

        // Back button: Return to previous page (request-ride.html)
        const backBtn = document.getElementById('back-btn');
        backBtn.addEventListener('click', function () {
            window.history.back();  // Browser's back navigation
        });

        // Confirm button: Create booking in database
        const confirmBtn = document.getElementById('confirm-btn');
        confirmBtn.addEventListener('click', function () {
            confirmRide({
                pickupCoords,
                dropoffCoords,
                selectedRide,
                fare: {
                    base,
                    perKm,
                    distanceKm,
                    total
                },
                confirmBtn  // Pass button reference to disable during request
            });
        });
    }

    // ========================================================================
    // CONFIRM RIDE FUNCTION - Creates booking and assignment records
    // ========================================================================
    /**
     * Confirms the ride by creating database records
     *
     * PROCESS:
     * 1. Validate user is logged in
     * 2. Create booking record (POST /api/bookings.php)
     * 3. Create trip assignment record (POST /api/trip_assignment.php)
     * 4. Store IDs in sessionStorage
     * 5. Navigate to ride-status.html
     *
     * ERROR HANDLING:
     * - No userId → Redirect to login
     * - No tripId → Redirect to request-ride
     * - API failures → Show error, re-enable button
     *
     * @param {Object} params - All required data
     */
    async function confirmRide({ pickupCoords, dropoffCoords, selectedRide, fare, confirmBtn }) {

        // ====================================================================
        // VALIDATION PHASE
        // ====================================================================

        // Check if user is logged in
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            alert('Please log in before confirming a ride.');
            window.location.href = 'login.html';
            return;
        }

        // Get trip ID (needed for assignment)
        const tripId = sessionStorage.getItem('selectedTripId')
                    || selectedRide.tripId
                    || selectedRide.id;
        if (!tripId) {
            alert('Missing trip information. Please select a ride again.');
            window.location.href = 'request-ride.html';
            return;
        }

        // Get selected payment method
        const paymentMethodSelect = document.getElementById('payment-method');
        const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : 'cash';

        // ====================================================================
        // UI FEEDBACK: Disable button during request
        // ====================================================================
        confirmBtn.disabled = true;
        const originalText = confirmBtn.textContent;
        confirmBtn.textContent = 'Confirming...';

        // ====================================================================
        // PHASE 1: CREATE BOOKING RECORD
        // ====================================================================

        // Build booking payload
        const bookingPayload = {
            passenger_id: Number(userId),
            start_lat: pickupCoords.lat,
            start_long: pickupCoords.lng,
            end_lat: dropoffCoords.lat,
            end_long: dropoffCoords.lng,
            payment_type: paymentMethod,
            total_cost: fare.total,
            booking_confirmation: true
        };

        try {
            // POST request to create booking
            const bookingResponse = await fetch('/Corosa/backend/api/bookings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload)
            });
            const bookingResult = await bookingResponse.json();

            // Check if booking creation succeeded
            if (!bookingResult.success) {
                throw new Error(bookingResult.message || 'Failed to create booking');
            }

            // Extract booking ID from response
            const bookingId = bookingResult.data && bookingResult.data.booking_id;
            if (!bookingId) {
                throw new Error('Booking created but no booking_id returned.');
            }

            // Store booking ID for next page
            sessionStorage.setItem('bookingId', bookingId);

            // ================================================================
            // PHASE 2: CREATE TRIP ASSIGNMENT RECORD
            // ================================================================

            // Build assignment payload
            const tripAssignmentPayload = {
                booking_id: bookingId,
                trip_id: Number(tripId),
                seat_number: null,  // Auto-assigned by backend
                assignment_status: 'confirmed',
                payment_type: paymentMethod,
                total_cost: fare.total,
                booking_confirmation: true
            };

            // POST request to create assignment
            const assignmentResponse = await fetch('/Corosa/backend/api/trip_assignment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tripAssignmentPayload)
            });
            const assignmentResult = await assignmentResponse.json();

            // Check if assignment creation succeeded
            if (!assignmentResult.success) {
                throw new Error(assignmentResult.message || 'Failed to create trip assignment');
            }

            // Extract assignment ID (optional)
            const assignmentId = assignmentResult.data && assignmentResult.data.assignment_id;
            if (assignmentId) {
                sessionStorage.setItem('assignmentId', assignmentId);
            }

            // ================================================================
            // PHASE 3: STORE CONFIRMATION DATA & NAVIGATE
            // ================================================================
            sessionStorage.setItem('bookingConfirmed', 'true');
            sessionStorage.setItem('confirmedPaymentMethod', paymentMethod);
            sessionStorage.setItem('fareTotal', fare.total.toString());

            alert('Ride confirmed! Opening live ride status...');
            window.location.href = 'ride-status.html';

        } catch (error) {
            // ================================================================
            // ERROR HANDLING
            // ================================================================
            console.error('Error confirming ride:', error);
            alert(error.message || 'Failed to confirm ride. Please try again.');

            // Re-enable button so user can retry
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
            return;
        }
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    // Run render() when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();  // DOM already loaded
    }

})();
```

---

## 6. Backend API Analysis

### 6.1 Bookings API (bookings.php)

#### API Endpoint Specification

**URL:** `POST /Corosa/backend/api/bookings.php`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
    "passenger_id": 123,
    "start_lat": 16.4023,
    "start_long": 120.5960,
    "end_lat": 16.4080,
    "end_long": 120.5969,
    "payment_type": "cash",
    "total_cost": 70.00,
    "booking_confirmation": true
}
```

**Success Response:**
```json
{
    "success": true,
    "message": "Booking created successfully",
    "data": {
        "booking_id": 456
    }
}
```

**Error Response:**
```json
{
    "success": false,
    "message": "Missing required fields (...)"
}
```

#### Code Flow Analysis

```php
<?php
// ===========================================================================
// STEP 1: Configure Response Headers
// ===========================================================================
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");  // Allow cross-origin requests
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, ...");

// ===========================================================================
// STEP 2: Load Dependencies
// ===========================================================================
require_once '../config/database.php';    // Database connection class
require_once '../classes/Bookings.php';   // Bookings model class

// ===========================================================================
// STEP 3: Initialize Database and Model
// ===========================================================================
$database = new Database();
$db = $database->getConnection();  // PDO connection object
$booking = new Bookings($db);      // Bookings instance with DB connection

// ===========================================================================
// STEP 4: Route Request by HTTP Method
// ===========================================================================
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'POST':
        // -------------------------------------------------------------------
        // CREATE NEW BOOKING
        // -------------------------------------------------------------------

        // Read raw POST data (JSON)
        $data = json_decode(file_get_contents("php://input"));

        // Validate required fields exist
        if(!empty($data->passenger_id)
           && !empty($data->start_lat)
           && !empty($data->start_long)
           && !empty($data->end_lat)
           && !empty($data->end_long)) {

            // Set properties on booking object
            $booking->passenger_id = $data->passenger_id;
            $booking->booking_date = $data->booking_date ?? date('Y-m-d H:i:s');
            $booking->start_lat = $data->start_lat;
            $booking->start_long = $data->start_long;
            $booking->end_lat = $data->end_lat;
            $booking->end_long = $data->end_long;
            $booking->payment_type = $data->payment_type ?? 'cash';
            $booking->total_cost = $data->total_cost ?? 0;
            $booking->booking_confirmation = $data->booking_confirmation ?? false;

            // Call create() method - inserts into database
            if($booking->create()) {
                // Success: Return booking_id
                echo json_encode(array(
                    "success" => true,
                    "message" => "Booking created successfully",
                    "data" => array("booking_id" => $booking->booking_id)
                ));
            } else {
                // Database insertion failed
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to create booking",
                    "debug" => $booking->getLastError()
                ));
            }
        } else {
            // Missing required fields
            echo json_encode(array(
                "success" => false,
                "message" => "Missing required fields (passenger_id, start_lat, ...)"
            ));
        }
        break;

    // Other methods: GET, PUT, DELETE (not used in ride confirmation)
}
?>
```

### 6.2 Trip Assignment API (trip_assignment.php)

**URL:** `POST /Corosa/backend/api/trip_assignment.php`

**Request Body:**
```json
{
    "booking_id": 456,
    "trip_id": 789,
    "seat_number": null,
    "assignment_status": "confirmed",
    "payment_type": "cash",
    "total_cost": 70.00,
    "booking_confirmation": true
}
```

**Success Response:**
```json
{
    "success": true,
    "message": "Trip assignment created successfully",
    "data": {
        "assignment_id": 101
    }
}
```

**Key Differences from Bookings API:**
1. **Requires `booking_id`**: Links to previously created booking
2. **Requires `trip_id`**: Links to driver's trip
3. **Auto-decrements seats**: When `booking_confirmation` is true, available seats are reduced by 1 in the `trips` table

---

## 7. Database Operations

### 7.1 Bookings Class (Bookings.php)

#### create() Method - SQL INSERT

```php
public function create() {
    // =======================================================================
    // STEP 1: Prepare SQL Query
    // =======================================================================
    $query = "INSERT INTO bookings
              (passenger_id, booking_date, start_lat, start_long, end_lat, end_long,
               payment_type, total_cost, booking_confirmation)
              VALUES (:passenger_id, :booking_date, :start_lat, :start_long,
                      :end_lat, :end_long, :payment_type, :total_cost, :booking_confirmation)";

    $stmt = $this->conn->prepare($query);

    // =======================================================================
    // STEP 2: Sanitize Input Data
    // =======================================================================
    // htmlspecialchars() prevents XSS attacks
    // strip_tags() removes HTML/PHP tags
    $this->passenger_id = htmlspecialchars(strip_tags($this->passenger_id));
    $this->booking_date = htmlspecialchars(strip_tags($this->booking_date));
    $this->start_lat = htmlspecialchars(strip_tags($this->start_lat));
    $this->start_long = htmlspecialchars(strip_tags($this->start_long));
    $this->end_lat = htmlspecialchars(strip_tags($this->end_lat));
    $this->end_long = htmlspecialchars(strip_tags($this->end_long));
    $this->payment_type = $this->payment_type !== null
        ? htmlspecialchars(strip_tags($this->payment_type))
        : 'cash';
    $this->total_cost = htmlspecialchars(strip_tags($this->total_cost));
    $this->booking_confirmation = $this->booking_confirmation ? 1 : 0;

    // =======================================================================
    // STEP 3: Bind Parameters (Prevent SQL Injection)
    // =======================================================================
    $stmt->bindParam(":passenger_id", $this->passenger_id, PDO::PARAM_INT);
    $stmt->bindParam(":booking_date", $this->booking_date);
    $stmt->bindParam(":start_lat", $this->start_lat);
    $stmt->bindParam(":start_long", $this->start_long);
    $stmt->bindParam(":end_lat", $this->end_lat);
    $stmt->bindParam(":end_long", $this->end_long);
    $stmt->bindParam(":payment_type", $this->payment_type);
    $stmt->bindParam(":total_cost", $this->total_cost);
    $stmt->bindParam(":booking_confirmation", $this->booking_confirmation, PDO::PARAM_BOOL);

    // =======================================================================
    // STEP 4: Execute Query
    // =======================================================================
    if($stmt->execute()) {
        // Get auto-generated booking_id
        $this->booking_id = (int)$this->conn->lastInsertId();
        $this->last_error = null;
        return true;
    }

    // Execution failed - log error
    $errorInfo = $stmt->errorInfo();
    $this->last_error = $errorInfo[2] ?? 'Unknown database error';
    error_log("Bookings::create failed: " . $this->last_error);
    return false;
}
```

**Database Schema for `bookings` Table:**
```sql
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    passenger_id INT,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_lat DECIMAL(10,8),
    start_long DECIMAL(11,8),
    end_lat DECIMAL(10,8),
    end_long DECIMAL(11,8),
    payment_type VARCHAR(50),
    total_cost DECIMAL(10,2),
    booking_confirmation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (passenger_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

### 7.2 TripAssignment Class (TripAssignment.php)

#### create() Method with Seat Management

```php
public function create() {
    // Insert trip assignment record
    $query = "INSERT INTO trip_assignment
              (booking_id, trip_id, seat_number, assignment_status,
               payment_type, total_cost, booking_confirmation)
              VALUES (...)";

    // ... prepare, bind, execute (similar to Bookings) ...

    if($stmt->execute()) {
        $this->assignment_id = (int)$this->conn->lastInsertId();

        // ===================================================================
        // CRITICAL FEATURE: Auto-decrement available seats
        // ===================================================================
        if ($this->booking_confirmation) {
            try {
                $updateQuery = "UPDATE trips
                                SET available_seats = CASE
                                    WHEN available_seats > 0 THEN available_seats - 1
                                    ELSE 0
                                END
                                WHERE trip_id = :trip_id";
                $updateStmt = $this->conn->prepare($updateQuery);
                $updateStmt->bindParam(":trip_id", $this->trip_id, PDO::PARAM_INT);
                $updateStmt->execute();

                // WHY THIS IS IMPORTANT:
                // - Prevents overbooking (more passengers than seats)
                // - Updates seat count in real-time
                // - Next user sees reduced available seats

            } catch (Exception $e) {
                error_log("Seat decrement failed: " . $e->getMessage());
            }
        }

        return true;
    }
    return false;
}
```

**Database Schema for `trip_assignment` Table:**
```sql
CREATE TABLE trip_assignment (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    trip_id INT,
    seat_number TINYINT UNSIGNED,
    assignment_status VARCHAR(50) DEFAULT 'confirmed',
    payment_type VARCHAR(50),
    total_cost DECIMAL(10,2),
    booking_confirmation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE
);
```

---

## 8. Code Walkthrough

### Complete User Journey with Code Trace

```
┌──────────────────────────────────────────────────────────────────────┐
│ USER ACTION: Arrives at ride-confirmation.html                       │
└──────────────────────────────────────────────────────────────────────┘

1. Browser loads HTML
    ↓
2. Browser loads ride-confirmation.js
    ↓
3. IIFE executes immediately
    ↓
4. Code reaches initialization block:
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();  ← Executes if DOM already loaded
    }
    ↓
5. render() function runs:
    ├─ Calls loadData()
    │   ├─ Reads sessionStorage.getItem('pickupCoords')
    │   ├─ Reads sessionStorage.getItem('dropoffCoords')
    │   ├─ Reads sessionStorage.getItem('selectedRide')
    │   ├─ Validates all data exists
    │   └─ Returns { pickupCoords, dropoffCoords, selectedRide, ... }
    │
    ├─ Displays locations:
    │   document.getElementById('pickup-location').textContent = ...
    │
    ├─ Displays driver info:
    │   document.getElementById('driver-name').textContent = ...
    │
    ├─ Calculates fare:
    │   const distance = haversineDistance(pickup, dropoff)
    │   const total = 20.00 + (distance * 8.00)
    │
    ├─ Displays fare breakdown:
    │   document.getElementById('fare-total').textContent = ₱70.00
    │
    └─ Sets up button handlers:
        backBtn.addEventListener('click', () => window.history.back())
        confirmBtn.addEventListener('click', () => confirmRide({...}))

┌──────────────────────────────────────────────────────────────────────┐
│ USER ACTION: Clicks "Confirm ride" button                            │
└──────────────────────────────────────────────────────────────────────┘

6. confirmRide() function executes:
    ├─ Validates userId exists (logged in)
    ├─ Validates tripId exists
    ├─ Gets payment method from dropdown
    ├─ Disables button, changes text to "Confirming..."
    │
    ├─ PHASE 1: Create Booking
    │   ├─ Build bookingPayload object
    │   ├─ fetch('/api/bookings.php', { method: 'POST', body: ... })
    │   │       ↓
    │   │   [Server receives request]
    │   │       ↓
    │   │   bookings.php executes:
    │   │   ├─ json_decode(file_get_contents('php://input'))
    │   │   ├─ Validates required fields
    │   │   ├─ Creates Bookings instance
    │   │   ├─ Sets properties from $data
    │   │   ├─ Calls $booking->create()
    │   │   │       ↓
    │   │   │   Bookings.php create() method:
    │   │   │   ├─ Prepares INSERT query
    │   │   │   ├─ Sanitizes input
    │   │   │   ├─ Binds parameters
    │   │   │   ├─ Executes query
    │   │   │   ├─ Gets lastInsertId() → booking_id
    │   │   │   └─ Returns true
    │   │   │
    │   │   └─ Returns JSON: { success: true, data: { booking_id: 456 } }
    │   │
    │   ├─ await bookingResponse.json()
    │   ├─ Checks bookingResult.success
    │   ├─ Extracts booking_id
    │   └─ sessionStorage.setItem('bookingId', 456)
    │
    └─ PHASE 2: Create Trip Assignment
        ├─ Build tripAssignmentPayload object
        ├─ fetch('/api/trip_assignment.php', { method: 'POST', body: ... })
        │       ↓
        │   [Server receives request]
        │       ↓
        │   trip_assignment.php executes:
        │   ├─ json_decode(file_get_contents('php://input'))
        │   ├─ Validates required fields
        │   ├─ Creates TripAssignment instance
        │   ├─ Sets properties from $data
        │   ├─ Calls $tripAssignment->create()
        │   │       ↓
        │   │   TripAssignment.php create() method:
        │   │   ├─ Prepares INSERT query
        │   │   ├─ Sanitizes input
        │   │   ├─ Binds parameters
        │   │   ├─ Executes INSERT into trip_assignment
        │   │   ├─ Gets lastInsertId() → assignment_id
        │   │   ├─ Executes UPDATE trips SET available_seats = available_seats - 1
        │   │   └─ Returns true
        │   │
        │   └─ Returns JSON: { success: true, data: { assignment_id: 101 } }
        │
        ├─ await assignmentResponse.json()
        ├─ Checks assignmentResult.success
        ├─ Extracts assignment_id
        ├─ sessionStorage.setItem('assignmentId', 101)
        ├─ sessionStorage.setItem('bookingConfirmed', 'true')
        ├─ sessionStorage.setItem('confirmedPaymentMethod', 'cash')
        ├─ sessionStorage.setItem('fareTotal', '70.00')
        │
        └─ window.location.href = 'ride-status.html'

┌──────────────────────────────────────────────────────────────────────┐
│ RESULT: Browser navigates to ride-status.html                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 9. Error Handling

### 9.1 Frontend Error Scenarios

#### Scenario 1: Missing Session Data
```javascript
// Problem: User directly typed URL without going through booking flow
// Detection: loadData() returns null
// Handler:
if (!pickupCoords || !dropoffCoords || !selectedRide) {
    alert('Missing trip or ride data. Please start over.');
    window.location.href = 'select-pickup.html';
    return null;
}

// User Experience: Redirected to start of booking flow
```

#### Scenario 2: User Not Logged In
```javascript
// Problem: userId missing from sessionStorage
// Detection: confirmRide() checks at start
// Handler:
const userId = sessionStorage.getItem('userId');
if (!userId) {
    alert('Please log in before confirming a ride.');
    window.location.href = 'login.html';
    return;
}

// User Experience: Prompted to login, then can continue
```

#### Scenario 3: API Request Failed
```javascript
// Problem: Network error, server down, etc.
// Detection: try-catch block in confirmRide()
// Handler:
catch (error) {
    console.error('Error confirming ride:', error);
    alert(error.message || 'Failed to confirm ride. Please try again.');

    // Re-enable button so user can retry
    confirmBtn.disabled = false;
    confirmBtn.textContent = originalText;
    return;
}

// User Experience: Error message shown, button re-enabled for retry
```

### 9.2 Backend Error Scenarios

#### Scenario 1: Invalid JSON
```php
// Problem: Malformed JSON in request body
// Detection: json_decode() returns null
// Handler:
$data = json_decode(file_get_contents("php://input"));
if (!$data) {
    echo json_encode([ 'success' => false, 'message' => 'Invalid JSON' ]);
    exit;
}
```

#### Scenario 2: Missing Required Fields
```php
// Problem: Frontend didn't send all required data
// Detection: empty() checks
// Handler:
if(!empty($data->passenger_id) && !empty($data->start_lat) ...) {
    // Process request
} else {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields (passenger_id, start_lat, ...)"
    ]);
}
```

#### Scenario 3: Database Insertion Failed
```php
// Problem: Database constraint violation, connection lost, etc.
// Detection: create() method returns false
// Handler:
if($booking->create()) {
    // Success response
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to create booking",
        "debug" => $booking->getLastError()  // MySQL error message
    ]);
}
```

---

## 10. Security Considerations

### 10.1 SQL Injection Prevention

**Vulnerable Code (DON'T DO THIS):**
```php
// BAD: Directly inserting user input into SQL
$query = "INSERT INTO bookings (passenger_id) VALUES (" . $data->passenger_id . ")";
$stmt->execute();

// ATTACK: User sends passenger_id: "1); DROP TABLE bookings;--"
// RESULT: Your entire bookings table is deleted!
```

**Secure Code (Corosa uses this):**
```php
// GOOD: Using prepared statements with parameter binding
$query = "INSERT INTO bookings (passenger_id) VALUES (:passenger_id)";
$stmt = $this->conn->prepare($query);
$stmt->bindParam(":passenger_id", $this->passenger_id, PDO::PARAM_INT);
$stmt->execute();

// WHY IT'S SAFE:
// - PDO escapes special characters automatically
// - Parameter treated as data, not executable code
// - Even malicious input can't break out of data context
```

### 10.2 Cross-Site Scripting (XSS) Prevention

```php
// Sanitization applied before database insertion
$this->passenger_id = htmlspecialchars(strip_tags($this->passenger_id));

// htmlspecialchars(): Converts < > " ' & to HTML entities
// strip_tags(): Removes HTML/PHP tags

// EXAMPLE:
// Input:  <script>alert('hacked')</script>
// After:  &lt;script&gt;alert('hacked')&lt;/script&gt;
// Result: Displayed as text, not executed as code
```

### 10.3 Data Validation

#### Client-Side (JavaScript)
```javascript
// Validation before sending request
const userId = sessionStorage.getItem('userId');
if (!userId) {
    alert('Please log in before confirming a ride.');
    return;  // Don't send request
}

// PURPOSE: Immediate user feedback, reduced server load
// LIMITATION: Can be bypassed by modifying JavaScript
```

#### Server-Side (PHP)
```php
// ALWAYS validate on server (never trust client)
if(!empty($data->passenger_id) && !empty($data->start_lat) ...) {
    // Process
} else {
    // Reject
}

// PURPOSE: Security enforcement, final validation layer
// RULE: Never rely on client-side validation alone!
```

### 10.4 Authentication Check

```javascript
// Verify user is logged in before booking
const userId = sessionStorage.getItem('userId');
if (!userId) {
    window.location.href = 'login.html';
    return;
}

// IMPROVEMENT NEEDED:
// - Current system: Only checks if userId exists in sessionStorage
// - Better approach: Validate token with backend on every request
// - Best approach: Use JWT tokens with expiration, server-side sessions
```

---

## 11. Testing Scenarios

### 11.1 Happy Path Testing

```
TEST: Complete booking flow with valid data
─────────────────────────────────────────────
1. Navigate to ride-confirmation.html after selecting a ride
2. Verify all data displays correctly:
   ✓ Pickup and dropoff locations shown
   ✓ Driver name, employment, vehicle displayed
   ✓ Fare breakdown calculated correctly
   ✓ Payment dropdown has options
3. Select payment method (cash)
4. Click "Confirm ride" button
5. Expected Results:
   ✓ Button shows "Confirming..." and is disabled
   ✓ Success alert appears: "Ride confirmed!"
   ✓ Redirects to ride-status.html
   ✓ Database has new booking record
   ✓ Database has new trip_assignment record
   ✓ Trip's available_seats decreased by 1
   ✓ sessionStorage contains bookingId, assignmentId
```

### 11.2 Edge Case Testing

#### Test Case 1: Missing Session Data
```
SCENARIO: User refreshes page or types URL directly
─────────────────────────────────────────────────────
Steps:
1. Clear sessionStorage.removeItem('pickupCoords')
2. Load ride-confirmation.html
3. Expected Result:
   ✓ Alert: "Missing trip or ride data"
   ✓ Redirect to select-pickup.html
   ✓ No API calls made
```

#### Test Case 2: User Not Logged In
```
SCENARIO: User logged out or session expired
──────────────────────────────────────────────
Steps:
1. Clear sessionStorage.removeItem('userId')
2. Load ride-confirmation.html (with valid ride data)
3. Click "Confirm ride"
4. Expected Result:
   ✓ Alert: "Please log in before confirming"
   ✓ Redirect to login.html
   ✓ No API calls made
```

#### Test Case 3: Network Failure
```
SCENARIO: Server unreachable during confirmation
──────────────────────────────────────────────────
Steps:
1. Disconnect from network
2. Click "Confirm ride"
3. Expected Result:
   ✓ Button shows "Confirming..." briefly
   ✓ Alert: "Failed to confirm ride"
   ✓ Button re-enabled with original text
   ✓ User can retry when connection restored
```

#### Test Case 4: Duplicate Booking
```
SCENARIO: User clicks "Confirm" multiple times rapidly
────────────────────────────────────────────────────────
Steps:
1. Click "Confirm ride"
2. Immediately click again (before first request completes)
3. Expected Result:
   ✓ Button disabled after first click
   ✓ Second click has no effect
   ✓ Only one booking created in database
```

### 11.3 Integration Testing

```
TEST: End-to-end booking flow with database
─────────────────────────────────────────────
Prerequisites:
- Database tables created (bookings, trip_assignment, trips, users)
- Test user exists (user_id: 123)
- Test trip exists (trip_id: 789, available_seats: 4)

Steps:
1. Set sessionStorage data:
   - userId: 123
   - pickupCoords: {"lat": 16.4023, "lng": 120.5960}
   - dropoffCoords: {"lat": 16.4080, "lng": 120.5969}
   - selectedRide: {valid ride object}
   - selectedTripId: 789
2. Load ride-confirmation.html
3. Click "Confirm ride"
4. Verify Database Changes:
   - Query: SELECT * FROM bookings WHERE passenger_id = 123
     ✓ New record exists
     ✓ start_lat = 16.4023
     ✓ end_lat = 16.4080
     ✓ booking_confirmation = 1
   - Query: SELECT * FROM trip_assignment WHERE booking_id = [new_booking_id]
     ✓ New record exists
     ✓ trip_id = 789
     ✓ assignment_status = 'confirmed'
   - Query: SELECT available_seats FROM trips WHERE trip_id = 789
     ✓ available_seats = 3 (decreased from 4)
```

---

## 12. Summary & Key Takeaways

### Critical Code Paths

1. **Page Load Path:**
   ```
   HTML loads → JS executes → loadData() → render() → Display UI
   ```

2. **Confirmation Path:**
   ```
   Button click → confirmRide() → POST bookings → POST assignment → Navigate
   ```

3. **Data Flow:**
   ```
   sessionStorage → JavaScript → JSON → PHP API → Database → Response JSON
   ```

### Important Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `loadData()` | ride-confirmation.js | Read session data, validate |
| `haversineDistance()` | ride-confirmation.js | Calculate trip distance |
| `render()` | ride-confirmation.js | Display all information |
| `confirmRide()` | ride-confirmation.js | Create booking/assignment |
| `Bookings::create()` | Bookings.php | Insert booking record |
| `TripAssignment::create()` | TripAssignment.php | Insert assignment, update seats |

### Database Tables Involved

1. **bookings**: Passenger's trip request
2. **trip_assignment**: Links booking to driver's trip
3. **trips**: Driver's available ride (seats updated)
4. **users**: Validates passenger_id foreign key

### Security Measures

✅ PDO prepared statements (SQL injection prevention)
✅ htmlspecialchars + strip_tags (XSS prevention)
✅ Client & server-side validation
✅ CORS headers for cross-origin safety
❌ Missing: JWT token validation (improvement needed)
❌ Missing: Rate limiting (improvement needed)

### Performance Considerations

- **Haversine calculation**: Done client-side (no server load)
- **Two sequential API calls**: Could be optimized with single endpoint
- **Session storage**: Fast read/write, no database queries needed
- **Auto-commit transactions**: Each INSERT commits immediately (could use transactions for atomicity)

---

**Document Version:** 1.0
**Last Updated:** November 2025
**Author:** Corosa Development Team
