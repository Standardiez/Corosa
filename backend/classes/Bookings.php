<?php
require_once '../config/database.php';

class Bookings {
    private $conn;
    private $table_name = "bookings";

    public $booking_id;
    public $passenger_id;
    public $booking_date;
    public $pick_up_location;
    public $drop_off_location;
    public $payment_type;
    public $total_cost;
    public $booking_confirmation;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create a new booking
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (passenger_id, booking_date, pick_up_location, drop_off_location, 
                   payment_type, total_cost, booking_confirmation) 
                  VALUES (:passenger_id, :booking_date, :pick_up_location, :drop_off_location, 
                          :payment_type, :total_cost, :booking_confirmation)
                  RETURNING booking_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->passenger_id = htmlspecialchars(strip_tags($this->passenger_id));
        $this->booking_date = htmlspecialchars(strip_tags($this->booking_date));
        $this->pick_up_location = htmlspecialchars(strip_tags($this->pick_up_location));
        $this->drop_off_location = htmlspecialchars(strip_tags($this->drop_off_location));
        $this->payment_type = htmlspecialchars(strip_tags($this->payment_type));
        $this->total_cost = htmlspecialchars(strip_tags($this->total_cost));
        // Handle boolean for PostgreSQL
        $this->booking_confirmation = filter_var($this->booking_confirmation, FILTER_VALIDATE_BOOLEAN);

        // Bind values
        $stmt->bindParam(":passenger_id", $this->passenger_id);
        $stmt->bindParam(":booking_date", $this->booking_date);
        $stmt->bindParam(":pick_up_location", $this->pick_up_location);
        $stmt->bindParam(":drop_off_location", $this->drop_off_location);
        $stmt->bindParam(":payment_type", $this->payment_type);
        $stmt->bindParam(":total_cost", $this->total_cost);
        $stmt->bindParam(":booking_confirmation", $this->booking_confirmation, PDO::PARAM_BOOL);

        if($stmt->execute()) {
            // PostgreSQL: Get the returned ID from RETURNING clause
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->booking_id = $row['booking_id'];
            return true;
        }
        return false;
    }

    /**
     * Get booking by ID
     */
    public function getById() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE booking_id = :booking_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":booking_id", $this->booking_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->booking_id = $row['booking_id'];
            $this->passenger_id = $row['passenger_id'];
            $this->booking_date = $row['booking_date'];
            $this->pick_up_location = $row['pick_up_location'];
            $this->drop_off_location = $row['drop_off_location'];
            $this->payment_type = $row['payment_type'];
            $this->total_cost = $row['total_cost'];
            $this->booking_confirmation = $row['booking_confirmation'];
            $this->created_at = $row['created_at'];
            return true;
        }
        return false;
    }

    /**
     * Get all bookings for a passenger
     */
    public function getByPassengerId() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE passenger_id = :passenger_id 
                  ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":passenger_id", $this->passenger_id);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Get all bookings
     */
    public function getAll() {
        $query = "SELECT booking_id, passenger_id, booking_date, pick_up_location, 
                         drop_off_location, payment_type, total_cost, booking_confirmation, created_at 
                  FROM " . $this->table_name . " 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Update booking information
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET passenger_id = :passenger_id, booking_date = :booking_date, 
                      pick_up_location = :pick_up_location, drop_off_location = :drop_off_location,
                      payment_type = :payment_type, total_cost = :total_cost, 
                      booking_confirmation = :booking_confirmation
                  WHERE booking_id = :booking_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->passenger_id = htmlspecialchars(strip_tags($this->passenger_id));
        $this->booking_date = htmlspecialchars(strip_tags($this->booking_date));
        $this->pick_up_location = htmlspecialchars(strip_tags($this->pick_up_location));
        $this->drop_off_location = htmlspecialchars(strip_tags($this->drop_off_location));
        $this->payment_type = htmlspecialchars(strip_tags($this->payment_type));
        $this->total_cost = htmlspecialchars(strip_tags($this->total_cost));
        // Handle boolean for PostgreSQL
        $this->booking_confirmation = filter_var($this->booking_confirmation, FILTER_VALIDATE_BOOLEAN);

        // Bind values
        $stmt->bindParam(":passenger_id", $this->passenger_id);
        $stmt->bindParam(":booking_date", $this->booking_date);
        $stmt->bindParam(":pick_up_location", $this->pick_up_location);
        $stmt->bindParam(":drop_off_location", $this->drop_off_location);
        $stmt->bindParam(":payment_type", $this->payment_type);
        $stmt->bindParam(":total_cost", $this->total_cost);
        $stmt->bindParam(":booking_confirmation", $this->booking_confirmation, PDO::PARAM_BOOL);
        $stmt->bindParam(":booking_id", $this->booking_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Delete booking
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE booking_id = :booking_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":booking_id", $this->booking_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>

