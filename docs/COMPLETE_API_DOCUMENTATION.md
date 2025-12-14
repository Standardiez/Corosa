# Corosa Project - Complete Frontend ↔ Backend ↔ Database Documentation

**Project Structure:** Carpooling application for SLU Maryheights  
**Stack:** HTML/CSS/JavaScript (Frontend) + PHP/MySQL (Backend)

---

## Table of Contents
1. [Index Page](#1-index-page)
2. [Login Page](#2-login-page)
3. [Signup Page](#3-signup-page)
4. [Select Pickup Page](#4-select-pickup-page)
5. [Select Dropoff Page](#5-select-dropoff-page)
6. [Request Ride Page](#6-request-ride-page)
7. [Ride Confirmation Page](#7-ride-confirmation-page)
8. [Ride Status Page](#8-ride-status-page)
9. [User Profile Page](#9-user-profile-page)
10. [Rate Driver Page](#10-rate-driver-page)
11. [Rate and Review Page](#11-rate-and-review-page)

---

## 1. INDEX PAGE

**File:** `public/pages/index.html`

### UI Purpose
- Landing/home page of the application
- Shows hero section with CTA buttons ("Find Ride", "Create account")
- Displays user information in header if logged in

### Frontend-Backend Connection

#### 1.1 Authentication Check
**Trigger:** Page loads  
**Location:** `public/js/header-auth.js` (lines 1-85)

```javascript
// Checks localStorage for user session
const userDataStr = localStorage.getItem('userData');
if (userDataStr) {
    // Parse and display user info
    const userData = JSON.parse(userDataStr);
    // Show user initials in header
}
```

**Data Flow:**
1. **Trigger:** Page loads
2. **Frontend sends:** Nothing (reads from localStorage)
3. **Backend receives:** N/A
4. **Database query:** None (uses client-side storage)
5. **Returns to frontend:** User profile data from localStorage
6. **Frontend displays:** User initials and logout button if logged in

#### 1.2 Logout Functionality
**Function:** `handleLogout()` in `header-auth.js`

```javascript
function handleLogout() {
    localStorage.removeItem('userData');
    localStorage.removeItem('userToken');
    window.location.href = 'index.html';
}
```

---

## 2. LOGIN PAGE

**File:** `public/pages/login.html`

### UI Purpose
- Allows users to sign in with email and password
- Redirects to select-pickup after successful login

### Frontend-Backend Connection

#### 2.1 Login Form Submission
**API Endpoint:** `POST /Corosa/backend/api/login.php`  
**Location:** `public/js/login.js` (lines 40-90)

**Frontend Request:**
```javascript
const endpoint = "/Corosa/backend/api/login.php";
const payload = { 
    email: "user@example.com", 
    password: "password123" 
};
fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
})
```

**Backend Handler:** `backend/api/login.php` (lines 1-50)
```php
$raw_input = file_get_contents('php://input');
$data = json_decode($raw_input, true);
$email = $data['email'];
$password = $data['password'];

$database = new Database();
$db = $database->getConnection();
$user = new User($db);
$user->email = $email;

if ($user->getByEmail()) {
    if (password_verify($password, $user->hashed_password)) {
        echo json_encode(['success' => true, 'userId' => $user->user_id]);
    }
}
```

**Database Query:** `backend/classes/User.php::getByEmail()` (lines 115-140)
```sql
SELECT * FROM users WHERE email = :email LIMIT 1
```

**Database Flow:**
1. **Query:** Fetch user by email
2. **Table:** `users` table
3. **Columns returned:** 
   - `user_id`
   - `first_name`, `middle_initial`, `last_name`
   - `email`, `hashed_password`
   - `mobile_number`, `address_id`
   - `disabilities`, `employment_status`, `account_status`
   - `created_at`

**Response to Frontend:**
```json
{
    "success": true,
    "userId": 123,
    "message": "Logged in"
}
```

**Frontend Processing:**
```javascript
if (resp.success) {
    const userData = {
        userId: resp.userId,
        email: email,
        firstName: resp.firstName || 'User',
        lastName: resp.lastName || '',
        token: resp.token || null
    };
    localStorage.setItem('userData', JSON.stringify(userData));
    window.location.href = 'select-pickup.html';
}
```

---

## 3. SIGNUP PAGE

**File:** `public/pages/signup.html`

### UI Purpose
- User registration form
- Collects personal, contact, and address information
- Creates new user account in database

### Frontend-Backend Connection

#### 3.1 Signup Form Submission
**API Endpoint:** `POST /Corosa/backend/api/users.php`  
**Location:** `public/js/signup.js` (lines 150-205)

**Frontend Request:**
```javascript
const payload = {
    firstName: "Juan",
    middleInitial: "P",
    lastName: "Dela Cruz",
    birthdate: "1995-07-21",
    email: "juan@example.com",
    mobile: "09171234567",
    houseNumber: "123",
    street: "Main St",
    barangay: "Barangay 1",
    disabilities: "none",
    employment: "student",
    password: "password123"
};

fetch("/Corosa/backend/api/users.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
})
```

**Backend Handler:** `backend/api/users.php` (lines 55-160)
```php
$data = json_decode($raw_input, true);

// Validation
$requiredFields = ['firstName', 'lastName', 'email', 'mobile', 'birthdate', 
                   'houseNumber', 'street', 'barangay', 'employment', 'password'];
foreach ($requiredFields as $field) {
    if (empty($data[$field])) {
        $errors[$field] = ucfirst($field) . " is required";
    }
}

// Check if email already exists
$checkUser = new User($db);
$checkUser->email = $data['email'];
if ($checkUser->getByEmail()) {
    $errors['email'] = "Email already registered";
}

// Validate email format
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = "Invalid email format";
}

// Validate mobile format
if (!preg_match("/^09\d{9}$/", $data['mobile'])) {
    $errors['mobile'] = "Invalid mobile number format";
}

if (empty($errors)) {
    // Create user
    $user->first_name = $data['firstName'];
    $user->middle_initial = $data['middleInitial'] ?: null;
    $user->last_name = $data['lastName'];
    $user->birthdate = $data['birthdate'];
    $user->email = $data['email'];
    $user->mobile_number = $data['mobile'];
    $user->disabilities = $data['disabilities'] ?: null;
    $user->employment_status = $data['employment'];
    $user->password = password_hash($data['password'], PASSWORD_DEFAULT);
    $user->account_status = 'active';
    $user->house_number = $data['houseNumber'];
    $user->street = $data['street'];
    $user->barangay = $data['barangay'];
    
    if ($user->create()) {
        echo json_encode(['success' => true, 'userId' => $user->user_id]);
    }
}
```

**Database Operations:** `backend/classes/User.php::create()` (lines 35-95)

1. **First, create Address:**
   ```sql
   INSERT INTO address (address_unit, address_street, address_barangay)
   VALUES (:unit, :street, :barangay)
   ```
   - Table: `address`
   - Columns: `address_id` (AUTO_INCREMENT), `address_unit`, `address_street`, `address_barangay`

2. **Then, create User:**
   ```sql
   INSERT INTO users 
   (first_name, middle_initial, last_name, birthdate, email, mobile_number, 
    address_id, disabilities, employment_status, account_status, hashed_password)
   VALUES (:first_name, :middle_initial, :last_name, :birthdate, :email, :mobile_number, 
           :address_id, :disabilities, :employment_status, :account_status, :hashed_password)
   ```
   - Table: `users`
   - Columns populated:
     - `user_id` (AUTO_INCREMENT)
     - `first_name`, `middle_initial`, `last_name`
     - `birthdate`, `email`, `mobile_number`
     - `address_id` (FOREIGN KEY → address table)
     - `disabilities`, `employment_status`
     - `account_status` (set to 'active')
     - `hashed_password` (password_hash with PASSWORD_DEFAULT)
     - `created_at` (DEFAULT CURRENT_TIMESTAMP)

**Response to Frontend:**
```json
{
    "success": true,
    "userId": 123,
    "message": "Account created successfully"
}
```

**Frontend Processing:**
```javascript
if (result.success) {
    alert("Account created successfully!");
    window.location.href = "login.html";
} else if (result.errors) {
    // Display validation errors for each field
    for (const [field, message] of Object.entries(result.errors)) {
        setError(field, message);
    }
}
```

---

## 4. SELECT PICKUP PAGE

**File:** `public/pages/select-pickup.html`

### UI Purpose
- User selects pickup location via map
- Can use recent locations or saved places
- Stores location data in sessionStorage for next page

### Frontend-Backend Connection

#### 4.1 Location Selection (Client-Side Only)
**Trigger:** User drops pin on map or selects from list  
**Location:** `public/js/select-pickup.js` (expected file)

**Data Flow:**
1. **Trigger:** User clicks "Next" button
2. **Frontend stores in sessionStorage:**
   ```javascript
   sessionStorage.setItem('pickupCoords', JSON.stringify({lat: 14.5994, lng: 121.0437}));
   sessionStorage.setItem('pickupLocation', 'Gate 3 - Main Entrance, SLU Maryheights');
   ```
3. **Backend receives:** None (client-side only)
4. **Database query:** None
5. **Returns to frontend:** N/A
6. **Frontend displays:** Redirects to `select-dropoff.html`

**Note:** This page is currently a UI/UX placeholder. No backend integration yet.

---

## 5. SELECT DROPOFF PAGE

**File:** `public/pages/select-dropoff.html`

### UI Purpose
- User selects drop-off location after selecting pickup
- Displays pickup location for reference
- Stores drop-off location in sessionStorage

### Frontend-Backend Connection

#### 5.1 Location Selection (Client-Side Only)
**Trigger:** User drops pin on map or selects from list  
**Location:** `public/js/select-dropoff.js` (expected file)

**Data Flow:**
1. **Trigger:** User clicks "Next" button
2. **Frontend stores in sessionStorage:**
   ```javascript
   sessionStorage.setItem('dropoffCoords', JSON.stringify({lat: 14.5972, lng: 121.0454}));
   sessionStorage.setItem('dropoffLocation', 'Library Drop-off, Beside central library');
   ```
3. **Backend receives:** None (client-side only)
4. **Database query:** None
5. **Returns to frontend:** N/A
6. **Frontend displays:** Redirects to `request-ride.html`

**Note:** This page is currently a UI/UX placeholder. No backend integration yet.

---

## 6. REQUEST RIDE PAGE

**File:** `public/pages/request-ride.html`

### UI Purpose
- Displays map with route (pickup to drop-off)
- Fetches and shows available rides
- User can select a ride to request

### Frontend-Backend Connection

#### 6.1 Fetch Available Trips
**API Endpoint:** `GET /Corosa/backend/api/trip.php?action=getAvailableTrips`  
**Location:** `public/js/request-ride.js` (lines 130-160)

**Frontend Request:**
```javascript
fetch('/Corosa/backend/api/trip.php?action=getAvailableTrips')
    .then(response => response.json())
    .then(result => {
        if (result.success && Array.isArray(result.data)) {
            // Map and display available rides
        }
    })
```

**Backend Handler:** `backend/api/trip.php` (lines 25-35)
```php
if (isset($_GET['action']) && $_GET['action'] === 'getAvailableTrips') {
    $stmt = $trip->getTripAvailableTripData();
    $trips = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $trips[] = $row;
    }
    echo json_encode(['success' => true, 'data' => $trips]);
}
```

**Database Query:** `backend/classes/Trip.php::getTripAvailableTripData()` (lines 175-211)
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
WHERE t.ride_status IN ('available', 'pending')
AND t.available_seats > 0
ORDER BY t.created_at DESC
```

**Tables & Columns:**
- `trips`: `trip_id`, `driver_id`, `start_lat`, `start_long`, `end_lat`, `end_long`, `available_seats`, `ride_distance`, `ride_status`, `created_at`
- `driver`: `driver_id`, `user_id` (FOREIGN KEY)
- `users`: `user_id`, `first_name`, `middle_initial`, `last_name`, `employment_status`
- `vehicle`: `vehicle_model`, `seat_capacity`, `driver_id` (FOREIGN KEY)

**Response to Frontend:**
```json
{
    "success": true,
    "message": "Available trips retrieved successfully",
    "data": [
        {
            "trip_id": 1,
            "driver_id": 5,
            "start_lat": 14.5994,
            "start_long": 121.0437,
            "end_lat": 14.5972,
            "end_long": 121.0454,
            "available_seats": 2,
            "ride_distance": 1.5,
            "ride_status": "available",
            "created_at": "2025-11-17 10:30:00",
            "first_name": "Juan",
            "middle_initial": "P",
            "last_name": "Dela Cruz",
            "employment_status": "staff",
            "vehicle_model": "Toyota Vios",
            "seat_capacity": 4
        }
    ]
}
```

**Frontend Processing:**
```javascript
const availableRides = result.data.map(trip => ({
    id: trip.trip_id,
    tripId: trip.trip_id,
    driverId: trip.driver_id,
    driver: {
        firstName: trip.first_name,
        middleInitial: trip.middle_initial,
        lastName: trip.last_name,
        employmentStatus: trip.employment_status
    },
    vehicle: {
        model: trip.vehicle_model,
        availableSeats: trip.available_seats,
        totalCapacity: trip.seat_capacity
    },
    rideStatus: trip.ride_status,
    createdAt: trip.created_at
}));
displayAvailableRides();
```

#### 6.2 Ride Selection
**Trigger:** User clicks "Request Ride" button  
**Location:** `public/js/request-ride.js` (lines ~250)

**Data Flow:**
1. **Trigger:** User clicks on a ride card
2. **Frontend stores in sessionStorage:**
   ```javascript
   sessionStorage.setItem('selectedRide', JSON.stringify(rideObject));
   sessionStorage.setItem('selectedTripId', tripId);
   ```
3. **Backend receives:** None (client-side only)
4. **Database query:** None
5. **Returns to frontend:** N/A
6. **Frontend displays:** Redirects to `ride-confirmation.html`

---

## 7. RIDE CONFIRMATION PAGE

**File:** `public/pages/ride-confirmation.html`

### UI Purpose
- Review ride details (driver, vehicle, route, fare)
- Select payment method
- Confirm and create booking

### Frontend-Backend Connection

#### 7.1 Display Trip Information
**Trigger:** Page loads  
**Location:** `public/js/ride-confirmation.js` (lines 40-80)

**Data Flow:**
1. **Trigger:** Page loads
2. **Frontend retrieves from sessionStorage:**
   ```javascript
   const pickupCoords = JSON.parse(sessionStorage.getItem('pickupCoords'));
   const pickupAddress = sessionStorage.getItem('pickupLocation');
   const dropoffCoords = JSON.parse(sessionStorage.getItem('dropoffCoords'));
   const dropoffAddress = sessionStorage.getItem('dropoffLocation');
   const selectedRide = JSON.parse(sessionStorage.getItem('selectedRide'));
   ```
3. **Backend receives:** None
4. **Database query:** None
5. **Returns to frontend:** N/A
6. **Frontend displays:** 
   - Pickup and drop-off addresses
   - Driver name, employment status, vehicle info
   - Seat availability
   - Fare estimate (base: ₱20.00 + ₱8.00/km)

#### 7.2 Confirm Ride (Create Booking)
**API Endpoint:** `POST /Corosa/backend/api/bookings.php`  
**Location:** `public/js/ride-confirmation.js` (lines 85-180)

**Frontend Request:**
```javascript
const bookingPayload = {
    passenger_id: 123,
    start_lat: 14.5994,
    start_long: 121.0437,
    end_lat: 14.5972,
    end_long: 121.0454,
    payment_type: "cash",
    total_cost: 32.00,
    booking_confirmation: true
};

fetch('/Corosa/backend/api/bookings.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingPayload)
})
```

**Backend Handler:** `backend/api/bookings.php` (lines 85-130)
```php
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->passenger_id) && !empty($data->start_lat) && 
    !empty($data->start_long) && !empty($data->end_lat) && !empty($data->end_long)) {
    
    $booking->passenger_id = $data->passenger_id;
    $booking->booking_date = $data->booking_date ?? date('Y-m-d H:i:s');
    $booking->start_lat = $data->start_lat;
    $booking->start_long = $data->start_long;
    $booking->end_lat = $data->end_lat;
    $booking->end_long = $data->end_long;
    $booking->payment_type = $data->payment_type ?? 'cash';
    $booking->total_cost = $data->total_cost ?? 0;
    $booking->booking_confirmation = $data->booking_confirmation ?? false;
    
    if ($booking->create()) {
        echo json_encode(['success' => true, 'data' => ['booking_id' => $booking->booking_id]]);
    }
}
```

**Database Query:** `backend/classes/Bookings.php::create()`
```sql
INSERT INTO bookings 
(passenger_id, booking_date, start_lat, start_long, end_lat, end_long, 
 payment_type, total_cost, booking_confirmation)
VALUES 
(:passenger_id, :booking_date, :start_lat, :start_long, :end_lat, :end_long, 
 :payment_type, :total_cost, :booking_confirmation)
```

**Table: `bookings`**
- `booking_id` (AUTO_INCREMENT PRIMARY KEY)
- `passenger_id` (FOREIGN KEY → users)
- `booking_date` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `start_lat`, `start_long` (DECIMAL coordinates)
- `end_lat`, `end_long` (DECIMAL coordinates)
- `payment_type` (VARCHAR: 'cash', 'card')
- `total_cost` (DECIMAL)
- `booking_confirmation` (BOOLEAN)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Response to Frontend:**
```json
{
    "success": true,
    "message": "Booking created successfully",
    "data": {
        "booking_id": 456
    }
}
```

**Frontend Processing:**
```javascript
if (bookingResult.success) {
    const bookingId = bookingResult.data.booking_id;
    sessionStorage.setItem('bookingId', bookingId);
    window.location.href = 'ride-status.html';
} else {
    throw new Error(bookingResult.message);
}
```

---

## 8. RIDE STATUS PAGE

**File:** `public/pages/ride-status.html`

### UI Purpose
- Shows real-time ride status
- Displays driver and vehicle information
- Shows route on map
- Allows user to rate/review after ride completion

### Frontend-Backend Connection

#### 8.1 Fetch Booking Details
**API Endpoint:** `GET /Corosa/backend/api/bookings.php?booking_id=456`  
**Location:** `public/js/ride-status.js` (expected)

**Frontend Request:**
```javascript
const bookingId = sessionStorage.getItem('bookingId');
fetch(`/Corosa/backend/api/bookings.php?booking_id=${bookingId}`)
    .then(response => response.json())
```

**Backend Handler:** `backend/api/bookings.php` (lines 30-60)
```php
if (isset($_GET['booking_id'])) {
    $booking->booking_id = $_GET['booking_id'];
    if ($booking->getById()) {
        echo json_encode([
            'success' => true,
            'data' => [
                'booking_id' => $booking->booking_id,
                'passenger_id' => $booking->passenger_id,
                'start_lat' => $booking->start_lat,
                'start_long' => $booking->start_long,
                'end_lat' => $booking->end_lat,
                'end_long' => $booking->end_long,
                'payment_type' => $booking->payment_type,
                'total_cost' => $booking->total_cost,
                'booking_confirmation' => $booking->booking_confirmation,
                'created_at' => $booking->created_at
            ]
        ]);
    }
}
```

**Database Query:** `backend/classes/Bookings.php::getById()`
```sql
SELECT * FROM bookings WHERE booking_id = :booking_id LIMIT 1
```

#### 8.2 Fetch Driver Information
**Trigger:** Page loads to display driver/vehicle info  
**Location:** `public/js/ride-status.js` (expected)

**API Endpoint:** `GET /Corosa/backend/api/driver.php?driver_id=5`

**Expected Database Query:**
```sql
SELECT u.*, d.*, v.* 
FROM driver d
JOIN users u ON d.user_id = u.user_id
JOIN vehicle v ON v.driver_id = d.driver_id
WHERE d.driver_id = :driver_id
```

---

## 9. USER PROFILE PAGE

**File:** `public/pages/user-profile.html`

### UI Purpose
- Display user personal and contact information
- Allow user to edit profile information
- Display address information

### Frontend-Backend Connection

#### 9.1 Fetch User Profile
**API Endpoint:** `GET /Corosa/backend/api/users.php?user_id=123`  
**Location:** `public/js/user-profile.js` (expected)

**Frontend Request:**
```javascript
const userId = JSON.parse(localStorage.getItem('userData')).userId;
fetch(`/Corosa/backend/api/users.php?user_id=${userId}`)
    .then(response => response.json())
```

**Backend Handler:** `backend/api/users.php` (lines 180-210)
```php
if (isset($_GET['user_id'])) {
    $user->user_id = $_GET['user_id'];
    if ($user->getById()) {
        echo json_encode([
            'success' => true,
            'data' => [
                'user_id' => $user->user_id,
                'first_name' => $user->first_name,
                'middle_initial' => $user->middle_initial,
                'last_name' => $user->last_name,
                'birthdate' => $user->birthdate,
                'email' => $user->email,
                'mobile_number' => $user->mobile_number,
                'address_id' => $user->address_id,
                'disabilities' => $user->disabilities,
                'employment_status' => $user->employment_status,
                'account_status' => $user->account_status,
                'created_at' => $user->created_at
            ]
        ]);
    }
}
```

**Database Query:** `backend/classes/User.php::getById()` (lines 145-175)
```sql
SELECT * FROM users WHERE user_id = :user_id LIMIT 1
```

#### 9.2 Update User Profile
**API Endpoint:** `PUT /Corosa/backend/api/users.php`  
**Location:** `public/js/user-profile.js` (expected)

**Frontend Request:**
```javascript
const updatePayload = {
    user_id: 123,
    first_name: "Juan",
    middle_initial: "P",
    last_name: "Dela Cruz",
    birthdate: "1995-07-21",
    mobile_number: "09171234567",
    // ... other fields
};

fetch('/Corosa/backend/api/users.php', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatePayload)
})
```

**Backend Handler:** `backend/api/users.php` (lines 245-290)
```php
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id)) {
    $user->user_id = $data->user_id;
    $user->first_name = $data->first_name ?? '';
    $user->middle_initial = $data->middle_initial ?? '';
    $user->last_name = $data->last_name ?? '';
    // ... set other properties
    
    if ($user->update()) {
        echo json_encode(['success' => true, 'message' => 'User updated successfully']);
    }
}
```

**Database Query:** `backend/classes/User.php::update()`
```sql
UPDATE users 
SET first_name = :first_name, 
    middle_initial = :middle_initial,
    last_name = :last_name,
    birthdate = :birthdate,
    mobile_number = :mobile_number,
    disabilities = :disabilities,
    employment_status = :employment_status,
    account_status = :account_status
WHERE user_id = :user_id
```

---

## 10. RATE DRIVER PAGE

**File:** `public/pages/rate-driver.html`

### UI Purpose
- Simple rating interface (1-5 stars)
- Optional comments field
- Submit or skip rating

### Frontend-Backend Connection

#### 10.1 Rate Driver (Local Storage Only)
**Trigger:** User submits rating  
**Location:** `public/js/rate-driver.js` (lines 60-101)

**Data Flow:**
1. **Trigger:** User clicks "Submit rating" button
2. **Frontend stores in localStorage:**
   ```javascript
   const payload = {
       timestamp: new Date().toISOString(),
       rating: 5,
       comments: "Great driver!",
       driver: selectedRide.driver,
       vehicle: selectedRide.vehicle,
       trip: { 
           pickup: sessionStorage.getItem('pickupLocation'),
           dropoff: sessionStorage.getItem('dropoffLocation')
       }
   };
   
   const key = 'driverRatings';
   const arr = JSON.parse(localStorage.getItem(key)) || [];
   arr.push(payload);
   localStorage.setItem(key, JSON.stringify(arr));
   ```
3. **Backend receives:** None (client-side only)
4. **Database query:** None
5. **Returns to frontend:** N/A
6. **Frontend displays:** Redirects to `index.html` with thank you message

**Note:** Current implementation stores ratings in localStorage. No backend integration yet.

---

## 11. RATE AND REVIEW PAGE

**File:** `public/pages/RateAndReview.html`

### UI Purpose
- More detailed review form (star rating, comments)
- Report problematic rides
- View existing reviews for driver

### Frontend-Backend Connection

#### 11.1 Submit Review
**API Endpoint:** `POST /Corosa/backend/api/reviews.php`  
**Location:** `public/js/rate-and-review.js` (lines 100-200)

**Frontend Request:**
```javascript
const payload = {
    booking_id: 456,
    rating: 5,
    comment: "Excellent ride, driver was very courteous",
    created_at: new Date().toISOString()
};

fetch('/Corosa/backend/api/reviews.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
})
```

**Backend Handler:** `backend/api/reviews.php` (lines 80-110)
```php
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->booking_id) && !empty($data->rating)) {
    $review->booking_id = $data->booking_id;
    $review->rating = $data->rating;
    $review->comment = $data->comment ?? '';
    
    if ($review->create()) {
        echo json_encode([
            'success' => true,
            'message' => 'Review created successfully',
            'data' => ['review_id' => $review->review_id]
        ]);
    }
}
```

**Database Query:** `backend/classes/Reviews.php::create()`
```sql
INSERT INTO reviews (booking_id, rating, comment, created_at)
VALUES (:booking_id, :rating, :comment, NOW())
```

**Table: `reviews`** (assumed from pattern)
- `review_id` (AUTO_INCREMENT PRIMARY KEY)
- `booking_id` (FOREIGN KEY → bookings)
- `rating` (INT: 1-5)
- `comment` (TEXT)
- `created_at` (TIMESTAMP)

#### 11.2 Fetch Reviews for Booking
**API Endpoint:** `GET /Corosa/backend/api/reviews.php?booking_id=456`  
**Location:** `public/js/rate-and-review.js` (lines ~300)

**Frontend Request:**
```javascript
fetch(`/Corosa/backend/api/reviews.php?booking_id=${bookingId}`)
    .then(response => response.json())
```

**Backend Handler:** `backend/api/reviews.php` (lines 45-70)
```php
if (isset($_GET['booking_id'])) {
    $review->booking_id = $_GET['booking_id'];
    $stmt = $review->getByBookingId();
    $reviews = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $reviews[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Reviews retrieved successfully',
        'data' => $reviews
    ]);
}
```

**Database Query:** `backend/classes/Reviews.php::getByBookingId()`
```sql
SELECT * FROM reviews WHERE booking_id = :booking_id ORDER BY created_at DESC
```

---

## AUTHENTICATION & SESSION MANAGEMENT

### How Authentication Works

1. **Login:**
   - User enters email and password on login.html
   - Frontend sends POST request to `/Corosa/backend/api/login.php`
   - Backend validates credentials against `users` table
   - Returns `userId` if successful
   - Frontend stores user data in `localStorage` as JSON

2. **Session Persistence:**
   - On page load, `header-auth.js` checks `localStorage.getItem('userData')`
   - If found, displays user info in header
   - User stays "logged in" across page refreshes

3. **Logout:**
   - User clicks logout button
   - Frontend clears `localStorage`
   - Redirects to `index.html`
   - Header reverts to showing login link

### Important Note:
Current implementation uses **client-side localStorage**. No server-side session/cookie management exists. For production, implement:
- Server-side sessions with HttpOnly cookies
- CSRF token validation
- Secure password reset flow

---

## DATABASE SCHEMA OVERVIEW

### Tables & Relationships

```
address
├── address_id (PK)
├── address_street
├── address_barangay
└── address_unit

