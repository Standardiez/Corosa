const express = require("express");
const cors = require("cors");
const path = require("path");

/*
 * Open directory in cmd
 * npm install express cors multer mysql2
 */
const app = express();

// Enable CORS so the WAMP-served frontend (http://localhost) can call this API
app.use(
  cors({
    origin: "http://localhost",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware to parse JSON
app.use(express.json());

// Middleware for file uploads
app.use(express.urlencoded({ extended: true }));

// Import routers
const tripsRouter = require("./api/shared/js/trip");
const bookingsRouter = require("./api/pasenger/php/bookings");
const tripAssignmentsRouter = require("./api/shared/js/trip-assignment");
const driverRegistrationRouter = require("./server/routes/driver-registration");
const driverRidesRouter = require("./server/routes/driver-rides");
const driverBookingsRouter = require("./server/routes/driver-bookings");

// Mount routes
app.use("/api/trips", tripsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/trip-assignments", tripAssignmentsRouter);
app.use("/api/driver", driverRegistrationRouter);
app.use("/api/driver", driverRidesRouter);
app.use("/api/driver", driverBookingsRouter);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
