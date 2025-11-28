const express = require("express");
const cors = require("cors");
/*
* Open directory in cmd
* npm install express cors
*/
const app = express();

// Enable CORS - allow comma-separated list of origins
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost").split(",").map(origin => origin.trim());
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.warn(`Blocked CORS origin: ${origin}`);
        return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Middleware to parse JSON
app.use(express.json());

// Import routers
const tripsRouter = require("./api/trip");
const bookingsRouter = require("./api/bookings");
const tripAssignmentsRouter = require("./api/trip-assignment");

// Register routes
app.use("/api/trips", tripsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/trip-assignments", tripAssignmentsRouter);

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "corosa-node-api" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`  - GET/POST/PUT/DELETE /api/trips`);
    console.log(`  - GET/POST/PUT/DELETE /api/bookings`);
    console.log(`  - GET/POST/PUT/DELETE /api/trip-assignments`);
});