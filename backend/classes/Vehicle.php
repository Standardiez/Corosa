<?php
require_once '../config/database.php';

class Vehicle {
    private $conn;
    private $table_name = "vehicle";

    public $plate_number;
    public $driver_id;
    public $vehicle_model;
    public $seat_capacity;
    public $vehicle_status;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create a new vehicle
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (plate_number, driver_id, vehicle_model, seat_capacity, vehicle_status) 
                  VALUES (:plate_number, :driver_id, :vehicle_model, :seat_capacity, :vehicle_status)";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->plate_number = htmlspecialchars(strip_tags($this->plate_number));
        $this->driver_id = htmlspecialchars(strip_tags($this->driver_id));
        $this->vehicle_model = htmlspecialchars(strip_tags($this->vehicle_model));
        $this->seat_capacity = htmlspecialchars(strip_tags($this->seat_capacity));
        $this->vehicle_status = htmlspecialchars(strip_tags($this->vehicle_status));

        // Bind values
        $stmt->bindParam(":plate_number", $this->plate_number);
        $stmt->bindParam(":driver_id", $this->driver_id);
        $stmt->bindParam(":vehicle_model", $this->vehicle_model);
        $stmt->bindParam(":seat_capacity", $this->seat_capacity);
        $stmt->bindParam(":vehicle_status", $this->vehicle_status);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Get vehicle by plate number
     */
    public function getByPlateNumber() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE plate_number = :plate_number LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":plate_number", $this->plate_number);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->plate_number = $row['plate_number'];
            $this->driver_id = $row['driver_id'];
            $this->vehicle_model = $row['vehicle_model'];
            $this->seat_capacity = $row['seat_capacity'];
            $this->vehicle_status = $row['vehicle_status'];
            return true;
        }
        return false;
    }

    /**
     * Get all vehicles for a driver
     */
    public function getByDriverId() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE driver_id = :driver_id 
                  ORDER BY plate_number";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":driver_id", $this->driver_id);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Get all vehicles
     */
    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  ORDER BY plate_number";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Update vehicle information
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET driver_id = :driver_id, vehicle_model = :vehicle_model, 
                      seat_capacity = :seat_capacity, vehicle_status = :vehicle_status
                  WHERE plate_number = :plate_number";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->driver_id = htmlspecialchars(strip_tags($this->driver_id));
        $this->vehicle_model = htmlspecialchars(strip_tags($this->vehicle_model));
        $this->seat_capacity = htmlspecialchars(strip_tags($this->seat_capacity));
        $this->vehicle_status = htmlspecialchars(strip_tags($this->vehicle_status));

        // Bind values
        $stmt->bindParam(":driver_id", $this->driver_id);
        $stmt->bindParam(":vehicle_model", $this->vehicle_model);
        $stmt->bindParam(":seat_capacity", $this->seat_capacity);
        $stmt->bindParam(":vehicle_status", $this->vehicle_status);
        $stmt->bindParam(":plate_number", $this->plate_number);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Delete vehicle
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE plate_number = :plate_number";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":plate_number", $this->plate_number);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>

