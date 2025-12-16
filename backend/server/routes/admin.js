/**
 * Admin API Routes - Node.js Backend
 * Handles admin dashboard data by querying MySQL database directly
 * Acts as a bridge between frontend and the database
 */

const express = require("express");
const mysql = require("mysql2/promise");
const router = express.Router();

// Database connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "corosa_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * GET /api/admin/dashboard
 * Fetch dashboard summary statistics
 */
router.get("/dashboard", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // Get total drivers
    const [drivers] = await conn.query("SELECT COUNT(*) as count FROM driver");
    const totalDrivers = drivers[0]?.count || 0;

    // Get total passengers (users without driver record)
    const [passengers] = await conn.query(
      "SELECT COUNT(DISTINCT u.user_id) as count FROM users u LEFT JOIN driver d ON u.user_id = d.user_id WHERE d.driver_id IS NULL"
    );
    const totalPassengers = passengers[0]?.count || 0;

    // Get total trips
    const [trips] = await conn.query("SELECT COUNT(*) as count FROM trips");
    const totalTrips = trips[0]?.count || 0;

    // Get completed trips
    const [completedTrips] = await conn.query(
      "SELECT COUNT(*) as count FROM trips WHERE ride_status = 'completed'"
    );
    const completedCount = completedTrips[0]?.count || 0;

    // Get total bookings
    const [bookings] = await conn.query("SELECT COUNT(*) as count FROM bookings");
    const totalBookings = bookings[0]?.count || 0;

    conn.release();

    res.json({
      status: "success",
      data: {
        totalDrivers,
        totalPassengers,
        totalTrips,
        completedTrips: completedCount,
        totalBookings,
        activeTrips: totalTrips - completedCount,
      },
    });
  } catch (error) {
    console.error("[Admin] Dashboard error:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching dashboard data",
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/drivers
 * Fetch all registered drivers with their vehicle info
 */
router.get("/drivers", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [drivers] = await conn.query(`
      SELECT 
        d.driver_id,
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.mobile_number,
        d.driver_license_image,
        v.plate_number,
        v.vehicle_model,
        v.seat_capacity,
        v.vehicle_status,
        COUNT(t.trip_id) as total_rides
      FROM driver d
      JOIN users u ON d.user_id = u.user_id
      LEFT JOIN vehicle v ON d.driver_id = v.driver_id
      LEFT JOIN trips t ON d.driver_id = t.driver_id
      GROUP BY d.driver_id, d.user_id, d.driver_license_image, v.plate_number, v.vehicle_model, v.seat_capacity, v.vehicle_status
      ORDER BY u.first_name ASC
    `);

    conn.release();

    res.json({
      status: "success",
      data: drivers,
      count: drivers.length,
    });
  } catch (error) {
    console.error("[Admin] Drivers fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching drivers",
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/passengers
 * Fetch all registered passengers
 */
router.get("/passengers", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [passengers] = await conn.query(`
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.mobile_number,
        u.account_status,
        u.created_at,
        COUNT(b.booking_id) as total_bookings
      FROM users u
      LEFT JOIN driver d ON u.user_id = d.user_id
      LEFT JOIN bookings b ON u.user_id = b.passenger_id
      WHERE d.driver_id IS NULL
      GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.mobile_number, u.account_status, u.created_at
      ORDER BY u.first_name ASC
    `);

    conn.release();

    res.json({
      status: "success",
      data: passengers,
      count: passengers.length,
    });
  } catch (error) {
    console.error("[Admin] Passengers fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching passengers",
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/trips
 * Fetch all trips with driver and booking info
 */
router.get("/trips", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [trips] = await conn.query(`
      SELECT 
        t.trip_id,
        t.driver_id,
        CONCAT(u.first_name, ' ', u.last_name) as driver_name,
        u.email as driver_email,
        t.start_lat,
        t.start_long,
        t.end_lat,
        t.end_long,
        t.available_seats,
        t.ride_status,
        t.created_at,
        COUNT(DISTINCT ta.booking_id) as passenger_count
      FROM trips t
      JOIN driver d ON t.driver_id = d.driver_id
      JOIN users u ON d.user_id = u.user_id
      LEFT JOIN trip_assignment ta ON t.trip_id = ta.trip_id AND ta.assignment_status = 'active'
      GROUP BY t.trip_id, t.driver_id, t.start_lat, t.start_long, t.end_lat, t.end_long, t.available_seats, t.ride_status, t.created_at
      ORDER BY t.created_at DESC
    `);

    conn.release();

    res.json({
      status: "success",
      data: trips,
      count: trips.length,
    });
  } catch (error) {
    console.error("[Admin] Trips fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching trips",
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/bookings
 * Fetch all bookings with passenger and trip info
 */
router.get("/bookings", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [bookings] = await conn.query(`
      SELECT 
        b.booking_id,
        b.passenger_id,
        CONCAT(u.first_name, ' ', u.last_name) as passenger_name,
        u.email as passenger_email,
        b.start_lat,
        b.start_long,
        b.end_lat,
        b.end_long,
        b.payment_type,
        b.total_cost,
        b.booking_confirmation,
        b.created_at,
        ta.trip_id,
        ta.assignment_status
      FROM bookings b
      JOIN users u ON b.passenger_id = u.user_id
      LEFT JOIN trip_assignment ta ON b.booking_id = ta.booking_id
      ORDER BY b.created_at DESC
    `);

    conn.release();

    res.json({
      status: "success",
      data: bookings,
      count: bookings.length,
    });
  } catch (error) {
    console.error("[Admin] Bookings fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching bookings",
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/reviews
 * Fetch all reviews and ratings
 */
router.get("/reviews", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [reviews] = await conn.query(`
      SELECT 
        r.review_id,
        r.booking_id,
        r.rating,
        r.comment,
        r.created_at,
        b.passenger_id,
        CONCAT(u.first_name, ' ', u.last_name) as reviewer_name,
        t.driver_id
      FROM reviews r
      JOIN bookings b ON r.booking_id = b.booking_id
      JOIN users u ON b.passenger_id = u.user_id
      LEFT JOIN trip_assignment ta ON b.booking_id = ta.booking_id
      LEFT JOIN trips t ON ta.trip_id = t.trip_id
      ORDER BY r.created_at DESC
    `);

    conn.release();

    res.json({
      status: "success",
      data: reviews,
      count: reviews.length,
    });
  } catch (error) {
    console.error("[Admin] Reviews fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching reviews",
      error: error.message,
    });
  }
});

module.exports = router;
