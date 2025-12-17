<?php
/**
 * Corosa API endpoint for Reviews
 * This file handles review-related operations with PostgreSQL
 */

// Set headers for JSON response and CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include database configuration and Reviews class
require_once '../../../config/database.php';
require_once '../../../classes/shared/php/Reviews.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

// Initialize Reviews object
$review = new Reviews($db);

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Check if review_id is provided in query string
        if(isset($_GET['review_id'])) {
            // Get review by ID
            $review->review_id = $_GET['review_id'];
            
            if($review->getById()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Review retrieved successfully",
                    "data" => array(
                        "review_id" => $review->review_id,
                        "booking_id" => $review->booking_id,
                        "rating" => $review->rating,
                        "comment" => $review->comment,
                        "created_at" => $review->created_at
                    )
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Review not found"
                ));
            }
        } else if(isset($_GET['booking_id'])) {
            // Get all reviews for a booking
            $review->booking_id = $_GET['booking_id'];
            $stmt = $review->getByBookingId();
            $reviews = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $reviews[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Reviews retrieved successfully",
                "data" => $reviews
            ));
        } else {
            // Get all reviews
            $stmt = $review->getAll();
            $reviews = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $reviews[] = $row;
            }
            
            echo json_encode(array(
                "success" => true,
                "message" => "Reviews retrieved successfully",
                "data" => $reviews
            ));
        }
        break;
        
    case 'POST':
        // Create new review
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->booking_id) && !empty($data->rating)) {
            $review->booking_id = $data->booking_id;
            $review->rating = $data->rating;
            $review->comment = $data->comment ?? '';
            
            if($review->create()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Review created successfully",
                    "data" => array("review_id" => $review->review_id)
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to create review"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Missing required fields (booking_id, rating)"
            ));
        }
        break;
        
    case 'PUT':
        // Update review
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->review_id)) {
            $review->review_id = $data->review_id;
            $review->booking_id = $data->booking_id ?? '';
            $review->rating = $data->rating ?? 0;
            $review->comment = $data->comment ?? '';
            
            if($review->update()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Review updated successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to update review"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Review ID is required"
            ));
        }
        break;
        
    case 'DELETE':
        // Delete review
        if(isset($_GET['review_id'])) {
            $review->review_id = $_GET['review_id'];
            
            if($review->delete()) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Review deleted successfully"
                ));
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Failed to delete review"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Review ID is required"
            ));
        }
        break;
        
    default:
        echo json_encode(array(
            "success" => false,
            "message" => "Method not allowed"
        ));
        break;
}
?>

