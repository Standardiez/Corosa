# Node.js Integration Guide for Corosa Project

## Overview

This document outlines the integration of Node.js into the existing Corosa carpooling application, which currently uses a PHP/MySQL backend with vanilla JavaScript frontend.

## What is Node.js?

**Node.js** is a JavaScript runtime built on Chrome's V8 engine that enables server-side JavaScript execution. Key characteristics:

- **Event-driven, non-blocking I/O**: Handles multiple concurrent operations efficiently
- **Single-threaded event loop**: Optimized for I/O-intensive applications
- **NPM ecosystem**: Access to 1.5+ million packages
- **Real-time capabilities**: Excellent for live updates and WebSocket connections
- **JavaScript everywhere**: Same language for frontend and backend

## Why Integrate Node.js into Corosa?

### **Current Limitations**
- **No real-time updates**: Users must refresh to see ride status changes
- **Limited concurrent handling**: PHP's synchronous nature
- **Complex asynchronous operations**: Difficult to implement in PHP
- **Modern JavaScript features**: Limited to frontend only

### **Node.js Benefits**
- **Real-time ride tracking**: Live location updates for passengers
- **Push notifications**: Instant alerts for ride confirmations, cancellations
- **Better performance**: Handle multiple concurrent bookings efficiently
- **Modern development**: Async/await patterns throughout the stack
- **Unified language**: JavaScript across frontend and backend

## Integration Strategy: Hybrid Architecture

### **Recommended Approach**
Keep existing PHP backend for core features while adding Node.js for enhanced functionality.

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
│              (HTML/CSS/JavaScript)                      │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌─────────────┐              ┌─────────────┐
│ PHP Backend │              │ Node.js     │
│             │              │ Services    │
│ • Users     │              │             │
│ • Bookings  │              │ • WebSocket │
│ • Auth      │              │ • Real-time │
│ • Reviews   │              │ • Push      │
│             │              │ • Jobs      │
└─────────────┘              └─────────────┘
        │                           │
        └─────────────┬─────────────┘
                      ▼
              ┌─────────────┐
              │    MySQL    │
              │  Database   │
              └─────────────┘
```

## Implementation Plan

### **Phase 1: Setup & Real-time Tracking (Weeks 1-4)**

#### **Step 1: Environment Setup**
```bash
# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express socket.io mysql2 cors dotenv
npm install -D nodemon concurrently
```

#### **Step 2: Basic Express Server**
```javascript
// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost", // Your frontend URL
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Real-time tracking endpoint
app.post('/api/location-update', (req, res) => {
  const { rideId, driverId, location } = req.body;
  
  // Broadcast location update to passengers
  io.to(`ride-${rideId}`).emit('locationUpdate', {
    driverId,
    location,
    timestamp: new Date()
  });
  
  res.json({ success: true });
});

