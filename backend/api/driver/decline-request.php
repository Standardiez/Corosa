<?php
/**
 * Driver API - Decline Booking Request
 * Removes a pending booking request from a trip
 * 
 * POST /backend/api/driver/decline-request.php
 * 
 * Request Body:
 * {
 *   "bookingId": 1,
 *   "tripId": 1,
 *   "driverId": 1
 * }
 * 
 * Response:
 * {
 *   "status": "success",
 *   "message": "Booking request declined",
 *   "tripId": 1
 * }
 */

header("Content-Type: application/json");
require_once "../../config/database.php";

try {
    // Validate request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
        exit;
    }

    // Get JSON input
    $input = json_decode(file_get_contents("php://input"), true);
    
    $bookingId = $input['bookingId'] ?? null;
    $tripId = $input['tripId'] ?? null;
    $driverId = $input['driverId'] ?? null;

    // Validate required fields
    if (!$bookingId || !$tripId || !$driverId) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "bookingId, tripId, and driverId are required"
        ]);
        exit;
    }

    // Connect to database
    $db = new Database();
    $pdo = $db->getConnection();

    // Start transaction
    $pdo->beginTransaction();

    try {
        // Verify driver owns this trip
        $tripCheckQuery = "SELECT driver_id FROM trips WHERE trip_id = :trip_id LIMIT 1";
        $tripCheckStmt = $pdo->prepare($tripCheckQuery);
        $tripCheckStmt->execute([":trip_id" => $tripId]);
        $tripRow = $tripCheckStmt->fetch(PDO::FETCH_ASSOC);

        if (!$tripRow || $tripRow["driver_id"] != $driverId) {
            throw new Exception("Trip not found or unauthorized");
        }

        // Update trip_assignment status to declined
        $assignmentUpdateQuery = "
            UPDATE trip_assignment
            SET assignment_status = 'declined'
            WHERE booking_id = :booking_id AND trip_id = :trip_id
            LIMIT 1
        ";
        $assignmentStmt = $pdo->prepare($assignmentUpdateQuery);
        $assignmentStmt->execute([
            ":booking_id" => $bookingId,
            ":trip_id" => $tripId
        ]);

        if ($assignmentStmt->rowCount() === 0) {
            throw new Exception("Booking request not found");
        }

        // Optionally: If trip had no other confirmed requests, return seats
        // (This depends on business logic - we'll just decline the assignment)

        // Commit transaction
        $pdo->commit();

        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Booking request declined",
            "tripId" => (int)$tripId
        ]);

    } catch (Exception $e) {
        // Rollback on error
        $pdo->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Error declining request: " . $e->getMessage()
    ]);
}
?>
