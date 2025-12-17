<?php
/**
 * Corosa API endpoint for Address
 * This file handles address-related operations with PostgreSQL
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

// Include database configuration and Address class
require_once '../../../config/database.php';
require_once '../../../classes/shared/php/Address.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

// Initialize Address object
$address = new Address($db);

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Check if address_id is provided in query string
        if(isset($_GET['address_id'])) {
            // Get address by ID
            $address->address_id = $_GET['address_id'];
            
            if($address->getById()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Address retrieved successfully",
                    "data" => array(
                        "address_id" => $address->address_id,
                        "address_street" => $address->address_street,
                        "address_barangay" => $address->address_barangay,
                        "address_unit" => $address->address_unit
                    )
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Address not found"
                ));
            }
        } else if(isset($_GET['user_id'])) {
            // Get all addresses for a user
            $address->user_id = $_GET['user_id'];
            $stmt = $address->getByUserId();
            $addresses = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $addresses[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Addresses retrieved successfully",
                "data" => $addresses
            ));
        } else {
            // Get all addresses
            $stmt = $address->getAll();
            $addresses = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $addresses[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Addresses retrieved successfully",
                "data" => $addresses
            ));
        }
        break;
        
    case 'POST':
        // Create new address
        $data = json_decode(file_get_contents("php://input"));
        
        // Note: Address table doesn't have user_id - users reference address_id instead
        $address->address_street = $data->address_street ?? '';
        $address->address_barangay = $data->address_barangay ?? '';
        $address->address_unit = $data->address_unit ?? '';
        
        if($address->create()) {
            echo json_encode(array(
                "success" => true,
                "message" => "Address created successfully",
                "data" => array("address_id" => $address->address_id)
            ));
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Failed to create address"
            ));
        }
        break;
        
    case 'PUT':
        // Update address
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->address_id)) {
            $address->address_id = $data->address_id;
            $address->address_street = $data->address_street ?? '';
            $address->address_barangay = $data->address_barangay ?? '';
            $address->address_unit = $data->address_unit ?? '';
            
            if($address->update()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Address updated successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to update address"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Address ID is required"
            ));
        }
        break;
        
    case 'DELETE':
        // Delete address
        if(isset($_GET['address_id'])) {
            $address->address_id = $_GET['address_id'];
            
            if($address->delete()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Address deleted successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to delete address"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Address ID is required"
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

