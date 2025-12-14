<?php
/**
 * ============================================================================
 * DRIVER REGISTRATION API - BACKEND HANDLER
 * ============================================================================
 *
 * PURPOSE:
 *   Creates a driver profile for an authenticated user. This endpoint:
 *   - Associates a user with the driver table
 *   - Stores driver license image path
 *   - Creates vehicle profile with seat capacity
 *   - Validates that user exists and isn't already a driver
 *
 * HTTP METHOD: POST
 * ENDPOINT: /Corosa/backend/api/driver/driver-registration-handler.php
 *
 * REQUEST FORMAT (multipart/form-data):
 *   {
 *     "userId": 123,
 *     "email": "driver@slu.edu.ph",
 *     "driverLicenseImage": <file>,
 *     "plateNumber": "ABC 1234",
 *     "vehicleModel": "Honda Civic 2020",
 *     "seatCapacity": 5
 *   }
 *
 * SUCCESS RESPONSE:
 *   {
 *     "success": true,
 *     "driverId": 456,
 *     "vehicleId": "ABC 1234",
 *     "message": "Driver profile created successfully"
 *   }
 *
 * ERROR RESPONSES:
 *   {
 *     "success": false,
 *     "message": "User already registered as driver",
 *     "errors": { "driver": "already_driver" }
 *   }
 *
 * ============================================================================
 */

// Configure response headers
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Error handling
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error [$errno]: $errstr in $errfile on line $errline");
    return true;
});

set_exception_handler(function($exception) {
    error_log("Uncaught Exception: " . $exception->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $exception->getMessage()
    ]);
    exit;
});

// ============================================================================
// STEP 1: Validate request method
// ============================================================================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed"
    ]);
    exit;
}

// ============================================================================
// STEP 2: Get input data
// ============================================================================
$userId = isset($_POST['userId']) ? intval($_POST['userId']) : null;
$email = isset($_POST['email']) ? trim($_POST['email']) : null;
$plateNumber = isset($_POST['plateNumber']) ? strtoupper(trim($_POST['plateNumber'])) : null;
$vehicleModel = isset($_POST['vehicleModel']) ? trim($_POST['vehicleModel']) : null;
$seatCapacity = isset($_POST['seatCapacity']) ? intval($_POST['seatCapacity']) : null;
$driverLicenseFile = isset($_FILES['driverLicenseImage']) ? $_FILES['driverLicenseImage'] : null;

// ============================================================================
// STEP 3: Validate inputs
// ============================================================================
$errors = [];

if (!$userId) {
    $errors['userId'] = 'User ID is required';
}

if (!$email) {
    $errors['email'] = 'Email is required';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Invalid email format';
}

if (!$plateNumber) {
    $errors['plateNumber'] = 'Plate number is required';
}

if (!$vehicleModel) {
    $errors['vehicleModel'] = 'Vehicle model is required';
}

if (!$seatCapacity || $seatCapacity < 2 || $seatCapacity > 8) {
    $errors['seatCapacity'] = 'Valid seat capacity (2-8) is required';
}

// Validate file
if (!$driverLicenseFile || $driverLicenseFile['error'] !== UPLOAD_ERR_OK) {
    $errors['driverLicenseImage'] = 'Driver license image upload failed';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Validation failed",
        "errors" => $errors
    ]);
    exit;
}

// ============================================================================
// STEP 4: Connect to database
// ============================================================================
try {
    // Direct PDO connection
    $dsn = "mysql:host=localhost;port=3306;dbname=corosa_db;charset=utf8mb4";
    $conn = new PDO($dsn, "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    error_log("Database Connection Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $e->getMessage()
    ]);
    exit;
}

// ============================================================================
// STEP 5: Verify user exists
// ============================================================================
try {
    $userCheck = $conn->prepare("SELECT user_id FROM users WHERE user_id = ? AND email = ?");
    $userCheck->execute([$userId, $email]);
    
    if ($userCheck->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "User not found",
            "errors" => ["user" => "not_found"]
        ]);
        exit;
    }
} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database query failed"
    ]);
    exit;
}

// ============================================================================
// STEP 6: Check if user is already a driver
// ============================================================================
try {
    $driverCheck = $conn->prepare("SELECT driver_id FROM driver WHERE user_id = ?");
    $driverCheck->execute([$userId]);
    
    if ($driverCheck->rowCount() > 0) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "User is already registered as a driver",
            "errors" => ["driver" => "already_driver"]
        ]);
        exit;
    }
} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database query failed"
    ]);
    exit;
}

// ============================================================================
// STEP 7: Handle file upload
// ============================================================================
$uploadDir = '../../../assets/driver-licenses/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$fileExt = pathinfo($driverLicenseFile['name'], PATHINFO_EXTENSION);
$allowedExts = ['jpg', 'jpeg', 'png', 'gif'];
$fileExt = strtolower($fileExt);

if (!in_array($fileExt, $allowedExts)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid file type",
        "errors" => ["driverLicenseImage" => "invalid_file_type"]
    ]);
    exit;
}

$fileName = "DL_" . $userId . "_" . time() . "." . $fileExt;
$uploadPath = $uploadDir . $fileName;

if (!move_uploaded_file($driverLicenseFile['tmp_name'], $uploadPath)) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to save driver license image",
        "errors" => ["driverLicenseImage" => "save_failed"]
    ]);
    exit;
}

// ============================================================================
// STEP 8: Create driver record
// ============================================================================
try {
    $driverInsert = $conn->prepare("INSERT INTO driver (user_id, driver_license_image) VALUES (?, ?)");
    $driverInsert->execute([$userId, $fileName]);
    $driverId = $conn->lastInsertId();
} catch (PDOException $e) {
    unlink($uploadPath);
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to create driver profile",
        "errors" => ["driver" => "creation_failed"]
    ]);
    exit;
}

// ============================================================================
// STEP 9: Create vehicle record
// ============================================================================
try {
    $vehicleInsert = $conn->prepare(
        "INSERT INTO vehicle (plate_number, driver_id, vehicle_model, seat_capacity, vehicle_status) 
         VALUES (?, ?, ?, ?, 'available')"
    );
    $vehicleInsert->execute([$plateNumber, $driverId, $vehicleModel, $seatCapacity]);
} catch (PDOException $e) {
    // Delete driver record if vehicle creation fails
    try {
        $conn->prepare("DELETE FROM driver WHERE driver_id = ?")->execute([$driverId]);
    } catch (PDOException $e2) {
        error_log("Cleanup Error: " . $e2->getMessage());
    }
    
    unlink($uploadPath);
    error_log("Database Error: " . $e->getMessage());
    
    // Check if plate number already exists
    if (strpos($e->getMessage(), 'UNIQUE') !== false || strpos($e->getMessage(), 'Duplicate') !== false) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Plate number already registered",
            "errors" => ["plateNumber" => "already_exists"]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Failed to create vehicle profile",
            "errors" => ["vehicle" => "creation_failed"]
        ]);
    }
    exit;
}

// ============================================================================
// STEP 10: Return success response
// ============================================================================
http_response_code(201);
echo json_encode([
    "success" => true,
    "driverId" => $driverId,
    "vehicleId" => $plateNumber,
    "message" => "Driver profile created successfully. You can now log in as a driver."
]);
?>

