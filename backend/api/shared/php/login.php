<?php
/**
 * ============================================================================
 * COROSA LOGIN API - BACKEND AUTHENTICATION HANDLER
 * ============================================================================
 *
 * PURPOSE:
 *   Authenticates users by verifying their email and password against the
 *   database. Returns user information if credentials are valid.
 *
 * HTTP METHOD: POST
 * ENDPOINT: /Corosa/backend/api/login.php
 *
 * REQUEST FORMAT (JSON):
 *   {
 *     "email": "user@slu.edu.ph",
 *     "password": "userPassword123"
 *   }
 *
 * SUCCESS RESPONSE:
 *   {
 *     "success": true,
 *     "userId": 123,
 *     "message": "Logged in"
 *   }
 *
 * ERROR RESPONSES:
 *   {
 *     "success": false,
 *     "message": "Invalid credentials"      // Wrong email or password
 *   }
 *   {
 *     "success": false,
 *     "message": "Email and password required"  // Missing fields
 *   }
 *   {
 *     "success": false,
 *     "message": "Invalid JSON"              // Malformed request
 *   }
 *
 * ============================================================================
 * SECURITY FEATURES
 * ============================================================================
 *
 * 1. PASSWORD HASHING:
 *    - Passwords are stored using PHP's password_hash() with bcrypt
 *    - Never store plain text passwords in database
 *    - password_verify() checks submitted password against hash
 *
 * 2. NO INFORMATION LEAKAGE:
 *    - Same error message for "user not found" and "wrong password"
 *    - Prevents attackers from knowing which emails are registered
 *
 * 3. INPUT SANITIZATION:
 *    - trim() removes whitespace from email
 *    - PDO prepared statements prevent SQL injection
 *
 * 4. PRODUCTION CONSIDERATIONS:
 *    - Use HTTPS/TLS to encrypt data in transit
 *    - Consider rate limiting to prevent brute force attacks
 *    - Implement session tokens or JWT for authenticated requests
 *    - Log failed login attempts for security monitoring
 *
 * ============================================================================
 */

// ============================================================================
// STEP 1: Configure response headers
// ============================================================================
// Tell the client we're sending JSON data (not HTML)
header('Content-Type: application/json; charset=UTF-8');

// Enable CORS for local development (localhost)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests (browsers send OPTIONS before POST)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Enable error display for debugging (DISABLE in production!)
ini_set('display_errors', 0);  // Don't display errors as HTML
ini_set('log_errors', 1);       // Log errors instead
error_reporting(E_ALL);

// Set error handler to catch all errors and log them
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error [$errno]: $errstr in $errfile on line $errline");
    // Return true to prevent default error handling
    return true;
});

// Set exception handler to catch uncaught exceptions
set_exception_handler(function($exception) {
    error_log("Uncaught Exception: " . $exception->getMessage() . " in " . $exception->getFile() . " on line " . $exception->getLine());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred. Check server logs for details.'
    ]);
    exit;
});

// ============================================================================
// STEP 2: Load required dependencies
// ============================================================================
// Database class handles PostgreSQL/MySQL connection
try {
    require_once '../../../config/database.php';
} catch (Exception $e) {
    error_log("Failed to load database.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load database configuration'
    ]);
    exit;
}

// User class contains methods for querying user data
try {
    require_once '../../../classes/shared/php/User.php';
} catch (Exception $e) {
    error_log("Failed to load User.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load user class'
    ]);
    exit;
}

// ============================================================================
// STEP 3: Read and parse incoming request
// ============================================================================
// file_get_contents('php://input') reads raw POST data
// This is necessary because we're receiving JSON (not standard form data)
$raw_input = file_get_contents('php://input');

// json_decode() converts JSON string to PHP associative array
// Second parameter 'true' means return array (not object)
$data = json_decode($raw_input, true);

// Validate that we received valid JSON
if (!$data) {
    echo json_encode([ 'success' => false, 'message' => 'Invalid JSON' ]);
    exit;  // Stop execution - don't process invalid requests
}

$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';

if (!$email || !$password) {
    echo json_encode([ 'success' => false, 'message' => 'Email and password required' ]);
    exit;
}

// ============================================================================
// STEP 6: Establish database connection
// ============================================================================
// Create new Database instance and get PDO connection object
try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Database connection returned null");
    }
} catch (Exception $e) {
    error_log("Database connection error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed. Ensure MySQL is running and corosa_db exists.'
    ]);
    exit;
}

