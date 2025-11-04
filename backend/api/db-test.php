<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Include database configuration
require_once '../config/database.php';

try {
    // Initialize database connection
    $database = new Database();
    $db = $database->getConnection();
    
    echo json_encode([
        'status' => 'ok',
        'message' => 'Database connection successful',
        'mysql_info' => [
            'version' => $db->getAttribute(PDO::ATTR_SERVER_VERSION),
            'connection' => $db->getAttribute(PDO::ATTR_CONNECTION_STATUS)
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed',
        'error' => $e->getMessage()
    ]);
}
?>