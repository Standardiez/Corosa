const express = require("express");
const TripNode = require("../../../classes/shared/js/TripNode");

const router = express.Router();
const trip = new TripNode();

// GET /api/trips?action=getAvailableTrips
// GET /api/trips?trip_id=1
// GET /api/trips?driver_id=123
// GET /api/trips (all with joins)
router.get("/", async (req, res) => {
    const { action, trip_id, driver_id } = req.query;

    try {
        if (action === "getAvailableTrips") {
            const trips = await trip.getTripAvailableTripData();
            return res.json({
                success: true,
                message: "Available trips retrieved successfully",
                data: trips
            });
        }

        if (action === "getAllForAdmin") {
            const trips = await trip.getAllTripsForAdmin();
            return res.json({
                success: true,
                message: "All trips retrieved successfully",
                data: trips
            });
        }

        if (trip_id) {
            const found = await trip.getById(trip_id);
            if (!found) {
                return res.json({
                    success: false,
                    message: "Trip not found"
                });
            }
            return res.json({
                success: true,
                message: "Trip retrieved successfully",
                data: found
            });
        }

        if (driver_id) {
            const trips = await trip.getByDriverId(driver_id);
            return res.json({
                success: true,
                message: "Trips retrieved successfully",
                data: trips
            });
        }

        // Gets all trips
        const trips = await trip.getAllWithDriverAndVehicle();
        return res.json({
            success: true,
            message: "Trips retrieved successfully",
            data: trips
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
        const { driver_id, start_lat, start_long, end_lat, end_long } = req.body;

        if (!driver_id || !start_lat || !start_long || !end_lat || !end_long) {
            return res.json({
                success: false,
                message: "Missing required fields (driver_id, start_lat, start_long, end_lat, end_long)"
            });
        }

        const tripId = await trip.create(req.body);

        return res.json({
            success: true,
            message: "Trip created successfully",
            data: { trip_id: tripId }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create trip",
            error: error.message
        });
    }
});

// PUT
router.put("/", async (req, res) => {
    try {
        const { trip_id } = req.body;

        if (!trip_id) {
            return res.json({
                success: false,
                message: "Trip ID is required"
            });
        }

        const updated = await trip.update(req.body);
        if (!updated) {
            return res.json({
                success: false,
                message: "Failed to update trip"
            });
        }

        return res.json({
            success: true,
            message: "Trip updated successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update trip",
            error: error.message
        });
    }
});

// DELETE
router.delete("/", async (req, res) => {
    try {
        const { trip_id } = req.query;

        if (!trip_id) {
            return res.json({
                success: false,
                message: "Trip ID is required"
            });
        }

        const deleted = await trip.delete(trip_id);
        if (!deleted) {
            return res.json({
                success: false,
                message: "Failed to delete trip"
            });
        }

        return res.json({
            success: true,
            message: "Trip deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete trip",
            error: error.message
        });
    }
});

module.exports = router;