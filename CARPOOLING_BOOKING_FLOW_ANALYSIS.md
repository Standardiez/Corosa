# Corosa Carpooling Booking System - Technical Analysis

## Overview

This document provides a comprehensive analysis of the Corosa carpooling booking system's page routing flow and database operations (CRUD) from the passenger perspective.

---

## 1. Page Routing Flow

### Complete User Journey

```
index.html → login.html → select-pickup.html → select-dropoff.html → request-ride.html → ride-confirmation.html → ride-status.html → RateAndReview.html
```

### Detailed Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         COROSA BOOKING FLOW                              │
└──────────────────────────────────────────────────────────────────────────┘

     START
       │
       ▼
┌─────────────┐
│ index.html  │ Landing Page
│             │ • Hero section with Corosa branding
│             │ • "Find Ride" button → select-pickup.html
│             │ • "Create account" → signup.html
│             │ • "Login" link → login.html
└──────┬──────┘
       │ User clicks "Find Ride"
       ▼
┌─────────────┐
│ login.html  │ Authentication Gate (if not logged in)
│             │ • User enters email + password
│             │ • POST /backend/api/login.php
│             │ • On success: Save userData to localStorage
│             │ • Navigate to select-pickup.html
└──────┬──────┘
       │ Authenticated
       ▼
┌─────────────┐
│select-pickup│ Pickup Location Selection
│   .html     │ • Google Maps integration
│             │ • User's current location (geolocation API)
│             │ • Draggable marker for precise selection
│             │ • Reverse geocoding for address display
│             │ • Store: pickupLocation, pickupCoords in sessionStorage
│             │ • "Next" → select-dropoff.html
└──────┬──────┘
       │ Pickup selected
       ▼
┌─────────────┐
│select-dropoff│ Drop-off Location Selection
│   .html     │ • Display selected pickup location
│             │ • Google Maps with pickup marker (red circle)
│             │ • Draggable marker for drop-off point
│             │ • Reverse geocoding for address display
│             │ • Store: dropoffLocation, dropoffCoords in sessionStorage
│             │ • "Back" → select-pickup.html
│             │ • "Next" → request-ride.html
└──────┬──────┘
       │ Drop-off selected
       ▼
┌─────────────┐
│request-ride │ Available Rides Display
│   .html     │ • Display route map (pickup → dropoff)
│             │ • Google Directions API for route visualization
│             │ • GET /backend/api/trip.php?action=getAvailableTrips
│             │ • Show list of available drivers with:
│             │   - Driver name & employment status
│             │   - Vehicle model & year
│             │   - Available seats (X/Y format)
│             │   - "Request Ride" button
│             │ • Store: selectedRide, selectedTripId in sessionStorage
│             │ • Click ride → ride-confirmation.html
└──────┬──────┘
       │ Ride selected
       ▼
┌─────────────┐
│ride-confirm │ Booking Confirmation
│  ation.html │ • Display full trip summary:
│             │   - Pickup & drop-off locations
│             │   - Driver details (name, employment, vehicle)
│             │   - Fare breakdown:
│             │     • Base fare: ₱20.00
│             │     • Distance charge: ₱8.00/km
│             │     • Total cost calculation
│             │ • Payment method selection (Cash/GCash)
│             │ • "Back" → request-ride.html
│             │ • "Confirm Ride" button triggers:
│             │   1. POST /backend/api/bookings.php (create booking)
│             │   2. POST /backend/api/trip_assignment.php (assign to trip)
│             │   3. Store: bookingId, assignmentId in sessionStorage
│             │   4. Navigate to ride-status.html
└──────┬──────┘
       │ Booking confirmed
       ▼
┌─────────────┐
│ride-status  │ Live Ride Tracking
│   .html     │ • Real-time map visualization
│             │ • Google Maps with 3 markers:
│             │   - Driver's current position (car icon)
│             │   - Pickup location (green circle)
│             │   - Drop-off location (red circle)
│             │ • Google Directions API for route polylines
│             │ • 3-stage animation:
│             │   Stage 1: Driver approaching pickup
│             │   Stage 2: En route to destination
│             │   Stage 3: Ride completed
│             │ • Progress indicators show current stage
│             │ • On completion (Stage 3):
│             │   - Wait 800ms
│             │   - Auto-redirect to RateAndReview.html
└──────┬──────┘
       │ Ride completed
       ▼