server.listen(3000, () => {
  console.log('Node.js server running on port 3000');
});
```

#### **Step 3: WebSocket Integration**
```javascript
// Handle real-time connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join ride room for real-time updates
  socket.on('joinRide', (rideId) => {
    socket.join(`ride-${rideId}`);
    console.log(`User joined ride ${rideId}`);
  });

  // Handle driver location updates
  socket.on('driverLocationUpdate', (data) => {
    socket.to(`ride-${data.rideId}`).emit('locationUpdate', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
```

### **Phase 2: Frontend Integration (Week 5)**

#### **Update ride-status.js**
```javascript
// Add to existing ride-status.js
const socket = io('http://localhost:3000');

// Connect to ride room for real-time updates
const rideId = sessionStorage.getItem('rideId');
if (rideId) {
  socket.emit('joinRide', rideId);
}

// Listen for real-time location updates
socket.on('locationUpdate', (data) => {
  // Update car marker position on map
  if (carMarker) {
    carMarker.setPosition(data.location);
    map.panTo(data.location);
  }
  
  // Update UI with timestamp
  document.getElementById('last-update').textContent = 
    `Last update: ${new Date(data.timestamp).toLocaleTimeString()}`;
});
```

### **Phase 3: Push Notifications (Weeks 6-7)**

#### **Notification Service**
```javascript
// notifications.js
const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendBookingConfirmation(userEmail, bookingDetails) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Ride Booking Confirmed - Corosa',
      html: `
        <h2>Your ride has been confirmed!</h2>
        <p>Booking ID: ${bookingDetails.bookingId}</p>
        <p>Pickup: ${bookingDetails.pickup}</p>
        <p>Dropoff: ${bookingDetails.dropoff}</p>
        <p>Driver: ${bookingDetails.driverName}</p>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendRideReminder(userEmail, rideDetails) {
    // Implementation for ride reminders
  }
}

module.exports = NotificationService;
```

### **Phase 4: Background Jobs (Week 8)**

#### **Scheduled Tasks**
```javascript
// jobs.js
const cron = require('node-cron');
const mysql = require('mysql2/promise');

// Send ride reminders 30 minutes before pickup
cron.schedule('*/5 * * * *', async () => {
  console.log('Checking for upcoming rides...');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'corosa_db'
  });

  const [upcomingRides] = await connection.execute(`
    SELECT b.*, u.email, u.first_name 
    FROM bookings b 
    JOIN users u ON b.passenger_id = u.user_id 
    WHERE b.pickup_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 MINUTE)
    AND b.reminder_sent = 0
  `);

  for (const ride of upcomingRides) {
    // Send reminder notification
    await notificationService.sendRideReminder(ride.email, ride);
    
    // Mark reminder as sent
    await connection.execute(
      'UPDATE bookings SET reminder_sent = 1 WHERE booking_id = ?',
      [ride.booking_id]
    );
  }

  await connection.end();
});
```

## File Structure Updates

### **New Node.js Files**
```
Corosa/
├── 📁 nodejs/                      # New Node.js backend
│   ├── 📄 server.js               # Main Express server
│   ├── 📄 package.json            # Node.js dependencies
│   ├── 📁 services/               # Business logic services
│   │   ├── notification.js        # Email/push notifications
│   │   ├── realtime.js            # WebSocket handling
│   │   └── jobs.js                # Background scheduled tasks
│   ├── 📁 routes/                 # API route handlers
│   │   ├── tracking.js            # Real-time tracking endpoints
│   │   └── notifications.js       # Notification endpoints
│   └── 📁 config/                 # Node.js configuration
│       └── database.js            # MySQL connection for Node.js
│
├── 📁 backend/                    # Existing PHP backend (unchanged)
└── 📁 public/                     # Frontend (minimal changes)
```

### **Updated Frontend Files**
- `ride-status.js`: Add Socket.io integration
- `request-ride.js`: Real-time ride availability updates
- `ride-confirmation.js`: Connect to notification service

## Development Environment Setup

### **Prerequisites**
- Node.js 18+ installed
- Existing WAMP server running
- MySQL database accessible from Node.js

### **Installation Steps**
```bash
# 1. Navigate to project root
cd C:\wamp64\www\Corosa

# 2. Create Node.js directory
mkdir nodejs && cd nodejs

# 3. Initialize Node.js project
npm init -y

# 4. Install dependencies
npm install express socket.io mysql2 cors dotenv nodemailer node-cron
npm install -D nodemon concurrently eslint

# 5. Update package.json scripts
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  }
}
```

### **Running Both Servers**
```bash
# Terminal 1: Start WAMP (existing PHP server)
# Access via: http://localhost/Corosa

# Terminal 2: Start Node.js server
cd nodejs
npm run dev
# Access via: http://localhost:3000
```

## Benefits After Integration

### **For Users**
- **Real-time ride tracking**: See driver location updates live
- **Instant notifications**: Email/SMS alerts for bookings
- **Better responsiveness**: Faster updates without page refresh
- **Improved reliability**: Better handling of concurrent operations

### **For Developers**
- **Modern JavaScript**: Consistent language across stack
- **Better debugging**: Advanced Node.js debugging tools
- **Scalable architecture**: Microservices approach
- **Rich ecosystem**: Access to npm packages

### **For System**
- **Performance**: Non-blocking I/O for better concurrency
- **Maintainability**: Modular, service-based architecture
- **Extensibility**: Easy to add new real-time features
- **Future-ready**: Foundation for mobile apps and PWAs

## Migration Considerations

### **Database Compatibility**
- Node.js connects to same MySQL database
- No schema changes required initially
- Gradual migration of data access patterns

### **Authentication**
- Phase 1: Use existing PHP session validation
- Phase 2: Implement JWT tokens for Node.js services
- Phase 3: Unified authentication system

### **Error Handling**
- Implement proper error boundaries
- Graceful fallbacks when Node.js services unavailable
- Consistent error messaging across PHP and Node.js

## Testing Strategy

### **Unit Testing**
```javascript
// tests/notification.test.js
const NotificationService = require('../services/notification');

describe('NotificationService', () => {
  test('should send booking confirmation email', async () => {
    const service = new NotificationService();
    const result = await service.sendBookingConfirmation(
      'test@example.com',
      { bookingId: 123, pickup: 'SLU Main', dropoff: 'SM Baguio' }
    );
    expect(result).toBeTruthy();
  });
});
```

### **Integration Testing**
- Test WebSocket connections
- Verify database connectivity
- Test API endpoint compatibility with existing frontend

## Deployment Considerations

### **Development**
- Run both PHP and Node.js servers locally
- Use nodemon for auto-restart during development

### **Production**
- Use PM2 for Node.js process management
- Configure reverse proxy (Nginx) for routing
- Set up environment variables for configuration
- Implement logging and monitoring

---

*Integration Guide created: November 19, 2025*  
*Recommended Timeline: 8-10 weeks for full implementation*  
*Architecture: Hybrid PHP + Node.js with shared MySQL database*