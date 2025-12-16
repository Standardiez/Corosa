<?php
/**
 * Driver API - Fetch Driver's Rides
 * Retrieves all rides created by a driver (available, pending, active)
 * 
 * GET /backend/api/driver/fetch-driver-rides.php?driverId=USER_ID
 * 
 * Response:
 * {
 *   "status": "success",
 *   "rides": [
 *     {
 *       "tripId": 1,
 *       "startLat": 16.4023,
 *       "startLng": 120.5960,
 *       "endLat": 16.4080,
 *       "endLng": 120.5969,
 *       "availableSeats": 3,
 *       "rideStatus": "available",
 *       "createdAt": "2025-01-15 10:30:00"
 *     }
 *   ],
 *   "count": 1,
 *   "hasRides": true
 * }
 */

header("Content-Type: application/json");
require_once "../../config/database.php";

try {
    // Get driverId from query parameter
    $userId = $_GET['driverId'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "driverId query parameter is required"
        ]);
        exit;
    }

    // Connect to database
    $db = new Database();
    $pdo = $db->getConnection();

    // First, get the driver_id from user_id
    $driverQuery = "SELECT driver_id FROM driver WHERE user_id = :user_id LIMIT 1";
    $driverStmt = $pdo->prepare($driverQuery);
    $driverStmt->execute([":user_id" => $userId]);
    $driverRow = $driverStmt->fetch(PDO::FETCH_ASSOC);

    if (!$driverRow) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Driver not found"
        ]);
        exit;
    }

    $driverId = $driverRow["driver_id"];

    // Fetch all rides for this driver
    $query = "
        SELECT
            trip_id,
            start_lat,
            start_long,
            end_lat,
            end_long,
            available_seats,
            ride_status,
            created_at
        FROM trips
        WHERE driver_id = :driver_id
        AND ride_status IN ('available', 'pending', 'active')
        ORDER BY created_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([":driver_id" => $driverId]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format response
    $rides = [];
    foreach ($results as $row) {
        $rides[] = [
            "tripId" => (int)$row["trip_id"],
            "startLat" => (float)$row["start_lat"],
            "startLng" => (float)$row["start_long"],
            "endLat" => (float)$row["end_lat"],
            "endLng" => (float)$row["end_long"],
            "availableSeats" => (int)$row["available_seats"],
            "rideStatus" => $row["ride_status"],
            "createdAt" => $row["created_at"]
        ];
    }

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "rides" => $rides,
        "count" => count($rides),
        "hasRides" => count($rides) > 0
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Error fetching rides: " . $e->getMessage()
    ]);
}
?>
