<?php
require_once '../../../config/database.php';

class EmergencyContact {
    private $conn;
    private $table_name = "emergency_contact";

    public $contact_id;
    public $user_id;
    public $contact_name;
    public $contact_number;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create a new emergency contact
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (user_id, contact_name, contact_number) 
                  VALUES (:user_id, :contact_name, :contact_number)
                  RETURNING contact_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->contact_name = htmlspecialchars(strip_tags($this->contact_name));
        $this->contact_number = htmlspecialchars(strip_tags($this->contact_number));

        // Bind values
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":contact_name", $this->contact_name);
        $stmt->bindParam(":contact_number", $this->contact_number);

        if($stmt->execute()) {
            // PostgreSQL: Get the returned ID from RETURNING clause
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->contact_id = $row['contact_id'];
            return true;
        }
        return false;
    }

    /**
     * Get emergency contact by ID
     */
    public function getById() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE contact_id = :contact_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":contact_id", $this->contact_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->contact_id = $row['contact_id'];
            $this->user_id = $row['user_id'];
            $this->contact_name = $row['contact_name'];
            $this->contact_number = $row['contact_number'];
            return true;
        }
        return false;
    }

    /**
     * Get all emergency contacts for a user
     */
    public function getByUserId() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE user_id = :user_id 
                  ORDER BY contact_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Get all emergency contacts
     */
    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  ORDER BY contact_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Update emergency contact
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET user_id = :user_id, contact_name = :contact_name, contact_number = :contact_number
                  WHERE contact_id = :contact_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->contact_name = htmlspecialchars(strip_tags($this->contact_name));
        $this->contact_number = htmlspecialchars(strip_tags($this->contact_number));

        // Bind values
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":contact_name", $this->contact_name);
        $stmt->bindParam(":contact_number", $this->contact_number);
        $stmt->bindParam(":contact_id", $this->contact_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Delete emergency contact
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE contact_id = :contact_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":contact_id", $this->contact_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>

