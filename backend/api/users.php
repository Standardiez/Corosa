<?php
/**
 * Corosa API endpoint for Users
 * This file handles user-related operations with MySQL
 */

// Enable detailed error output for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Function to handle errors
function handleError($message, $code = 500) {
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code($code);
    
    $error = [
        'success' => false,
        'message' => $message,
        'debug' => [
            'file' => debug_backtrace()[0]['file'],
            'line' => debug_backtrace()[0]['line'],
            'post_data' => $_POST,
            'raw_input' => file_get_contents('php://input')
        ]
    ];
    
    echo json_encode($error, JSON_PRETTY_PRINT);
    exit;
}

// Set error handler
set_error_handler(function($severity, $message, $file, $line) {
    handleError("Server error: " . $message);
});

// Set headers for JSON response
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database configuration and User class
require_once '../config/database.php';
require_once '../classes/User.php';

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

            // Map frontend field names to User class properties
            $user->first_name = $data['firstName'];
        $user->middle_initial = $data['middleInitial'];
        $user->last_name = $data['lastName'];
        $user->birthdate = $data['birthdate'];
        $user->email = $data['email'];
        $user->mobile_number = $data['mobile'];
        $user->house_number = $data['houseNumber'];
        $user->street = $data['street'];
        $user->barangay = $data['barangay'];
        $user->disabilities = $data['disabilities'];
        $user->employment_status = $data['employment'];
        $user->account_status = 'active';
        $user->hashed_password = password_hash($data['password'], PASSWORD_DEFAULT);

        // Validate required fields
        $requiredFields = ['firstName', 'lastName', 'email', 'mobile', 'birthdate', 'houseNumber', 'street', 'barangay', 'disabilities', 'employment', 'password'];
        $errors = [];

        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                $errors[$field] = ucfirst($field) . " is required";
            }
        }

        // Check if email already exists
        $checkUser = new User($db);
        $checkUser->email = $data['email'];
        if ($checkUser->getByEmail()) {
            $errors['email'] = "Email already registered";
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
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "errors" => $errors
            ]);
            exit;
        }

        // Set user properties
        $user->first_name = $data['firstName'];
        $user->middle_initial = $data['middleInitial'] ?? null;
        $user->last_name = $data['lastName'];
        $user->birthdate = $data['birthdate'];
        $user->email = $data['email'];
        $user->mobile_number = $data['mobile'];
        $user->disabilities = $data['disabilities'];
        $user->employment_status = $data['employment'];
        $user->password = password_hash($data['password'], PASSWORD_DEFAULT);
        $user->account_status = 'active';
        
        // Set address properties
        $user->house_number = $data['houseNumber'];
        $user->street = $data['street'];
        $user->barangay = $data['barangay'];

        // Create the user (this will also create the address)
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
        
    // Remove duplicate POST case as it's handled above
        
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

