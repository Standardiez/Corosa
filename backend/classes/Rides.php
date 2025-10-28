<?php
require_once '../config/database.php';

class Passenger {
    private $conn;
    private $table_name = "rides";

    public $ride_id;
    public $driver_id;
    public $starting_location;
    public $end_location;
    public $departure_time;
    public $available_seats;
    public $ride_distance;
    public $ride_status;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create a new ride
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (ride_id, driver_id, starting_location, end_location, departure_time, 
                  available_seats, ride_distance, ride_status, created_at) 
                  VALUES (:ride_id, :driver_id, :starting_location, :end_location, :departure_time, 
                          :available_seats, :ride_distance, :ride_status, :created_at)";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->ride_id = htmlspecialchars(strip_tags($this->ride_id));
        $this->driver_id = htmlspecialchars(strip_tags($this->driver_id));
        $this->starting_location = htmlspecialchars(strip_tags($this->starting_location));
        $this->end_location = htmlspecialchars(strip_tags($this->end_location));
        $this->departure_time = htmlspecialchars(strip_tags($this->departure_time));
        $this->available_seats = htmlspecialchars(strip_tags($this->available_seats));
        $this->ride_distance = htmlspecialchars(strip_tags($this->ride_distance));
        $this->ride_status = htmlspecialchars(strip_tags($this->ride_status));
        $this->created_at = htmlspecialchars(strip_tags($this->created_at));

        // Bind values
        $stmt->bindParam(":ride_id", $this->ride_id);
        $stmt->bindParam(":driver_id", $this->driver_id);
        $stmt->bindParam(":starting_location", $this->starting_location);
        $stmt->bindParam(":end_location", $this->end_location);
        $stmt->bindParam(":departure_time", $this->departure_time);
        $stmt->bindParam(":available_seats", $this->available_seats);
        $stmt->bindParam(":ride_distance", $this->ride_distance);
        $stmt->bindParam(":ride_status", $this->ride_status);
        $stmt->bindParam(":created_at", $this->created_at);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

}
?>
