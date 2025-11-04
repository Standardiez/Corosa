cd "c:\Users\My PC\Corosa\backend"
php -S localhost:8000<?php
// Set error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include database configuration
require_once 'config/database.php';

try {
    // Create new database instance
    $database = new Database();
    $db = $database->getConnection();
    
    if($db) {
        echo "✅ Database connection successful!\n\n";
        
        // Test query to check if tables exist
        $tables = ['address', 'users', 'driver', 'vehicle', 'emergency_contact', 
                   'trips', 'bookings', 'trip_assignment', 'reviews', 'history'];
        
        foreach($tables as $table) {
            $query = "SELECT COUNT(*) as count FROM $table";
            try {
                $stmt = $db->query($query);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                echo "Table '$table': {$row['count']} rows\n";
            } catch(PDOException $e) {
                echo "❌ Table '$table': Not found or error - " . $e->getMessage() . "\n";
            }
        }
    }
} catch(Exception $e) {
    echo "❌ Connection failed: " . $e->getMessage();
}
?>