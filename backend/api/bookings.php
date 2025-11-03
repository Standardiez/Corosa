<?php
/**
 * Corosa API endpoint for Bookings
 * This file handles booking-related operations with PostgreSQL
 */

// Set headers for JSON response
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database configuration and Bookings class
require_once '../config/database.php';
require_once '../classes/Bookings.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

// Initialize Bookings object
$booking = new Bookings($db);

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Check if booking_id is provided in query string
        if(isset($_GET['booking_id'])) {
            // Get booking by ID
            $booking->booking_id = $_GET['booking_id'];
            
            if($booking->getById()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Booking retrieved successfully",
                    "data" => array(
                        "booking_id" => $booking->booking_id,
                        "passenger_id" => $booking->passenger_id,
                        "booking_date" => $booking->booking_date,
                        "pick_up_location" => $booking->pick_up_location,
                        "drop_off_location" => $booking->drop_off_location,
                        "payment_type" => $booking->payment_type,
                        "total_cost" => $booking->total_cost,
                        "booking_confirmation" => $booking->booking_confirmation,
                        "created_at" => $booking->created_at
                    )
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Booking not found"
                ));
            }
        } else if(isset($_GET['passenger_id'])) {
            // Get all bookings for a passenger
            $booking->passenger_id = $_GET['passenger_id'];
            $stmt = $booking->getByPassengerId();
            $bookings = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $bookings[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Bookings retrieved successfully",
                "data" => $bookings
            ));
        } else {
            // Get all bookings
            $stmt = $booking->getAll();
            $bookings = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $bookings[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Bookings retrieved successfully",
                "data" => $bookings
            ));
        }
        break;
        
    case 'POST':
        // Create new booking
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->passenger_id) && !empty($data->pick_up_location) && !empty($data->drop_off_location)) {
            $booking->passenger_id = $data->passenger_id;
            $booking->booking_date = $data->booking_date ?? date('Y-m-d H:i:s');
            $booking->pick_up_location = $data->pick_up_location;
            $booking->drop_off_location = $data->drop_off_location;
            $booking->payment_type = $data->payment_type ?? 'cash';
            $booking->total_cost = $data->total_cost ?? 0;
            $booking->booking_confirmation = $data->booking_confirmation ?? false;
            
            if($booking->create()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Booking created successfully",
                    "data" => array("booking_id" => $booking->booking_id)
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to create booking"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Missing required fields (passenger_id, pick_up_location, drop_off_location)"
            ));
        }
        break;
        
    case 'PUT':
        // Update booking
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->booking_id)) {
            $booking->booking_id = $data->booking_id;
            $booking->passenger_id = $data->passenger_id ?? '';
            $booking->booking_date = $data->booking_date ?? '';
            $booking->pick_up_location = $data->pick_up_location ?? '';
            $booking->drop_off_location = $data->drop_off_location ?? '';
            $booking->payment_type = $data->payment_type ?? '';
            $booking->total_cost = $data->total_cost ?? 0;
            $booking->booking_confirmation = $data->booking_confirmation ?? false;
            
            if($booking->update()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Booking updated successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to update booking"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Booking ID is required"
            ));
        }
        break;
        
    case 'DELETE':
        // Delete booking
        if(isset($_GET['booking_id'])) {
            $booking->booking_id = $_GET['booking_id'];
            
            if($booking->delete()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Booking deleted successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to delete booking"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Booking ID is required"
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

