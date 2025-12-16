/**
 * DRIVER RIDE CREATION API - NODE.JS
 * Handles ride creation, updates, and queries
 *
 * Endpoints:
 * POST   /api/driver/rides - Create new ride
 * GET    /api/driver/rides/:driverId - Get driver's rides
 * PUT    /api/driver/rides/:rideId - Update ride
 * DELETE /api/driver/rides/:rideId - Cancel ride
 */

const express = require("express");
const mysql = require("mysql2/promise");
const router = express.Router();

/**
 * POST /api/driver/rides
 * Create a new ride with start location, destination, and seats
 */
router.post("/rides", async (req, res) => {
  try {
    const {
      driverId,
      startLat,
      startLong,
      endLat,
      endLong,
      availableSeats,
    } = req.body;

    console.log("[POST /api/driver/rides] Request body:", req.body);

    // ====================================================================
    // VALIDATION
    // ====================================================================
    const errors = {};

    if (!driverId) errors.driverId = "Driver ID is required";
    if (startLat === undefined || startLat === null)
      errors.startLat = "Start latitude required";
    if (startLong === undefined || startLong === null)
      errors.startLong = "Start longitude required";
    if (endLat === undefined || endLat === null)
      errors.endLat = "End latitude required";
    if (endLong === undefined || endLong === null)
      errors.endLong = "End longitude required";
    if (!availableSeats || availableSeats < 1 || availableSeats > 8) {
      errors.availableSeats = "Available seats must be between 1 and 8";
    }

    if (Object.keys(errors).length > 0) {
      console.log("[POST /api/driver/rides] Validation errors:", errors);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // ====================================================================
    // DATABASE CONNECTION
    // ====================================================================
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      // ====================================================================
      // VERIFY DRIVER EXISTS
      // ====================================================================
      const [driverRows] = await connection.execute(
        "SELECT driver_id FROM driver WHERE driver_id = ?",
        [driverId]
      );

      if (driverRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Driver not found",
          errors: { driver: "not_found" },
        });
      }

      // ====================================================================
      // CREATE TRIP RECORD
      // ====================================================================
      const [tripResult] = await connection.execute(
        `INSERT INTO trips (
          driver_id, 
          start_lat, 
          start_long, 
          end_lat, 
          end_long,
          available_seats,
          ride_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          driverId,
          parseFloat(startLat),
          parseFloat(startLong),
          parseFloat(endLat),
          parseFloat(endLong),
          parseInt(availableSeats),
          "available",
        ]
      );

      const tripId = tripResult.insertId;

      // ====================================================================
      // SUCCESS - RETURN CREATED RIDE
      // ====================================================================
      res.status(201).json({
        success: true,
        tripId: tripId,
        message: "Ride created successfully",
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Ride creation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * GET /api/driver/rides/:driverId
 * Get all rides for a specific driver
 */
router.get("/rides/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      const [rides] = await connection.execute(
        `SELECT 
          trip_id,
          driver_id,
          start_lat,
          start_long,
          end_lat,
          end_long,
          available_seats,
          ride_status,
          created_at
        FROM trips
        WHERE driver_id = ?
        ORDER BY created_at DESC`,
        [driverId]
      );

      res.status(200).json({
        success: true,
        rides: rides,
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Get rides error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * PUT /api/driver/rides/:rideId
 * Update a ride (available seats, status)
 */
router.put("/rides/:rideId", async (req, res) => {
  try {
    const { rideId } = req.params;
    const { availableSeats, tripStatus } = req.body;

    if (!availableSeats && !tripStatus) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field (availableSeats or tripStatus) is required",
      });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      let updateQuery = "UPDATE trips SET ";
      let updateParams = [];
      let updateFields = [];

      if (availableSeats !== undefined) {
        updateFields.push("available_seats = ?");
        updateParams.push(parseInt(availableSeats));
      }

      if (tripStatus) {
        updateFields.push("trip_status = ?");
        updateParams.push(tripStatus);
      }

      updateQuery += updateFields.join(", ") + " WHERE trip_id = ?";
      updateParams.push(rideId);

      const [result] = await connection.execute(updateQuery, updateParams);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Ride not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Ride updated successfully",
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Ride update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * DELETE /api/driver/rides/:rideId
 * Cancel a ride
 */
router.delete("/rides/:rideId", async (req, res) => {
  try {
    const { rideId } = req.params;

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      // Soft delete - mark as cancelled
      const [result] = await connection.execute(
        "UPDATE trips SET trip_status = ? WHERE trip_id = ?",
        ["cancelled", rideId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Ride not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Ride cancelled successfully",
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Ride deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

module.exports = router;
