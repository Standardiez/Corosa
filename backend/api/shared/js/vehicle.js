const express = require("express");
const VehicleNode = require("../../../classes/driver/js/VehicleNode");

const router = express.Router();
const vehicle = new VehicleNode();

// GET /api/vehicles?plate_number=XXX
// GET /api/vehicles?driver_id=123
// GET /api/vehicles (all vehicles)
router.get("/", async (req, res) => {
    const { plate_number, driver_id } = req.query;
    try {
        if (plate_number) {
            const found = await vehicle.getByPlateNumber(plate_number);
            if (!found) {
                return res.json({
                    success: false,
                    message: "Vehicle not found"
                });
            }
            return res.json({
                success: true,
                message: "Vehicle retrieved successfully",
                data: found
            });
        }
        if (driver_id) {
            const vehicles = await vehicle.getByDriverId(driver_id);
            return res.json({
                success: true,
                message: "Vehicles retrieved successfully",
                data: vehicles
            });
        }
        // Get all vehicles
        const vehicles = await vehicle.getAll();
        return res.json({
            success: true,
            message: "Vehicles retrieved successfully",
            data: vehicles
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

// POST /api/vehicles
router.post("/", async (req, res) => {
    try {
        const { plate_number, driver_id, vehicle_model, seat_capacity, vehicle_status } = req.body;
        if (!plate_number || !driver_id) {
            return res.json({
                success: false,
                message: "Missing required fields (plate_number, driver_id)"
            });
        }
        const created = await vehicle.create({
            plate_number,
            driver_id,
            vehicle_model,
            seat_capacity,
            vehicle_status: vehicle_status || 'active'
        });
        if (!created) {
            return res.json({
                success: false,
                message: "Failed to create vehicle"
            });
        }
        return res.json({
            success: true,
            message: "Vehicle created successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create vehicle",
            error: error.message
        });
    }
});

// PUT /api/vehicles
router.put("/", async (req, res) => {
    try {
        const { plate_number } = req.body;
        if (!plate_number) {
            return res.json({
                success: false,
                message: "Plate number is required"
            });
        }
        const updated = await vehicle.update(req.body);
        if (!updated) {
            return res.json({
                success: false,
                message: "Failed to update vehicle"
            });
        }
        return res.json({
            success: true,
            message: "Vehicle updated successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update vehicle",
            error: error.message
        });
    }
});

// DELETE /api/vehicles
router.delete("/", async (req, res) => {
    try {
        const { plate_number } = req.query;
        if (!plate_number) {
            return res.json({
                success: false,
                message: "Plate number is required"
            });
        }
        const deleted = await vehicle.delete(plate_number);
        if (!deleted) {
            return res.json({
                success: false,
                message: "Failed to delete vehicle"
            });
        }
        return res.json({
            success: true,
            message: "Vehicle deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete vehicle",
            error: error.message
        });
    }
});

module.exports = router;
