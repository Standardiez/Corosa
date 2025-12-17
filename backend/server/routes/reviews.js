const express = require("express");
const router = express.Router();
const connection = require("../../config/database");

// POST - Submit or update review
router.post("/reviews", async (req, res) => {
  try {
    const { bookingId, passengerId, rating, comment } = req.body;

    if (!bookingId || !passengerId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: bookingId, passengerId, rating",
      });
    }

    // Check if review already exists
    const [existingReview] = await connection.execute(
      `SELECT review_id FROM reviews WHERE booking_id = ?`,
      [bookingId]
    );

    let query, params;

    if (existingReview.length > 0) {
      // Update existing review
      query = `UPDATE reviews 
               SET rating = ?, comment = ?, updated_at = NOW() 
               WHERE booking_id = ?`;
      params = [rating, comment || null, bookingId];
    } else {
      // Insert new review
      query = `INSERT INTO reviews (booking_id, passenger_id, rating, comment, created_at) 
               VALUES (?, ?, ?, ?, NOW())`;
      params = [bookingId, passengerId, rating, comment || null];
    }

    const [result] = await connection.execute(query, params);

    res.json({
      success: true,
      message:
        existingReview.length > 0 ? "Review updated" : "Review submitted",
      data: {
        bookingId,
        rating,
        comment: comment || null,
      },
    });
  } catch (error) {
    console.error("[Reviews] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: error.message,
    });
  }
});

// GET - Fetch review for a booking
router.get("/reviews/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const [reviews] = await connection.execute(
      `SELECT review_id, booking_id, passenger_id, rating, comment, created_at, updated_at
       FROM reviews WHERE booking_id = ?`,
      [bookingId]
    );

    if (reviews.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: "No review found for this booking",
      });
    }

    res.json({
      success: true,
      data: reviews[0],
    });
  } catch (error) {
    console.error("[Reviews] Error fetching review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch review",
      error: error.message,
    });
  }
});

module.exports = router;
