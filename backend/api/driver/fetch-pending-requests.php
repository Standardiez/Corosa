<?php
/**
 * Driver API - Fetch Pending Booking Requests
 * Retrieves all pending booking requests for a driver's available trips
 * 
 * GET /backend/api/driver/fetch-pending-requests.php?driverId=USER_ID
 * 
 * Response:
 * {
 *   "status": "success",
 *   "pendingRequests": [
 *     {
 *       "bookingId": 1,
 *       "tripId": 1,
 *       "passengerId": 2,
 *       "passengerName": "Jane Smith",
 *       "passengerMobile": "+63321573919",
 *       "pickupLat": 16.4023,
 *       "pickupLng": 120.5960,
 *       "dropoffLat": 16.4080,
 *       "dropoffLng": 120.5969,
 *       "seatsRequested": 1,
 *       "bookingDate": "2025-01-15 10:30:00",
 *       "paymentType": "cash",
 *       "totalCost": 50.00
 *     }
 *   ]
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

    // Fetch all pending booking requests for this driver's trips
    // This joins:
    // - trips (driver's available rides)
    // - trip_assignment (passenger assignments)
    // - bookings (passenger booking data)
    // - users (passenger information)
    $query = "
        SELECT
            b.booking_id,
            ta.trip_id,
            b.passenger_id,
            CONCAT(u.first_name, ' ', u.last_name) AS passengerName,
            u.mobile_number AS passengerMobile,
            b.start_lat AS pickupLat,
            b.start_long AS pickupLng,
            b.end_lat AS dropoffLat,
            b.end_long AS dropoffLng,
            ta.seat_number AS seatsRequested,
            b.booking_date AS bookingDate,
            b.payment_type AS paymentType,
            b.total_cost AS totalCost,
            ta.assignment_status AS status
        FROM trip_assignment ta
        JOIN trips t ON ta.trip_id = t.trip_id
        JOIN bookings b ON ta.booking_id = b.booking_id
        JOIN users u ON b.passenger_id = u.user_id
        WHERE t.driver_id = :driver_id
        AND ta.assignment_status IN ('pending', 'confirmed')
        AND t.ride_status IN ('available', 'pending')
        ORDER BY b.booking_date DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([":driver_id" => $driverId]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format response
    $pendingRequests = [];
    foreach ($results as $row) {
        $pendingRequests[] = [
            "bookingId" => (int)$row["booking_id"],
            "tripId" => (int)$row["trip_id"],
            "passengerId" => (int)$row["passenger_id"],
            "passengerName" => $row["passengerName"],
            "passengerMobile" => $row["passengerMobile"],
            "pickupLat" => (float)$row["pickupLat"],
            "pickupLng" => (float)$row["pickupLng"],
            "dropoffLat" => (float)$row["dropoffLat"],
            "dropoffLng" => (float)$row["dropoffLng"],
            "seatsRequested" => (int)$row["seatsRequested"],
            "bookingDate" => $row["bookingDate"],
            "paymentType" => $row["paymentType"],
            "totalCost" => (float)$row["totalCost"],
            "status" => $row["status"]
        ];
    }

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "pendingRequests" => $pendingRequests,
        "count" => count($pendingRequests)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Error fetching pending requests: " . $e->getMessage()
    ]);
}
?>
