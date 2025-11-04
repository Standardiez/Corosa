<?php
/**
 * Database Configuration for PostgreSQL
 * Simple connection setup for Corosa project
 */

class Database {
    // Database connection settings
    private $host = 'localhost';        // PostgreSQL server address
    private $port = '5432';             // PostgreSQL default port
    private $db_name = 'corosa_db';    // database name
    private $username = 'postgres';     // PostgreSQL username
    private $password = 'admin123'; // PostgreSQL password
    private $conn;

    

    /**
     * Get database connection
     * @return PDO|null
     */
    public function getConnection() {
        $this->conn = null;

        try {
            // Create connection string for PostgreSQL
            // Using pgsql driver (alternative to postgresql)
            $dsn = "pgsql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name;
            
            // Create PDO connection
            $this->conn = new PDO($dsn, $this->username, $this->password);
            
            // Set error handling
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Set timezone to UTC (optional, adjust as needed)
            $this->conn->exec("SET timezone TO 'UTC'");
            
        } catch(PDOException $exception) {
            // Log error instead of echoing (for production)
            error_log("Database connection error: " . $exception->getMessage());
            throw new Exception("Database connection failed: " . $exception->getMessage());
        }

        return $this->conn;
    }
}
?>

