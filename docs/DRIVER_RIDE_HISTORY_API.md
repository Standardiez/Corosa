# Driver Ride History API Documentation

## Overview
The Driver Ride History feature allows drivers to view their completed and cancelled rides with passenger information, ratings, and reviews. This document explains how the feature works and how to improve it.

---

## Architecture

### Frontend
**File:** `public/driver/pages/driver-history.html`
- Displays ride history in an organized card layout
- Filters by ride status (All, Completed, Cancelled)
- Shows passenger info, trip details, fare, and ratings
- Responsive design with modern UI components

### Backend API
**File:** `backend/api/driver/fetch-ride-history.php`
- Fetches ride history from the database
- Joins multiple tables to get complete information
- Returns formatted data ready for frontend display

### Database Tables Involved
1. **trips** - Main trip records
2. **trip_assignment** - Links trips to bookings
3. **bookings** - Passenger booking details
4. **users** - Passenger information
5. **reviews** - Ratings and comments from passengers
6. **driver** - Driver profile information

---

## API Endpoint

### URL
```
GET /Corosa/backend/api/driver/fetch-ride-history.php?userId={user_id}
```

### Query Parameters
- `userId` (required) - The user_id of the logged-in driver

### Response Format

#### Success Response (200 OK)
```json
{
  "success": true,
  "history": [
    {
      "id": 1,
      "tripId": 10,
      "bookingId": 25,
      "passenger": "Sarah Johnson",
      "initials": "SJ",
      "from": "Baguio City Area (16.4023, 120.5960)",
      "to": "Baguio City Area (16.4080, 120.5969)",
      "date": "2024-01-15",
      "time": "2:30 PM",
      "distance": "3.2 km",
      "duration": "6 min",
      "fare": "₱85.00",
      "status": "completed",
      "rating": 5,
      "comment": "Great driver!",
      "feedback_id": "review-25"
    }
  ],
  "count": 1
}
```

#### Error Response (400/404/500)
```json
{
  "success": false,
  "message": "Error description here"
}
```

---

## Database Query

The API executes the following SQL query:

```sql
SELECT 
    t.trip_id,
    t.start_lat,
    t.start_long,
    t.end_lat,
    t.end_long,
    t.ride_distance,
    t.ride_status,
    t.created_at,
    b.booking_id,
    b.passenger_id,
    b.total_cost,
    b.payment_type,
    b.booking_date,
    u.first_name,
    u.middle_initial,
    u.last_name,
    r.rating,
    r.comment,
    ta.assignment_status
FROM trips t
LEFT JOIN trip_assignment ta ON t.trip_id = ta.trip_id
LEFT JOIN bookings b ON ta.booking_id = b.booking_id
LEFT JOIN users u ON b.passenger_id = u.user_id
LEFT JOIN reviews r ON b.booking_id = r.booking_id
WHERE t.driver_id = ?
AND t.ride_status IN ('completed', 'cancelled')
ORDER BY t.created_at DESC, b.booking_date DESC
```

---

## Frontend Implementation

### Authentication
The frontend retrieves the user ID from `localStorage`:

```javascript
const userData = JSON.parse(localStorage.getItem('userData'));
const userId = userData.userId || userData.user_id;
```

### Fetching Data
```javascript
async function fetchRideHistory() {
  const response = await fetch(`../../../backend/api/driver/fetch-ride-history.php?userId=${userId}`);
  const data = await response.json();
  
  if (data.success) {
    rideHistory = data.history || [];
    renderHistory();
  }
}
```

### Rendering
- Cards are dynamically generated using JavaScript
- Each card shows passenger avatar, trip route, details, and actions
- Filters update the display without re-fetching from server
- Empty states show helpful messages
- Loading states provide user feedback during API calls

---

## Features

### Current Features ✅
1. ✅ Fetch ride history from database
2. ✅ Display completed and cancelled trips
3. ✅ Show passenger information with avatars
4. ✅ Display trip routes and details
5. ✅ Show ratings and reviews
6. ✅ Filter by status (All, Completed, Cancelled)
7. ✅ Responsive design for mobile and desktop
8. ✅ Loading and error states
9. ✅ Modern card-based UI with hover effects
10. ✅ Link to passenger feedback/reviews

### User Experience Features ✅
- Smooth animations and transitions
- Color-coded status badges
- Icon-enhanced buttons and actions
- Empty state messages
- Retry functionality on errors
- Real-time filtering without page reload

---

## Future Improvements

### 1. Geocoding Integration 🔄
**Priority: HIGH**

Currently, addresses are displayed as coordinates. Integrate a geocoding service to convert lat/lng to street addresses.

#### Option A: Google Maps Geocoding API
```php
function getAddressFromCoordinates($lat, $lng) {
    $apiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
    $url = "https://maps.googleapis.com/maps/api/geocode/json?latlng={$lat},{$lng}&key={$apiKey}";
    
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    
    if ($data['status'] === 'OK') {
        return $data['results'][0]['formatted_address'];
    }
    
    return "Location ({$lat}, {$lng})";
}
```

#### Option B: OpenStreetMap Nominatim (Free)
```php
function getAddressFromCoordinates($lat, $lng) {
    $url = "https://nominatim.openstreetmap.org/reverse?format=json&lat={$lat}&lon={$lng}";
    
    $opts = [
        'http' => [
            'header' => "User-Agent: CorosaApp/1.0\r\n"
        ]
    ];
    $context = stream_context_create($opts);
    $response = file_get_contents($url, false, $context);
    $data = json_decode($response, true);
    
    if (isset($data['display_name'])) {
        return $data['display_name'];
    }
    
    return "Location ({$lat}, {$lng})";
}
```

### 2. Caching 🔄
**Priority: MEDIUM**