users
├── user_id (PK)
├── first_name
├── middle_initial
├── last_name
├── birthdate
├── email (UNIQUE)
├── mobile_number
├── address_id (FK → address)
├── disabilities
├── employment_status
├── account_status
├── hashed_password
└── created_at

driver
├── driver_id (PK)
├── user_id (UNIQUE FK → users)
└── driver_license_image

vehicle
├── plate_number (PK)
├── driver_id (FK → driver)
├── vehicle_model
├── seat_capacity
└── vehicle_status

trips
├── trip_id (PK)
├── driver_id (FK → driver)
├── start_lat
├── start_long
├── end_lat
├── end_long
├── available_seats
├── ride_distance
├── ride_status
└── created_at

bookings
├── booking_id (PK)
├── passenger_id (FK → users)
├── booking_date
├── start_lat
├── start_long
├── end_lat
├── end_long
├── payment_type
├── total_cost
├── booking_confirmation
└── created_at

reviews (inferred)
├── review_id (PK)
├── booking_id (FK → bookings)
├── rating (1-5)
├── comment
└── created_at

trip_assignment (referenced in getTripAvailableTripData)
├── trip_id (FK → trips)
└── assignment_status

emergency_contact
├── contact_id (PK)
├── user_id (FK → users)
├── contact_name
└── contact_number

