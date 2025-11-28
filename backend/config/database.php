<?php
/**
 * Database Configuration for MySQL
 * Simple connection setup for Corosa project
 */

class Database {
    // Database connection settings (can be overridden via environment variables)
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    private $conn;

    public function __construct() {
        $this->host = getenv('DB_HOST') ?: 'mysql';
        $this->port = getenv('DB_PORT') ?: '3306';
        $this->db_name = getenv('DB_NAME') ?: 'corosa_db';
        $this->username = getenv('DB_USER') ?: 'corosa_user';
        $this->password = getenv('DB_PASSWORD') ?: 'corosa_password';
    }

    /**
     * Check if MySQL server is running
     * @return bool
     */
    private function isMySQLRunning() {
        $host = $this->host ?: "mysql";
        $port = $this->port ?: 3306;

        try {
            $socket = @fsockopen($host, $port, $errno, $errstr, 2);

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
            // Allow container/host overrides
            $this->host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: $this->host ?? 'localhost';
            $this->port = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: $this->port ?? '3306';
            $this->db_name = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: $this->db_name ?? 'corosa_db';
            $this->username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: $this->username ?? 'root';
            $this->password = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: $this->password ?? '';

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