┌─────────────┐
│RateAndReview│ Post-Ride Feedback
│   .html     │ • Rate driver (1-5 stars)
│             │ • Optional text review
│             │ • POST /backend/api/reviews.php
│             │ • "Submit" → Return to index.html or dashboard
└──────┬──────┘
       │
      END
```

---

## 2. Session & Local Storage Management

### Storage Keys Used Throughout Flow

#### sessionStorage (Temporary - cleared on tab close)

| Key                      | Set By                 | Used By                                                      | Purpose                                     |
| ------------------------ | ---------------------- | ------------------------------------------------------------ | ------------------------------------------- |
| `userId`                 | login.html             | ride-confirmation.html                                       | User identification for bookings            |
| `userEmail`              | login.html             | Various                                                      | User email reference                        |
| `pickupLocation`         | select-pickup.html     | select-dropoff, request-ride, ride-confirmation, ride-status | Human-readable pickup address               |
| `pickupCoords`           | select-pickup.html     | select-dropoff, request-ride, ride-confirmation, ride-status | Pickup GPS coordinates (JSON)               |
| `dropoffLocation`        | select-dropoff.html    | request-ride, ride-confirmation, ride-status                 | Human-readable drop-off address             |
| `dropoffCoords`          | select-dropoff.html    | request-ride, ride-confirmation, ride-status                 | Drop-off GPS coordinates (JSON)             |
| `selectedRide`           | request-ride.html      | ride-confirmation, ride-status                               | Complete ride object (driver, vehicle info) |
| `selectedTripId`         | request-ride.html      | ride-confirmation                                            | Database trip_id for assignment             |
| `bookingId`              | ride-confirmation.html | ride-status, reviews                                         | Created booking record ID                   |
| `assignmentId`           | ride-confirmation.html | -                                                            | Trip assignment record ID                   |
| `confirmedPaymentMethod` | ride-confirmation.html | -                                                            | Selected payment method                     |
| `fareTotal`              | ride-confirmation.html | -                                                            | Final calculated fare                       |

#### localStorage (Persistent - survives tab close)

| Key         | Set By     | Used By                           | Purpose                                                      |
| ----------- | ---------- | --------------------------------- | ------------------------------------------------------------ |
| `userData`  | login.html | header-auth.js, user-profile.html | Full user object (userId, email, firstName, lastName, token) |
| `userToken` | login.html | API calls                         | Authentication token (if provided)                           |

---

## 3. Database CRUD Operations Analysis

### 3.1 Login Flow (READ)

**Page:** `login.html`
**API Endpoint:** `POST /Corosa/backend/api/login.php`

**Operation:** READ

```javascript
// Frontend Request
{
  email: "user@slu.edu.ph",
  password: "userPassword123"
}

// Backend Process
1. Query users table by email
2. Verify hashed_password using password_verify()
3. Retrieve user record with JOIN to address table

// Response
{
  success: true,
  userId: 123,
  firstName: "John",
  lastName: "Doe",
  token: "jwt_token_here",
  message: "Logged in"
}
```

**Database Tables Accessed:**

- `users` (READ)
- `address` (READ via JOIN)

---

### 3.2 Available Trips Retrieval (READ)

**Page:** `request-ride.html`
**API Endpoint:** `GET /Corosa/backend/api/trip.php?action=getAvailableTrips`

**Operation:** READ (Complex JOIN query)

```sql
SELECT
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
  u.user_id,
  u.first_name,
  u.middle_initial,
  u.last_name,
  u.email,
  u.employment_status,
  v.vehicle_model,
  v.plate_number,
  v.seat_capacity
