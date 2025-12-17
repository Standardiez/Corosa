<?php
/**
 * Corosa API endpoint for Vehicles
 * This file handles vehicle-related operations with PostgreSQL
 */

// Set headers for JSON response and CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include database configuration and Vehicle class
require_once '../../../config/database.php';
require_once '../../../classes/driver/php/Vehicle.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

// Initialize Vehicle object
$vehicle = new Vehicle($db);

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Check if plate_number is provided in query string
        if(isset($_GET['plate_number'])) {
            // Get vehicle by plate number
            $vehicle->plate_number = $_GET['plate_number'];
            
            if($vehicle->getByPlateNumber()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Vehicle retrieved successfully",
                    "data" => array(
                        "plate_number" => $vehicle->plate_number,
                        "driver_id" => $vehicle->driver_id,
                        "vehicle_model" => $vehicle->vehicle_model,
                        "seat_capacity" => $vehicle->seat_capacity,
                        "vehicle_status" => $vehicle->vehicle_status
                    )
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Vehicle not found"
                ));
            }
        } else if(isset($_GET['driver_id'])) {
            // Get all vehicles for a driver
            $vehicle->driver_id = $_GET['driver_id'];
            $stmt = $vehicle->getByDriverId();
            $vehicles = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $vehicles[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Vehicles retrieved successfully",
                "data" => $vehicles
            ));
        } else {
            // Get all vehicles
            $stmt = $vehicle->getAll();
            $vehicles = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $vehicles[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Vehicles retrieved successfully",
                "data" => $vehicles
            ));
        }
        break;
        
    case 'POST':
        // Create new vehicle
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->plate_number) && !empty($data->driver_id)) {
            $vehicle->plate_number = $data->plate_number;
            $vehicle->driver_id = $data->driver_id;
            $vehicle->vehicle_model = $data->vehicle_model ?? '';
            $vehicle->seat_capacity = $data->seat_capacity ?? 0;
            $vehicle->vehicle_status = $data->vehicle_status ?? 'active';
            
            if($vehicle->create()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Vehicle created successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to create vehicle"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Missing required fields (plate_number, driver_id)"
            ));
        }
        break;
        
    case 'PUT':
        // Update vehicle
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->plate_number)) {
            $vehicle->plate_number = $data->plate_number;
            $vehicle->driver_id = $data->driver_id ?? '';
            $vehicle->vehicle_model = $data->vehicle_model ?? '';
            $vehicle->seat_capacity = $data->seat_capacity ?? 0;
            $vehicle->vehicle_status = $data->vehicle_status ?? '';
            
            if($vehicle->update()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Vehicle updated successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to update vehicle"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Plate number is required"
            ));
        }
        break;
        
    case 'DELETE':
        // Delete vehicle
        if(isset($_GET['plate_number'])) {
            $vehicle->plate_number = $_GET['plate_number'];
            
            if($vehicle->delete()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Vehicle deleted successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to delete vehicle"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Plate number is required"
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

