<?php
require_once '../config/database.php';

class Reviews {
    private $conn;
    private $table_name = "reviews";

    public $review_id;
    public $booking_id;
    public $rating;
    public $comment;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create a new review
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (booking_id, rating, comment) 
                  VALUES (:booking_id, :rating, :comment)
                  RETURNING review_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->booking_id = htmlspecialchars(strip_tags($this->booking_id));
        $this->rating = htmlspecialchars(strip_tags($this->rating));
        $this->comment = htmlspecialchars(strip_tags($this->comment));

        // Bind values
        $stmt->bindParam(":booking_id", $this->booking_id);
        $stmt->bindParam(":rating", $this->rating);
        $stmt->bindParam(":comment", $this->comment);

        if($stmt->execute()) {
            // PostgreSQL: Get the returned ID from RETURNING clause
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->review_id = $row['review_id'];
            return true;
        }
        return false;
    }

    /**
     * Get review by ID
     */
    public function getById() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE review_id = :review_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":review_id", $this->review_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->review_id = $row['review_id'];
            $this->booking_id = $row['booking_id'];
            $this->rating = $row['rating'];
            $this->comment = $row['comment'];
            $this->created_at = $row['created_at'];
            return true;
        }
        return false;
    }

    /**
     * Get all reviews for a booking
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
     * Get all reviews
     */
    public function getAll() {
        $query = "SELECT review_id, booking_id, rating, comment, created_at 
                  FROM " . $this->table_name . " 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Update review
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET booking_id = :booking_id, rating = :rating, comment = :comment
                  WHERE review_id = :review_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->booking_id = htmlspecialchars(strip_tags($this->booking_id));
        $this->rating = htmlspecialchars(strip_tags($this->rating));
        $this->comment = htmlspecialchars(strip_tags($this->comment));

        // Bind values
        $stmt->bindParam(":booking_id", $this->booking_id);
        $stmt->bindParam(":rating", $this->rating);
        $stmt->bindParam(":comment", $this->comment);
        $stmt->bindParam(":review_id", $this->review_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Delete review
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE review_id = :review_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":review_id", $this->review_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>

