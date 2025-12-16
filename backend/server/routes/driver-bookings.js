/**
 * DRIVER BOOKING REQUESTS API - NODE.JS
 * Handles booking requests for driver's rides
 *
 * Endpoints:
 * GET    /api/driver/bookings/:driverId - Get all booking requests for driver
 * POST   /api/driver/bookings/:bookingId/accept - Accept booking
 * POST   /api/driver/bookings/:bookingId/reject - Reject booking
 */

const express = require("express");
const mysql = require("mysql2/promise");
const router = express.Router();

/**
 * GET /api/driver/bookings/:driverId
 * Get all pending booking requests for driver's rides
 */
router.get("/bookings/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      const [bookings] = await connection.execute(
        `SELECT 
          b.booking_id,
          b.start_lat as pickup_lat,
          b.start_long as pickup_long,
          b.end_lat as dropoff_lat,
          b.end_long as dropoff_long,
          b.created_at,
          t.trip_id,
          t.available_seats,
          u.first_name,
          u.last_name,
          u.mobile_number
        FROM bookings b
        JOIN trip_assignment ta ON b.booking_id = ta.booking_id
        JOIN trips t ON ta.trip_id = t.trip_id
        JOIN users u ON b.passenger_id = u.user_id
        WHERE t.driver_id = ?
        AND ta.assignment_status = 'pending'
        ORDER BY b.created_at DESC`,
        [driverId]
      );

      res.status(200).json({
        success: true,
        bookings: bookings,
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * POST /api/driver/bookings/:bookingId/accept
 * Accept a booking request and reduce available seats
 */
router.post("/bookings/:bookingId/accept", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      // Get booking and trip assignment details
      const [bookingRows] = await connection.execute(
        `SELECT b.booking_id, b.passenger_id, ta.assignment_id, ta.trip_id
         FROM bookings b
         JOIN trip_assignment ta ON b.booking_id = ta.booking_id
         WHERE b.booking_id = ? AND ta.assignment_status = ?`,
        [bookingId, "pending"]
      );

      if (bookingRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Booking not found or already processed",
        });
      }

      const { trip_id, assignment_id } = bookingRows[0];

      // Start transaction
      await connection.beginTransaction();

      try {
        // Update trip assignment status
        await connection.execute(
          "UPDATE trip_assignment SET assignment_status = ? WHERE assignment_id = ?",
          ["accepted", assignment_id]
        );

        // Decrease available seats by 1
        const [updateResult] = await connection.execute(
          "UPDATE trips SET available_seats = available_seats - 1 WHERE trip_id = ?",
          [trip_id]
        );

        console.log(
          `[Accept Booking] Booking ${bookingId} accepted, seats deducted for trip ${trip_id}`
        );

        await connection.commit();

        res.status(200).json({
          success: true,
          message: "Booking accepted successfully and seat deducted",
        });
      } catch (innerError) {
        await connection.rollback();
        throw innerError;
      }
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Accept booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * POST /api/driver/bookings/:bookingId/reject
 * Reject a booking request
 */
router.post("/bookings/:bookingId/reject", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      const [result] = await connection.execute(
        "UPDATE bookings SET booking_status = ? WHERE booking_id = ? AND booking_status = ?",
        ["rejected", bookingId, "pending"]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Booking not found or already processed",
        });
      }

      res.status(200).json({
        success: true,
        message: "Booking rejected successfully",
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Reject booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

module.exports = router;