FROM trips t
LEFT JOIN driver d ON t.driver_id = d.driver_id
LEFT JOIN users u ON d.user_id = u.user_id
LEFT JOIN vehicle v ON v.driver_id = d.driver_id
WHERE t.ride_status IN ('available', 'scheduled')
ORDER BY t.created_at DESC
```

**Database Tables Accessed:**

- `trips` (READ)
- `driver` (READ via JOIN)
- `users` (READ via JOIN)
- `vehicle` (READ via JOIN)

**Frontend Display:**

- Driver full name (first_name + middle_initial + last_name)
- Employment status
- Vehicle model & year
- Available seats / total capacity
- Trip creation timestamp

---

### 3.3 Booking Creation (CREATE)

**Page:** `ride-confirmation.html`
**API Endpoint:** `POST /Corosa/backend/api/bookings.php`

**Operation:** CREATE

```javascript
// Frontend Request
{
  passenger_id: 123,
  start_lat: 16.4023,
  start_long: 120.5960,
  end_lat: 16.4080,
  end_long: 120.5969,
  payment_type: "cash",
  total_cost: 70.00,
  booking_confirmation: true
}

// SQL Executed
INSERT INTO bookings (
  passenger_id,
  booking_date,
  start_lat,
  start_long,
  end_lat,
  end_long,
  payment_type,
  total_cost,
  booking_confirmation,
  created_at
) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, NOW())

// Response
{
  success: true,
  message: "Booking created successfully",
  data: {
    booking_id: 456
  }
}
```

**Database Tables Affected:**

- `bookings` (CREATE/INSERT)

**Business Logic:**

- booking_date defaults to current timestamp
- booking_confirmation set to true (confirmed booking)
- Foreign key reference to users.user_id (passenger_id)

---

### 3.4 Trip Assignment (CREATE)

**Page:** `ride-confirmation.html`
**API Endpoint:** `POST /Corosa/backend/api/trip_assignment.php`

**Operation:** CREATE

```javascript
// Frontend Request
{
  booking_id: 456,
  trip_id: 789,
  seat_number: null,
  assignment_status: "confirmed",
  payment_type: "cash",
  total_cost: 70.00,
  booking_confirmation: true
}

// SQL Executed
INSERT INTO trip_assignment (
  booking_id,
  trip_id,
  seat_number,
  assignment_status,
  payment_type,
  total_cost,
  booking_confirmation,
  created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())

// Response
{
  success: true,
  message: "Trip assignment created successfully",
  data: {
    assignment_id: 101
  }
}
```

**Database Tables Affected:**

- `trip_assignment` (CREATE/INSERT)

**Business Logic:**

- Links booking to specific trip
- assignment_status: "confirmed" (passenger confirmed)
- Foreign keys: bookings.booking_id, trips.trip_id
- Seat number currently null (can be assigned later)

---

### 3.5 Review Submission (CREATE)

**Page:** `RateAndReview.html`
**API Endpoint:** `POST /Corosa/backend/api/reviews.php`

**Operation:** CREATE

```javascript
// Frontend Request
{
  booking_id: 456,
  rating: 5,
  comment: "Great driver! Very safe and friendly."
}

// SQL Executed
INSERT INTO reviews (
  booking_id,
  rating,
  comment,
  created_at
) VALUES (?, ?, ?, NOW())

// Response
{
  success: true,
  message: "Review submitted successfully",
  data: {
    review_id: 234
  }
}
```

**Database Tables Affected:**

- `reviews` (CREATE/INSERT)

**Business Logic:**

- One review per booking
- Rating scale: 1-5 stars
- Comment is optional (TEXT field)
- Foreign key to bookings.booking_id

---

## 4. Data Flow Summary

### 4.1 User Authentication Flow

```
User Input (login.html)
    ↓
POST /api/login.php
    ↓
Database Query: SELECT FROM users WHERE email = ?
    ↓
Password Verification (hashed_password)
    ↓
Response: userData object
    ↓
Store in localStorage & sessionStorage
    ↓
Navigate to select-pickup.html
```

### 4.2 Booking Creation Flow

```
Location Selection (select-pickup.html, select-dropoff.html)
    ↓
Store in sessionStorage: pickupCoords, dropoffCoords
    ↓
Fetch Available Trips (request-ride.html)
    ↓
GET /api/trip.php?action=getAvailableTrips
    ↓
Database: Multi-table JOIN (trips + driver + users + vehicle)
    ↓
Display ride cards with driver/vehicle info
    ↓
User selects ride → ride-confirmation.html
    ↓
Calculate fare (base + distance * rate)
    ↓
User confirms booking
    ↓
