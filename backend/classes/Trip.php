<?php
require_once '../config/database.php';

class Trip {
    private $conn;
    private $table_name = "trip";

    public $trip_id;
    public $driver_id;
    public $start_lat;
    public $start_long;
    public $end_lat;
    public $end_long;
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
                  (driver_id, start_lat, start_long, end_lat, end_long, available_seats, ride_distance, ride_status) 
                  VALUES (:driver_id, :start_long, :start_lat, :end_long, :end_lat, :available_seats, :ride_distance, :ride_status)
                  RETURNING trip_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->driver_id = htmlspecialchars(strip_tags($this->driver_id));
        $this->start_lat = htmlspecialchars(strip_tags($this->start_lat));
        $this->start_long = htmlspecialchars(strip_tags($this->start_long));
        $this->end_lat = htmlspecialchars(strip_tags($this->end_lat));
        $this->end_long = htmlspecialchars(strip_tags($this->end_long));
        $this->available_seats = htmlspecialchars(strip_tags($this->available_seats));
        $this->ride_distance = htmlspecialchars(strip_tags($this->ride_distance));
        $this->ride_status = htmlspecialchars(strip_tags($this->ride_status));

        // Bind values
        $stmt->bindParam(":driver_id", $this->driver_id);
        $stmt->bindParam(":start_lat", $this->start_lat);
        $stmt->bindParam(":start_long", $this->start_long);
        $stmt->bindParam(":end_lat", $this->end_lat);
        $stmt->bindParam(":end_long", $this->end_long);
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
            $this->driver_id = $row['driver_id']
            $this->start_lat = $row['start_lat'];
            $this->start_long= $row['start_long'];
            $this->end_lat= $row['end_lat'];
            $this->end_long = $row['end_long'];
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
        $query = "SELECT trip_id, driver_id, start_lat, start_long, end_lat, end_long,
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
                  SET driver_id = :driver_id, start_lat = :start_lat, start_long = :start_long, end_lat = :end_lat, end_long = :end_long,
                    available_seats = :available_seats, ride_distance = :ride_distance, ride_status = :ride_status
                  WHERE trip_id = :trip_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->driver_id = htmlspecialchars(strip_tags($this->driver_id));
        $this->start_lat = htmlspecialchars(strip_tags($this->start_lat));
        $this->start_long = htmlspecialchars(strip_tags($this->start_long));
        $this->end_lat= htmlspecialchars(strip_tags($this->end_lat));
        $this->end_long = htmlspecialchars(strip_tags($this->end_long));
        $this->available_seats = htmlspecialchars(strip_tags($this->available_seats));
        $this->ride_distance = htmlspecialchars(strip_tags($this->ride_distance));
        $this->ride_status = htmlspecialchars(strip_tags($this->ride_status));

        // Bind values
        $stmt->bindParam(":driver_id", $this->driver_id);
        $stmt->bindParam(":start_lat", $this->start_lat);
        $stmt->bindParam(":start_long", $this->start_long);
        $stmt->bindParam(":end_lat", $this->end_lat);
        $stmt->bindParam(":end_long", $this->end_long);
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

