<?php
require_once '../config/database.php';

class Trip {
    private $conn;
    private $table_name = "trip";

    public $trip_id;
    public $driver_id;
    public $starting_location;
    public $end_location;
    public $available_seats;
    public $ride_distance;
    public $ride_status;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create a new trip
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (driver_id, starting_location, end_location, available_seats, ride_distance, ride_status) 
                  VALUES (:driver_id, :starting_location, :end_location, :available_seats, :ride_distance, :ride_status)
                  RETURNING trip_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->driver_id = htmlspecialchars(strip_tags($this->driver_id));
        $this->starting_location = htmlspecialchars(strip_tags($this->starting_location));
        $this->end_location = htmlspecialchars(strip_tags($this->end_location));
        $this->available_seats = htmlspecialchars(strip_tags($this->available_seats));
        $this->ride_distance = htmlspecialchars(strip_tags($this->ride_distance));
        $this->ride_status = htmlspecialchars(strip_tags($this->ride_status));

        // Bind values
        $stmt->bindParam(":driver_id", $this->driver_id);
        $stmt->bindParam(":starting_location", $this->starting_location);
        $stmt->bindParam(":end_location", $this->end_location);
        $stmt->bindParam(":available_seats", $this->available_seats);
        $stmt->bindParam(":ride_distance", $this->ride_distance);
        $stmt->bindParam(":ride_status", $this->ride_status);

        if($stmt->execute()) {
            // PostgreSQL: Get the returned ID from RETURNING clause
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->trip_id = $row['trip_id'];
            return true;
        }
        return false;
    }

    /**
     * Get trip by ID
     */
    public function getById() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE trip_id = :trip_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":trip_id", $this->trip_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->trip_id = $row['trip_id'];
            $this->driver_id = $row['driver_id'];
            $this->starting_location = $row['starting_location'];
            $this->end_location = $row['end_location'];
            $this->available_seats = $row['available_seats'];
            $this->ride_distance = $row['ride_distance'];
            $this->ride_status = $row['ride_status'];
            $this->created_at = $row['created_at'];
            return true;
        }
        return false;
    }

    /**
     * Get all trips for a driver
     */
    public function getByDriverId() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE driver_id = :driver_id 
                  ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":driver_id", $this->driver_id);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Get all trips
     */
    public function getAll() {
        $query = "SELECT trip_id, driver_id, starting_location, end_location, 
                         available_seats, ride_distance, ride_status, created_at 
                  FROM " . $this->table_name . " 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Update trip information
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET driver_id = :driver_id, starting_location = :starting_location, 
                      end_location = :end_location, available_seats = :available_seats,
                      ride_distance = :ride_distance, ride_status = :ride_status
                  WHERE trip_id = :trip_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->driver_id = htmlspecialchars(strip_tags($this->driver_id));
        $this->starting_location = htmlspecialchars(strip_tags($this->starting_location));
        $this->end_location = htmlspecialchars(strip_tags($this->end_location));
        $this->available_seats = htmlspecialchars(strip_tags($this->available_seats));
        $this->ride_distance = htmlspecialchars(strip_tags($this->ride_distance));
        $this->ride_status = htmlspecialchars(strip_tags($this->ride_status));

        // Bind values
        $stmt->bindParam(":driver_id", $this->driver_id);
        $stmt->bindParam(":starting_location", $this->starting_location);
        $stmt->bindParam(":end_location", $this->end_location);
        $stmt->bindParam(":available_seats", $this->available_seats);
        $stmt->bindParam(":ride_distance", $this->ride_distance);
        $stmt->bindParam(":ride_status", $this->ride_status);
        $stmt->bindParam(":trip_id", $this->trip_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Delete trip
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE trip_id = :trip_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":trip_id", $this->trip_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>

