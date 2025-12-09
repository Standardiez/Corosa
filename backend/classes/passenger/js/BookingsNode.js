const db = require('../../../config/database');

/**
 * Node.js equivalent of the PHP Bookings class.
 */
class BookingsNode {
    /**
     * Create a new booking
     * @param {Object} data
     * @returns {Promise<number>}
     */
    async create(data) {
        const {
            passenger_id,
            booking_date,
            start_lat,
            start_long,
            end_lat,
            end_long,
            payment_type = 'cash',
            total_cost = 0,
            booking_confirmation = false
        } = data;

        const [result] = await db.query(
            `INSERT INTO bookings 
                (passenger_id, booking_date, start_lat, start_long, end_lat, end_long,
                 payment_type, total_cost, booking_confirmation)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                passenger_id,
                booking_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
                start_lat,
                start_long,
                end_lat,
                end_long,
                payment_type,
                total_cost,
                booking_confirmation ? 1 : 0
            ]
        );

        return result.insertId;
    }

    /**
     * Get booking by ID
     * @param {number} bookingId
     * @returns {Promise<Object|null>}
     */
    async getById(bookingId) {
        const [rows] = await db.query(
            `SELECT * FROM bookings WHERE booking_id = ? LIMIT 1`,
            [bookingId]
        );
        return rows[0] || null;
    }

    /**
     * Get all bookings for a passenger
     * @param {number} passengerId
     * @returns {Promise<Array>}
     */
    async getByPassengerId(passengerId) {
        const [rows] = await db.query(
            `SELECT * FROM bookings 
             WHERE passenger_id = ? 
             ORDER BY created_at DESC`,
            [passengerId]
        );
        return rows;
    }

    /**
     * Get all bookings
     * @returns {Promise<Array>}
     */
    async getAll() {
        const [rows] = await db.query(
            `SELECT booking_id, passenger_id, booking_date, start_lat, start_long, 
                    end_lat, end_long, payment_type, total_cost, booking_confirmation, created_at
             FROM bookings 
             ORDER BY created_at DESC`
        );
        return rows;
    }

    /**
     * Update booking
     * @param {Object} data
     * @returns {Promise<boolean>}
     */
    async update(data) {
        const {
            booking_id,
            passenger_id,
            booking_date,
            start_lat,
            start_long,
            end_lat,
            end_long,
            payment_type,
            total_cost,
            booking_confirmation
        } = data;

        const [result] = await db.query(
            `UPDATE bookings 
             SET passenger_id = ?, booking_date = ?, start_lat = ?, start_long = ?,
                 end_lat = ?, end_long = ?, payment_type = ?, total_cost = ?, booking_confirmation = ?
             WHERE booking_id = ?`,
            [
                passenger_id,
                booking_date,
                start_lat,
                start_long,
                end_lat,
                end_long,
                payment_type,
                total_cost,
                booking_confirmation ? 1 : 0,
                booking_id
            ]
        );

        return result.affectedRows > 0;
    }

    /**
     * Delete booking
     * @param {number} bookingId
     * @returns {Promise<boolean>}
     */
    async delete(bookingId) {
        const [result] = await db.query(
            `DELETE FROM bookings WHERE booking_id = ?`,
            [bookingId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = BookingsNode;