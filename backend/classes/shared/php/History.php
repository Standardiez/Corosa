<?php
require_once '../../../config/database.php';

class History {
    private $conn;
    private $table_name = "history";

    public $history_id;
    public $user_id;
    public $status;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create a new history record
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (user_id, status) 
                  VALUES (:user_id, :status)
                  RETURNING history_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->status = htmlspecialchars(strip_tags($this->status));

        // Bind values
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":status", $this->status);

        if($stmt->execute()) {
            // PostgreSQL: Get the returned ID from RETURNING clause
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->history_id = $row['history_id'];
            return true;
        }
        return false;
    }

    /**
     * Get history by ID
     */
    public function getById() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE history_id = :history_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":history_id", $this->history_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->history_id = $row['history_id'];
            $this->user_id = $row['user_id'];
            $this->status = $row['status'];
            $this->created_at = $row['created_at'];
            return true;
        }
        return false;
    }

    /**
     * Get all history records for a user
     */
    public function getByUserId() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE user_id = :user_id 
                  ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Get all history records
     */
    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Update history record
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET user_id = :user_id, status = :status
                  WHERE history_id = :history_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->status = htmlspecialchars(strip_tags($this->status));

        // Bind values
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":history_id", $this->history_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Delete history record
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE history_id = :history_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":history_id", $this->history_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>

