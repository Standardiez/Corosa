/**
 * PASSENGER RIDE DETAILS API - NODE.JS
 * Fetch complete ride information for passenger
 *
 * Endpoints:
 * GET /api/passenger/ride-details/:bookingId - Get ride details by booking ID
 */

const express = require("express");
const mysql = require("mysql2/promise");
const router = express.Router();

/**
 * GET /api/passenger/ride-details/:bookingId
 * Fetch complete ride details for passenger display
 */
router.get("/ride-details/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    console.log(
      `[GET /api/passenger/ride-details/${bookingId}] Fetching ride details`
    );

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corosa_db",
    });

    try {
      // Fetch booking and trip assignment details
      const [bookingData] = await connection.execute(
        `SELECT 
          b.booking_id,
          b.passenger_id,
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
        LEFT JOIN trip_assignment ta ON b.booking_id = ta.booking_id
        WHERE b.booking_id = ?`,
        [bookingId]
      );

      if (bookingData.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      const booking = bookingData[0];
      let tripId = booking.trip_id;
      let driverId = null;

      console.log("[Ride Details] Booking data:", {
        booking_id: booking.booking_id,
        trip_id: booking.trip_id,
        assignment_status: booking.assignment_status,
        start_lat: booking.start_lat,
        start_long: booking.start_long,
      });

      // If no trip_assignment, find driver by matching trip coordinates or get most recent trip
      if (!tripId) {
        console.log(
          "[Ride Details] No trip_assignment found, searching trips..."
        );

        // Try exact coordinate match first
        let [trips] = await connection.execute(
          `SELECT trip_id, driver_id
           FROM trips
           WHERE start_lat = ? AND start_long = ? 
           AND end_lat = ? AND end_long = ?
           ORDER BY created_at DESC
           LIMIT 1`,
          [
            booking.start_lat,
            booking.start_long,
            booking.end_lat,
            booking.end_long,
          ]
        );

        // If no exact match, get most recent trip with available seats
        if (trips.length === 0) {
          console.log(
            "[Ride Details] No exact coordinate match, getting most recent trip..."
          );
          [trips] = await connection.execute(
            `SELECT trip_id, driver_id
             FROM trips
             WHERE available_seats > 0
             ORDER BY created_at DESC
             LIMIT 1`
          );
        }

        if (trips.length > 0) {
          tripId = trips[0].trip_id;
          driverId = trips[0].driver_id;
          console.log("[Ride Details] Found trip:", { tripId, driverId });
        } else {
          console.log("[Ride Details] No trip found");
        }
      } else {
        // If we have trip_id from trip_assignment, fetch the driver_id from trips table
        const [trips] = await connection.execute(
          `SELECT driver_id FROM trips WHERE trip_id = ?`,
          [tripId]
        );

        if (trips.length > 0) {
          driverId = trips[0].driver_id;
        }
      }

      // Fetch driver information
      let driverInfo = null;
      if (driverId) {
        const [drivers] = await connection.execute(
          `SELECT 
            u.user_id,
            u.first_name,
            u.last_name,
            u.employment_status,
            d.driver_id,
            v.plate_number,
            v.vehicle_model,
            v.seat_capacity
          FROM driver d
          INNER JOIN users u ON d.user_id = u.user_id
          LEFT JOIN vehicle v ON d.driver_id = v.driver_id
          WHERE d.driver_id = ?`,
          [driverId]
        );

        if (drivers.length > 0) {
          driverInfo = drivers[0];
          console.log("[Ride Details] Driver info fetched:", driverInfo);
        } else {
          console.log(
            "[Ride Details] No driver found for driver_id:",
            driverId
          );
        }
      } else {
        console.log(
          "[Ride Details] WARNING: No driver_id found for booking",
          booking.booking_id
        );
      }

      // Fetch existing review if any
      let review = null;
      const [reviews] = await connection.execute(
        `SELECT review_id, rating, comment, created_at
         FROM reviews
         WHERE booking_id = ?`,
        [bookingId]
      );

      if (reviews.length > 0) {
        review = reviews[0];
      }

      // Fetch address information if available (optional enhancement)
      let pickupAddress = null;
      let dropoffAddress = null;

      res.status(200).json({
        success: true,
        data: {
          booking: {
            booking_id: booking.booking_id,
            passenger_id: booking.passenger_id,
            start_lat: parseFloat(booking.start_lat),
            start_long: parseFloat(booking.start_long),
            end_lat: parseFloat(booking.end_lat),
            end_long: parseFloat(booking.end_long),
            payment_type: booking.payment_type,
            total_cost: parseFloat(booking.total_cost),
            booking_confirmation: booking.booking_confirmation,
            created_at: booking.created_at,
            trip_id: booking.trip_id,
            assignment_status: booking.assignment_status,
            ride_status: booking.ride_status,
          },
          driver: driverInfo,
          review: review,
          pickup_coords: {
            lat: parseFloat(booking.start_lat),
            lng: parseFloat(booking.start_long),
          },
          dropoff_coords: {
            lat: parseFloat(booking.end_lat),
            lng: parseFloat(booking.end_long),
          },
        },
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Fetch ride details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

module.exports = router;
