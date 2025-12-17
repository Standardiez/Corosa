/*
* open directory in cmd
* npm install mysql2
*/
const mysql = require("mysql2/promise");

// Use environment variables for Docker, fallback to localhost for local development
const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "corosa_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4"
});

module.exports = db;