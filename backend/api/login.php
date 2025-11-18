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

// Enable error display for debugging (DISABLE in production!)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// ============================================================================
// STEP 2: Load required dependencies
// ============================================================================
// Database class handles PostgreSQL/MySQL connection
require_once '../config/database.php';

// User class contains methods for querying user data
require_once '../classes/User.php';

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
$database = new Database();
$db = $database->getConnection();

// ============================================================================
// STEP 7: Initialize User object and query database
// ============================================================================
// Create User instance with database connection
$user = new User($db);

// Set the email we're searching for
$user->email = $email;

// ============================================================================
// STEP 8: Attempt to find user by email
// ============================================================================
// getByEmail() queries the database: SELECT * FROM users WHERE email = ?
// Returns true if user found, false if not found
// If found, user properties are populated (user_id, hashed_password, etc.)
if ($user->getByEmail()) {

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

        // Return success response with user ID
        // Frontend will store this in localStorage and sessionStorage
        echo json_encode([
            'success' => true,
            'userId' => $user->user_id,
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
