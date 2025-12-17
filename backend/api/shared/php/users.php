<?php
/**
 * Corosa API endpoint for Users
 * This file handles user-related operations with MySQL
 */

// Start output buffering to prevent any accidental output before JSON
ob_start();

// Disable error display - log errors instead of outputting them
// This prevents PHP warnings/notices from breaking JSON responses
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Function to handle errors
function handleError($message, $code = 500) {
    // Clear any output buffer
    ob_clean();
    
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code($code);
    
    $error = [
        'success' => false,
        'message' => $message
    ];
    
    echo json_encode($error);
    ob_end_flush();
    exit;
}

// Set error handler - log errors but don't output them
set_error_handler(function($severity, $message, $file, $line) {
    // Log the error but don't output it
    error_log("PHP Error [$severity]: $message in $file on line $line");
    // Only handle fatal errors, not warnings/notices
    if ($severity === E_ERROR || $severity === E_PARSE || $severity === E_CORE_ERROR) {
        handleError("Server error: " . $message);
    }
    return true; // Don't execute PHP's internal error handler
});

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

// Include database configuration and User class
require_once '../../../config/database.php';
require_once '../../../classes/shared/php/User.php';

// Initialize database connection
try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        handleError("Database connection failed");
    }

    // Initialize User object
    $user = new User($db);
} catch (PDOException $e) {
    handleError("Database error: " . $e->getMessage());
} catch (Exception $e) {
    handleError("Server error: " . $e->getMessage());
}

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'POST':
        // Handle user registration
        $raw_input = file_get_contents("php://input");
        $data = json_decode($raw_input, true);
        
        if (!$data) {
            handleError("Invalid JSON data received. Raw input: " . $raw_input);
        }
        
        try {
            // Log the received data for debugging
            error_log("Received signup data: " . print_r($data, true));

            // Validate required fields FIRST
            $requiredFields = ['firstName', 'lastName', 'email', 'mobile', 'birthdate', 'houseNumber', 'street', 'barangay', 'employment', 'password'];
            $errors = [];

            foreach ($requiredFields as $field) {
                if (empty($data[$field])) {
                    $errors[$field] = ucfirst($field) . " is required";
                }
            }

            // Check if email already exists
            if (!empty($data['email'])) {
                $checkUser = new User($db);
                $checkUser->email = $data['email'];
                if ($checkUser->getByEmail()) {
                    $errors['email'] = "Email already registered";
                }
            }

            // Validate email format
            if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $errors['email'] = "Invalid email format";
            }

            // Validate mobile number format (09XXXXXXXXX)
            if (!empty($data['mobile']) && !preg_match("/^09\d{9}$/", $data['mobile'])) {
                $errors['mobile'] = "Invalid mobile number format";
            }

            if (!empty($errors)) {
                ob_clean(); // Clear any output buffer
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "errors" => $errors
                ]);
                ob_end_flush();
                exit;
            }

            // Set user properties ONCE - handle empty strings properly
            $user->first_name = $data['firstName'];
            $user->middle_initial = !empty($data['middleInitial']) ? $data['middleInitial'] : null;
            $user->last_name = $data['lastName'];
            $user->birthdate = $data['birthdate'];
            $user->email = $data['email'];
            $user->mobile_number = $data['mobile'];
            $user->disabilities = !empty($data['disabilities']) ? $data['disabilities'] : null;
            $user->employment_status = $data['employment'];
            $user->password = password_hash($data['password'], PASSWORD_DEFAULT);
            $user->account_status = 'active';
            
            // Set address properties
            $user->house_number = $data['houseNumber'];
            $user->street = $data['street'];
            $user->barangay = $data['barangay'];

            // Create the user (this will also create the address)
            // Clear any output buffer before sending JSON
            ob_clean();
            
            if ($user->create()) {
                http_response_code(201);
                echo json_encode([
                    "success" => true,
                    "message" => "Account created successfully",
                    "userId" => $user->user_id
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    "success" => false,
                    "message" => "Error creating user account"
                ]);
            }
            ob_end_flush();
            exit;
        } catch (Exception $e) {
            // Log the full exception for debugging
            error_log("Exception during registration: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
            handleError("Error during registration: " . $e->getMessage());
        }
        break;

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
        ob_clean();
        http_response_code(405);
        echo json_encode(array(
            "success" => false,
            "message" => "Method not allowed"
        ));
        ob_end_flush();
        break;
}

// End output buffering if still active (cleanup)
if (ob_get_level() > 0) {
    ob_end_flush();
}
?>