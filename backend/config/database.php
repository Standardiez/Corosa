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
            $dsn = "pgsql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name;
            
            // Create PDO connection
            $this->conn = new PDO($dsn, $this->username, $this->password);
            
            // Set error handling
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
?>

