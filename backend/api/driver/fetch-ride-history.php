<?php
/**
 * ============================================================================
 * DRIVER RIDE HISTORY API
 * ============================================================================
 *
 * PURPOSE:
 *   Fetches completed and cancelled ride history for a driver including:
 *   - Trip details (pickup, dropoff, date, time)
 *   - Passenger information
 *   - Booking status
 *   - Reviews and ratings
 *
 * HTTP METHOD: GET
 * ENDPOINT: /Corosa/backend/api/driver/fetch-ride-history.php?userId=123
 *
 * QUERY PARAMETERS:
 *   - userId: The user_id of the logged-in driver (required)
 *
 * SUCCESS RESPONSE:
 *   {
 *     "success": true,
 *     "history": [
 *       {
 *         "id": 1,
 *         "tripId": 10,
 *         "bookingId": 25,
 *         "passenger": "Sarah Johnson",
 *         "initials": "SJ",
 *         "from": "123 Main Street",
 *         "to": "Downtown Station",
 *         "date": "2024-01-15",
 *         "time": "2:30 PM",
 *         "distance": "3.2 km",
 *         "duration": "12 min",
 *         "fare": "₱85.00",
 *         "status": "completed",
 *         "rating": 5,
 *         "comment": "Great driver!"
 *       }
 *     ]
 *   }
 *
 * ERROR RESPONSES:
 *   {
 *     "success": false,
 *     "message": "User ID is required"
 *   }
 *
 * ============================================================================
 */

// Configure response headers
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Error handling
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// ============================================================================
// STEP 1: Validate request method
// ============================================================================
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed"
    ]);
    exit;
}

// ============================================================================
// STEP 2: Get and validate user ID
// ============================================================================
$userId = isset($_GET['userId']) ? intval($_GET['userId']) : null;

if (!$userId) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "User ID is required"
    ]);
    exit;
}

// ============================================================================
// STEP 3: Connect to database
// ============================================================================
try {
    require_once __DIR__ . '/../../config/database.php';
    $database = new Database();
    $conn = $database->getConnection();
} catch (Exception $e) {
    error_log("Database Connection Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit;
}

// ============================================================================
// STEP 4: Get driver ID from user ID
// ============================================================================
try {
    $driverQuery = $conn->prepare("SELECT driver_id FROM driver WHERE user_id = ?");
    $driverQuery->execute([$userId]);
    $driverRow = $driverQuery->fetch(PDO::FETCH_ASSOC);
    
    if (!$driverRow) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Driver not found"
        ]);
        exit;
    }
    
    $driverId = $driverRow['driver_id'];
} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error fetching driver information"
    ]);
    exit;
}

// ============================================================================
// STEP 5: Fetch ride history with passenger details and reviews
// ============================================================================
try {
    $historyQuery = $conn->prepare("
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
    ");
    
    $historyQuery->execute([$driverId]);
    $results = $historyQuery->fetchAll(PDO::FETCH_ASSOC);
    
} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error fetching ride history"
    ]);
    exit;
}

// ============================================================================
// STEP 6: Format the response data
// ============================================================================
$history = [];
$processedBookings = []; // To avoid duplicate bookings

foreach ($results as $row) {
    // Skip if we've already processed this booking
    $bookingId = $row['booking_id'];
    if ($bookingId && in_array($bookingId, $processedBookings)) {
        continue;
    }
    
    if ($bookingId) {
        $processedBookings[] = $bookingId;
    }
    
    // Get passenger full name and initials
    $firstName = $row['first_name'] ?? 'Unknown';
    $middleInitial = $row['middle_initial'] ?? '';
    $lastName = $row['last_name'] ?? 'Passenger';
    
    $fullName = trim("$firstName $lastName");
    $initials = strtoupper(substr($firstName, 0, 1) . substr($lastName, 0, 1));
    
    // Format date and time
    $createdAt = new DateTime($row['created_at']);
    $date = $createdAt->format('Y-m-d');
    $time = $createdAt->format('g:i A');
    
    // Convert coordinates to addresses (placeholder - you can integrate geocoding API)
    $startAddress = getAddressFromCoordinates($row['start_lat'], $row['start_long']);
    $endAddress = getAddressFromCoordinates($row['end_lat'], $row['end_long']);
    
    // Calculate distance and duration (placeholder calculations)
    $distance = $row['ride_distance'] ? number_format($row['ride_distance'], 1) . ' km' : 'N/A';
    $duration = estimateDuration($row['ride_distance']);
    
    // Format fare
    $fare = $row['total_cost'] ? '₱' . number_format($row['total_cost'], 2) : '₱0.00';
    
    // Determine status
    $status = strtolower($row['ride_status']);
    
    // Get rating and comment
    $rating = $row['rating'] ? intval($row['rating']) : null;
    $comment = $row['comment'] ?? null;
    
    $history[] = [
        'id' => count($history) + 1,
        'tripId' => intval($row['trip_id']),
        'bookingId' => $bookingId ? intval($bookingId) : null,
        'passenger' => $fullName,
        'initials' => $initials,
        'from' => $startAddress,
        'to' => $endAddress,
        'date' => $date,
        'time' => $time,
        'distance' => $distance,
        'duration' => $duration,
        'fare' => $fare,
        'status' => $status,
        'rating' => $rating,
        'comment' => $comment,
        'feedback_id' => $rating ? "review-" . $bookingId : null
    ];
}

// ============================================================================
// STEP 7: Return success response
// ============================================================================
http_response_code(200);
echo json_encode([
    "success" => true,
    "history" => $history,
    "count" => count($history)
]);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert coordinates to address
 * 
 * TODO: Integrate with a geocoding service for production
 * Options:
 * 1. Google Maps Geocoding API: https://developers.google.com/maps/documentation/geocoding
 * 2. OpenStreetMap Nominatim: https://nominatim.org/release-docs/develop/api/Reverse/
 * 3. Mapbox Geocoding API: https://docs.mapbox.com/api/search/geocoding/
 * 
 * Example Google Maps API call:
 * $url = "https://maps.googleapis.com/maps/api/geocode/json?latlng={$lat},{$lng}&key=YOUR_API_KEY";
 * $response = file_get_contents($url);
 * $data = json_decode($response, true);
 * return $data['results'][0]['formatted_address'];
 */
function getAddressFromCoordinates($lat, $lng) {
    if (!$lat || !$lng) {
        return 'Location not specified';
    }
    
    // For now, return a formatted coordinate string
    // This will be replaced with actual street addresses once geocoding is integrated
    $latFormatted = number_format($lat, 6);
    $lngFormatted = number_format($lng, 6);
    
    // Simple city/region guessing based on Baguio City coordinates
    // Baguio City is approximately at lat: 16.4023, lng: 120.5960
    $location = "Baguio City";
    if ($lat >= 16.35 && $lat <= 16.45 && $lng >= 120.55 && $lng <= 120.65) {
        $location = "Baguio City Area";
    }
    
    return "$location ($latFormatted, $lngFormatted)";
}

/**
 * Estimate trip duration based on distance
 * Simple calculation: ~30 km/h average speed in city
 */
function estimateDuration($distanceKm) {
    if (!$distanceKm || $distanceKm <= 0) {
        return 'N/A';
    }
    
    $hours = $distanceKm / 30; // 30 km/h average
    $minutes = round($hours * 60);
    
    if ($minutes < 60) {
        return $minutes . ' min';
    } else {
        $hrs = floor($minutes / 60);
        $mins = $minutes % 60;
        return $hrs . 'h ' . $mins . 'm';
    }
}
?>

