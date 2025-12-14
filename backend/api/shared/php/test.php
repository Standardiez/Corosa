<?php
/**
 * Simple diagnostic test for login system
 * Visit: http://localhost/Corosa/backend/api/shared/php/test.php
 */

header('Content-Type: application/json; charset=UTF-8');

$results = [];

// Test 1: Check if PHP is running
$results['php_running'] = true;
$results['php_version'] = phpversion();

// Test 2: Check if MySQL extension is available
$results['mysql_extension'] = extension_loaded('pdo_mysql') ? 'available' : 'NOT INSTALLED';

// Test 3: Try to connect to MySQL
try {
    $host = 'localhost';
    $port = '3306';
    $db_name = 'corosa_db';
    $username = 'root';
    $password = '';
    
    $dsn = "mysql:host=$host;port=$port;dbname=$db_name;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $results['database_connection'] = 'SUCCESS';
} catch (PDOException $e) {
    $results['database_connection'] = 'FAILED: ' . $e->getMessage();
}

// Test 4: Check if required files exist
$results['database_php_exists'] = file_exists('../../../config/database.php') ? 'YES' : 'NO';
$results['user_php_exists'] = file_exists('../../../classes/shared/php/User.php') ? 'YES' : 'NO';

// Test 5: Try to include User class
try {
    require_once '../../../config/database.php';
    require_once '../../../classes/shared/php/User.php';
    $results['classes_loaded'] = 'SUCCESS';
} catch (Exception $e) {
    $results['classes_loaded'] = 'FAILED: ' . $e->getMessage();
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
