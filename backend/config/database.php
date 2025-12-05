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
    private $username = 'root';      // MySQL default username
    private $password = '';          // MySQL default password (usually blank in WAMP)
    private $conn;

    /**
     * Check if MySQL server is running
     * @return bool
     */
    private function isMySQLRunning() {
        try {
            $socket = @fsockopen($this->host, $this->port, $errno, $errstr, 5);
            if ($socket) {
                fclose($socket);
                return true;
            }
            return false;
        } catch (Exception $e) {
            return false;
        }
    }

    

    /**
     * Get database connection
     * @return PDO|null
     * @throws PDOException if connection fails
     */
    public function getConnection() {
        $this->conn = null;

        try {
            // Check if MySQL is running
            if (!$this->isMySQLRunning()) {
                throw new PDOException("MySQL server is not running");
            }

            // Create connection string for MySQL
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            
            // Create PDO connection with error mode
            $this->conn = new PDO($dsn, $this->username, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
            
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