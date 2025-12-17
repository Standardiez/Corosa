const db = require('../../../config/database');

/**
 * Node.js equivalent of the PHP TripAssignment class.
 */
class TripAssignmentNode {
    /**
     * Create a new trip assignment
     * @param {Object} data
     * @returns {Promise<number>}
     */
    async create(data) {
        const {
            booking_id,
            trip_id,
            seat_number = null,
            assignment_status = 'pending',
            payment_type = 'cash',
            total_cost = 0,
            booking_confirmation = false
        } = data;

        // Get connection
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Insert trip assignment
            const [result] = await connection.query(
                `INSERT INTO trip_assignment 
                    (booking_id, trip_id, seat_number, assignment_status, payment_type, total_cost, booking_confirmation)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    booking_id,
                    trip_id,
                    seat_number,
                    assignment_status,
                    payment_type,
                    total_cost,
                    booking_confirmation ? 1 : 0
                ]
            );

            const assignmentId = result.insertId;

            // Prevents overbooking when multiple users book simultaneously
            if (booking_confirmation) {
                await connection.query(
                    `UPDATE trips 
                     SET available_seats = CASE 
                         WHEN available_seats > 0 THEN available_seats - 1 
                         ELSE 0 
                     END 
                     WHERE trip_id = ?`,
                    [trip_id]
                );
            }

            await connection.commit();
            return assignmentId;
        } catch (error) {
            await connection.rollback();
            console.error('TripAssignment::create failed:', error.message);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get trip assignment by ID
     * @param {number} assignmentId
     * @returns {Promise<Object|null>}
     */
    async getById(assignmentId) {
        const [rows] = await db.query(
            `SELECT * FROM trip_assignment WHERE assignment_id = ? LIMIT 1`,
            [assignmentId]
        );
        return rows[0] || null;
    }

    /**
     * Get all trip assignments for a booking
     * @param {number} bookingId
     * @returns {Promise<Array>}
     */
    async getByBookingId(bookingId) {
        const [rows] = await db.query(
            `SELECT * FROM trip_assignment 
             WHERE booking_id = ? 
             ORDER BY created_at DESC`,
            [bookingId]
        );
        return rows;
    }

    /**
     * Get all trip assignments for a trip
     * @param {number} tripId
     * @returns {Promise<Array>}
     */
    async getByTripId(tripId) {
        const [rows] = await db.query(
            `SELECT * FROM trip_assignment 
             WHERE trip_id = ? 
             ORDER BY created_at DESC`,
            [tripId]
        );
        return rows;
    }

    /**
     * Get all trip assignments
     * @returns {Promise<Array>}
     */
    async getAll() {
        const [rows] = await db.query(
            `SELECT assignment_id, booking_id, trip_id, seat_number, assignment_status, 
                    payment_type, total_cost, booking_confirmation, created_at 
             FROM trip_assignment 
             ORDER BY created_at DESC`
        );
        return rows;
    }

    async getAllForAdmin() {
        const [rows] = await db.query(`
            SELECT 
                ta.assignment_id,
                ta.booking_id,
                ta.trip_id,
                ta.payment_type,
                ta.total_cost,
                ta.assignment_status,
                ta.created_at,
                -- Passenger info
                passenger.user_id as passenger_id,
                passenger.first_name as passenger_first_name,
                passenger.middle_initial as passenger_middle_initial,
                passenger.last_name as passenger_last_name,
                -- Driver info
                driver_user.first_name as driver_first_name,
                driver_user.middle_initial as driver_middle_initial,
                driver_user.last_name as driver_last_name,
                -- Trip coordinates for distance calculation
                t.start_lat,
                t.start_long,
                t.end_lat,
                t.end_long,
                t.ride_distance
            FROM trip_assignment ta
            LEFT JOIN bookings b ON ta.booking_id = b.booking_id
            LEFT JOIN users passenger ON b.passenger_id = passenger.user_id
            LEFT JOIN trips t ON ta.trip_id = t.trip_id
            LEFT JOIN driver d ON t.driver_id = d.driver_id
            LEFT JOIN users driver_user ON d.user_id = driver_user.user_id
            ORDER BY ta.created_at DESC
        `);
        return rows;
    }

    /**
     * Update trip assignment
     * @param {Object} data
     * @returns {Promise<boolean>}
     */
    async update(data) {
        const {
            assignment_id,
            booking_id,
            trip_id,
            seat_number,
            assignment_status,
            payment_type,
            total_cost,
            booking_confirmation
        } = data;

        const [result] = await db.query(
            `UPDATE trip_assignment 
             SET booking_id = ?, trip_id = ?, seat_number = ?, 
                 assignment_status = ?, payment_type = ?, total_cost = ?, booking_confirmation = ?
             WHERE assignment_id = ?`,
            [
                booking_id,
                trip_id,
                seat_number,
                assignment_status,
                payment_type,
                total_cost,
                booking_confirmation ? 1 : 0,
                assignment_id
            ]
        );

        return result.affectedRows > 0;
    }

    /**
     * Delete trip assignment
     * @param {number} assignmentId
     * @returns {Promise<boolean>}
     */
    async delete(assignmentId) {
        const [result] = await db.query(
            `DELETE FROM trip_assignment WHERE assignment_id = ?`,
            [assignmentId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = TripAssignmentNode;