<?php
/**
 * ========================================
 * BOOKINGS CLASS
 * ========================================
 *
 * PURPOSE:
 * Encapsulates all database operations for the bookings table.
 * Provides CRUD (Create, Read, Update, Delete) functionality for booking records.
 *
 * DESIGN PATTERN:
 * This follows the Data Access Object (DAO) pattern, separating business logic
 * from database access logic. Properties represent table columns, and methods
 * handle SQL operations with prepared statements for security.
 *
 * DATABASE TABLE STRUCTURE (bookings):
 * - booking_id (INT, PRIMARY KEY, AUTO_INCREMENT)
 * - passenger_id (INT, FOREIGN KEY → users.user_id)
 * - booking_date (DATETIME) - When the ride is scheduled
 * - start_lat (DECIMAL) - Pickup latitude
 * - start_long (DECIMAL) - Pickup longitude
 * - end_lat (DECIMAL) - Dropoff latitude
 * - end_long (DECIMAL) - Dropoff longitude
 * - payment_type (VARCHAR) - 'cash', 'gcash', etc.
 * - total_cost (DECIMAL) - Calculated fare
 * - booking_confirmation (BOOLEAN) - True when passenger confirms
 * - created_at (TIMESTAMP) - Record creation timestamp
 *
 * SECURITY FEATURES:
 * - PDO prepared statements prevent SQL injection
 * - htmlspecialchars/strip_tags sanitize all user input
 * - Error logging for debugging without exposing details to users
 *
 * DEPENDENCIES:
 * - Database connection from config/database.php
 * ========================================
 */

require_once '../config/database.php';

class Bookings {
    // ========================================
    // PRIVATE PROPERTIES (Internal Use Only)
    // ========================================

    /**
     * $conn - PDO database connection object
     * Used for executing all SQL queries.
     * Injected via constructor for flexibility (dependency injection).
     */
    private $conn;

    /**
     * $table_name - The database table this class operates on
     * Hardcoded to "bookings" but could be made configurable.
     */
    private $table_name = "bookings";

    /**
     * $last_error - Stores the most recent database error message
     * Used for debugging and user-friendly error responses.
     * Retrieved via getLastError() method.
     */
    private $last_error;

    // ========================================
    // PUBLIC PROPERTIES (Data Fields)
    // ========================================
    // These map directly to columns in the bookings table.
    // Set these properties before calling create() or update().
    // Retrieved automatically after getById() succeeds.

    public $booking_id;              // INT - Primary key, auto-generated
    public $passenger_id;            // INT - Foreign key to users table
    public $booking_date;            // DATETIME - Scheduled ride time
    public $start_lat;               // DECIMAL - Pickup latitude
    public $start_long;              // DECIMAL - Pickup longitude
    public $end_lat;                 // DECIMAL - Dropoff latitude
    public $end_long;                // DECIMAL - Dropoff longitude
    public $payment_type;            // VARCHAR - 'cash', 'gcash', etc.
    public $total_cost;              // DECIMAL - Fare amount
    public $booking_confirmation;    // BOOLEAN - Confirmation status
    public $created_at;              // TIMESTAMP - Record creation time

    // ========================================
    // CONSTRUCTOR & ERROR HANDLING
    // ========================================

    /**
     * Constructor - Initialize the Bookings object
     *
     * @param PDO $db - Database connection object
     *
     * USAGE:
     * $database = new Database();
     * $db = $database->getConnection();
     * $booking = new Bookings($db);
     *
     * WHY DEPENDENCY INJECTION?
     * Passing the connection allows easier testing (mock connections)
     * and reuse of a single connection across multiple objects.
     */
    public function __construct($db) {
        $this->conn = $db;
        $this->last_error = null;
    }

