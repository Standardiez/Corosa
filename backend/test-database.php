<?php
/**
 * Database Connection Test Script for PostgreSQL
 * This script tests if the database connection is working properly
 * 
 * Usage: 
 *   - Via browser: http://localhost:8000/backend/test-database.php
 *   - Via command line: php test-database.php
 */

// Set headers for JSON response
header("Content-Type: application/json; charset=UTF-8");

// Include database configuration
require_once 'config/database.php';

function testDatabaseConnection() {
    $results = array(
        'database_connection' => false,
        'database_config' => array(),
        'tables' => array(),
        'sample_data' => array(),
        'errors' => array()
    );

    try {
        // Test database connection
        $database = new Database();
        $db = $database->getConnection();

        if ($db) {
            $results['database_connection'] = true;
            
            // Get database configuration (without sensitive data)
            $results['database_config'] = array(
                'host' => 'localhost',
                'port' => '5432',
                'database' => 'corosa_db',
                'status' => 'Connected'
            );

            // Test query: Get all table names
            $query = "SELECT table_name 
                      FROM information_schema.tables 
                      WHERE table_schema = 'public' 
                      ORDER BY table_name";
            $stmt = $db->query($query);
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $results['tables'] = $tables;

            // Test query: Get row counts for each table
            $tableCounts = array();
            foreach ($tables as $table) {
                try {
                    $countQuery = "SELECT COUNT(*) FROM \"$table\"";
                    $countStmt = $db->query($countQuery);
                    $count = $countStmt->fetchColumn();
                    $tableCounts[$table] = (int)$count;
                } catch (PDOException $e) {
                    $tableCounts[$table] = "Error: " . $e->getMessage();
                }
            }
            $results['table_counts'] = $tableCounts;

            // Test query: Get sample data from key tables
            $sampleQueries = array(
                'users' => 'SELECT user_id, first_name, last_name, email, account_status FROM "user" LIMIT 3',
                'trips' => 'SELECT trip_id, driver_id, start_lat, start_long, end_lat, end_long, available_seats FROM trip LIMIT 3',
                'drivers' => 'SELECT driver_id, user_id FROM driver LIMIT 3',
                'vehicles' => 'SELECT plate_number, driver_id, vehicle_model, seat_capacity FROM vehicle LIMIT 3',
                'bookings' => 'SELECT booking_id, passenger_id,  start_lat, start_long, end_lat, end_long, total_cost FROM bookings LIMIT 3'
            );

            foreach ($sampleQueries as $key => $query) {
                try {
                    $stmt = $db->query($query);
                    $results['sample_data'][$key] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (PDOException $e) {
                    $results['sample_data'][$key] = "Error: " . $e->getMessage();
                }
            }

            // Test query: Check if foreign key relationships work
            $fkTest = "SELECT 
                        t.trip_id,  
                        t.start_loc,
                        t.start_long,
                        t.end_lat,
                        t.end_long,
                        d.driver_id,
                        u.first_name || ' ' || u.last_name as driver_name,
                        v.vehicle_model,
                        v.plate_number
                      FROM trip t
                      LEFT JOIN driver d ON t.driver_id = d.driver_id
                      LEFT JOIN \"user\" u ON d.user_id = u.user_id
                      LEFT JOIN vehicle v ON v.driver_id = d.driver_id
                      LIMIT 3";
            
            try {
                $stmt = $db->query($fkTest);
                $results['join_test'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                $results['join_test'] = "Error: " . $e->getMessage();
            }

            echo json_encode(array(
                'success' => true,
                'message' => 'Database connection successful!',
                'results' => $results
            ), JSON_PRETTY_PRINT);

        } else {
            $results['errors'][] = 'Failed to establish database connection';
            echo json_encode(array(
                'success' => false,
                'message' => 'Database connection failed',
                'results' => $results
            ), JSON_PRETTY_PRINT);
        }

    } catch (PDOException $exception) {
        $results['errors'][] = $exception->getMessage();
        echo json_encode(array(
            'success' => false,
            'message' => 'Database connection error',
            'error' => $exception->getMessage(),
            'results' => $results
        ), JSON_PRETTY_PRINT);
    } catch (Exception $exception) {
        $results['errors'][] = $exception->getMessage();
        echo json_encode(array(
            'success' => false,
            'message' => 'General error',
            'error' => $exception->getMessage(),
            'results' => $results
        ), JSON_PRETTY_PRINT);
    }
}

// Run the test
testDatabaseConnection();
?>

