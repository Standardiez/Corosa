<?php
/**
 * Corosa API endpoint for Passengers
 * This file handles passenger-related operations with PostgreSQL
 */

// Set headers for JSON response
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database configuration and Passenger class
require_once '../config/database.php';
require_once '../classes/Passenger.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

// Initialize Passenger object
$passenger = new Passenger($db);

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Get all passengers
        $stmt = $passenger->getAll();
        $passengers = array();
        
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $passengers[] = $row;
        }
        
        echo json_encode(array(
            "success" => true,
            "message" => "Passengers retrieved successfully",
            "data" => $passengers
        ));
        break;
        
    case 'POST':
        // Create new passenger
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->first_name) && !empty($data->last_name) && !empty($data->email) && !empty($data->hashed_password)) {
            $passenger->first_name = $data->first_name;
            $passenger->middle_initial = $data->middle_initial ?? '';
            $passenger->last_name = $data->last_name;
            $passenger->birthdate = $data->birthdate ?? null;
            $passenger->email = $data->email;
            $passenger->mobile_number = $data->mobile_number ?? '';
            $passenger->emergency_contact = $data->emergency_contact ?? '';
            $passenger->address = $data->address ?? '';
            $passenger->disabilities = $data->disabilities ?? '';
            $passenger->employment_status = $data->employment_status ?? 'student';
            $passenger->account_status = $data->account_status ?? 'active';
            $passenger->hashed_password = $data->hashed_password;
            
            if($passenger->create()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Passenger created successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to create passenger"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Missing required fields"
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