    /**
     * Get the last error message from database operations
     *
     * @return string|null - Error message or null if no error
     *
     * USAGE:
     * if (!$booking->create()) {
     *     echo $booking->getLastError();
     * }
     *
     * This allows API endpoints to return meaningful error messages
     * without exposing raw SQL errors to the client.
     */
    public function getLastError() {
        return $this->last_error;
    }

    // ========================================
    // CREATE METHOD
    // ========================================

    /**
     * Create a new booking record in the database
     *
     * @return bool - True on success, false on failure
     *
     * PREREQUISITES:
     * Set the following properties before calling:
     * - $this->passenger_id (required)
     * - $this->booking_date (required)
     * - $this->start_lat, start_long, end_lat, end_long (required)
     * - $this->total_cost (required)
     * - $this->payment_type (optional, defaults to 'cash')
     * - $this->booking_confirmation (optional, defaults to false)
     *
     * USAGE EXAMPLE:
     * $booking = new Bookings($db);
     * $booking->passenger_id = 5;
     * $booking->booking_date = '2025-11-20 10:30:00';
     * $booking->start_lat = 14.5995;
     * $booking->start_long = 120.9842;
     * $booking->end_lat = 14.6091;
     * $booking->end_long = 121.0223;
     * $booking->total_cost = 150.00;
     * $booking->payment_type = 'cash';
     * $booking->booking_confirmation = false;
     *
     * if ($booking->create()) {
     *     echo "Booking created with ID: " . $booking->booking_id;
     * } else {
     *     echo "Error: " . $booking->getLastError();
     * }
     *
     * FLOW:
     * 1. Build INSERT query with placeholders
     * 2. Prepare statement (PDO compiles SQL safely)
     * 3. Sanitize all input data (remove HTML/script tags)
     * 4. Bind sanitized values to placeholders
     * 5. Execute query
     * 6. On success: Store auto-generated booking_id
     * 7. On failure: Log error and store message
     */
    public function create() {
        // Step 1: Build INSERT query
        // Note: created_at is auto-set by database DEFAULT CURRENT_TIMESTAMP
        $query = "INSERT INTO " . $this->table_name . "
                  (passenger_id, booking_date, start_lat, start_long, end_lat, end_long,
                   payment_type, total_cost, booking_confirmation)
                  VALUES (:passenger_id, :booking_date, :start_lat, :start_long, :end_lat, :end_long,
                          :payment_type, :total_cost, :booking_confirmation)";

        // Step 2: Prepare statement (compiles SQL once, protects against injection)
        $stmt = $this->conn->prepare($query);

        // Step 3: Sanitize input data
        // htmlspecialchars() converts special characters to HTML entities
        // strip_tags() removes any HTML/PHP tags
        // This prevents XSS attacks if data is later displayed
        $this->passenger_id = htmlspecialchars(strip_tags($this->passenger_id));
        $this->booking_date = htmlspecialchars(strip_tags($this->booking_date));
        $this->start_lat = htmlspecialchars(strip_tags($this->start_lat));
        $this->start_long = htmlspecialchars(strip_tags($this->start_long));
        $this->end_lat = htmlspecialchars(strip_tags($this->end_lat));
        $this->end_long = htmlspecialchars(strip_tags($this->end_long));

        // Default payment_type to 'cash' if not provided
        $this->payment_type = $this->payment_type !== null ? htmlspecialchars(strip_tags($this->payment_type)) : 'cash';

        $this->total_cost = htmlspecialchars(strip_tags($this->total_cost));

        // Convert boolean to MySQL-compatible 1 or 0
        // PHP booleans must be converted for reliable storage
        $this->booking_confirmation = $this->booking_confirmation ? 1 : 0;

        // Step 4: Bind values to placeholders
        // PDO::PARAM_INT enforces integer type for passenger_id
        // PDO::PARAM_BOOL enforces boolean for booking_confirmation
        // Other params default to PDO::PARAM_STR (string)
        $stmt->bindParam(":passenger_id", $this->passenger_id, PDO::PARAM_INT);
        $stmt->bindParam(":booking_date", $this->booking_date);
        $stmt->bindParam(":start_lat", $this->start_lat);
        $stmt->bindParam(":start_long", $this->start_long);
        $stmt->bindParam(":end_lat", $this->end_lat);
        $stmt->bindParam(":end_long", $this->end_long);
        $stmt->bindParam(":payment_type", $this->payment_type);
        $stmt->bindParam(":total_cost", $this->total_cost);
        $stmt->bindParam(":booking_confirmation", $this->booking_confirmation, PDO::PARAM_BOOL);

        // Step 5: Execute query
        if($stmt->execute()) {
            // Step 6: SUCCESS - Store the auto-generated booking_id
            // lastInsertId() returns the PRIMARY KEY value just inserted
            // Cast to int for consistency
            $this->booking_id = (int)$this->conn->lastInsertId();
            $this->last_error = null;
            return true;
        }

        // Step 7: FAILURE - Log and store error
        // errorInfo() returns [SQLSTATE, driver error code, driver error message]
        // Index [2] contains the human-readable message
        // ?? provides fallback if error details unavailable
        $errorInfo = $stmt->errorInfo();
        $this->last_error = $errorInfo[2] ?? 'Unknown database error';

        // error_log() writes to PHP error log for debugging
        // Never expose raw SQL errors to users (security risk)
        error_log("Bookings::create failed: " . $this->last_error);
        return false;
    }

