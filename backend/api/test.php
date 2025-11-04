<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

echo json_encode([
    'status' => 'ok',
    'message' => 'API endpoint is reachable',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>