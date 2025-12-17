<?php
/**
 * Corosa API endpoint for Drivers
 * This file handles driver-related operations with PostgreSQL
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

// Include database configuration and Driver class
require_once '../../../config/database.php';
require_once '../../../classes/driver/php/Driver.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

// Initialize Driver object
$driver = new Driver($db);

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Check if driver_id is provided in query string
        if(isset($_GET['driver_id'])) {
            // Get driver by ID
            $driver->driver_id = $_GET['driver_id'];
            
            if($driver->getById()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Driver retrieved successfully",
                    "data" => array(
                        "driver_id" => $driver->driver_id,
                        "user_id" => $driver->user_id,
                        "driver_license_image" => $driver->driver_license_image
                    )
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Driver not found"
                ));
            }
        } else if(isset($_GET['user_id'])) {
            // Get driver by user ID
            $driver->user_id = $_GET['user_id'];
            
            if($driver->getByUserId()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Driver retrieved successfully",
                    "data" => array(
                        "driver_id" => $driver->driver_id,
                        "user_id" => $driver->user_id,
                        "driver_license_image" => $driver->driver_license_image
                    )
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Driver not found"
                ));
            }
        } else {
            // Get all drivers
            $stmt = $driver->getAll();
            $drivers = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $drivers[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Drivers retrieved successfully",
                "data" => $drivers
            ));
        }
        break;
        
    case 'POST':
        // Create new driver
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->user_id)) {
            $driver->user_id = $data->user_id;
            $driver->driver_license_image = $data->driver_license_image ?? '';
            
            if($driver->create()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Driver created successfully",
                    "data" => array("driver_id" => $driver->driver_id)
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to create driver"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Missing required fields (user_id)"
            ));
        }
        break;
        
    case 'PUT':
        // Update driver
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->driver_id)) {
            $driver->driver_id = $data->driver_id;
            $driver->user_id = $data->user_id ?? '';
            $driver->driver_license_image = $data->driver_license_image ?? '';
            
            if($driver->update()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Driver updated successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to update driver"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Driver ID is required"
            ));
        }
        break;
        
    case 'DELETE':
        // Delete driver
        if(isset($_GET['driver_id'])) {
            $driver->driver_id = $_GET['driver_id'];
            
            if($driver->delete()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Driver deleted successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to delete driver"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Driver ID is required"
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

