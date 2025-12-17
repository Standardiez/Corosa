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
    const { driverId, startLat, startLong, endLat, endLong, availableSeats } =
      req.body;

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
 * GET /api/driver/rides/:driverId/:tripId
 * Get a specific trip by ID for a driver
 */
router.get("/rides/:driverId/:tripId", async (req, res) => {
  try {
    const { driverId, tripId } = req.params;

    console.log(
      `[GET /api/driver/rides/${driverId}/${tripId}] Fetching trip`
    );

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      const [trips] = await connection.execute(
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
        WHERE trip_id = ? AND driver_id = ?`,
        [tripId, driverId]
      );

      if (trips.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Trip not found",
        });
      }

      console.log(
        `[GET /api/driver/rides/${driverId}/${tripId}] Trip found:`,
        trips[0]
      );

      res.status(200).json({
        success: true,
        data: trips[0],
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Get trip by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * PUT /api/driver/rides/:tripId/status
 * Update ride status progression: available -> on_the_way -> in_progress -> arrived -> completed
 */
router.put("/rides/:tripId/status", async (req, res) => {
  try {
    const { tripId } = req.params;
    const { newStatus } = req.body;

    console.log(`[PUT /api/driver/rides/${tripId}/status] Request:`, {
      newStatus,
    });

    // Valid status enum values
    const validStatuses = ["on_the_way", "in_progress", "arrived", "completed"];
    if (!newStatus || !validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Human-readable labels for messages
    const statusLabels = {
      on_the_way: "Driver is on the way",
      in_progress: "Ride in progress",
      arrived: "Arrived at destination",
      completed: "Ride completed",
    };

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      // Check current ride status
      const [rides] = await connection.execute(
        "SELECT trip_id, ride_status FROM trips WHERE trip_id = ?",
        [tripId]
      );

      if (rides.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Ride not found",
        });
      }

      const currentRide = rides[0];
      const currentStatus = currentRide.ride_status;

      // Validate progression - only allow transitions to the next status
      const statusProgression = {
        available: ["on_the_way"],
        on_the_way: ["in_progress"],
        in_progress: ["arrived"],
        arrived: ["completed"],
        completed: [],
      };

      if (!statusProgression[currentStatus]?.includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: `Cannot update from '${currentStatus}' to '${newStatus}'. Invalid progression.`,
          currentStatus,
          allowedNextStatuses: statusProgression[currentStatus] || [],
        });
      }

      // Update status
      const [result] = await connection.execute(
        "UPDATE trips SET ride_status = ? WHERE trip_id = ?",
        [newStatus, tripId]
      );

      if (result.affectedRows === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to update status",
        });
      }

      console.log(
        `[PUT /api/driver/rides/${tripId}/status] Updated: ${currentStatus} -> ${newStatus}`
      );

      // Return human-readable message
      const messageLabel = statusLabels[newStatus] || newStatus;

      res.status(200).json({
        success: true,
        message: `Ride status updated: ${messageLabel}`,
        currentStatus: newStatus,
        humanReadable: messageLabel,
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Ride status update error:", error);
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
 * DELETE /api/driver/rides/:tripId
 * Cancel a ride (only if status is 'available')
 */
router.delete("/rides/:tripId", async (req, res) => {
  try {
    const { tripId } = req.params;

    console.log(`[DELETE /api/driver/rides/${tripId}] Cancel request`);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      // Check ride status
      const [rides] = await connection.execute(
        "SELECT trip_id, ride_status FROM trips WHERE trip_id = ?",
        [tripId]
      );

      if (rides.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Ride not found",
        });
      }

      const currentStatus = rides[0].ride_status;

      // Only allow cancellation if available
      if (currentStatus !== "available") {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel ride with status '${currentStatus}'. Only 'available' rides can be cancelled.`,
          currentStatus,
        });
      }

      // Mark as cancelled
      const [result] = await connection.execute(
        "UPDATE trips SET ride_status = ? WHERE trip_id = ?",
        ["cancelled", tripId]
      );

      if (result.affectedRows === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to cancel ride",
        });
      }

      console.log(`[DELETE /api/driver/rides/${tripId}] Successfully cancelled`);

      res.status(200).json({
        success: true,
        message: "Ride cancelled successfully",
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Ride cancellation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * GET /api/driver/trips/:driverId/completed
 * Get all completed trips for a driver (with earnings info)
 */
router.get("/trips/:driverId/completed", async (req, res) => {
  try {
    const { driverId } = req.params;

    console.log(
      `[GET /api/driver/trips/${driverId}/completed] Fetching completed trips`
    );

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      const query = `
        SELECT 
          t.trip_id,
          t.driver_id,
          t.start_lat,
          t.start_long,
          t.end_lat,
          t.end_long,
          t.available_seats,
          t.ride_status,
          t.created_at,
          COUNT(DISTINCT ta.assignment_id) as passenger_count,
          COALESCE(SUM(b.total_cost), 0) as total_earnings
        FROM trips t
        LEFT JOIN trip_assignment ta ON t.trip_id = ta.trip_id AND ta.assignment_status = 'accepted'
        LEFT JOIN bookings b ON ta.booking_id = b.booking_id
        WHERE t.driver_id = ? AND t.ride_status = 'completed'
        GROUP BY t.trip_id
        ORDER BY t.created_at DESC
      `;

      const [completedTrips] = await connection.execute(query, [driverId]);

      console.log(
        `[GET /api/driver/trips/${driverId}/completed] Found ${completedTrips.length} completed trips`
      );

      res.status(200).json({
        success: true,
        data: completedTrips,
        count: completedTrips.length,
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Get completed trips error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * GET /api/driver/stats/:driverId
 * Get driver statistics (pending requests, total rides, average rating, weekly earnings)
 */
router.get("/stats/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    console.log(`[GET /api/driver/stats/${driverId}] Fetching statistics`);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      // Get pending requests count
      const [pendingReqs] = await connection.execute(
        `SELECT COUNT(*) as count FROM bookings b
         JOIN trip_assignment ta ON b.booking_id = ta.booking_id
         WHERE ta.trip_id IN (SELECT trip_id FROM trips WHERE driver_id = ?)
         AND ta.assignment_status = 'pending'`,
        [driverId]
      );

      // Get total completed rides
      const [totalRides] = await connection.execute(
        "SELECT COUNT(*) as count FROM trips WHERE driver_id = ? AND ride_status IN ('completed', 'in_progress', 'arrived')",
        [driverId]
      );

      // Get average rating (if reviews table exists)
      const [avgRating] = await connection.execute(
        `SELECT ROUND(AVG(rating), 1) as avg_rating FROM reviews WHERE driver_id = ?`,
        [driverId]
      );

      // Get this week's earnings (completed trips in last 7 days)
      const [weeklyEarnings] = await connection.execute(
        `SELECT COALESCE(SUM(b.total_cost), 0) as total 
         FROM bookings b
         JOIN trip_assignment ta ON b.booking_id = ta.booking_id
         WHERE ta.trip_id IN (SELECT trip_id FROM trips 
                             WHERE driver_id = ? AND ride_status = 'completed' 
                             AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))
         AND ta.assignment_status = 'accepted'`,
        [driverId]
      );

      const stats = {
        pending_requests: pendingReqs[0].count || 0,
        total_rides: totalRides[0].count || 0,
        average_rating: avgRating[0].avg_rating || 0,
        weekly_earnings: parseFloat(weeklyEarnings[0].total) || 0,
      };

      console.log(
        `[GET /api/driver/stats/${driverId}] Stats:`,
        JSON.stringify(stats)
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Get driver stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * GET /api/driver/available-rides
 * Get all available rides for passengers to book
 * Filters for rides with status 'available' or 'pending' and available_seats > 0
 */
router.get("/available-rides", async (req, res) => {
  console.log("[GET /api/driver/available-rides] Request received");

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      // Get all available rides with available seats
      // Match ride_status to schema: 'available' or 'pending' (not 'active')
      const query = `
        SELECT 
          t.trip_id,
          t.driver_id,
          t.start_lat,
          t.start_long,
          t.end_lat,
          t.end_long,
          t.available_seats,
          t.ride_status,
          t.created_at,
          u.first_name,
          u.last_name,
          u.mobile_number,
          v.vehicle_model,
          v.seat_capacity
        FROM trips t
        JOIN driver d ON t.driver_id = d.driver_id
        JOIN users u ON d.user_id = u.user_id
        LEFT JOIN vehicle v ON d.driver_id = v.driver_id
        WHERE (t.ride_status = 'available' OR t.ride_status = 'pending') 
          AND t.available_seats > 0
        ORDER BY t.created_at DESC
      `;

      console.log("[GET /api/driver/available-rides] Executing query...");
      const [rides] = await connection.execute(query);

      console.log(
        "[GET /api/driver/available-rides] Found",
        rides.length,
        "available rides"
      );
      console.log(
        "[GET /api/driver/available-rides] Ride data:",
        JSON.stringify(rides, null, 2)
      );

      res.status(200).json({
        success: true,
        data: rides,
        count: rides.length,
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("[GET /api/driver/available-rides] Error:", error.message);
    console.error("[GET /api/driver/available-rides] Full error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
      error: error.message,
    });
  }
});

/**
 * GET /api/driver/reviews/:driverId
 * Get all reviews for a driver with passenger info and payment details
 */
router.get("/reviews/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    console.log(`[GET /api/driver/reviews/${driverId}] Fetching reviews`);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      // Get all reviews for driver with passenger info
      const [reviews] = await connection.execute(
        `SELECT 
          r.review_id,
          r.rating,
          r.comment,
          r.created_at,
          u.first_name,
          u.last_name,
          ta.total_cost as payment,
          ta.payment_type
        FROM reviews r
        INNER JOIN bookings b ON r.booking_id = b.booking_id
        INNER JOIN users u ON b.passenger_id = u.user_id
        INNER JOIN trip_assignment ta ON r.booking_id = ta.booking_id
        INNER JOIN trips t ON ta.trip_id = t.trip_id
        WHERE t.driver_id = ?
        ORDER BY r.created_at DESC`,
        [driverId]
      );

      if (reviews.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          totalReviews: 0,
          averageRating: 0,
        });
      }

      // Calculate stats
      const totalReviews = reviews.length;
      const averageRating =
        reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews;
      const positiveCount = reviews.filter((r) => r.rating >= 4).length;
      const positivePercent = Math.round((positiveCount / totalReviews) * 100);

      console.log(
        `[GET /api/driver/reviews/${driverId}] Found ${totalReviews} reviews`
      );

      res.status(200).json({
        success: true,
        data: reviews,
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(1)),
        positivePercent,
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

module.exports = router;
