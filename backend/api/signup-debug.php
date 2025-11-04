<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    // Get raw POST data
    $raw_input = file_get_contents("php://input");
    
    // Log the raw input
    error_log("Raw input received: " . $raw_input);
    
    // Parse JSON
    $data = json_decode($raw_input, true);
    
    // Log the parsed data
    error_log("Parsed data: " . print_r($data, true));
    
    // Include required files
    require_once '../config/database.php';
    require_once '../classes/User.php';
    
    // Initialize database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Initialize User object
    $user = new User($db);
    
    // Map the data
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
    
    // Try to create the user
    if ($user->create()) {
        echo json_encode([
            'success' => true,
            'message' => 'Account created successfully'
        ]);
    } else {
        throw new Exception("Failed to create user");
    }
    
} catch (Exception $e) {
    error_log("Error in signup-debug.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug_info' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]
    ]);
}
?>