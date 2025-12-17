const express = require("express");
const cors = require("cors");
const path = require("path");

/*
 * Open directory in cmd
 * npm install express cors multer mysql2
 */
const app = express();

// Enable CORS - Allow requests from localhost, Docker frontend, and LAN IPs
// For LAN access, we'll allow all origins in development (restrict in production)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from environment or use defaults
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost', 'http://localhost:8080', 'http://127.0.0.1', 'http://127.0.0.1:8080'];
    
    // Allow if origin is in allowed list, or if it's a local network IP (for LAN access)
    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed)) ||
                     /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
                     /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
                     /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin);
    
    callback(null, isAllowed);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));

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

// Mount routes
app.use("/api/trips", tripsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/trip-assignments", tripAssignmentsRouter);
app.use("/api/vehicle", vehicleRouter);
app.use("/api/driver", driverRegistrationRouter);
app.use("/api/driver", driverRidesRouter);
app.use("/api", driverBookingsRouter); // Bookings at /api level (POST /api/bookings)

// Start server - bind to 0.0.0.0 for LAN access
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`CORS enabled for: ${process.env.CORS_ORIGIN || 'localhost and LAN IPs'}`);
});
