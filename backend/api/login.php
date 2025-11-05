<?php
header('Content-Type: application/json; charset=UTF-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once '../config/database.php';
require_once '../classes/User.php';

$raw_input = file_get_contents('php://input');
$data = json_decode($raw_input, true);
if (!$data) {
    echo json_encode([ 'success' => false, 'message' => 'Invalid JSON' ]);
    exit;
}

$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';

if (!$email || !$password) {
    echo json_encode([ 'success' => false, 'message' => 'Email and password required' ]);
    exit;
}

$database = new Database();
$db = $database->getConnection();
$user = new User($db);
$user->email = $email;

if ($user->getByEmail()) {
    // User found, verify password
    if (isset($user->hashed_password) && password_verify($password, $user->hashed_password)) {
        echo json_encode([
            'success' => true,
            'userId' => $user->user_id,
            'message' => 'Logged in'
        ]);
        exit;
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid credentials'
        ]);
        exit;
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid credentials'
    ]);
    exit;
}