history
├── history_id (PK)
├── user_id (FK → users)
├── history_status
└── created_at
```

---

## COMMON DATA FLOWS

### Flow 1: User Registration → Login → Request Ride
1. User fills signup form
2. POST to `/backend/api/users.php`
3. Address created, then User record created
4. User redirected to login
5. User logs in, credentials verified
6. User data stored in localStorage
7. Redirected to `select-pickup.html`

### Flow 2: Selecting Pickup & Dropoff → Requesting Ride
1. User selects pickup location (stored in sessionStorage)
2. User selects dropoff location (stored in sessionStorage)
3. `request-ride.html` fetches trips via GET `/backend/api/trip.php?action=getAvailableTrips`
4. Backend queries trips joined with driver/vehicle info
5. Frontend displays available rides
6. User selects a ride (stored in sessionStorage)

### Flow 3: Creating & Confirming Booking
1. User reviews ride details on `ride-confirmation.html`
2. Selects payment method
3. Clicks confirm
4. Frontend sends POST to `/backend/api/bookings.php`
5. Backend creates booking record
6. Booking ID returned
7. Frontend stores booking ID and redirects to `ride-status.html`

### Flow 4: Rating & Reviewing
1. After ride, user goes to rate-driver.html or RateAndReview.html
2. Selects star rating and optional comments
3. For rate-driver: Data stored in localStorage (no backend yet)
4. For RateAndReview: POST to `/backend/api/reviews.php`
5. Backend creates review record linked to booking
6. User can view reviews for that booking via GET request

---

## API ENDPOINT SUMMARY

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | /backend/api/login.php | Authenticate user | `{email, password}` | `{success, userId}` |
| POST | /backend/api/users.php | Register new user | `{firstName, lastName, ..., password}` | `{success, userId}` |
| GET | /backend/api/users.php?user_id=X | Get user profile | None | `{success, data: {user...}}` |
| PUT | /backend/api/users.php | Update user profile | `{user_id, first_name, ...}` | `{success, message}` |
| DELETE | /backend/api/users.php?user_id=X | Delete user | None | `{success, message}` |
| GET | /backend/api/trip.php?action=getAvailableTrips | Fetch available trips | None | `{success, data: [trips]}` |
| POST | /backend/api/bookings.php | Create booking | `{passenger_id, start_lat, ..., total_cost}` | `{success, data: {booking_id}}` |
| GET | /backend/api/bookings.php?booking_id=X | Get booking details | None | `{success, data: {booking...}}` |
| POST | /backend/api/reviews.php | Submit review | `{booking_id, rating, comment}` | `{success, data: {review_id}}` |
| GET | /backend/api/reviews.php?booking_id=X | Get booking reviews | None | `{success, data: [reviews]}` |

---

## ERROR HANDLING

### Frontend Validation
- Form fields validated before submission
- Error messages displayed next to invalid fields
- User can correct and resubmit

### Backend Validation
- All fields checked for presence and format
- Email uniqueness verified
- Mobile number format validated
- Password encrypted before storage
- Invalid requests return `{success: false, errors: {...}}`

### Error Response Example
```json
{
    "success": false,
    "errors": {
        "email": "Email already registered",
        "mobile": "Invalid mobile number format"
    }
}
```

---

## NOTES FOR PROFESSOR REVIEW

✅ **COMPLETE IMPLEMENTATIONS:**
- User Registration (signup.html → users.php)
- User Login (login.html → login.php)
- Get User Profile (user-profile.html → users.php GET)
- Update User Profile (user-profile.html → users.php PUT)
- Fetch Available Trips (request-ride.html → trip.php)
- Create Booking (ride-confirmation.html → bookings.php POST)
- Submit Review (RateAndReview.html → reviews.php POST)

⚠️ **PARTIAL/CLIENT-SIDE ONLY:**
- Select Pickup Location (currently just UI, uses sessionStorage)
- Select Dropoff Location (currently just UI, uses sessionStorage)
- Rate Driver (stores in localStorage, no backend)

🔲 **NOT YET IMPLEMENTED:**
- Get Booking by ID (bookings.php has skeleton)
- Get Driver Info for Ride Status (needs driver.php implementation)
- Real-time ride status updates
- Trip Assignment management
- Emergency Contact management
- History tracking

---

**End of Documentation**
