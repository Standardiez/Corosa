<?php
require_once '../config/database.php';

class Bookings {
    private $conn;
    private $table_name = "bookings";
    private $last_error;

    public $booking_id;
    public $passenger_id;
    public $booking_date;
    public $start_lat;
    public $start_long;
    public $end_lat;
    public $end_long;
    public $payment_type;
    public $total_cost;
    public $booking_confirmation;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
        $this->last_error = null;
    }

    public function getLastError() {
        return $this->last_error;
    }

    /**
     * Create a new booking
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (passenger_id, booking_date, start_lat, start_long, end_lat, end_long, 
                   payment_type, total_cost, booking_confirmation) 
                  VALUES (:passenger_id, :booking_date, :start_lat, :start_long, :end_lat, :end_long,
                          :payment_type, :total_cost, :booking_confirmation)";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->passenger_id = htmlspecialchars(strip_tags($this->passenger_id));
        $this->booking_date = htmlspecialchars(strip_tags($this->booking_date));
        $this->start_lat = htmlspecialchars(strip_tags($this->start_lat));
        $this->start_long = htmlspecialchars(strip_tags($this->start_long));
        $this->end_lat = htmlspecialchars(strip_tags($this->end_lat));
        $this->end_long = htmlspecialchars(strip_tags($this->end_long));
        $this->payment_type = $this->payment_type !== null ? htmlspecialchars(strip_tags($this->payment_type)) : 'cash';
        $this->total_cost = htmlspecialchars(strip_tags($this->total_cost));
        $this->booking_confirmation = $this->booking_confirmation ? 1 : 0; // Convert to MySQL boolean

        // Bind values
        $stmt->bindParam(":passenger_id", $this->passenger_id, PDO::PARAM_INT);
        $stmt->bindParam(":booking_date", $this->booking_date);
        $stmt->bindParam(":start_lat", $this->start_lat);
        $stmt->bindParam(":start_long", $this->start_long);
        $stmt->bindParam(":end_lat", $this->end_lat);
        $stmt->bindParam(":end_long", $this->end_long);
        $stmt->bindParam(":payment_type", $this->payment_type);
        $stmt->bindParam(":total_cost", $this->total_cost);
        $stmt->bindParam(":booking_confirmation", $this->booking_confirmation, PDO::PARAM_BOOL);

        if($stmt->execute()) {
            $this->booking_id = (int)$this->conn->lastInsertId();
            $this->last_error = null;
            return true;
        }
        $errorInfo = $stmt->errorInfo();
        $this->last_error = $errorInfo[2] ?? 'Unknown database error';
        error_log("Bookings::create failed: " . $this->last_error);
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
            $this->start_lat = $row['start_lat'];
            $this->start_long = $row['start_long'];
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
        $query = "SELECT booking_id, passenger_id, booking_date, start_lat, 
                         start_long, payment_type, total_cost, booking_confirmation, created_at 
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
                      start_lat = :start_lat, start_long = :start_long,
                      end_lat = :end_lat, end_long = :end_long,
                      payment_type = :payment_type, total_cost = :total_cost, 
                      booking_confirmation = :booking_confirmation
                  WHERE booking_id = :booking_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->passenger_id = htmlspecialchars(strip_tags($this->passenger_id));
        $this->booking_date = htmlspecialchars(strip_tags($this->booking_date));
        $this->start_lat = htmlspecialchars(strip_tags($this->start_lat));
        $this->start_long = htmlspecialchars(strip_tags($this->start_long));
        $this->end_lat = htmlspecialchars(strip_tags($this->end_lat));
        $this->end_long = htmlspecialchars(strip_tags($this->end_long));
        $this->payment_type = htmlspecialchars(strip_tags($this->payment_type));
        $this->total_cost = htmlspecialchars(strip_tags($this->total_cost));
        // Handle boolean for PostgreSQL
        $this->booking_confirmation = filter_var($this->booking_confirmation, FILTER_VALIDATE_BOOLEAN);

        // Bind values
        $stmt->bindParam(":passenger_id", $this->passenger_id);
        $stmt->bindParam(":booking_date", $this->booking_date);
        $stmt->bindParam(":start_lat", $this->start_lat);
        $stmt->bindParam(":start_long", $this->start_long);
        $stmt->bindParam(":end_lat", $this->end_lat);
        $stmt->bindParam(":end_long", $this->end_long);
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

