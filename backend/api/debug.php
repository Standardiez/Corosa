<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Function to check MySQL connection
function checkMySQLConnection() {
    try {
        require_once '../config/database.php';
        $database = new Database();
        $conn = $database->getConnection();
        return [
            'connected' => true,
            'version' => $conn->getAttribute(PDO::ATTR_SERVER_VERSION)
        ];
    } catch (Exception $e) {
        return [
            'connected' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Function to check if the database exists
function checkDatabase() {
    try {
        $pdo = new PDO("mysql:host=localhost;port=3306", "root", "");
        $stmt = $pdo->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'corosa_db'");
        return [
            'exists' => (bool)$stmt->fetch(),
            'tables' => checkTables()
        ];
    } catch (Exception $e) {
        return [
            'exists' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Function to check tables
function checkTables() {
    try {
        $pdo = new PDO("mysql:host=localhost;port=3306;dbname=corosa_db", "root", "");
        $stmt = $pdo->query("SHOW TABLES");
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (Exception $e) {
        return ['error' => $e->getMessage()];
    }
}

// Collect server information
$serverInfo = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'],
    'request_method' => $_SERVER['REQUEST_METHOD'],
    'request_uri' => $_SERVER['REQUEST_URI'],
    'mysql' => checkMySQLConnection(),
    'database' => checkDatabase(),
    'post_data' => file_get_contents("php://input")
];

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

echo json_encode($serverInfo, JSON_PRETTY_PRINT);
?>