[Transaction Start]
    ├─ POST /api/bookings.php
    │      ↓
    │  INSERT INTO bookings
    │      ↓
    │  Return booking_id
    │
    └─ POST /api/trip_assignment.php
           ↓
       INSERT INTO trip_assignment
           ↓
       Return assignment_id
[Transaction End]
    ↓
Navigate to ride-status.html
    ↓
Simulate ride progress with Google Maps
    ↓
On completion → RateAndReview.html
    ↓
POST /api/reviews.php
    ↓
INSERT INTO reviews
    ↓
Complete
```

---

## 5. Database Schema Relationships

### Entity Relationship Diagram (Text Format)

```
users (1) ──────< (N) bookings
  │                      │
  │                      │
  └──> (1) address       │
  │                      │
  │                      └──> (1) trip_assignment (N) ──┐
  │                                                      │
  └──> (1) driver (1) ──> (N) trips ───────────────────┘
          │                     │
          │                     │
          └──> (1) vehicle      └──> reviews (N) <── bookings (1)
```

### Key Relationships Used in Booking Flow

1. **users → bookings** (1:N)

   - A user (passenger) can have multiple bookings
   - Foreign Key: `bookings.passenger_id → users.user_id`

2. **users → driver** (1:1)

   - A user can be a driver (optional)
   - Foreign Key: `driver.user_id → users.user_id`

3. **driver → trips** (1:N)

   - A driver can offer multiple trips
   - Foreign Key: `trips.driver_id → driver.driver_id`

4. **driver → vehicle** (1:N)

   - A driver can have multiple vehicles
   - Foreign Key: `vehicle.driver_id → driver.driver_id`

5. **bookings ↔ trips** (N:M via trip_assignment)

   - Many bookings can be assigned to many trips
   - Junction Table: `trip_assignment`
   - Foreign Keys:
     - `trip_assignment.booking_id → bookings.booking_id`
     - `trip_assignment.trip_id → trips.trip_id`

6. **bookings → reviews** (1:1)
   - One booking can have one review
   - Foreign Key: `reviews.booking_id → bookings.booking_id`

---

## 6. API Endpoints Summary

### Complete API Reference

| Method | Endpoint                                   | Purpose                    | Returns                                        |
| ------ | ------------------------------------------ | -------------------------- | ---------------------------------------------- |
| POST   | `/api/login.php`                           | Authenticate user          | userData + token                               |
| GET    | `/api/trip.php?action=getAvailableTrips`   | Get all available rides    | Array of trip objects with driver/vehicle info |
| GET    | `/api/trip.php?trip_id={id}`               | Get specific trip details  | Single trip object                             |
| POST   | `/api/bookings.php`                        | Create new booking         | booking_id                                     |
| GET    | `/api/bookings.php?booking_id={id}`        | Get booking details        | Single booking object                          |
| GET    | `/api/bookings.php?passenger_id={id}`      | Get user's booking history | Array of bookings                              |
| POST   | `/api/trip_assignment.php`                 | Assign booking to trip     | assignment_id                                  |
| GET    | `/api/trip_assignment.php?booking_id={id}` | Get assignment for booking | Assignment object                              |
| POST   | `/api/reviews.php`                         | Submit ride review         | review_id                                      |
| GET    | `/api/reviews.php?booking_id={id}`         | Get review for booking     | Review object                                  |

---

## 7. Technology Stack

### Frontend

- **HTML5** - Page structure
- **CSS3** - Styling (custom design system)
- **Vanilla JavaScript** - No frameworks, pure JS
- **Google Maps JavaScript API** - Location selection, route visualization, real-time tracking
- **Google Geocoding API** - Reverse geocoding for address display
- **Google Directions API** - Route calculation and turn-by-turn directions

### Backend

- **PHP 7.4+** - Server-side logic
- **MySQL/PostgreSQL** - Database (designed for both)
- **PDO** - Database abstraction layer
- **RESTful API** - JSON request/response format
- **CORS enabled** - Cross-origin resource sharing

### Data Storage

- **sessionStorage** - Temporary booking flow data
- **localStorage** - Persistent user authentication data
- **MySQL Database** - Permanent data storage

---

## 8. Key Features & Implementation Details

### 8.1 Real-Time Geolocation

```javascript
// select-pickup.js
navigator.geolocation.getCurrentPosition(
  (position) => {
    const userLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
    // Center map on user's location
    // Place draggable marker
  },
  (error) => {
    // Fallback to Baguio City default
    const fallback = { lat: 16.4023, lng: 120.596 };
  }
);
```

### 8.2 Fare Calculation Algorithm

```javascript
// ride-confirmation.js
function calculateFare(pickupCoords, dropoffCoords) {
  const BASE_FARE = 20.0; // ₱20.00 base
  const RATE_PER_KM = 8.0; // ₱8.00 per km

  // Haversine formula for distance
  const distance = haversineDistance(pickupCoords, dropoffCoords);
  const distanceCharge = RATE_PER_KM * distance;
  const totalFare = BASE_FARE + distanceCharge;

  return {
    base: BASE_FARE,
    perKm: RATE_PER_KM,
    distance: distance,
    total: totalFare,
  };
}
```

### 8.3 Route Visualization

```javascript
// ride-status.js
// Uses Google Directions Service for realistic routing
directionsService.route(
  {
    origin: pickupCoords,
    destination: dropoffCoords,
    travelMode: google.maps.TravelMode.DRIVING,
  },
  (result, status) => {
    if (status === "OK") {
      directionsRenderer.setDirections(result);
      // Animate car marker along route steps
    }
  }
);
```

### 8.4 Ride Status Animation

```javascript
// 3-stage animation system
Stage 1: Driver approaching pickup
  - Car marker moves from offset position to pickup marker
  - Route polyline displayed in real-time

