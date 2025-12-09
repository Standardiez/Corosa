/*
* open directory in cmd
* npm install mysql2
*/
const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "corosa_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4"
});

module.exports = db;