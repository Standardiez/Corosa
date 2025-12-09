
const express = require("express");
const TripAssignmentNode = require("../../../classes/shared/js/TripAssignmentNode");

const router = express.Router();
const tripAssignment = new TripAssignmentNode();

// GET /api/trip-assignments?assignment_id=1
// GET /api/trip-assignments?booking_id=123
// GET /api/trip-assignments?trip_id=456
// GET /api/trip-assignments (all)
router.get("/", async (req, res) => {
    const { assignment_id, booking_id, trip_id } = req.query;

    try {
        if (assignment_id) {
            const found = await tripAssignment.getById(assignment_id);
            if (!found) {
                return res.json({
                    success: false,
                    message: "Trip assignment not found"
                });
            }
            return res.json({
                success: true,
                message: "Trip assignment retrieved successfully",
                data: found
            });
        }

        if (booking_id) {
            const assignments = await tripAssignment.getByBookingId(booking_id);
            return res.json({
                success: true,
                message: "Trip assignments retrieved successfully",
                data: assignments
            });
        }

        if (trip_id) {
            const assignments = await tripAssignment.getByTripId(trip_id);
            return res.json({
                success: true,
                message: "Trip assignments retrieved successfully",
                data: assignments
            });
        }

        // Get all trip assignment
        const assignments = await tripAssignment.getAll();
        return res.json({
            success: true,
            message: "Trip assignments retrieved successfully",
            data: assignments
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
        const { booking_id, trip_id } = req.body;

        if (!booking_id || !trip_id) {
            return res.json({
                success: false,
                message: "Missing required fields (booking_id, trip_id)"
            });
        }

        const assignmentId = await tripAssignment.create(req.body);

        return res.json({
            success: true,
            message: "Trip assignment created successfully",
            data: { assignment_id: assignmentId }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create trip assignment",
            error: error.message
        });
    }
});

// PUT
router.put("/", async (req, res) => {
    try {
        const { assignment_id } = req.body;

        if (!assignment_id) {
            return res.json({
                success: false,
                message: "Assignment ID is required"
            });
        }

        const updated = await tripAssignment.update(req.body);
        if (!updated) {
            return res.json({
                success: false,
                message: "Failed to update trip assignment"
            });
        }

        return res.json({
            success: true,
            message: "Trip assignment updated successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update trip assignment",
            error: error.message
        });
    }
});

// DELETE
router.delete("/", async (req, res) => {
    try {
        const { assignment_id } = req.query;

        if (!assignment_id) {
            return res.json({
                success: false,
                message: "Assignment ID is required"
            });
        }

        const deleted = await tripAssignment.delete(assignment_id);
        if (!deleted) {
            return res.json({
                success: false,
                message: "Failed to delete trip assignment"
            });
        }

        return res.json({
            success: true,
            message: "Trip assignment deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete trip assignment",
            error: error.message
        });
    }
});

module.exports = router;
