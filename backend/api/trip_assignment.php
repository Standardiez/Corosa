<?php
/**
 * Corosa API endpoint for Trip Assignments
 * This file handles trip assignment-related operations with PostgreSQL
 */

// Set headers for JSON response
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database configuration and TripAssignment class
require_once '../config/database.php';
require_once '../classes/TripAssignment.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

// Initialize TripAssignment object
$tripAssignment = new TripAssignment($db);

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Check if assignment_id is provided in query string
        if(isset($_GET['assignment_id'])) {
            // Get trip assignment by ID
            $tripAssignment->assignment_id = $_GET['assignment_id'];
            
            if($tripAssignment->getById()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Trip assignment retrieved successfully",
                    "data" => array(
                        "assignment_id" => $tripAssignment->assignment_id,
                        "booking_id" => $tripAssignment->booking_id,
                        "trip_id" => $tripAssignment->trip_id,
                        "seat_number" => $tripAssignment->seat_number,
                        "assignment_status" => $tripAssignment->assignment_status,
                        "payment_type" => $tripAssignment->payment_type,
                        "total_cost" => $tripAssignment->total_cost,
                        "booking_confirmation" => $tripAssignment->booking_confirmation,
                        "created_at" => $tripAssignment->created_at
                    )
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Trip assignment not found"
                ));
            }
        } else if(isset($_GET['booking_id'])) {
            // Get all trip assignments for a booking
            $tripAssignment->booking_id = $_GET['booking_id'];
            $stmt = $tripAssignment->getByBookingId();
            $assignments = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $assignments[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Trip assignments retrieved successfully",
                "data" => $assignments
            ));
        } else if(isset($_GET['trip_id'])) {
            // Get all trip assignments for a trip
            $tripAssignment->trip_id = $_GET['trip_id'];
            $stmt = $tripAssignment->getByTripId();
            $assignments = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $assignments[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Trip assignments retrieved successfully",
                "data" => $assignments
            ));
        } else {
            // Get all trip assignments
            $stmt = $tripAssignment->getAll();
            $assignments = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $assignments[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Trip assignments retrieved successfully",
                "data" => $assignments
            ));
        }
        break;
        
    case 'POST':
        // Create new trip assignment
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->booking_id) && !empty($data->trip_id)) {
            $tripAssignment->booking_id = $data->booking_id;
            $tripAssignment->trip_id = $data->trip_id;
            $tripAssignment->seat_number = $data->seat_number ?? '';
            $tripAssignment->assignment_status = $data->assignment_status ?? 'pending';
            $tripAssignment->payment_type = $data->payment_type ?? 'cash';
            $tripAssignment->total_cost = $data->total_cost ?? 0;
            $tripAssignment->booking_confirmation = $data->booking_confirmation ?? false;
            
            if($tripAssignment->create()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Trip assignment created successfully",
                    "data" => array("assignment_id" => $tripAssignment->assignment_id)
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to create trip assignment",
                    "debug" => $tripAssignment->getLastError()
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Missing required fields (booking_id, trip_id)"
            ));
        }
        break;
        
    case 'PUT':
        // Update trip assignment
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->assignment_id)) {
            $tripAssignment->assignment_id = $data->assignment_id;
            $tripAssignment->booking_id = $data->booking_id ?? '';
            $tripAssignment->trip_id = $data->trip_id ?? '';
            $tripAssignment->seat_number = $data->seat_number ?? '';
            $tripAssignment->assignment_status = $data->assignment_status ?? '';
            $tripAssignment->payment_type = $data->payment_type ?? '';
            $tripAssignment->total_cost = $data->total_cost ?? 0;
            $tripAssignment->booking_confirmation = $data->booking_confirmation ?? false;
            
            if($tripAssignment->update()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Trip assignment updated successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to update trip assignment"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Assignment ID is required"
            ));
        }
        break;
        
    case 'DELETE':
        // Delete trip assignment
        if(isset($_GET['assignment_id'])) {
            $tripAssignment->assignment_id = $_GET['assignment_id'];
            
            if($tripAssignment->delete()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Trip assignment deleted successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to delete trip assignment"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Assignment ID is required"
            ));
        }
        break;
        
    default:
        echo json_encode(array(
            "success" => false,
            "message" => "Method not allowed"
        ));
        break;
}
?>

