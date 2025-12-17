// UserNode.js - Handles user DB logic for Node.js API
const db = require("../../../config/database");

class UserNode {
    // Get all users
    async getAll() {
        const sql = "SELECT * FROM users";
        const [rows] = await db.query(sql);
        return rows;
    }
    async getAllStats() {
        const sql = "SELECT * FROM users ";
        const [rows] = await db.query(sql);
        const countTotal = rows.length;
        const countActive = rows.filter(u => u.status === 'active').length;
        const countInactive = rows.filter(u => u.status === 'inactive').length;
        return {
            totalUsers: countTotal,
            active: countActive,
            inactive: countInactive
        };
    }


    // Get user by ID
    async getById(user_id) {
        const sql = "SELECT * FROM users WHERE id = ?";
        const [rows] = await db.query(sql, [user_id]);
        return rows[0] || null;
    }

    // Create a new user
    async create(data) {
        const sql = `INSERT INTO users (username, password, email, role, status) VALUES (?, ?, ?, ?, ?)`;
        const params = [
            data.username,
            data.password,
            data.email,
            data.role || 'user',
            data.status || 'active'
        ];
        const [result] = await db.query(sql, params);
        return result.affectedRows > 0;
    }

    // Update a user
    async update(data) {
        const sql = `UPDATE users SET username = ?, email = ?, role = ?, status = ? WHERE id = ?`;
        const params = [
            data.username,
            data.email,
            data.role || 'user',
            data.status || 'active',
            data.id
        ];
        const [result] = await db.query(sql, params);
        return result.affectedRows > 0;
    }

    // Delete a user
    async delete(user_id) {
        const sql = "DELETE FROM users WHERE id = ?";
        const [result] = await db.query(sql, [user_id]);
        return result.affectedRows > 0;
    }
}

module.exports = UserNode;
