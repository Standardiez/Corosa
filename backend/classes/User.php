<?php
require_once '../config/database.php';

class User {
    private $conn;
    private $table_name = "user";

    public $user_id;
    public $first_name;
    public $middle_initial;
    public $last_name;
    public $birthdate;
    public $email;
    public $mobile_number;
    public $address;
    public $disabilities;
    public $employment_status;
    public $account_status;
    public $created_at;
    public $hashed_password;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create a new user
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (first_name, middle_initial, last_name, birthdate, email, mobile_number, 
                   disabilities, employment_status, account_status, hashed_password) 
                  VALUES (:first_name, :middle_initial, :last_name, :birthdate, :email, :mobile_number, 
                          :disabilities, :employment_status, :account_status, :hashed_password)
                  RETURNING user_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->middle_initial = htmlspecialchars(strip_tags($this->middle_initial));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->birthdate = htmlspecialchars(strip_tags($this->birthdate));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->mobile_number = htmlspecialchars(strip_tags($this->mobile_number));
        $this->disabilities = htmlspecialchars(strip_tags($this->disabilities));
        $this->employment_status = htmlspecialchars(strip_tags($this->employment_status));
        $this->account_status = htmlspecialchars(strip_tags($this->account_status));
        $this->hashed_password = htmlspecialchars(strip_tags($this->hashed_password));

        // Bind values
        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":middle_initial", $this->middle_initial);
        $stmt->bindParam(":last_name", $this->last_name);
        $stmt->bindParam(":birthdate", $this->birthdate);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":mobile_number", $this->mobile_number);
        $stmt->bindParam(":disabilities", $this->disabilities);
        $stmt->bindParam(":employment_status", $this->employment_status);
        $stmt->bindParam(":account_status", $this->account_status);
        $stmt->bindParam(":hashed_password", $this->hashed_password);

        if($stmt->execute()) {
            // PostgreSQL: Get the returned ID from RETURNING clause
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->user_id = $row['user_id'];
            return true;
        }
        return false;
    }

    /**
     * Get user by email
     */
    public function getByEmail() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->user_id = $row['user_id'];
            $this->first_name = $row['first_name'];
            $this->middle_initial = $row['middle_initial'];
            $this->last_name = $row['last_name'];
            $this->birthdate = $row['birthdate'];
            $this->email = $row['email'];
            $this->mobile_number = $row['mobile_number'];
            $this->disabilities = $row['disabilities'];
            $this->employment_status = $row['employment_status'];
            $this->account_status = $row['account_status'];
            $this->created_at = $row['created_at'];
            $this->hashed_password = $row['hashed_password'];
            return true;
        }
        return false;
    }

    /**
     * Get user by ID
     */
    public function getById() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = :user_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->user_id = $row['user_id'];
            $this->first_name = $row['first_name'];
            $this->middle_initial = $row['middle_initial'];
            $this->last_name = $row['last_name'];
            $this->birthdate = $row['birthdate'];
            $this->email = $row['email'];
            $this->mobile_number = $row['mobile_number'];
            $this->disabilities = $row['disabilities'];
            $this->employment_status = $row['employment_status'];
            $this->account_status = $row['account_status'];
            $this->created_at = $row['created_at'];
            $this->hashed_password = $row['hashed_password'];
            return true;
        }
        return false;
    }

    /**
     * Get all users
     */
    public function getAll() {
        $query = "SELECT user_id, first_name, middle_initial, last_name, email, 
                         mobile_number, employment_status, account_status, created_at 
                  FROM " . $this->table_name . " 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Update user information
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET first_name = :first_name, middle_initial = :middle_initial, last_name = :last_name, 
                      birthdate = :birthdate, mobile_number = :mobile_number,
                      disabilities = :disabilities, employment_status = :employment_status,
                      account_status = :account_status
                  WHERE user_id = :user_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->middle_initial = htmlspecialchars(strip_tags($this->middle_initial));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->birthdate = htmlspecialchars(strip_tags($this->birthdate));
        $this->mobile_number = htmlspecialchars(strip_tags($this->mobile_number));
        $this->disabilities = htmlspecialchars(strip_tags($this->disabilities));
        $this->employment_status = htmlspecialchars(strip_tags($this->employment_status));
        $this->account_status = htmlspecialchars(strip_tags($this->account_status));

        // Bind values
        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":middle_initial", $this->middle_initial);
        $stmt->bindParam(":last_name", $this->last_name);
        $stmt->bindParam(":birthdate", $this->birthdate);
        $stmt->bindParam(":mobile_number", $this->mobile_number);
        $stmt->bindParam(":disabilities", $this->disabilities);
        $stmt->bindParam(":employment_status", $this->employment_status);
        $stmt->bindParam(":account_status", $this->account_status);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Delete user
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>

