// VehicleNode.js - Handles vehicle DB logic for Node.js API

const db = require('../../../config/database');
class VehicleNode {
    // Get all vehicles
    async getAll() {
        console.log('Fetching all vehicles from database...');
        const sql = "SELECT * FROM vehicle";
        const [rows] = await db.query(sql);
        return rows;
    }

    // Get vehicle by plate number
    async getByPlateNumber(plate_number) {
        const sql = "SELECT * FROM vehicle WHERE plate_number = ?";
        const [rows] = await db.query(sql, [plate_number]);
        return rows[0] || null;
    }

    // Get all vehicles for a driver
    async getByDriverId(driver_id) {
        const sql = "SELECT * FROM vehicle WHERE driver_id = ?";
        const [rows] = await db.query(sql, [driver_id]);
        return rows;
    }

    // Create a new vehicle
    async create(data) {
        const sql = `INSERT INTO vehicle (plate_number, driver_id, vehicle_model, seat_capacity, vehicle_status) VALUES (?, ?, ?, ?, ?)`;
        const params = [
            data.plate_number,
            data.driver_id,
            data.vehicle_model || '',
            data.seat_capacity || 0,
            data.vehicle_status || 'active'
        ];
        const [result] = await db.query(sql, params);
        return result.affectedRows > 0;
    }

    // Update a vehicle
    async update(data) {
        const sql = `UPDATE vehicle SET vehicle_model = ?, seat_capacity = ?, vehicle_status = ? WHERE plate_number = ?`;
        const params = [
            data.vehicle_model || '',
            data.seat_capacity || 0,
            data.vehicle_status || 'active',
            data.plate_number
        ];
        const [result] = await db.query(sql, params);
        return result.affectedRows > 0;
    }

    // Delete a vehicle
    async delete(plate_number) {
        const sql = "DELETE FROM vehicle WHERE plate_number = ?";
        const [result] = await db.query(sql, [plate_number]);
        return result.affectedRows > 0;
    }
}

module.exports = VehicleNode;
