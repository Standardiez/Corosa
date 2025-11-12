<?php
require_once '../config/database.php';

class TripAssignment {
    private $conn;
    private $table_name = "trip_assignment";
    private $last_error;

    public $assignment_id;
    public $booking_id;
    public $trip_id;
    public $seat_number;
    public $assignment_status;
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
     * Create a new trip assignment
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (booking_id, trip_id, seat_number, assignment_status, payment_type, 
                   total_cost, booking_confirmation) 
                  VALUES (:booking_id, :trip_id, :seat_number, :assignment_status, :payment_type, 
                          :total_cost, :booking_confirmation)";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->booking_id = htmlspecialchars(strip_tags($this->booking_id));
        $this->trip_id = htmlspecialchars(strip_tags($this->trip_id));
        $this->seat_number = $this->seat_number !== null ? htmlspecialchars(strip_tags($this->seat_number)) : null;
        $this->assignment_status = $this->assignment_status !== null ? htmlspecialchars(strip_tags($this->assignment_status)) : 'pending';
        $this->payment_type = $this->payment_type !== null ? htmlspecialchars(strip_tags($this->payment_type)) : 'cash';
        $this->total_cost = htmlspecialchars(strip_tags($this->total_cost));
        // Handle boolean
        $this->booking_confirmation = filter_var($this->booking_confirmation, FILTER_VALIDATE_BOOLEAN);

        // Bind values
        $stmt->bindParam(":booking_id", $this->booking_id, PDO::PARAM_INT);
        $stmt->bindParam(":trip_id", $this->trip_id, PDO::PARAM_INT);
        if($this->seat_number === null) {
            $stmt->bindValue(":seat_number", null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(":seat_number", $this->seat_number);
        }
        $stmt->bindParam(":assignment_status", $this->assignment_status);
        $stmt->bindParam(":payment_type", $this->payment_type);
        $stmt->bindParam(":total_cost", $this->total_cost);
        $stmt->bindParam(":booking_confirmation", $this->booking_confirmation, PDO::PARAM_BOOL);

        if($stmt->execute()) {
            $this->assignment_id = (int)$this->conn->lastInsertId();
            $this->last_error = null;
            return true;
        }
        $errorInfo = $stmt->errorInfo();
        $this->last_error = $errorInfo[2] ?? 'Unknown database error';
        error_log("TripAssignment::create failed: " . $this->last_error);
        return false;
    }

    /**
     * Get trip assignment by ID
     */
    public function getById() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE assignment_id = :assignment_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":assignment_id", $this->assignment_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->assignment_id = $row['assignment_id'];
            $this->booking_id = $row['booking_id'];
            $this->trip_id = $row['trip_id'];
            $this->seat_number = $row['seat_number'];
            $this->assignment_status = $row['assignment_status'];
            $this->payment_type = $row['payment_type'];
            $this->total_cost = $row['total_cost'];
            $this->booking_confirmation = $row['booking_confirmation'];
            $this->created_at = $row['created_at'];
            return true;
        }
        return false;
    }

    /**
     * Get all trip assignments for a booking
     */
    public function getByBookingId() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE booking_id = :booking_id 
                  ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":booking_id", $this->booking_id);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Get all trip assignments for a trip
     */
    public function getByTripId() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE trip_id = :trip_id 
                  ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":trip_id", $this->trip_id);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Get all trip assignments
     */
    public function getAll() {
        $query = "SELECT assignment_id, booking_id, trip_id, seat_number, assignment_status, 
                         payment_type, total_cost, booking_confirmation, created_at 
                  FROM " . $this->table_name . " 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Update trip assignment information
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET booking_id = :booking_id, trip_id = :trip_id, seat_number = :seat_number, 
                      assignment_status = :assignment_status, payment_type = :payment_type,
                      total_cost = :total_cost, booking_confirmation = :booking_confirmation
                  WHERE assignment_id = :assignment_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->booking_id = htmlspecialchars(strip_tags($this->booking_id));
        $this->trip_id = htmlspecialchars(strip_tags($this->trip_id));
        $this->seat_number = htmlspecialchars(strip_tags($this->seat_number));
        $this->assignment_status = htmlspecialchars(strip_tags($this->assignment_status));
        $this->payment_type = htmlspecialchars(strip_tags($this->payment_type));
        $this->total_cost = htmlspecialchars(strip_tags($this->total_cost));
        // Handle boolean for PostgreSQL
        $this->booking_confirmation = filter_var($this->booking_confirmation, FILTER_VALIDATE_BOOLEAN);

        // Bind values
        $stmt->bindParam(":booking_id", $this->booking_id);
        $stmt->bindParam(":trip_id", $this->trip_id);
        $stmt->bindParam(":seat_number", $this->seat_number);
        $stmt->bindParam(":assignment_status", $this->assignment_status);
        $stmt->bindParam(":payment_type", $this->payment_type);
        $stmt->bindParam(":total_cost", $this->total_cost);
        $stmt->bindParam(":booking_confirmation", $this->booking_confirmation, PDO::PARAM_BOOL);
        $stmt->bindParam(":assignment_id", $this->assignment_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Delete trip assignment
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE assignment_id = :assignment_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":assignment_id", $this->assignment_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>

