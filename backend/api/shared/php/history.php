<?php
/**
 * Corosa API endpoint for History
 * This file handles history-related operations with PostgreSQL
 */

// Set headers for JSON response
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database configuration and History class
require_once '../../../config/database.php';
require_once '../../../classes/shared/php/History.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

// Initialize History object
$history = new History($db);

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Check if history_id is provided in query string
        if(isset($_GET['history_id'])) {
            // Get history by ID
            $history->history_id = $_GET['history_id'];
            
            if($history->getById()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "History retrieved successfully",
                    "data" => array(
                        "history_id" => $history->history_id,
                        "user_id" => $history->user_id,
                        "status" => $history->status,
                        "created_at" => $history->created_at
                    )
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "History not found"
                ));
            }
        } else if(isset($_GET['user_id'])) {
            // Get all history records for a user
            $history->user_id = $_GET['user_id'];
            $stmt = $history->getByUserId();
            $histories = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $histories[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "History records retrieved successfully",
                "data" => $histories
            ));
        } else {
            // Get all history records
            $stmt = $history->getAll();
            $histories = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $histories[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "History records retrieved successfully",
                "data" => $histories
            ));
        }
        break;
        
    case 'POST':
        // Create new history record
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->user_id) && !empty($data->status)) {
            $history->user_id = $data->user_id;
            $history->status = $data->status;
            
            if($history->create()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "History record created successfully",
                    "data" => array("history_id" => $history->history_id)
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to create history record"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Missing required fields (user_id, status)"
            ));
        }
        break;
        
    case 'PUT':
        // Update history record
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->history_id)) {
            $history->history_id = $data->history_id;
            $history->user_id = $data->user_id ?? '';
            $history->status = $data->status ?? '';
            
            if($history->update()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "History record updated successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to update history record"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "History ID is required"
            ));
        }
        break;
        
    case 'DELETE':
        // Delete history record
        if(isset($_GET['history_id'])) {
            $history->history_id = $_GET['history_id'];
            
            if($history->delete()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "History record deleted successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to delete history record"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "History ID is required"
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

