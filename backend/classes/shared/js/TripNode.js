const db = require('../../../config/database');

// Node.js version of Trip.php
class TripNode {
    async getTripAvailableTripData() {
        const [rows] = await db.query(`
            SELECT 
                t.trip_id,
                t.driver_id,
                t.start_lat,
                t.start_long,
                t.end_lat,
                t.end_long,
                t.available_seats,
                t.ride_distance,
                t.ride_status,
                t.created_at,
                u.first_name,
                u.middle_initial,
                u.last_name,
                u.employment_status,
                v.vehicle_model,
                v.seat_capacity
            FROM trips t
            LEFT JOIN driver d ON t.driver_id = d.driver_id
            LEFT JOIN users u ON d.user_id = u.user_id
            LEFT JOIN vehicle v ON v.driver_id = d.driver_id
            LEFT JOIN (
                SELECT trip_id, COUNT(*) AS confirmed_count
                FROM trip_assignment
                WHERE assignment_status = 'confirmed'
                GROUP BY trip_id
            ) ta ON t.trip_id = ta.trip_id
            WHERE t.ride_status IN ('available', 'scheduled')
              AND t.available_seats > 0
            ORDER BY t.created_at DESC
        `);

        return rows;
    }

    async getById(tripId) {
        const [rows] = await db.query(
            `SELECT * FROM trips WHERE trip_id = ? LIMIT 1`,
            [tripId]
        );
        return rows[0] || null;
    }

    async getByDriverId(driverId) {
        const [rows] = await db.query(
            `SELECT * FROM trips WHERE driver_id = ? ORDER BY created_at DESC`,
            [driverId]
        );
        return rows;
    }

    async getAllWithDriverAndVehicle() {
        const [rows] = await db.query(`
            SELECT 
                t.trip_id,
                t.driver_id,
                t.start_lat,
                t.start_long,
                t.end_lat,
                t.end_long,
                t.available_seats,
                t.ride_distance,
                t.ride_status,
                t.created_at,
                u.user_id,
                u.first_name,
                u.middle_initial,
                u.last_name,
                u.email,
                u.employment_status,
                v.vehicle_model,
                v.plate_number,
                v.seat_capacity
            FROM trips t
            LEFT JOIN driver d ON t.driver_id = d.driver_id
            LEFT JOIN users u ON d.user_id = u.user_id
            LEFT JOIN vehicle v ON v.driver_id = d.driver_id
            WHERE t.ride_status IN ('available', 'scheduled')
            ORDER BY t.created_at DESC
        `);

        return rows;
    }

    async create(data) {
        const {
            driver_id,
            start_lat,
            start_long,
            end_lat,
            end_long,
            available_seats = 0,
            ride_distance = 0,
            ride_status = 'available'
        } = data;

        const [result] = await db.query(
            `INSERT INTO trips 
                (driver_id, start_lat, start_long, end_lat, end_long, available_seats, ride_distance, ride_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                driver_id,
                start_lat,
                start_long,
                end_lat,
                end_long,
                available_seats,
                ride_distance,
                ride_status
            ]
        );

        return result.insertId;
    }

    async update(data) {
        const {
            trip_id,
            driver_id,
            start_lat,
            start_long,
            end_lat,
            end_long,
            available_seats = 0,
            ride_distance = 0,
            ride_status
        } = data;

        const [result] = await db.query(
            `UPDATE trips 
             SET driver_id = ?, start_lat = ?, start_long = ?, end_lat = ?, end_long = ?,
                 available_seats = ?, ride_distance = ?, ride_status = ?
             WHERE trip_id = ?`,
            [
                driver_id,
                start_lat,
                start_long,
                end_lat,
                end_long,
                available_seats,
                ride_distance,
                ride_status,
                trip_id
            ]
        );

        return result.affectedRows > 0;
    }

    async delete(tripId) {
        const [result] = await db.query(
            `DELETE FROM trips WHERE trip_id = ?`,
            [tripId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = TripNode;

