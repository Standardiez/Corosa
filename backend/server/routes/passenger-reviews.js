/**
 * PASSENGER REVIEWS API - NODE.JS
 * Handles review submission by passengers for drivers
 *
 * Endpoints:
 * POST   /api/reviews - Submit a new review
 * GET    /api/reviews/booking/:bookingId - Get review for a booking
 * GET    /api/reviews/driver/:driverId - Get aggregated reviews for a driver
 * PUT    /api/reviews/:reviewId - Update existing review
 */

const express = require("express");
const connection = require("../../config/database");
const router = express.Router();

/**
 * POST /api/reviews
 * Submit a new review for a completed ride
 */
router.post("/", async (req, res) => {
  try {
    const { bookingId, passengerId, rating, comment } = req.body;

    console.log("[POST /api/reviews] Submission from passenger:", passengerId);

    // ====================================================================
    // VALIDATION
    // ====================================================================
    const errors = {};

    if (!bookingId) errors.bookingId = "Booking ID is required";
    if (!passengerId) errors.passengerId = "Passenger ID is required";
    if (!rating || rating < 1 || rating > 5)
      errors.rating = "Rating must be between 1 and 5";

    if (Object.keys(errors).length > 0) {
      console.log("[POST /api/reviews] Validation errors:", errors);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    try {
      // Check if booking exists and belongs to this passenger
      const [bookingCheck] = await connection.execute(
        `SELECT b.booking_id, b.passenger_id, b.total_cost
         FROM bookings b
         WHERE b.booking_id = ? AND b.passenger_id = ?`,
        [bookingId, passengerId]
      );

      if (bookingCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Booking not found for this passenger",
        });
      }

      console.log("[POST /api/reviews] Booking found:", bookingId);

      // Check if review already exists for this booking
      const [existingReview] = await connection.execute(
        `SELECT review_id FROM reviews WHERE booking_id = ?`,
        [bookingId]
      );

      if (existingReview.length > 0) {
        // Update existing review
        console.log(
          `[POST /api/reviews] Review exists for booking ${bookingId}, updating...`
        );

        await connection.execute(
          `UPDATE reviews 
           SET rating = ?, comment = ?, updated_at = NOW()
           WHERE booking_id = ?`,
          [rating, comment || null, bookingId]
        );

        console.log(`[POST /api/reviews] Review updated successfully`);

        return res.status(200).json({
          success: true,
          message: "Review updated successfully",
          reviewId: existingReview[0].review_id,
        });
      }

      // Insert new review (schema: booking_id, rating, comment, created_at)
      const [insertResult] = await connection.execute(
        `INSERT INTO reviews (booking_id, rating, comment, created_at)
         VALUES (?, ?, ?, NOW())`,
        [bookingId, rating, comment || null]
      );

      console.log(
        `[POST /api/reviews] Review submitted successfully with ID: ${insertResult.insertId}`
      );

      res.status(201).json({
        success: true,
        message: "Review submitted successfully",
        reviewId: insertResult.insertId,
      });
    } catch (error) {
      console.error("Submit review error:", error);
      res.status(500).json({
        success: false,
        message: "Server error: " + error.message,
      });
    }
  } catch (error) {
    console.error("Submit review outer error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * GET /api/reviews/driver/:driverId
 * Get driver's aggregated rating and recent reviews
 */
router.get("/driver/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    console.log(`[GET /api/reviews/driver/${driverId}] Fetching driver stats`);

    // Aggregate rating and review count for this driver
    const [summaryRows] = await connection.execute(
      `SELECT 
         u.user_id        AS driver_user_id,
         u.first_name     AS first_name,
         u.last_name      AS last_name,
         AVG(r.rating)    AS avg_rating,
         COUNT(r.review_id) AS total_reviews
       FROM reviews r
       INNER JOIN bookings b        ON r.booking_id = b.booking_id
       INNER JOIN trip_assignment ta ON b.booking_id = ta.booking_id
       INNER JOIN trips t           ON ta.trip_id = t.trip_id
       INNER JOIN driver d          ON t.driver_id = d.driver_id
       INNER JOIN users u           ON d.user_id = u.user_id
       WHERE d.driver_id = ?
       GROUP BY u.user_id, u.first_name, u.last_name`,
      [driverId]
    );

    // Fetch recent individual reviews (for detail view)
    const [reviewRows] = await connection.execute(
      `SELECT 
         r.review_id,
         r.rating,
         r.comment,
         r.created_at
       FROM reviews r
       INNER JOIN bookings b        ON r.booking_id = b.booking_id
       INNER JOIN trip_assignment ta ON b.booking_id = ta.booking_id
       INNER JOIN trips t           ON ta.trip_id = t.trip_id
       INNER JOIN driver d          ON t.driver_id = d.driver_id
       WHERE d.driver_id = ?
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [driverId]
    );

    if (summaryRows.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          driver: null,
          averageRating: null,
          totalReviews: 0,
          reviews: [],
        },
        message: "No reviews found for this driver",
      });
    }

    const summary = summaryRows[0];

    res.status(200).json({
      success: true,
      data: {
        driver: {
          userId: summary.driver_user_id,
          firstName: summary.first_name,
          lastName: summary.last_name,
        },
        averageRating: summary.avg_rating
          ? Number.parseFloat(summary.avg_rating)
          : null,
        totalReviews: summary.total_reviews || 0,
        reviews: reviewRows,
      },
    });
  } catch (error) {
    console.error("Get driver reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * GET /api/reviews/booking/:bookingId
 * Get review for a specific booking
 */
router.get("/booking/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    console.log(`[GET /api/reviews/booking/${bookingId}] Fetching review`);

    const [reviews] = await connection.execute(
      `SELECT r.review_id, r.booking_id, r.rating, r.comment, r.created_at
       FROM reviews r
       WHERE r.booking_id = ?`,
      [bookingId]
    );

    if (reviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No review found for this booking",
      });
    }

    res.status(200).json({
      success: true,
      data: reviews[0],
    });
  } catch (error) {
    console.error("Get review error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

/**
 * GET /api/reviews/ride-details/:bookingId
 * Get complete ride details for a booking (for display on rate page)
 */
router.get("/ride-details/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    console.log(
      `[GET /api/reviews/ride-details/${bookingId}] Fetching ride details`
    );

    // Get complete ride details
    const [rideDetails] = await connection.execute(
      `SELECT 
        b.booking_id,
        b.passenger_id,
        b.start_lat as pickup_lat,
        b.start_long as pickup_lng,
        b.end_lat as dropoff_lat,
        b.end_long as dropoff_lng,
        b.payment_type,
        b.total_cost,
        b.created_at,
        t.trip_id,
        t.driver_id,
        t.ride_status,
        u.first_name as driver_first_name,
        u.last_name as driver_last_name,
        u.email as driver_email,
        u.mobile_number as driver_phone,
        v.plate_number,
        v.vehicle_model,
        v.seat_capacity,
        d.driver_id as driver_record_id
      FROM bookings b
      LEFT JOIN trip_assignment ta ON b.booking_id = ta.booking_id
      LEFT JOIN trips t ON ta.trip_id = t.trip_id
      LEFT JOIN driver d ON t.driver_id = d.driver_id
      LEFT JOIN users u ON d.user_id = u.user_id
      LEFT JOIN vehicle v ON d.driver_id = v.driver_id
      WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (rideDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const ride = rideDetails[0];

    // Check if review already submitted
    const [reviewCheck] = await connection.execute(
      `SELECT review_id, rating, comment FROM reviews WHERE booking_id = ?`,
      [bookingId]
    );

    res.status(200).json({
      success: true,
      data: {
        bookingId: ride.booking_id,
        passengerId: ride.passenger_id,
        rideStatus: ride.ride_status,
        date: ride.created_at,
        driver: {
          driverId: ride.driver_id,
          firstName: ride.driver_first_name,
          lastName: ride.driver_last_name,
          email: ride.driver_email,
          phone: ride.driver_phone,
        },
        vehicle: {
          model: ride.vehicle_model,
          licensePlate: ride.plate_number,
          capacity: ride.seat_capacity,
        },
        route: {
          pickup: {
            lat: ride.pickup_lat,
            lng: ride.pickup_lng,
          },
          dropoff: {
            lat: ride.dropoff_lat,
            lng: ride.dropoff_lng,
          },
        },
        payment: {
          type: ride.payment_type,
          amount: ride.total_cost,
        },
        existingReview: reviewCheck.length > 0 ? reviewCheck[0] : null,
      },
    });
  } catch (error) {
    console.error("Get ride details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

module.exports = router;
