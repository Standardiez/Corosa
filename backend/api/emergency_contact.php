<?php
/**
 * Corosa API endpoint for Emergency Contact
 * This file handles emergency contact-related operations with PostgreSQL
 */

// Set headers for JSON response
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database configuration and EmergencyContact class
require_once '../config/database.php';
require_once '../classes/EmergencyContact.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

// Initialize EmergencyContact object
$emergencyContact = new EmergencyContact($db);

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Check if contact_id is provided in query string
        if(isset($_GET['contact_id'])) {
            // Get emergency contact by ID
            $emergencyContact->contact_id = $_GET['contact_id'];
            
            if($emergencyContact->getById()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Emergency contact retrieved successfully",
                    "data" => array(
                        "contact_id" => $emergencyContact->contact_id,
                        "user_id" => $emergencyContact->user_id,
                        "contact_name" => $emergencyContact->contact_name,
                        "contact_number" => $emergencyContact->contact_number
                    )
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Emergency contact not found"
                ));
            }
        } else if(isset($_GET['user_id'])) {
            // Get all emergency contacts for a user
            $emergencyContact->user_id = $_GET['user_id'];
            $stmt = $emergencyContact->getByUserId();
            $contacts = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $contacts[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Emergency contacts retrieved successfully",
                "data" => $contacts
            ));
        } else {
            // Get all emergency contacts
            $stmt = $emergencyContact->getAll();
            $contacts = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $contacts[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Emergency contacts retrieved successfully",
                "data" => $contacts
            ));
        }
        break;
        
    case 'POST':
        // Create new emergency contact
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->user_id) && !empty($data->contact_name) && !empty($data->contact_number)) {
            $emergencyContact->user_id = $data->user_id;
            $emergencyContact->contact_name = $data->contact_name;
            $emergencyContact->contact_number = $data->contact_number;
            
            if($emergencyContact->create()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Emergency contact created successfully",
                    "data" => array("contact_id" => $emergencyContact->contact_id)
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to create emergency contact"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Missing required fields (user_id, contact_name, contact_number)"
            ));
        }
        break;
        
    case 'PUT':
        // Update emergency contact
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->contact_id)) {
            $emergencyContact->contact_id = $data->contact_id;
            $emergencyContact->user_id = $data->user_id ?? '';
            $emergencyContact->contact_name = $data->contact_name ?? '';
            $emergencyContact->contact_number = $data->contact_number ?? '';
            
            if($emergencyContact->update()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Emergency contact updated successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to update emergency contact"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Contact ID is required"
            ));
        }
        break;
        
    case 'DELETE':
        // Delete emergency contact
        if(isset($_GET['contact_id'])) {
            $emergencyContact->contact_id = $_GET['contact_id'];
            
            if($emergencyContact->delete()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Emergency contact deleted successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to delete emergency contact"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Contact ID is required"
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

