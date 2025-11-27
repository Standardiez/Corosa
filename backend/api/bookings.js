const express = require("express");
const BookingsNode = require("../classes/BookingsNode");

const router = express.Router();
const booking = new BookingsNode();

// GET /api/bookings?booking_id=1
// GET /api/bookings?passenger_id=123
// GET /api/bookings (all)
router.get("/", async (req, res) => {
    const { booking_id, passenger_id } = req.query;

    try {
        if (booking_id) {
            const found = await booking.getById(booking_id);
            if (!found) {
                return res.json({
                    success: false,
                    message: "Booking not found"
                });
            }
            return res.json({
                success: true,
                message: "Booking retrieved successfully",
                data: found
            });
        }

        if (passenger_id) {
            const bookings = await booking.getByPassengerId(passenger_id);
            return res.json({
                success: true,
                message: "Bookings retrieved successfully",
                data: bookings
            });
        }

        // Gets all Bookings
        const bookings = await booking.getAll();
        return res.json({
            success: true,
            message: "Bookings retrieved successfully",
            data: bookings
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// POST
router.post("/", async (req, res) => {
    try {
        const { passenger_id, start_lat, start_long, end_lat, end_long } = req.body;

        if (!passenger_id || !start_lat || !start_long || !end_lat || !end_long) {
            return res.json({
                success: false,
                message: "Missing required fields (passenger_id, start_lat, start_long, end_lat, end_long)"
            });
        }

        const bookingId = await booking.create(req.body);

        return res.json({
            success: true,
            message: "Booking created successfully",
            data: { booking_id: bookingId }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create booking",
            error: error.message
        });
    }
});

// PUT
router.put("/", async (req, res) => {
    try {
        const { booking_id } = req.body;

        if (!booking_id) {
            return res.json({
                success: false,
                message: "Booking ID is required"
            });
        }

        const updated = await booking.update(req.body);
        if (!updated) {
            return res.json({
                success: false,
                message: "Failed to update booking"
            });
        }

        return res.json({
            success: true,
            message: "Booking updated successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update booking",
            error: error.message
        });
    }
});

// DELETE
router.delete("/", async (req, res) => {
    try {
        const { booking_id } = req.query;

        if (!booking_id) {
            return res.json({
                success: false,
                message: "Booking ID is required"
            });
        }

        const deleted = await booking.delete(booking_id);
        if (!deleted) {
            return res.json({
                success: false,
                message: "Failed to delete booking"
            });
        }

        return res.json({
            success: true,
            message: "Booking deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete booking",
            error: error.message
        });
    }
});

module.exports = router;

