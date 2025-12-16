<?php
/**
 * Driver - Create Trip API
 * Handles ride creation by drivers
 */

header('Content-Type: application/json');
require_once '../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $required = ['driverId', 'startLocation', 'endLocation', 'availableSeats', 'departureTime'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        $driverId = intval($data['driverId']);
        $startLocation = trim($data['startLocation']);
        $endLocation = trim($data['endLocation']);
        $availableSeats = intval($data['availableSeats']);
        $departureTime = $data['departureTime'];
        $startCoords = isset($data['startCoordinates']) ? $data['startCoordinates'] : '';
        $endCoords = isset($data['endCoordinates']) ? $data['endCoordinates'] : '';

        // Parse coordinates if provided
        $startLat = null;
        $startLong = null;
        $endLat = null;
        $endLong = null;

        if ($startCoords) {
            $coords = json_decode($startCoords, true);
            $startLat = $coords['lat'] ?? null;
            $startLong = $coords['lng'] ?? null;
        }

        if ($endCoords) {
            $coords = json_decode($endCoords, true);
            $endLat = $coords['lat'] ?? null;
            $endLong = $coords['lng'] ?? null;
        }

        // Get database connection
        $database = new Database();
        $conn = $database->getConnection();

        // Verify driver exists and get driver_id
        $stmt = $conn->prepare("SELECT driver_id FROM driver WHERE user_id = ?");
        $stmt->execute([$driverId]);
        $driverResult = $stmt->fetch();

        if (!$driverResult) {
            throw new Exception("Driver not found");
        }

        $driverId = $driverResult['driver_id'];

        // Insert trip into database
        $stmt = $conn->prepare(
            "INSERT INTO trips (driver_id, start_lat, start_long, end_lat, end_long, available_seats, ride_status) 
             VALUES (?, ?, ?, ?, ?, ?, 'available')"
        );

        $stmt->execute([
            $driverId,
            $startLat,
            $startLong,
            $endLat,
            $endLong,
            $availableSeats
        ]);

        $tripId = $conn->lastInsertId();

        // Store trip metadata (location strings and departure time)
        $metadataStmt = $conn->prepare(
            "INSERT INTO trips_metadata (trip_id, start_location, end_location, departure_time) 
             VALUES (?, ?, ?, ?)"
        );

        try {
            $metadataStmt->execute([$tripId, $startLocation, $endLocation, $departureTime]);
        } catch (PDOException $e) {
            // Table might not exist yet, continue anyway
        }

        echo json_encode([
            'status' => 'success',
            'message' => 'Trip created successfully',
            'tripId' => $tripId,
            'id' => $tripId
        ]);

    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
}
?>