// ============================================================================
// STEP 7: Initialize User object and query database
// ============================================================================
// Create User instance with database connection
try {
    $user = new User($db);
} catch (Exception $e) {
    error_log("User initialization error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'User class initialization failed'
    ]);
    exit;
}

// Set the email we're searching for
$user->email = $email;

// ============================================================================
// STEP 8: Attempt to find user by email
// ============================================================================
// getByEmail() queries the database: SELECT * FROM users WHERE email = ?
// Returns true if user found, false if not found
// If found, user properties are populated (user_id, hashed_password, etc.)
try {
    $userFound = $user->getByEmail();
} catch (Exception $e) {
    error_log("Query error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database query failed'
    ]);
    exit;
}

if ($userFound) {

    // --------------------------------------------------------------------------
    // User exists in database - now verify the password
    // --------------------------------------------------------------------------

    // ========================================================================
    // PASSWORD VERIFICATION PROCESS
    // ========================================================================
    //
    // HOW PASSWORD HASHING WORKS:
    //
    // 1. DURING SIGNUP (not shown in this file):
    //    User password: "myPassword123"
    //    password_hash("myPassword123") → "$2y$10$abcd1234..." (bcrypt hash)
    //    Stored in database: "$2y$10$abcd1234..."
    //
    // 2. DURING LOGIN (this file):
    //    User submits: "myPassword123"
    //    password_verify("myPassword123", "$2y$10$abcd1234...") → true/false
    //
    // KEY POINTS:
    //    - Hash is one-way (can't reverse to get original password)
    //    - Same password produces different hashes each time (salt is random)
    //    - password_verify() can still match them correctly
    //    - This is why we don't compare passwords directly!
    //
    // SECURITY BENEFIT:
    //    - If database is stolen, attackers can't get actual passwords
    //    - Even database admins can't see user passwords
    //
    // ========================================================================

    if (isset($user->hashed_password) && password_verify($password, $user->hashed_password)) {
        // ----------------------------------------------------------------------
        // SUCCESS: Password matches!
        // ----------------------------------------------------------------------

        // Determine user role (check if they're a driver)
        $role = 'passenger'; // Default role
        try {
            $checkDriverQuery = "SELECT driver_id FROM driver WHERE user_id = ?";
            $checkDriverStmt = $db->prepare($checkDriverQuery);
            $checkDriverStmt->execute([$user->user_id]);
            if ($checkDriverStmt->rowCount() > 0) {
                $role = 'driver';
            }
        } catch (Exception $e) {
            error_log("Role check error: " . $e->getMessage());
            // Default to passenger if role check fails
            $role = 'passenger';
        }

        // Return success response with user ID and role
        // Frontend will store this in localStorage and sessionStorage
        echo json_encode([
            'success' => true,
            'userId' => $user->user_id,
            'role' => $role,
            'message' => 'Logged in'

            // OPTIONAL FIELDS you could add:
            // 'firstName' => $user->first_name,
            // 'lastName' => $user->last_name,
            // 'token' => generateJWT($user->user_id),  // If using JWT
        ]);
        exit;

    } else {
        // ----------------------------------------------------------------------
        // FAILURE: Password does NOT match
        // ----------------------------------------------------------------------

        // SECURITY NOTE: We return "Invalid credentials" (generic message)
        // We DON'T say "password is wrong" because that tells attackers
        // the email exists in our system
        echo json_encode([
            'success' => false,
            'message' => 'Invalid credentials'
        ]);
        exit;
    }

} else {
    // --------------------------------------------------------------------------
    // User NOT found in database
    // --------------------------------------------------------------------------

    // SECURITY NOTE: Same generic error message as wrong password
    // This prevents attackers from discovering which emails are registered
    // They can't tell the difference between:
    //   - Email doesn't exist
    //   - Email exists but password is wrong
    echo json_encode([
        'success' => false,
        'message' => 'Invalid credentials'
    ]);
    exit;
}

// ============================================================================
// END OF LOGIN HANDLER
// ============================================================================
//
// FLOW SUMMARY:
// 1. Receive JSON request with email and password
// 2. Validate JSON is properly formatted
// 3. Extract and sanitize email and password
// 4. Check that both fields are provided
// 5. Connect to database
// 6. Query database for user with that email
// 7. If user found:
//    - Verify password using password_verify()
//    - If match: Return success with userId
//    - If no match: Return "Invalid credentials"
// 8. If user not found:
//    - Return "Invalid credentials" (same message for security)
//
// ============================================================================
