<?php
/*
 * ============================================================================
 * BOOKINGS API ENDPOINT - RESTful API for Booking Operations
 * ============================================================================
 *
 * PURPOSE:
 * This file provides a RESTful API for managing passenger booking records
 * in the Corosa carpooling system.
 *
 * SUPPORTED HTTP METHODS:
 * - GET:    Retrieve booking(s) by ID, passenger ID, or all bookings
 * - POST:   Create a new booking record
 * - PUT:    Update an existing booking record
 * - DELETE: Delete a booking record
 *
 * DATABASE TABLE: bookings
 * - booking_id (PRIMARY KEY, AUTO_INCREMENT)
 * - passenger_id (FOREIGN KEY → users table)
 * - booking_date (TIMESTAMP)
 * - start_lat, start_long (GPS coordinates for pickup)
 * - end_lat, end_long (GPS coordinates for dropoff)
 * - payment_type (e.g., 'cash', 'card')
 * - total_cost (DECIMAL)
 * - booking_confirmation (BOOLEAN)
 * - created_at (TIMESTAMP)
 *
 * USAGE EXAMPLE (from ride-confirmation.js):
 * fetch('/Corosa/backend/api/bookings.php', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *         passenger_id: 123,
 *         start_lat: 16.4023,
 *         start_long: 120.5960,
 *         end_lat: 16.4080,
 *         end_long: 120.5969,
 *         payment_type: 'cash',
 *         total_cost: 70.00,
 *         booking_confirmation: true
 *     })
 * });
 *
 * SECURITY FEATURES:
 * - Input sanitization (htmlspecialchars, strip_tags in Bookings class)
 * - Prepared statements (SQL injection prevention)
 * - JSON validation (checks for required fields)
 *
 * DEPENDENCIES:
 * - Database.php: PDO connection management
 * - Bookings.php: ORM-style class for database operations
 * ============================================================================
 */

// ===========================================================================
// STEP 1: CONFIGURE HTTP RESPONSE HEADERS
// ===========================================================================

/*
 * Set Content-Type header to inform client that response is JSON
 * charset=UTF-8 ensures proper handling of special characters (e.g., ₱, é, ñ)
 */
header("Content-Type: application/json; charset=UTF-8");

/*
 * CORS (Cross-Origin Resource Sharing) Headers
 *
 * Access-Control-Allow-Origin: *
 * - Allows requests from any domain (use specific domain in production)
 * - Enables frontend (localhost:3000) to call backend (localhost:8080)
 *
 * Access-Control-Allow-Methods: GET, POST, PUT, DELETE
 * - Specifies which HTTP methods are permitted
 * - RESTful API standard methods
 *
 * Access-Control-Allow-Headers: ...
 * - Specifies which headers client can send
 * - Content-Type: For JSON data
 * - Authorization: For future token-based authentication
 * - X-Requested-With: Standard AJAX identifier
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// ===========================================================================
// STEP 2: LOAD DEPENDENCIES
// ===========================================================================

/*
 * require_once ensures files are loaded exactly once
 * Prevents "class already defined" errors if file is included multiple times
 */
require_once '../config/database.php';   // Database connection class
require_once '../classes/Bookings.php';  // Bookings model/ORM class

// ===========================================================================
// STEP 3: INITIALIZE DATABASE CONNECTION
// ===========================================================================

/*
 * Create Database instance and get PDO connection
 *
 * PDO (PHP Data Objects):
 * - Database abstraction layer (works with MySQL, PostgreSQL, SQLite, etc.)
 * - Provides prepared statements (prevents SQL injection)
 * - Consistent API across different database systems
 */
$database = new Database();
$db = $database->getConnection();  // Returns PDO object

// ===========================================================================
// STEP 4: INITIALIZE BOOKINGS MODEL
// ===========================================================================

/*
 * Create Bookings instance with database connection
 * This object provides methods like:
 * - create()           : Insert new booking
 * - getById()          : Retrieve booking by ID
 * - getByPassengerId() : Retrieve all bookings for a passenger
 * - getAll()           : Retrieve all bookings
 * - update()           : Modify existing booking
 * - delete()           : Remove booking
 */
$booking = new Bookings($db);

// ===========================================================================
// STEP 5: ROUTE REQUEST BY HTTP METHOD
// ===========================================================================

