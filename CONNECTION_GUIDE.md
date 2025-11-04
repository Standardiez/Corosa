# Corosa Frontend-Backend Connection Guide

This guide will help you connect the frontend to the backend API and test the PostgreSQL database connection.

## 📋 Prerequisites

1. **PostgreSQL** installed and running
2. **PHP** (version 7.4 or higher) with PDO PostgreSQL extension
3. **Web server** (PHP built-in server, XAMPP, WAMP, or Apache)

## 🗄️ Database Setup

### Step 1: Create PostgreSQL Database

1. Open PostgreSQL command line or pgAdmin
2. Create the database:
   ```sql
   CREATE DATABASE corosa_db;
   ```

3. Connect to the database:
   ```sql
   \c corosa_db;
   ```

### Step 2: Run the Schema

1. Navigate to the project directory:
   ```bash
   cd backend/database
   ```

2. Run the SQL schema:
   ```bash
   psql -U postgres -d corosa_db -f schema.sql
   ```
   
   Or if using pgAdmin, open `backend/database/schema.sql` and execute it.

### Step 3: Verify Database Connection

1. Check your database credentials in `backend/config/database.php`:
   ```php
   private $host = 'localhost';
   private $port = '5432';
   private $db_name = 'corosa_db';
   private $username = 'postgres';
   private $password = 'admin123'; // Update this if needed
   ```

2. Test the database connection by running:
   ```bash
   php backend/test-database.php
   ```
   
   Or visit in browser:
   ```
   http://localhost:8000/backend/test-database.php
   ```

   You should see a JSON response with database information, tables, and sample data.

## 🚀 Backend Setup

### Option 1: PHP Built-in Server (Recommended for Development)

1. Navigate to the project root:
   ```bash
   cd C:\Users\My PC\Corosa
   ```

2. Start the PHP server:
   ```bash
   php -S localhost:8000
   ```

3. The backend API will be available at:
   ```
   http://localhost:8000/backend/api/
   ```

### Option 2: XAMPP/WAMP

1. Copy the project to your web server directory:
   - XAMPP: `C:\xampp\htdocs\corosa`
   - WAMP: `C:\wamp\www\corosa`

2. Access via:
   ```
   http://localhost/corosa/backend/api/
   ```

## 🎨 Frontend Setup

### Step 1: Configure API Base URL

1. Open `public/src/scripts/api-config.js`
2. Update the `API_BASE_URL` constant:

   **For PHP built-in server:**
   ```javascript
   const API_BASE_URL = 'http://localhost:8000/backend';
   ```

   **For XAMPP/WAMP:**
   ```javascript
   const API_BASE_URL = 'http://localhost/corosa/backend';
   ```

### Step 2: Install Frontend Dependencies

1. Navigate to the public directory:
   ```bash
   cd public
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Step 3: Build Tailwind CSS

1. Build the CSS (one-time):
   ```bash
   npm run build
   ```

2. Or watch for changes during development:
   ```bash
   npm run build:css
   ```

### Step 4: Start the Frontend

1. Start the live server:
   ```bash
   npm start
   ```

   Or use any static file server:
   ```bash
   # Using Python
   python -m http.server 3000
   
   # Using Node.js http-server
   npx http-server public/src -p 3000
   ```

2. Open your browser:
   ```
   http://localhost:3000/pages/index.html
   ```

## 🧪 Testing the Connection

### Test 1: Database Connection

1. Run the database test script:
   ```bash
   php backend/test-database.php
   ```

2. Expected output:
   ```json
   {
     "success": true,
     "message": "Database connection successful!",
     "results": {
       "database_connection": true,
       "tables": ["address", "user", "driver", ...],
       "table_counts": {...},
       "sample_data": {...}
     }
   }
   ```

### Test 2: API Endpoints

Test the API endpoints directly:

1. **Get all trips:**
   ```
   http://localhost:8000/backend/api/trip.php
   ```

2. **Get all users:**
   ```
   http://localhost:8000/backend/api/users.php
   ```

3. **Get all bookings:**
   ```
   http://localhost:8000/backend/api/bookings.php
   ```

### Test 3: Frontend-Backend Integration

1. Open the frontend in your browser
2. Navigate to the "Find Ride" page
3. Open browser DevTools (F12) → Network tab
4. You should see API calls to `http://localhost:8000/backend/api/trip.php`
5. Check the Console tab for any errors

## 🔧 Troubleshooting

### Database Connection Issues

**Problem:** "Connection error: could not connect to server"

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   # Windows
   services.msc → Check PostgreSQL service
   ```

2. Check credentials in `backend/config/database.php`

3. Verify database exists:
   ```sql
   \l  -- List all databases
   ```

### CORS Issues

**Problem:** "Access to fetch blocked by CORS policy"

**Solution:** The backend already has CORS headers set. If you still see issues:
1. Check that the API base URL in `api-config.js` matches your backend URL
2. Ensure both frontend and backend are running on the same protocol (http/https)

### API Not Found

**Problem:** "404 Not Found" when accessing API endpoints

**Solutions:**
1. Verify the backend server is running
2. Check the API base URL in `api-config.js`
3. Ensure the file paths are correct (case-sensitive on Linux)

### No Rides Displaying

**Problem:** Frontend shows "No rides available"

**Solutions:**
1. Check browser console for errors
2. Verify database has trip data:
   ```sql
   SELECT * FROM trip;
   ```
3. Check API response:
   ```
   http://localhost:8000/backend/api/trip.php
   ```

## 📝 API Endpoints Reference

### Trips
- `GET /backend/api/trip.php` - Get all trips
- `GET /backend/api/trip.php?trip_id=1` - Get trip by ID
- `GET /backend/api/trip.php?driver_id=1` - Get trips by driver
- `POST /backend/api/trip.php` - Create new trip

### Users
- `GET /backend/api/users.php` - Get all users
- `GET /backend/api/users.php?user_id=1` - Get user by ID
- `GET /backend/api/users.php?email=user@example.com` - Get user by email
- `POST /backend/api/users.php` - Create new user

### Bookings
- `GET /backend/api/bookings.php` - Get all bookings
- `GET /backend/api/bookings.php?booking_id=1` - Get booking by ID
- `GET /backend/api/bookings.php?passenger_id=1` - Get bookings by passenger
- `POST /backend/api/bookings.php` - Create new booking

## 🎯 Next Steps

1. ✅ Database setup and testing
2. ✅ Backend API running
3. ✅ Frontend connected to backend
4. ⏭️ Add authentication (if needed)
5. ⏭️ Add error handling improvements
6. ⏭️ Add loading states and user feedback
7. ⏭️ Implement booking functionality

## 📞 Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Check the PHP error logs
3. Verify all prerequisites are installed
4. Test each component individually (database → API → frontend)

---

**Happy Coding! 🚀**