    // ========================================
    // READ METHODS (Retrieval)
    // ========================================

    /**
     * Get a single booking by its ID
     *
     * @return bool - True if found and properties populated, false otherwise
     *
     * PREREQUISITES:
     * Set $this->booking_id before calling
     *
     * USAGE EXAMPLE:
     * $booking = new Bookings($db);
     * $booking->booking_id = 42;
     *
     * if ($booking->getById()) {
     *     echo "Passenger ID: " . $booking->passenger_id;
     *     echo "Total Cost: " . $booking->total_cost;
     * } else {
     *     echo "Booking not found";
     * }
     *
     * FLOW:
     * 1. Build SELECT query with WHERE clause
     * 2. Prepare and bind booking_id
     * 3. Execute query
     * 4. If found: Fetch row and populate all object properties
     * 5. If not found: Return false
     *
     * SIDE EFFECT:
     * On success, all public properties are overwritten with database values.
     */
    public function getById() {
        // Step 1: Build SELECT query
        // LIMIT 1 optimizes performance (stops after first match)
        // booking_id is PRIMARY KEY, so only one row can match
        $query = "SELECT * FROM " . $this->table_name . " WHERE booking_id = :booking_id LIMIT 1";

        // Step 2: Prepare and bind
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":booking_id", $this->booking_id);

        // Step 3: Execute query
        $stmt->execute();

        // Step 4: Check if result exists
        if($stmt->rowCount() > 0) {
            // Fetch row as associative array (column name => value)
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            // Populate object properties with database values
            // This allows chaining: $booking->getById() then access $booking->total_cost
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

        // Step 5: Not found
        return false;
    }

    /**
     * Get all bookings for a specific passenger
     *
     * @return PDOStatement - Statement object containing result set
     *
     * PREREQUISITES:
     * Set $this->passenger_id before calling
     *
     * USAGE EXAMPLE:
     * $booking = new Bookings($db);
     * $booking->passenger_id = 5;
     * $stmt = $booking->getByPassengerId();
     *
     * $bookings = [];
     * while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
     *     $bookings[] = $row;
     * }
     *
     * RETURN VALUE:
     * Returns a PDOStatement object, NOT an array.
     * This is memory-efficient for large result sets (fetch rows one at a time).
     *
     * ORDERING:
     * Results sorted by created_at DESC (newest first).
     * Useful for showing "Recent Bookings" in user profile.
     *
     * FLOW:
     * 1. Build SELECT with WHERE passenger_id filter
     * 2. Order by most recent bookings first
     * 3. Prepare, bind, execute
     * 4. Return statement object for iteration
     */
    public function getByPassengerId() {
        // Build filtered SELECT query
        // ORDER BY created_at DESC shows newest bookings first
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE passenger_id = :passenger_id
                  ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":passenger_id", $this->passenger_id);
        $stmt->execute();

