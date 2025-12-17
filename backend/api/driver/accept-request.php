<?php
/**
 * Driver API - Accept Booking Request
 * Marks a pending booking request as confirmed and updates trip availability
 * 
 * POST /backend/api/driver/accept-request.php
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
 *   "message": "Booking request accepted",
 *   "tripId": 1,
 *   "remainingSeats": 2
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
        $tripCheckQuery = "SELECT driver_id, available_seats FROM trips WHERE trip_id = :trip_id LIMIT 1";
        $tripCheckStmt = $pdo->prepare($tripCheckQuery);
        $tripCheckStmt->execute([":trip_id" => $tripId]);
        $tripRow = $tripCheckStmt->fetch(PDO::FETCH_ASSOC);

        if (!$tripRow || $tripRow["driver_id"] != $driverId) {
            throw new Exception("Trip not found or unauthorized");
        }

        // Update trip_assignment status to confirmed
        $assignmentUpdateQuery = "
            UPDATE trip_assignment
            SET assignment_status = 'confirmed'
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

        // Decrease available seats in trip
        $seatsUpdateQuery = "
            UPDATE trips
            SET available_seats = available_seats - 1
            WHERE trip_id = :trip_id AND available_seats > 0
            LIMIT 1
        ";
        $seatsStmt = $pdo->prepare($seatsUpdateQuery);
        $seatsStmt->execute([":trip_id" => $tripId]);

        // Get updated seats count
        $seatsCheckQuery = "SELECT available_seats FROM trips WHERE trip_id = :trip_id LIMIT 1";
        $seatsCheckStmt = $pdo->prepare($seatsCheckQuery);
        $seatsCheckStmt->execute([":trip_id" => $tripId]);
        $seatsCheckRow = $seatsCheckStmt->fetch(PDO::FETCH_ASSOC);
        $remainingSeats = $seatsCheckRow ? (int)$seatsCheckRow["available_seats"] : 0;

        // If no more seats, update trip status to 'full'
        if ($remainingSeats === 0) {
            $statusUpdateQuery = "
                UPDATE trips
                SET ride_status = 'full'
                WHERE trip_id = :trip_id
                LIMIT 1
            ";
            $statusStmt = $pdo->prepare($statusUpdateQuery);
            $statusStmt->execute([":trip_id" => $tripId]);
        }

        // Commit transaction
        $pdo->commit();

        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Booking request accepted",
            "tripId" => (int)$tripId,
            "remainingSeats" => $remainingSeats
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
        "message" => "Error accepting request: " . $e->getMessage()
    ]);
}
?>
