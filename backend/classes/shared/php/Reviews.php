<?php
require_once '../../../config/database.php';

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
                  VALUES (:booking_id, :rating, :comment)";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->booking_id = htmlspecialchars(strip_tags($this->booking_id));
        $this->rating = htmlspecialchars(strip_tags($this->rating));
        $this->comment = $this->comment !== null ? htmlspecialchars(strip_tags($this->comment)) : null;

        // Bind values
        $stmt->bindParam(":booking_id", $this->booking_id);
        $stmt->bindParam(":rating", $this->rating);
        if($this->comment === null){
            $stmt->bindValue(":comment", null, PDO::PARAM_NULL);
        }else{
            $stmt->bindParam(":comment", $this->comment);
        }

        if($stmt->execute()) {
            $this->review_id = (int)$this->conn->lastInsertId();
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
        $query = "SELECT 
                    r.review_id,
                    r.booking_id,
                    r.rating,
                    r.comment,
                    r.created_at,
                    TRIM(CONCAT(
                        u.first_name, ' ',
                        COALESCE(NULLIF(CONCAT(u.middle_initial, '. '), '. '), ''),
                        u.last_name
                    )) AS reviewer_name
                  FROM " . $this->table_name . " r
                  LEFT JOIN bookings b ON r.booking_id = b.booking_id
                  LEFT JOIN users u ON b.passenger_id = u.user_id
                  WHERE r.booking_id = :booking_id 
                  ORDER BY r.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":booking_id", $this->booking_id);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Get all reviews
     */
    public function getAll() {
        $query = "SELECT 
                    r.review_id,
                    r.booking_id,
                    r.rating,
                    r.comment,
                    r.created_at,
                    TRIM(CONCAT(
                        u.first_name, ' ',
                        COALESCE(NULLIF(CONCAT(u.middle_initial, '. '), '. '), ''),
                        u.last_name
                    )) AS reviewer_name
                  FROM " . $this->table_name . " r
                  LEFT JOIN bookings b ON r.booking_id = b.booking_id
                  LEFT JOIN users u ON b.passenger_id = u.user_id
                  ORDER BY r.created_at DESC";
        
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

