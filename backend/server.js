const express = require("express");
const cors = require("cors");
/*
* Open directory in cmd
* npm install express cors
*/
const app = express();

// Enable CORS so the WAMP-served frontend (http://localhost) can call this API
app.use(cors({
    origin: "http://localhost",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware to parse JSON
app.use(express.json());

// Import routers
const tripsRouter = require("./api/shared/js/trip");
const bookingsRouter = require("./api/pasenger/php/bookings");
const tripAssignmentsRouter = require("./api/shared/js/trip-assignment");

// Mount routes
app.use("/api/trips", tripsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/trip-assignments", tripAssignmentsRouter);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});