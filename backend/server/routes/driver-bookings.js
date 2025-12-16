/**
 * DRIVER BOOKING REQUESTS API - NODE.JS
 * Handles booking requests for driver's rides
 *
 * Endpoints:
 * POST   /api/bookings - Create new booking request (passenger side)
 * GET    /api/driver/bookings/:driverId - Get all booking requests for driver
 * POST   /api/driver/bookings/:bookingId/accept - Accept booking
 * POST   /api/driver/bookings/:bookingId/reject - Reject booking
 */

const express = require("express");
const mysql = require("mysql2/promise");
const router = express.Router();

/**
 * GET /api/bookings/:bookingId/status
 * Get status of a specific booking
 */
router.get("/bookings/:bookingId/status", async (req, res) => {
  console.log("[GET /api/bookings/:bookingId/status] Request received");
  
  try {
    const { bookingId } = req.params;

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      const [results] = await connection.execute(
        `SELECT 
          b.booking_id,
          ta.assignment_status,
          ta.created_at
        FROM bookings b
        LEFT JOIN trip_assignment ta ON b.booking_id = ta.booking_id
        WHERE b.booking_id = ?`,
        [bookingId]
      );

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      const booking = results[0];
      console.log("[GET /api/bookings/:bookingId/status] Booking status:", booking.assignment_status);

      res.status(200).json({
        success: true,
        data: {
          booking_id: booking.booking_id,
          assignment_status: booking.assignment_status || "pending",
          created_at: booking.created_at,
        },
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("[GET /api/bookings/:bookingId/status] Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * POST /api/bookings
 * Create a new booking request (passenger side)
 */
router.post("/bookings", async (req, res) => {
  console.log("[POST /api/bookings] Request received", req.body);
  
  try {
    const {
      passenger_id,
      trip_id,
      start_lat,
      start_long,
      end_lat,
      end_long,
      payment_type,
      total_cost,
    } = req.body;

    // Validate required fields
    if (!passenger_id || !trip_id || !start_lat || !start_long || !end_lat || !end_long) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      // Create booking record
      const [bookingResult] = await connection.execute(
        `INSERT INTO bookings (
          passenger_id,
          start_lat,
          start_long,
          end_lat,
          end_long,
          payment_type,
          total_cost,
          booking_confirmation,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          passenger_id,
          parseFloat(start_lat),
          parseFloat(start_long),
          parseFloat(end_lat),
          parseFloat(end_long),
          payment_type || "cash",
          parseFloat(total_cost) || 0,
          true, // Mark as confirmed
        ]
      );

      const bookingId = bookingResult.insertId;
      console.log("[POST /api/bookings] Booking created:", bookingId);

      // Create trip assignment record with status "pending"
      const [assignmentResult] = await connection.execute(
        `INSERT INTO trip_assignment (
          booking_id,
          trip_id,
          seat_number,
          assignment_status,
          payment_type,
          total_cost,
          booking_confirmation,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          bookingId,
          trip_id,
          null, // Auto-assign seat
          "pending", // Status is pending until driver accepts
          payment_type || "cash",
          parseFloat(total_cost) || 0,
          true,
        ]
      );

      const assignmentId = assignmentResult.insertId;
      console.log("[POST /api/bookings] Trip assignment created:", assignmentId, "Status: pending");

      res.status(201).json({
        success: true,
        message: "Booking request created successfully",
        data: {
          booking_id: bookingId,
          assignment_id: assignmentId,
          status: "pending",
        },
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("[POST /api/bookings] Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * GET /api/driver/bookings/:driverId
 * Get all pending booking requests for driver's rides
 */
router.get("/bookings/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    console.log("[GET /api/driver/bookings] Request for driver:", driverId);

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

      console.log("[GET /api/driver/bookings] Found", bookings.length, "pending bookings for driver", driverId);
      if (bookings.length === 0) {
        console.log("[GET /api/driver/bookings] Debug: Checking all bookings for this driver...");
        const [allBookings] = await connection.execute(
          `SELECT 
            b.booking_id,
            ta.assignment_status,
            t.driver_id
          FROM bookings b
          JOIN trip_assignment ta ON b.booking_id = ta.booking_id
          JOIN trips t ON ta.trip_id = t.trip_id
          WHERE t.driver_id = ?`,
          [driverId]
        );
        console.log("[GET /api/driver/bookings] All bookings for driver:", allBookings);
      }

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
 * GET /api/driver/accepted-passengers/:driverId
 * Get all accepted passengers for driver's trips
 */
router.get("/accepted-passengers/:driverId", async (req, res) => {
  console.log("[GET /api/driver/accepted-passengers] Request received");
  
  try {
    const { driverId } = req.params;

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      // Get all ACCEPTED passengers for driver's rides
      const [passengers] = await connection.execute(
        `SELECT 
          b.booking_id,
          b.start_lat as pickup_lat,
          b.start_long as pickup_long,
          b.end_lat as dropoff_lat,
          b.end_long as dropoff_long,
          b.created_at,
          t.trip_id,
          u.first_name,
          u.last_name,
          u.mobile_number,
          ta.assignment_status
        FROM bookings b
        JOIN trip_assignment ta ON b.booking_id = ta.booking_id
        JOIN trips t ON ta.trip_id = t.trip_id
        JOIN users u ON b.passenger_id = u.user_id
        WHERE t.driver_id = ?
        AND ta.assignment_status = 'accepted'
        ORDER BY b.created_at DESC`,
        [driverId]
      );

      console.log("[GET /api/driver/accepted-passengers] Found", passengers.length, "accepted passengers");

      res.status(200).json({
        success: true,
        passengers: passengers,
        count: passengers.length,
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("[GET /api/driver/accepted-passengers] Error:", error);
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
