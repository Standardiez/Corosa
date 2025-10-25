<?php
require_once '../config/database.php';

class Passenger {
    private $conn;
    private $table_name = "passengers";

    public $passenger_id;
    public $first_name;
    public $middle_initial;
    public $last_name;
    public $birthdate;
    public $email;
    public $mobile_number;
    public $emergency_contact;
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
     * Create a new passenger
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (first_name, middle_initial, last_name, birthdate, email, mobile_number, 
                   emergency_contact, address, disabilities, employment_status, account_status, hashed_password) 
                  VALUES (:first_name, :middle_initial, :last_name, :birthdate, :email, :mobile_number, 
                          :emergency_contact, :address, :disabilities, :employment_status, :account_status, :hashed_password)";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->middle_initial = htmlspecialchars(strip_tags($this->middle_initial));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->birthdate = htmlspecialchars(strip_tags($this->birthdate));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->mobile_number = htmlspecialchars(strip_tags($this->mobile_number));
        $this->emergency_contact = htmlspecialchars(strip_tags($this->emergency_contact));
        $this->address = htmlspecialchars(strip_tags($this->address));
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
        $stmt->bindParam(":emergency_contact", $this->emergency_contact);
        $stmt->bindParam(":address", $this->address);
        $stmt->bindParam(":disabilities", $this->disabilities);
        $stmt->bindParam(":employment_status", $this->employment_status);
        $stmt->bindParam(":account_status", $this->account_status);
        $stmt->bindParam(":hashed_password", $this->hashed_password);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Get passenger by email
     */
    public function getByEmail() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->passenger_id = $row['passenger_id'];
            $this->first_name = $row['first_name'];
            $this->middle_initial = $row['middle_initial'];
            $this->last_name = $row['last_name'];
            $this->birthdate = $row['birthdate'];
            $this->email = $row['email'];
            $this->mobile_number = $row['mobile_number'];
            $this->emergency_contact = $row['emergency_contact'];
            $this->address = $row['address'];
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
     * Get passenger by ID
     */
    public function getById() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE passenger_id = :passenger_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":passenger_id", $this->passenger_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->passenger_id = $row['passenger_id'];
            $this->first_name = $row['first_name'];
            $this->middle_initial = $row['middle_initial'];
            $this->last_name = $row['last_name'];
            $this->birthdate = $row['birthdate'];
            $this->email = $row['email'];
            $this->mobile_number = $row['mobile_number'];
            $this->emergency_contact = $row['emergency_contact'];
            $this->address = $row['address'];
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
     * Get all passengers
     */
    public function getAll() {
        $query = "SELECT passenger_id, first_name, middle_initial, last_name, email, 
                         mobile_number, employment_status, account_status, created_at 
                  FROM " . $this->table_name . " 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Update passenger information
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET first_name = :first_name, middle_initial = :middle_initial, last_name = :last_name, 
                      birthdate = :birthdate, mobile_number = :mobile_number, emergency_contact = :emergency_contact,
                      address = :address, disabilities = :disabilities, employment_status = :employment_status,
                      account_status = :account_status
                  WHERE passenger_id = :passenger_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->middle_initial = htmlspecialchars(strip_tags($this->middle_initial));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->birthdate = htmlspecialchars(strip_tags($this->birthdate));
        $this->mobile_number = htmlspecialchars(strip_tags($this->mobile_number));
        $this->emergency_contact = htmlspecialchars(strip_tags($this->emergency_contact));
        $this->address = htmlspecialchars(strip_tags($this->address));
        $this->disabilities = htmlspecialchars(strip_tags($this->disabilities));
        $this->employment_status = htmlspecialchars(strip_tags($this->employment_status));
        $this->account_status = htmlspecialchars(strip_tags($this->account_status));

        // Bind values
        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":middle_initial", $this->middle_initial);
        $stmt->bindParam(":last_name", $this->last_name);
        $stmt->bindParam(":birthdate", $this->birthdate);
        $stmt->bindParam(":mobile_number", $this->mobile_number);
        $stmt->bindParam(":emergency_contact", $this->emergency_contact);
        $stmt->bindParam(":address", $this->address);
        $stmt->bindParam(":disabilities", $this->disabilities);
        $stmt->bindParam(":employment_status", $this->employment_status);
        $stmt->bindParam(":account_status", $this->account_status);
        $stmt->bindParam(":passenger_id", $this->passenger_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Delete passenger
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE passenger_id = :passenger_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":passenger_id", $this->passenger_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>