Cache geocoding results to avoid repeated API calls:
- Store coordinate→address mappings in database
- Use Redis or Memcached for faster lookups
- Implement cache expiration (e.g., 30 days)

### 3. Trip Duration Calculation 🔄
**Priority: MEDIUM**

Store actual trip start and end times in the database:
```sql
ALTER TABLE trips ADD COLUMN started_at TIMESTAMP NULL;
ALTER TABLE trips ADD COLUMN completed_at TIMESTAMP NULL;
```

Then calculate real duration:
```php
$duration = strtotime($row['completed_at']) - strtotime($row['started_at']);
$minutes = round($duration / 60);
```

### 4. Pagination 🔄
**Priority: MEDIUM**

For drivers with many rides, implement pagination:
```php
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$perPage = 20;
$offset = ($page - 1) * $perPage;

// Add to query:
// LIMIT $perPage OFFSET $offset
```

### 5. Export Functionality 📊
**Priority: LOW**

Allow drivers to export their ride history:
- CSV export for spreadsheets
- PDF reports with charts
- Email summary reports

### 6. Statistics Dashboard 📈
**Priority: LOW**

Add summary statistics:
- Total rides completed
- Total earnings
- Average rating
- Popular routes
- Busiest hours/days

### 7. Search and Advanced Filters 🔍
**Priority: LOW**

Add search functionality:
- Search by passenger name
- Date range picker
- Minimum fare filter
- Distance range filter

---

## Testing

### Manual Testing Steps

1. **Login as Driver**
   - Go to login page
   - Use driver credentials
   - Verify localStorage has userData

2. **Navigate to History Page**
   - Click "Ride History" in sidebar
   - Or go to `/public/driver/pages/driver-history.html`

3. **Verify Data Loading**
   - Should see loading state
   - Then see ride cards or empty state

4. **Test Filters**
   - Click "Completed" - should show only completed rides
   - Click "Cancelled" - should show only cancelled rides
   - Click "All Rides" - should show everything

5. **Test Error Handling**
   - Disconnect from database
   - Should see error message with retry button

### API Testing (Direct)

Test the API directly using curl or Postman:

```bash
# Test with valid user ID
curl "http://localhost/Corosa/backend/api/driver/fetch-ride-history.php?userId=1"

# Test without user ID (should return 400 error)
curl "http://localhost/Corosa/backend/api/driver/fetch-ride-history.php"

# Test with non-existent user (should return 404)
curl "http://localhost/Corosa/backend/api/driver/fetch-ride-history.php?userId=99999"
```

### Database Testing

```sql
-- Check if driver has trips
SELECT 
    d.driver_id, 
    u.first_name, 
    u.last_name,
    COUNT(t.trip_id) as total_trips,
    SUM(CASE WHEN t.ride_status = 'completed' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN t.ride_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
FROM driver d
JOIN users u ON d.user_id = u.user_id
LEFT JOIN trips t ON d.driver_id = t.driver_id
GROUP BY d.driver_id;

-- Check specific ride details
SELECT 
    t.trip_id,
    t.ride_status,
    b.booking_id,
    u.first_name,
    r.rating
FROM trips t
LEFT JOIN trip_assignment ta ON t.trip_id = ta.trip_id
LEFT JOIN bookings b ON ta.booking_id = b.booking_id
LEFT JOIN users u ON b.passenger_id = u.user_id
LEFT JOIN reviews r ON b.booking_id = r.booking_id
WHERE t.driver_id = 1;
```

---

## Troubleshooting

### Issue: No rides showing up
**Solution:**
1. Check if driver has any completed/cancelled trips in database
2. Verify userId is correct in localStorage
3. Check browser console for errors
4. Verify API endpoint URL is correct

### Issue: "Driver not found" error
**Solution:**
1. Verify user is registered as a driver in `driver` table
2. Check if userId in localStorage matches database
3. Ensure driver record has correct user_id foreign key

### Issue: Addresses showing as coordinates
**Solution:**
- This is expected behavior until geocoding is integrated
- See "Future Improvements" section for geocoding integration

### Issue: Database connection error
**Solution:**
1. Ensure MySQL/WAMP is running
2. Check database credentials in `backend/config/database.php`
3. Verify database exists: `corosa_db`
4. Check PHP error logs

---

## Security Considerations

### Current Security Features ✅
1. ✅ Prepared statements prevent SQL injection
2. ✅ Input validation (userId must be integer)
3. ✅ User authentication check (driver must exist)
4. ✅ CORS headers configured
5. ✅ Error logging enabled

### Recommended Enhancements 🔒
1. Add JWT token validation
2. Implement rate limiting
3. Add request origin validation
4. Sanitize all user inputs
5. Use HTTPS in production
6. Add API key authentication

---

## Performance Considerations

### Current Performance
- Query complexity: O(n) where n = number of trips
- Uses LEFT JOINs (efficient with proper indexes)
- No pagination (may be slow with 1000+ rides)

### Optimization Recommendations
1. Add indexes on foreign keys (if not exists)
2. Implement pagination for large datasets
3. Cache geocoding results
4. Use query result caching
5. Consider denormalization for read-heavy operations

---

## Dependencies

### PHP Extensions Required
- PDO
- pdo_mysql
- json

### Frontend Dependencies
- Boxicons (loaded via CDN)
- Modern browser with ES6+ support
- localStorage support

### Backend Dependencies
- PHP 7.4+
- MySQL 5.7+ or MariaDB 10.3+
- Apache/Nginx web server

---

## Conclusion

The Driver Ride History feature is now fully integrated with the database and provides a modern, user-friendly interface for drivers to view their past trips. The foundation is solid and ready for future enhancements like geocoding, advanced filtering, and analytics.

For questions or issues, refer to the troubleshooting section or check the main project documentation.

