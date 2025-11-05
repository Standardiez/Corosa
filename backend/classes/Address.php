<?php
require_once '../config/database.php';

class Address {
    private $conn;
    private $table_name = "address";

    public $address_id;
    public $address_street;
    public $address_barangay;
    public $address_unit;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create a new address
     */
    public function create() {
    // Use a portable INSERT. PostgreSQL supports RETURNING but MySQL does not.
    $query = "INSERT INTO " . $this->table_name . " 
          (address_street, address_barangay, address_unit) 
          VALUES (:address_street, :address_barangay, :address_unit)";

        $stmt = $this->conn->prepare($query);

        // Sanitize input data
        $this->address_street = htmlspecialchars(strip_tags($this->address_street));
        $this->address_barangay = htmlspecialchars(strip_tags($this->address_barangay));
        $this->address_unit = htmlspecialchars(strip_tags($this->address_unit));

        // Bind values
        $stmt->bindParam(":address_street", $this->address_street);
        $stmt->bindParam(":address_barangay", $this->address_barangay);
        $stmt->bindParam(":address_unit", $this->address_unit);

        if ($stmt->execute()) {
            // Determine driver: PostgreSQL may return via RETURNING, MySQL uses lastInsertId
            $driver = $this->conn->getAttribute(PDO::ATTR_DRIVER_NAME);
            if ($driver === 'pgsql') {
                // If using pgsql and RETURNING was used elsewhere, try to fetch
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($row && isset($row['address_id'])) {
                    $this->address_id = $row['address_id'];
                }
            } else {
                // MySQL / SQLite: use lastInsertId
                $this->address_id = $this->conn->lastInsertId();
            }

            return true;
        }
        return false;
    }

    /**
     * Get address by ID
     */
    public function getById() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE address_id = :address_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":address_id", $this->address_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->address_id = $row['address_id'];
            $this->address_street = $row['address_street'];
            $this->address_barangay = $row['address_barangay'];
            $this->address_unit = $row['address_unit'];
            return true;
        }
        return false;
    }

    /**
     * Get all addresses (no user_id in address table - users reference address_id)
     * This method is kept for API compatibility but returns all addresses
     */
    public function getByUserId() {
        // Note: Address table doesn't have user_id - users reference address_id instead
        // This method returns all addresses for backward compatibility
        $query = "SELECT * FROM " . $this->table_name . " 
                  ORDER BY address_id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Get all addresses
     */
    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  ORDER BY address_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    /**
     * Update address
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET address_street = :address_street, 
                      address_barangay = :address_barangay, address_unit = :address_unit
                  WHERE address_id = :address_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->address_street = htmlspecialchars(strip_tags($this->address_street));
        $this->address_barangay = htmlspecialchars(strip_tags($this->address_barangay));
        $this->address_unit = htmlspecialchars(strip_tags($this->address_unit));

        // Bind values
        $stmt->bindParam(":address_street", $this->address_street);
        $stmt->bindParam(":address_barangay", $this->address_barangay);
        $stmt->bindParam(":address_unit", $this->address_unit);
        $stmt->bindParam(":address_id", $this->address_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Delete address
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE address_id = :address_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":address_id", $this->address_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>

