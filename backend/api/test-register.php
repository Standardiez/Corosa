<?php
// Enable error display
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

try {
    // Connect to MySQL
    $conn = new PDO("mysql:host=localhost;dbname=corosa_db", "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get POST data
    $data = json_decode(file_get_contents("php://input"), true);
    
    // If this is a POST request with data
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $data) {
        // Insert test user
        $stmt = $conn->prepare("INSERT INTO users (first_name, last_name, email, mobile_number, hashed_password) VALUES (?, ?, ?, ?, ?)");
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $stmt->execute([
            $data['firstName'],
            $data['lastName'],
            $data['email'],
            $data['mobile'],
            $hashedPassword
        ]);
        
        echo json_encode([
            "success" => true,
            "message" => "User created successfully",
            "userId" => $conn->lastInsertId()
        ]);
    } else {
        // For GET requests, just test connection
        echo json_encode([
            "success" => true,
            "message" => "Database connection successful",
            "method" => $_SERVER['REQUEST_METHOD'],
            "post_data" => $data
        ]);
    }
} catch(PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage(),
        "method" => $_SERVER['REQUEST_METHOD']
    ]);
}
?>