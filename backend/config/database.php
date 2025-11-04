<?php
/**
 * Database Configuration for MySQL
 * Simple connection setup for Corosa project
 */

class Database {
    // Database connection settings
    private $host = 'localhost';     // MySQL server address
    private $port = '3306';         // MySQL default port
    private $db_name = 'corosa_db'; // database name
    private $username = 'root';      // MySQL username
    private $password = '';          // MySQL password (change as needed)
    private $conn;

    

    /**
     * Get database connection
     * @return PDO|null
     */
    public function getConnection() {
        $this->conn = null;

        try {
            // Create connection string for MySQL
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            
            // Create PDO connection
            $this->conn = new PDO($dsn, $this->username, $this->password);
            
            // Set error handling
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Set timezone to match your system
            $this->conn->exec("SET time_zone = '+00:00'");
            
        } catch(PDOException $exception) {
            // Log error instead of echoing (for production)
            error_log("Database connection error: " . $exception->getMessage());
            throw new Exception("Database connection failed: " . $exception->getMessage());
        }

        return $this->conn;
    }
}
?>