/*
 * RESTful API Routing:
 * HTTP method determines the operation to perform
 *
 * $_SERVER['REQUEST_METHOD'] contains the HTTP verb:
 * - GET:    Read/retrieve data
 * - POST:   Create new data
 * - PUT:    Update existing data
 * - DELETE: Remove data
 */
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    // =======================================================================
    // GET REQUEST - RETRIEVE BOOKING(S)
    // =======================================================================
    /*
     * GET supports three query patterns:
     *
     * 1. Get specific booking by ID:
     *    GET /bookings.php?booking_id=456
     *
     * 2. Get all bookings for a passenger:
     *    GET /bookings.php?passenger_id=123
     *
     * 3. Get all bookings (admin/reporting):
     *    GET /bookings.php
     *
     * RESPONSE FORMAT:
     * {
     *   "success": true/false,
     *   "message": "...",
     *   "data": {...} or [...]
     * }
     */
    case 'GET':

        // -------------------------------------------------------------------
        // PATTERN 1: Get booking by booking_id
        // -------------------------------------------------------------------
        /*
         * URL: /bookings.php?booking_id=456
         *
         * USAGE: View specific booking details
         * USED BY: ride-status.html, booking history pages
         */
        if(isset($_GET['booking_id'])) {
            // Set booking_id property
            $booking->booking_id = $_GET['booking_id'];

            /*
             * Call getById() method from Bookings class
             *
             * WHAT HAPPENS:
             * 1. Executes: SELECT * FROM bookings WHERE booking_id = ?
             * 2. Uses prepared statement (SQL injection safe)
             * 3. Populates $booking object properties with results
             * 4. Returns true if found, false if not
             */
            if($booking->getById()) {
                // Success: Booking found, return all data
                echo json_encode(array(
                    "success" => true,
                    "message" => "Booking retrieved successfully",
                    "data" => array(
                        "booking_id" => $booking->booking_id,
                        "passenger_id" => $booking->passenger_id,
                        "booking_date" => $booking->booking_date,
                        "start_lat" => $booking->start_lat,
                        "start_long" => $booking->start_long,
                        "end_lat" => $booking->end_lat,
                        "end_long" => $booking->end_long,
                        "payment_type" => $booking->payment_type,
                        "total_cost" => $booking->total_cost,
                        "booking_confirmation" => $booking->booking_confirmation,
                        "created_at" => $booking->created_at
                    )
                ));
            } else {
                // Failure: Booking not found or database error
                echo json_encode(array(
                    "success" => false,
                    "message" => "Booking not found"
                ));
            }

        // -------------------------------------------------------------------
        // PATTERN 2: Get all bookings for a passenger
        // -------------------------------------------------------------------
        /*
         * URL: /bookings.php?passenger_id=123
         *
         * USAGE: Display user's booking history
         * USED BY: user-profile.html, booking history page
         * RETURNS: Array of booking objects
         */
        } else if(isset($_GET['passenger_id'])) {
            // Set passenger_id property
            $booking->passenger_id = $_GET['passenger_id'];

            /*
             * Call getByPassengerId() method
             *
             * WHAT HAPPENS:
             * 1. Executes: SELECT * FROM bookings WHERE passenger_id = ? ORDER BY created_at DESC
             * 2. Returns PDOStatement object (not array yet)
             * 3. Must fetch rows manually
             */
            $stmt = $booking->getByPassengerId();
            $bookings = array();  // Initialize empty array for results

            /*
             * Fetch all rows from result set
             *
             * PDO::FETCH_ASSOC returns associative array:
             * ['booking_id' => 456, 'passenger_id' => 123, ...]
             *
             * while() loop continues until no more rows
             */
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $bookings[] = $row;  // Add row to results array
            }

            // Return array of bookings
            echo json_encode(array(
                "success" => true,
                "message" => "Bookings retrieved successfully",
                "data" => $bookings  // Array of booking objects
            ));

        // -------------------------------------------------------------------
        // PATTERN 3: Get all bookings (no filters)
        // -------------------------------------------------------------------
        /*
         * URL: /bookings.php
         *
         * USAGE: Admin dashboard, reporting, analytics
         * WARNING: Can return large datasets, consider adding pagination
         * RETURNS: Array of all booking objects
         */
        } else {
            /*
             * Call getAll() method
             *
             * WHAT HAPPENS:
             * 1. Executes: SELECT * FROM bookings ORDER BY created_at DESC
             * 2. No WHERE clause - returns ALL bookings
             * 3. Returns PDOStatement object
             */
            $stmt = $booking->getAll();
            $bookings = array();

            // Fetch all rows
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $bookings[] = $row;
            }

            // Return complete list of bookings
            echo json_encode(array(
                "success" => true,
                "message" => "Bookings retrieved successfully",
                "data" => $bookings
            ));
        }
        break;

    // =======================================================================
    // POST REQUEST - CREATE NEW BOOKING
    // =======================================================================
    /*
     * Creates a new booking record in the database
     *
     * REQUEST BODY (JSON):
     * {
     *   "passenger_id": 123,           // REQUIRED
     *   "start_lat": 16.4023,          // REQUIRED (pickup latitude)
     *   "start_long": 120.5960,        // REQUIRED (pickup longitude)
     *   "end_lat": 16.4080,            // REQUIRED (dropoff latitude)
     *   "end_long": 120.5969,          // REQUIRED (dropoff longitude)
     *   "booking_date": "2025-11-18 14:30:00",  // Optional (defaults to now)
     *   "payment_type": "cash",        // Optional (defaults to 'cash')
     *   "total_cost": 70.00,           // Optional (defaults to 0)
     *   "booking_confirmation": true   // Optional (defaults to false)
     * }
     *
     * SUCCESS RESPONSE:
     * {
     *   "success": true,
     *   "message": "Booking created successfully",
     *   "data": { "booking_id": 456 }
     * }
     *
     * ERROR RESPONSE:
     * {
     *   "success": false,
     *   "message": "Missing required fields (...)",
     *   "debug": "MySQL error message..."  // Only included on database errors
     * }
     *
     * CALLED BY: ride-confirmation.js (confirmRide function)
     */
    case 'POST':

        // -------------------------------------------------------------------
        // STEP 1: Read and parse JSON request body
        // -------------------------------------------------------------------
        /*
         * php://input is a read-only stream of raw HTTP request body
         * file_get_contents() reads the entire stream as string
         * json_decode() converts JSON string to PHP object
         *
         * EXAMPLE:
         * Input: '{"passenger_id":123,"start_lat":16.4023}'
         * Output: stdClass Object with properties passenger_id, start_lat
         */
        $data = json_decode(file_get_contents("php://input"));

        // -------------------------------------------------------------------
        // STEP 2: Validate required fields
        // -------------------------------------------------------------------
        /*
         * REQUIRED FIELDS:
         * - passenger_id: Links to users table (foreign key)
         * - start_lat/start_long: Pickup GPS coordinates
         * - end_lat/end_long: Dropoff GPS coordinates
         *
         * !empty() checks if value exists AND is not:
         * - null
         * - empty string ""
         * - 0 (number zero)
         * - false
         *
         * NOTE: Coordinates can be 0 (equator/prime meridian) but unlikely in real use
         */
        if(!empty($data->passenger_id) && !empty($data->start_lat) && !empty($data->start_long)
        && !empty($data->end_lat) && !empty($data->end_long)) {

            // ---------------------------------------------------------------
            // STEP 3: Set booking properties with defaults for optional fields
            // ---------------------------------------------------------------

            // REQUIRED fields
            $booking->passenger_id = $data->passenger_id;
            $booking->start_lat = $data->start_lat;
            $booking->start_long = $data->start_long;
            $booking->end_lat = $data->end_lat;
            $booking->end_long = $data->end_long;

            /*
             * OPTIONAL fields with defaults
             *
             * NULL COALESCING OPERATOR (??):
             * $a ?? $b means "use $a if it exists and is not null, otherwise use $b"
             *
             * EXAMPLES:
             * $data->booking_date ?? date('Y-m-d H:i:s')
             * - If client sends booking_date: use it
             * - If not: use current server timestamp
             */
            $booking->booking_date = $data->booking_date ?? date('Y-m-d H:i:s');
            $booking->payment_type = $data->payment_type ?? 'cash';
            $booking->total_cost = $data->total_cost ?? 0;
            $booking->booking_confirmation = $data->booking_confirmation ?? false;

            // ---------------------------------------------------------------
            // STEP 4: Attempt to create booking in database
            // ---------------------------------------------------------------
            /*
             * Call create() method from Bookings class
             *
             * WHAT HAPPENS INSIDE create():
             * 1. Sanitize input (htmlspecialchars, strip_tags)
             * 2. Prepare SQL: INSERT INTO bookings (...) VALUES (?, ?, ...)
             * 3. Bind parameters (prevents SQL injection)
             * 4. Execute query
             * 5. Get auto-generated booking_id using lastInsertId()
             * 6. Return true on success, false on failure
             */
            if($booking->create()) {
                // SUCCESS: Booking created
                /*
                 * Return booking_id so client can:
                 * - Store in sessionStorage
                 * - Use for trip_assignment creation
                 * - Display confirmation message
                 */
                echo json_encode(array(
                    "success" => true,
                    "message" => "Booking created successfully",
                    "data" => array("booking_id" => $booking->booking_id)
                ));
            } else {
                // FAILURE: Database error occurred
                /*
                 * Include debug info for troubleshooting
                 *
                 * POSSIBLE ERRORS:
                 * - Invalid passenger_id (foreign key constraint)
                 * - Database connection lost
                 * - Table doesn't exist
                 * - Permission denied
                 *
                 * getLastError() returns PDO error message
                 */
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to create booking",
                    "debug" => $booking->getLastError()
                ));
            }
        } else {
            // ---------------------------------------------------------------
            // VALIDATION FAILED: Missing required fields
            // ---------------------------------------------------------------
            /*
             * Client didn't send all required data
             *
             * SECURITY BENEFIT:
             * - Reject invalid requests early (before database access)
             * - Reduces database load
             * - Prevents partial/corrupted records
             */
            echo json_encode(array(
                "success" => false,
                "message" => "Missing required fields (passenger_id, start_lat, start_long, end_lat, end_long)"
            ));
        }
        break;

    // =======================================================================
    // PUT REQUEST - UPDATE EXISTING BOOKING
    // =======================================================================
    /*
     * Updates an existing booking record
     *
     * REQUEST BODY (JSON):
     * {
     *   "booking_id": 456,             // REQUIRED
     *   "passenger_id": 123,           // Optional
     *   "booking_date": "2025-11-18",  // Optional
     *   "start_lat": 16.4023,          // Optional
     *   "start_long": 120.5960,        // Optional
     *   "end_lat": 16.4080,            // Optional
     *   "end_long": 120.5969,          // Optional
     *   "payment_type": "card",        // Optional
     *   "total_cost": 80.00,           // Optional
     *   "booking_confirmation": true   // Optional
     * }
     *
     * NOTE: Only booking_id is required. Other fields are optional.
     *       Empty string '' means "don't update this field"
     *
     * USE CASES:
     * - Change pickup/dropoff locations
     * - Update payment method
     * - Adjust total cost
     * - Confirm/unconfirm booking
     *
     * SUCCESS RESPONSE:
     * {
     *   "success": true,
     *   "message": "Booking updated successfully"
     * }
     */
    case 'PUT':

        // -------------------------------------------------------------------
        // STEP 1: Read and parse JSON request body
        // -------------------------------------------------------------------
        $data = json_decode(file_get_contents("php://input"));

        // -------------------------------------------------------------------
        // STEP 2: Validate booking_id is provided
        // -------------------------------------------------------------------
        /*
         * booking_id is required to identify which record to update
         *
         * Without booking_id:
         * - Can't determine which record to modify
         * - Could accidentally update wrong record
         * - SQL would fail (WHERE booking_id = ? with no value)
         */
        if(!empty($data->booking_id)) {

            // ---------------------------------------------------------------
            // STEP 3: Set properties (with empty string defaults for unchanged)
            // ---------------------------------------------------------------
            /*
             * UPDATE LOGIC:
             * - If field is provided in JSON: use new value
             * - If field is NOT provided: use '' (empty string)
             * - Empty string tells update() method to skip that field
             *
             * This allows partial updates:
             * - Client only sends fields that changed
             * - Other fields remain unchanged in database
             */
            $booking->booking_id = $data->booking_id;
            $booking->passenger_id = $data->passenger_id ?? '';
            $booking->booking_date = $data->booking_date ?? '';
            $booking->start_lat = $data->start_lat ?? '';
            $booking->start_long = $data->start_long ?? '';
            $booking->end_lat = $data->end_lat ?? '';
            $booking->end_long = $data->end_long ?? '';
            $booking->payment_type = $data->payment_type ?? '';
            $booking->total_cost = $data->total_cost ?? 0;
            $booking->booking_confirmation = $data->booking_confirmation ?? false;

            // ---------------------------------------------------------------
            // STEP 4: Attempt to update booking in database
            // ---------------------------------------------------------------
            /*
             * Call update() method from Bookings class
             *
             * WHAT HAPPENS INSIDE update():
             * 1. Build UPDATE query with only non-empty fields
             * 2. Example: UPDATE bookings SET payment_type = ? WHERE booking_id = ?
             * 3. Bind parameters
             * 4. Execute query
             * 5. Return true if rows affected > 0, false otherwise
             */
            if($booking->update()) {
                // SUCCESS: Booking updated
                echo json_encode(array(
                    "success" => true,
                    "message" => "Booking updated successfully"
                ));
            } else {
                // FAILURE: No rows updated or database error
                /*
                 * POSSIBLE REASONS:
                 * - booking_id doesn't exist
                 * - No fields actually changed (UPDATE has no effect)
                 * - Database connection lost
                 * - Permission denied
                 */
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to update booking"
                ));
            }
        } else {
            // ---------------------------------------------------------------
            // VALIDATION FAILED: Missing booking_id
            // ---------------------------------------------------------------
            echo json_encode(array(
                "success" => false,
                "message" => "Booking ID is required"
            ));
        }
        break;

    // =======================================================================
    // DELETE REQUEST - REMOVE BOOKING
    // =======================================================================
    /*
     * Deletes a booking record from the database
     *
     * REQUEST FORMAT:
     * DELETE /bookings.php?booking_id=456
     *
     * IMPORTANT: booking_id must be in query string, not request body
     * (DELETE requests typically don't have a body)
     *
     * USE CASES:
     * - User cancels their booking
     * - Admin removes invalid/test bookings
     * - Cleanup of old/expired bookings
     *
     * SIDE EFFECTS:
     * - Related trip_assignment records may be deleted (CASCADE)
     * - Available seats in trips table should be incremented (not automatic)
     *
     * SUCCESS RESPONSE:
     * {
     *   "success": true,
     *   "message": "Booking deleted successfully"
     * }
     */
    case 'DELETE':

        // -------------------------------------------------------------------
        // STEP 1: Validate booking_id is provided in query string
        // -------------------------------------------------------------------
        /*
         * isset() checks if variable exists (not null)
         *
         * $_GET['booking_id'] comes from URL:
         * /bookings.php?booking_id=456
         */
        if(isset($_GET['booking_id'])) {
            // Set booking_id property
            $booking->booking_id = $_GET['booking_id'];

            // ---------------------------------------------------------------
            // STEP 2: Attempt to delete booking from database
            // ---------------------------------------------------------------
            /*
             * Call delete() method from Bookings class
             *
             * WHAT HAPPENS INSIDE delete():
             * 1. Prepare SQL: DELETE FROM bookings WHERE booking_id = ?
             * 2. Bind parameter
             * 3. Execute query
             * 4. Return true if rows affected > 0, false otherwise
             *
             * DATABASE CASCADING:
             * If foreign key constraints are set with ON DELETE CASCADE:
             * - Related trip_assignment records are automatically deleted
             * - This prevents orphaned records in trip_assignment table
             *
             * NOTE: Current implementation doesn't restore available_seats
             *       Consider adding seat restoration logic for production
             */
            if($booking->delete()) {
                // SUCCESS: Booking deleted
                echo json_encode(array(
                    "success" => true,
                    "message" => "Booking deleted successfully"
                ));
            } else {
                // FAILURE: Delete failed
                /*
                 * POSSIBLE REASONS:
                 * - booking_id doesn't exist (nothing to delete)
                 * - Database connection lost
                 * - Permission denied
                 * - Foreign key constraint prevents deletion
                 */
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to delete booking"
                ));
            }
        } else {
            // ---------------------------------------------------------------
            // VALIDATION FAILED: Missing booking_id
            // ---------------------------------------------------------------
            echo json_encode(array(
                "success" => false,
                "message" => "Booking ID is required"
            ));
        }
        break;

    // =======================================================================
    // DEFAULT CASE - UNSUPPORTED HTTP METHOD
    // =======================================================================
    /*
     * Handles any HTTP method not explicitly supported
     *
     * EXAMPLES OF UNSUPPORTED METHODS:
     * - PATCH: Partial update (similar to PUT)
     * - HEAD: Metadata only
     * - OPTIONS: CORS preflight
     * - CONNECT, TRACE: Rarely used
     *
     * RESPONSE:
     * {
     *   "success": false,
     *   "message": "Method not allowed"
     * }
     */
    default:
        echo json_encode(array(
            "success" => false,
            "message" => "Method not allowed"
        ));
        break;
}

/*
 * ============================================================================
 * END OF API ENDPOINT
 * ============================================================================
 *
 * SUMMARY:
 * This file provides complete CRUD operations for bookings:
 * - CREATE: POST with required fields
 * - READ:   GET by ID, by passenger, or all
 * - UPDATE: PUT with booking_id + optional fields
 * - DELETE: DELETE with booking_id in query string
 *
 * SECURITY FEATURES:
 * ✅ JSON validation
 * ✅ Required field checking
 * ✅ Prepared statements (SQL injection prevention)
 * ✅ Input sanitization (in Bookings class)
 * ✅ CORS headers for cross-origin requests
 *
 * IMPROVEMENTS FOR PRODUCTION:
 * - Add authentication/authorization checks
 * - Implement rate limiting
 * - Add request logging
 * - Return seat to trip on DELETE
 * - Add pagination for GET all
 * - Validate GPS coordinates range
 * - Add API versioning
 * ============================================================================
 */
?>


