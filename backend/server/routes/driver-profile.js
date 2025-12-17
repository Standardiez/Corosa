/**
 * DRIVER PROFILE API - NODE.JS
 * Handles driver profile management and settings
 *
 * Endpoints:
 * GET    /api/driver/profile/:driverId - Get driver profile
 * PUT    /api/driver/profile/:driverId - Update driver profile
 */

const express = require("express");
const mysql = require("mysql2/promise");
const router = express.Router();

/**
 * GET /api/driver/profile/:driverId
 * Get driver profile information
 */
router.get("/profile/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    console.log(`[GET /api/driver/profile/${driverId}] Fetching profile`);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      // Get driver and user information
      const query = `
        SELECT 
          d.driver_id,
          d.user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.mobile_number,
          v.vehicle_id,
          v.vehicle_model,
          v.vehicle_year,
          v.seat_capacity,
          v.license_plate
        FROM driver d
        JOIN users u ON d.user_id = u.user_id
        LEFT JOIN vehicle v ON d.driver_id = v.driver_id
        WHERE d.driver_id = ?
      `;

      const [drivers] = await connection.execute(query, [driverId]);

      if (drivers.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Driver not found",
        });
      }

      const profile = drivers[0];

      console.log(`[GET /api/driver/profile/${driverId}] Profile fetched`);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Get driver profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * PUT /api/driver/profile/:driverId
 * Update driver profile information
 * Body: { firstName, lastName, email, mobileNumber, vehicleModel, vehicleYear, seatCapacity, licensePlate }
 */
router.put("/profile/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;
    const {
      firstName,
      lastName,
      email,
      mobileNumber,
      vehicleModel,
      vehicleYear,
      seatCapacity,
      licensePlate,
    } = req.body;

    console.log(`[PUT /api/driver/profile/${driverId}] Update request:`, {
      firstName,
      lastName,
      email,
      mobileNumber,
      vehicleModel,
      vehicleYear,
      seatCapacity,
      licensePlate,
    });

    // Validate input
    if (!firstName || !lastName || !email || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, and mobile number are required",
      });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      // Start transaction
      await connection.beginTransaction();

      // Get driver user_id first
      const [driverResult] = await connection.execute(
        "SELECT user_id FROM driver WHERE driver_id = ?",
        [driverId]
      );

      if (driverResult.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "Driver not found",
        });
      }

      const userId = driverResult[0].user_id;

      // Update user information
      await connection.execute(
        "UPDATE users SET first_name = ?, last_name = ?, email = ?, mobile_number = ? WHERE user_id = ?",
        [firstName, lastName, email, mobileNumber, userId]
      );

      // Update or insert vehicle information if provided
      if (vehicleModel || vehicleYear || seatCapacity || licensePlate) {
        const [existingVehicle] = await connection.execute(
          "SELECT vehicle_id FROM vehicle WHERE driver_id = ?",
          [driverId]
        );

        if (existingVehicle.length > 0) {
          // Update existing vehicle
          await connection.execute(
            `UPDATE vehicle 
             SET vehicle_model = ?, vehicle_year = ?, seat_capacity = ?, license_plate = ?
             WHERE driver_id = ?`,
            [
              vehicleModel || null,
              vehicleYear || null,
              seatCapacity || null,
              licensePlate || null,
              driverId,
            ]
          );
        } else {
          // Insert new vehicle
          await connection.execute(
            `INSERT INTO vehicle (driver_id, vehicle_model, vehicle_year, seat_capacity, license_plate)
             VALUES (?, ?, ?, ?, ?)`,
            [driverId, vehicleModel, vehicleYear, seatCapacity, licensePlate]
          );
        }
      }

      // Commit transaction
      await connection.commit();

      console.log(`[PUT /api/driver/profile/${driverId}] Profile updated successfully`);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Update driver profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

module.exports = router;
