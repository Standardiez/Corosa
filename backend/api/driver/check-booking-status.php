<?php
/**
 * Check Booking Status API
 * Allows passengers to check if their booking request has been accepted or declined
 * 
 * GET /backend/api/driver/check-booking-status.php?bookingId=123
 * 
 * Response:
 * {
 *   "success": true,
 *   "status": "confirmed",
 *   "message": "Your ride request has been accepted"
 * }
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../../config/database.php";

try {
    // Get bookingId from query parameter
    $bookingId = $_GET['bookingId'] ?? null;
    
    if (!$bookingId) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "bookingId query parameter is required"
        ]);
        exit;
    }

    // Connect to database
    $db = new Database();
    $pdo = $db->getConnection();

    // Get booking assignment status
    $query = "
        SELECT 
            ta.assignment_status,
            t.ride_status,
            b.booking_confirmation
        FROM trip_assignment ta
        JOIN bookings b ON ta.booking_id = b.booking_id
        JOIN trips t ON ta.trip_id = t.trip_id
        WHERE ta.booking_id = :booking_id
        LIMIT 1
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([":booking_id" => $bookingId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$result) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Booking not found"
        ]);
        exit;
    }

    $status = $result['assignment_status'];
    $message = "";

    switch ($status) {
        case 'pending':
            $message = "Your ride request is pending driver approval";
            break;
        case 'confirmed':
            $message = "Your ride request has been accepted";
            break;
        case 'declined':
            $message = "Your ride request was declined by the driver";
            break;
        case 'active':
            $message = "Your ride is active";
            break;
        case 'completed':
            $message = "Your ride has been completed";
            break;
        case 'cancelled':
            $message = "Your ride has been cancelled";
            break;
        default:
            $message = "Unknown status";
    }

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "status" => $status,
        "assignment_status" => $status, // For backward compatibility
        "ride_status" => $result['ride_status'],
        "message" => $message,
        "data" => [
            "assignment_status" => $status
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error checking booking status: " . $e->getMessage()
    ]);
}
?>

