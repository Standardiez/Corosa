<?php
require_once '../../../config/database.php';

class Driver {
    private $conn;
    private $table_name = "driver";

    public $driver_id;
    public $user_id;
    public $driver_license_image;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create a new driver
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (user_id, driver_license_image) 
                  VALUES (:user_id, :driver_license_image)
                  RETURNING driver_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->driver_license_image = htmlspecialchars(strip_tags($this->driver_license_image));

        // Bind values
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":driver_license_image", $this->driver_license_image);

        if($stmt->execute()) {
            // PostgreSQL: Get the returned ID from RETURNING clause
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->driver_id = $row['driver_id'];
            return true;
        }
        return false;
    }

    /**
     * Get driver by ID
     */
    public function getById() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE driver_id = :driver_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":driver_id", $this->driver_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->driver_id = $row['driver_id'];
            $this->user_id = $row['user_id'];
            $this->driver_license_image = $row['driver_license_image'];
            return true;
        }
        return false;
    }

    /**
     * Get driver by user ID
     */
    public function getByUserId() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = :user_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->driver_id = $row['driver_id'];
            $this->user_id = $row['user_id'];
            $this->driver_license_image = $row['driver_license_image'];
            return true;
        }
        return false;
    }

    /**
     * Get all drivers
     */
    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  ORDER BY driver_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Update driver information
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET user_id = :user_id, driver_license_image = :driver_license_image
                  WHERE driver_id = :driver_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->driver_license_image = htmlspecialchars(strip_tags($this->driver_license_image));

        // Bind values
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":driver_license_image", $this->driver_license_image);
        $stmt->bindParam(":driver_id", $this->driver_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Delete driver
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE driver_id = :driver_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":driver_id", $this->driver_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>