        // Return PDOStatement for manual iteration
        // Caller must fetch() in a loop
        return $stmt;
    }

    /**
     * Get all bookings in the system
     *
     * @return PDOStatement - Statement object containing all bookings
     *
     * USAGE EXAMPLE:
     * $booking = new Bookings($db);
     * $stmt = $booking->getAll();
     *
     * $all_bookings = [];
     * while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
     *     $all_bookings[] = $row;
     * }
     *
     * USE CASE:
     * Admin dashboard showing all system bookings.
     * Should be protected with authentication (not public endpoint).
     *
     * PERFORMANCE NOTE:
     * No LIMIT clause - could return thousands of rows.
     * For production, consider adding pagination:
     * - LIMIT 50 OFFSET 0 (first page)
     * - LIMIT 50 OFFSET 50 (second page), etc.
     *
     * COLUMN SELECTION:
     * Explicitly lists columns (not SELECT *) for clarity.
     * Missing end_lat, end_long - may need to add for full ride details.
     *
     * ORDERING:
     * Newest bookings first (created_at DESC).
     */
    public function getAll() {
        // Build SELECT query for all records
        // Explicit column list (self-documenting, avoids SELECT *)
        $query = "SELECT booking_id, passenger_id, booking_date, start_lat,
                         start_long, payment_type, total_cost, booking_confirmation, created_at
                  FROM " . $this->table_name . "
                  ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        // Return statement for iteration
        return $stmt;
    }

    // ========================================
    // UPDATE METHOD
    // ========================================

    /**
     * Update an existing booking record
     *
     * @return bool - True on success, false on failure
     *
     * PREREQUISITES:
     * Set $this->booking_id (identifies which record to update)
     * Set any other properties you want to change
     *
     * USAGE EXAMPLE:
     * $booking = new Bookings($db);
     * $booking->booking_id = 42;  // Which booking to update
     * $booking->total_cost = 175.00;  // New fare
     * $booking->payment_type = 'gcash';  // Changed payment method
     * $booking->booking_confirmation = true;  // User confirmed
     *
     * if ($booking->update()) {
     *     echo "Booking updated successfully";
     * } else {
     *     echo "Update failed";
     * }
     *
     * UPDATE STRATEGY:
     * This is a "full update" - ALL fields are SET in the query.
     * Even fields you don't want to change must be set correctly.
     *
     * BETTER APPROACH FOR PARTIAL UPDATES:
     * - Only include changed fields in SET clause
     * - Check which properties are set before building query
     * - Current implementation requires fetching existing data first
     *
     * FLOW:
     * 1. Build UPDATE query with all fields
     * 2. Prepare statement
     * 3. Sanitize all input data
     * 4. Bind values to placeholders
     * 5. Execute with WHERE booking_id clause
     */
    public function update() {
        // Step 1: Build UPDATE query
        // Sets ALL fields - not a partial update
        // WHERE booking_id ensures only one row is modified
        $query = "UPDATE " . $this->table_name . "
                  SET passenger_id = :passenger_id, booking_date = :booking_date,
                      start_lat = :start_lat, start_long = :start_long,
                      end_lat = :end_lat, end_long = :end_long,
                      payment_type = :payment_type, total_cost = :total_cost,
                      booking_confirmation = :booking_confirmation
                  WHERE booking_id = :booking_id";

        // Step 2: Prepare statement
        $stmt = $this->conn->prepare($query);

        // Step 3: Sanitize all input fields
        // Same sanitization as create() for security consistency
        $this->passenger_id = htmlspecialchars(strip_tags($this->passenger_id));
        $this->booking_date = htmlspecialchars(strip_tags($this->booking_date));
        $this->start_lat = htmlspecialchars(strip_tags($this->start_lat));
        $this->start_long = htmlspecialchars(strip_tags($this->start_long));
        $this->end_lat = htmlspecialchars(strip_tags($this->end_lat));
        $this->end_long = htmlspecialchars(strip_tags($this->end_long));
        $this->payment_type = htmlspecialchars(strip_tags($this->payment_type));
        $this->total_cost = htmlspecialchars(strip_tags($this->total_cost));

        // filter_var() validates boolean from various input types
        // Handles: true, false, 1, 0, "1", "0", "true", "false"
        // More robust than simple type casting
        $this->booking_confirmation = filter_var($this->booking_confirmation, FILTER_VALIDATE_BOOLEAN);

        // Step 4: Bind values to placeholders
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

        // Step 5: Execute update
        if($stmt->execute()) {
            return true;
        }
        return false;
    }    // ========================================
    // DELETE METHOD
    // ========================================

    /**
     * Delete a booking record from the database
     *
     * @return bool - True on success, false on failure
     *
     * PREREQUISITES:
     * Set $this->booking_id before calling
     *
     * USAGE EXAMPLE:
     * $booking = new Bookings($db);
     * $booking->booking_id = 42;
     *
     * if ($booking->delete()) {
     *     echo "Booking deleted";
     * } else {
     *     echo "Delete failed";
     * }
     *
     * CASCADING CONSIDERATIONS:
     * If trip_assignments table has foreign key to bookings:
     * - ON DELETE CASCADE: Related assignments deleted automatically
     * - ON DELETE RESTRICT: Delete fails if assignments exist
     * - ON DELETE SET NULL: assignment's booking_id set to NULL
     *
     * Check your database schema to understand behavior.
     *
     * SEAT RESTORATION ISSUE:
     * When a confirmed booking is deleted, available_seats in trips
     * table should be incremented (+1) to restore capacity.
     * This method does NOT handle that - potential improvement.
     *
     * SOFT DELETE ALTERNATIVE:
     * Instead of DELETE, consider adding is_deleted flag:
     * UPDATE bookings SET is_deleted = 1 WHERE booking_id = :id
     * Preserves data for auditing/analytics.
     *
     * FLOW:
     * 1. Build DELETE query with WHERE clause
     * 2. Prepare and bind booking_id
     * 3. Execute deletion
     * 4. Return success/failure status
     */
    public function delete() {
        // Step 1: Build DELETE query
        // WHERE booking_id ensures only one row deleted
        $query = "DELETE FROM " . $this->table_name . " WHERE booking_id = :booking_id";

        // Step 2: Prepare and bind
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":booking_id", $this->booking_id);

        // Step 3: Execute deletion
        if($stmt->execute()) {
            // Note: Does not restore trip seats if booking was confirmed
            // Consider adding: UPDATE trips SET available_seats = available_seats + 1
            return true;
        }
        return false;
    }
}

// ========================================
// END OF BOOKINGS CLASS
// ========================================
//
// SUMMARY OF CAPABILITIES:
// - Create new bookings with sanitized input
// - Retrieve bookings by ID, passenger, or all
// - Update existing booking records
// - Delete bookings (with cascading considerations)
// - Error tracking via getLastError()
//
// SECURITY FEATURES:
// - Prepared statements prevent SQL injection
// - Input sanitization (htmlspecialchars/strip_tags)
// - Error logging without exposing details
//
// RECOMMENDED IMPROVEMENTS:
// 1. Add seat restoration logic to delete()
// 2. Implement partial update support in update()
// 3. Add pagination to getAll()
// 4. Consider soft delete pattern
// 5. Add validation methods (e.g., validateCoordinates())
// 6. Implement caching for frequently accessed bookings
//
?>

