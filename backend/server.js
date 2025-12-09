const express = require("express");
const cors = require("cors");
/*
* Open directory in cmd
* npm install express cors
*/
const app = express();

// Enable CORS so the WAMP-served frontend (http://localhost) can call this API
app.use(cors({
    origin: "http://localhost",           // your WAMP origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware to parse JSON
app.use(express.json());

// Import trips router
const tripsRouter = require("./api/trip");
app.use("/api/trips", tripsRouter);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});