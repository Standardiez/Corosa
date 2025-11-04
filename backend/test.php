<?php
header('Content-Type: application/json');

// Include database configuration
require_once 'config/database.php';

try {
    // Initialize database connection
    $database = new Database();
    $db = $database->getConnection();
    
    echo json_encode([
        'status' => 'ok',
        'message' => 'Backend and MySQL connection successful',
        'mysql_version' => $db->getAttribute(PDO::ATTR_SERVER_VERSION)
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed',
        'error' => $e->getMessage()
    ]);
}
?>