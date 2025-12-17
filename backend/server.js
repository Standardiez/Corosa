const express = require("express");
const cors = require("cors");
const path = require("path");

/*
 * Open directory in cmd
 * npm install express cors multer mysql2
 */
const app = express();

// Enable CORS for all origins during development
// This allows access from localhost, Docker, and LAN IPs (e.g., 192.168.x.x)
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Middleware for file uploads
app.use(express.urlencoded({ extended: true }));

// Import routers
const tripsRouter = require("./api/shared/js/trip");
const bookingsRouter = require("./api/pasenger/php/bookings");
const tripAssignmentsRouter = require("./api/shared/js/trip-assignment");
const vehicleRouter = require("./api/shared/js/vehicle");

const driverRegistrationRouter = require("./server/routes/driver-registration");
const driverRidesRouter = require("./server/routes/driver-rides");
const driverBookingsRouter = require("./server/routes/driver-bookings");
const passengerRideDetailsRouter = require("./server/routes/passenger-ride-details");
const passengerReviewsRouter = require("./server/routes/passenger-reviews");
const adminRouter = require("./server/routes/admin");

// Mount routes
app.use("/api/trips", tripsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/trip-assignments", tripAssignmentsRouter);
app.use("/api/vehicle", vehicleRouter);

app.use("/api/driver", driverRegistrationRouter);
app.use("/api/driver", driverRidesRouter);
app.use("/api", driverBookingsRouter); // Bookings at /api level (POST /api/bookings)

// Passenger ride details + reviews (used by ride-status page)
app.use("/api/passenger", passengerRideDetailsRouter);
app.use("/api/reviews", passengerReviewsRouter);

// Admin routes
app.use("/api/admin", adminRouter);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
