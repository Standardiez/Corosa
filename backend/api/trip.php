<?php
/**
 * Corosa API endpoint for Trips
 * This file handles trip-related operations with PostgreSQL
 */

// Set headers for JSON response
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database configuration and Trip class
require_once '../config/database.php';
require_once '../classes/Trip.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

// Initialize Trip object
$trip = new Trip($db);

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Check if trip_id is provided in query string
        if(isset($_GET['trip_id'])) {
            // Get trip by ID
            $trip->trip_id = $_GET['trip_id'];
            
            if($trip->getById()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Trip retrieved successfully",
                    "data" => array(
                        "trip_id" => $trip->trip_id,
                        "driver_id" => $trip->driver_id,
                        "start_lat" => $trip->start_lat,
                        "start_long" => $trip->start_long,
                        "end_lat" => $trip->end_lat,
                        "end_long" => $trip->end_long,
                        "available_seats" => $trip->available_seats,
                        "ride_distance" => $trip->ride_distance,
                        "ride_status" => $trip->ride_status,
                        "created_at" => $trip->created_at
                    )
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Trip not found"
                ));
            }
        } else if(isset($_GET['driver_id'])) {
            // Get all trips for a driver
            $trip->driver_id = $_GET['driver_id'];
            $stmt = $trip->getByDriverId();
            $trips = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $trips[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Trips retrieved successfully",
                "data" => $trips
            ));
        } else {
            // Get all trips with driver and user information
            $query = "SELECT 
                        t.trip_id,
                        t.driver_id,
                        t.start_lat,
                        t.start_long,
                        t.end_lat,
                        t.end_long,
                        t.available_seats,
                        t.ride_distance,
                        t.ride_status,
                        t.created_at,
                        u.user_id,
                        u.first_name,
                        u.middle_initial,
                        u.last_name,
                        u.email,
                        u.employment_status,
                        v.vehicle_model,
                        v.plate_number,
                        v.seat_capacity
                      FROM trip t
                      LEFT JOIN driver d ON t.driver_id = d.driver_id
                      LEFT JOIN user u ON d.user_id = u.user_id
                      LEFT JOIN vehicle v ON v.driver_id = d.driver_id
                      WHERE t.ride_status = 'scheduled'
                      ORDER BY t.created_at DESC";
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            $trips = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $trips[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Trips retrieved successfully",
                "data" => $trips
            ));
        }
        break;
        
    case 'POST':
        // Create new trip
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->driver_id) && !empty($data->starting_location) && !empty($data->end_location)) {
            $trip->driver_id = $data->driver_id;
            $trip->starting_location = $data->starting_location;
            $trip->end_location = $data->end_location;
            $trip->available_seats = $data->available_seats ?? 0;
            $trip->ride_distance = $data->ride_distance ?? 0;
            $trip->ride_status = $data->ride_status ?? 'pending';
            
            if($trip->create()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Trip created successfully",
                    "data" => array("trip_id" => $trip->trip_id)
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to create trip"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Missing required fields (driver_id, starting_location, end_location)"
            ));
        }
        break;
        
    case 'PUT':
        // Update trip
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->trip_id)) {
            $trip->trip_id = $data->trip_id;
            $trip->driver_id = $data->driver_id ?? '';
            $trip->start_lat = $data->start_lat ?? '';
            $trip->start_long = $data->start_long ?? '';
            $trip->end_lat = $data->end_lat ?? '';
            $trip->end_long = $data->end_long ?? '';
            $trip->available_seats = $data->available_seats ?? 0;
            $trip->ride_distance = $data->ride_distance ?? 0;
            $trip->ride_status = $data->ride_status ?? '';
            
            if($trip->update()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Trip updated successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to update trip"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Trip ID is required"
            ));
        }
        break;
        
    case 'DELETE':
        // Delete trip
        if(isset($_GET['trip_id'])) {
            $trip->trip_id = $_GET['trip_id'];
            
            if($trip->delete()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Trip deleted successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to delete trip"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Trip ID is required"
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

