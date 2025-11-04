<?php
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once '../config/database.php';
require_once '../classes/User.php';

try {
    // Initialize Database Connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Initialize User object
    $user = new User($db);
    
    // Test data
    $testData = [
        "firstName" => "Test",
        "middleInitial" => "T",
        "lastName" => "User",
        "birthdate" => "2000-01-01",
        "email" => "test" . time() . "@example.com",
        "mobile" => "09123456789",
        "houseNumber" => "123",
        "street" => "Test St",
        "barangay" => "Test Brgy",
        "disabilities" => "none",
        "employment" => "student",
        "password" => "testpassword123"
    ];
    
    // Map test data to user object
    $user->first_name = $testData['firstName'];
    $user->middle_initial = $testData['middleInitial'];
    $user->last_name = $testData['lastName'];
    $user->birthdate = $testData['birthdate'];
    $user->email = $testData['email'];
    $user->mobile_number = $testData['mobile'];
    $user->disabilities = $testData['disabilities'];
    $user->employment_status = $testData['employment'];
    $user->hashed_password = password_hash($testData['password'], PASSWORD_DEFAULT);
    
    // Try to create user
    if($user->create()) {
        echo json_encode([
            "success" => true,
            "message" => "Test user created successfully",
            "data" => $testData
        ]);
    } else {
        throw new Exception("Failed to create test user");
    }
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ]);
}
?>