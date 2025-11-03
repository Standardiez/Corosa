<?php
/**
 * Corosa API endpoint for Users
 * This file handles user-related operations with PostgreSQL
 */

// Set headers for JSON response
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database configuration and User class
require_once '../config/database.php';
require_once '../classes/User.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

// Initialize User object
$user = new User($db);

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Check if user_id is provided in query string
        if(isset($_GET['user_id'])) {
            // Get user by ID
            $user->user_id = $_GET['user_id'];
            
            if($user->getById()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "User retrieved successfully",
                    "data" => array(
                        "user_id" => $user->user_id,
                        "first_name" => $user->first_name,
                        "middle_initial" => $user->middle_initial,
                        "last_name" => $user->last_name,
                        "birthdate" => $user->birthdate,
                        "email" => $user->email,
                        "mobile_number" => $user->mobile_number,
                        "address_id" => $user->address_id,
                        "disabilities" => $user->disabilities,
                        "employment_status" => $user->employment_status,
                        "account_status" => $user->account_status,
                        "created_at" => $user->created_at
                    )
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "User not found"
                ));
            }
        } else if(isset($_GET['email'])) {
            // Get user by email
            $user->email = $_GET['email'];
            
            if($user->getByEmail()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "User retrieved successfully",
                    "data" => array(
                        "user_id" => $user->user_id,
                        "first_name" => $user->first_name,
                        "middle_initial" => $user->middle_initial,
                        "last_name" => $user->last_name,
                        "birthdate" => $user->birthdate,
                        "email" => $user->email,
                        "mobile_number" => $user->mobile_number,
                        "address_id" => $user->address_id,
                        "disabilities" => $user->disabilities,
                        "employment_status" => $user->employment_status,
                        "account_status" => $user->account_status,
                        "created_at" => $user->created_at
                    )
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "User not found"
                ));
            }
        } else {
            // Get all users
            $stmt = $user->getAll();
            $users = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $users[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Users retrieved successfully",
                "data" => $users
            ));
        }
        break;
        
    case 'POST':
        // Create new user
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->first_name) && !empty($data->last_name) && !empty($data->email) && !empty($data->hashed_password)) {
            $user->first_name = $data->first_name;
            $user->middle_initial = $data->middle_initial ?? '';
            $user->last_name = $data->last_name;
            $user->birthdate = $data->birthdate ?? null;
            $user->email = $data->email;
            $user->mobile_number = $data->mobile_number ?? '';
            $user->address_id = $data->address_id ?? null;
            $user->disabilities = $data->disabilities ?? '';
            $user->employment_status = $data->employment_status ?? 'student';
            $user->account_status = $data->account_status ?? 'active';
            // Hash plaintext password before storing
            $user->hashed_password = password_hash($data->hashed_password, PASSWORD_BCRYPT);
            
            if($user->create()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "User created successfully",
                    "data" => array("user_id" => $user->user_id)
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to create user"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Missing required fields"
            ));
        }
        break;
        
    case 'PUT':
        // Update user
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->user_id)) {
            $user->user_id = $data->user_id;
            $user->first_name = $data->first_name ?? '';
            $user->middle_initial = $data->middle_initial ?? '';
            $user->last_name = $data->last_name ?? '';
            $user->birthdate = $data->birthdate ?? null;
            $user->mobile_number = $data->mobile_number ?? '';
            $user->address_id = $data->address_id ?? null;
            $user->disabilities = $data->disabilities ?? '';
            $user->employment_status = $data->employment_status ?? '';
            $user->account_status = $data->account_status ?? '';
            
            if($user->update()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "User updated successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to update user"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "User ID is required"
            ));
        }
        break;
        
    case 'DELETE':
        // Delete user
        if(isset($_GET['user_id'])) {
            $user->user_id = $_GET['user_id'];
            
            if($user->delete()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "User deleted successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to delete user"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "User ID is required"
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