Stage 2: En route to destination
  - Car marker travels from pickup to drop-off
  - Progress indicator updates

Stage 3: Ride completed
  - Car reaches drop-off marker
  - Wait 800ms
  - Auto-redirect to RateAndReview.html
```

---

## 9. Security Considerations

### 9.1 Authentication

- **Password Hashing**: Uses PHP's `password_hash()` with bcrypt
- **Token-Based Auth**: JWT tokens stored in localStorage
- **Session Management**: User ID stored in sessionStorage for booking flow

### 9.2 Data Validation

- **Frontend Validation**: Email format, required fields
- **Backend Validation**:
  - SQL injection prevention via PDO prepared statements
  - Input sanitization
  - Type checking (passenger_id, coordinates)

### 9.3 API Security

- **CORS Headers**: Access-Control-Allow-Origin configured
- **Method Restriction**: Only specified HTTP methods allowed
- **Required Fields Validation**: Checks for missing data before DB operations

---

## 10. Potential Improvements

### Database Optimizations

1. **Add Geospatial Indexes**:
   ```sql
   CREATE SPATIAL INDEX idx_trips_location ON trips(start_lat, start_long);
   ```
2. **Transaction Wrapping**: Wrap booking + assignment in single transaction
3. **Seat Management**: Implement seat decrement on trip assignment

### Feature Enhancements

1. **WebSocket Integration**: Real-time driver location updates
2. **Push Notifications**: Booking confirmations, ride updates
3. **Trip Matching Algorithm**: Match passengers to most optimal routes
4. **Payment Gateway**: Integration with GCash/PayMaya APIs
5. **Driver Acceptance Flow**: Allow drivers to accept/reject requests

### Code Quality

1. **Error Handling**: Comprehensive try-catch blocks
2. **Loading States**: Skeleton screens during API calls
3. **Retry Logic**: Handle network failures gracefully
4. **Unit Tests**: Frontend validation functions
5. **API Documentation**: OpenAPI/Swagger specification

---

## 11. Conclusion

The Corosa carpooling system implements a complete booking flow with:

✅ **7 main pages** in the passenger booking journey
✅ **5 API endpoints** for CRUD operations
✅ **6 database tables** involved in booking process
✅ **2 CREATE operations** (booking + assignment) per ride request
✅ **Multiple READ operations** for trip discovery and user authentication
✅ **Google Maps integration** for location services and route visualization
✅ **Real-time simulation** of ride progress with animated tracking

The architecture follows RESTful principles with clear separation of concerns between frontend (client-side routing, UI) and backend (data persistence, business logic). The use of sessionStorage for temporary booking flow data and localStorage for persistent authentication ensures a smooth user experience while maintaining security best practices.

---

**Document Version:** 1.0
**Last Updated:** November 2025
**Prepared for:** Corosa Technical Presentation
