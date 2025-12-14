# How to Run Driver-Side Locally & Remotely

**Quick Reference Guide**

---

## ⚡ QUICK START (5 minutes to running)

### Prerequisite Check
```cmd
# Check MySQL is installed
mysql --version

# Check Node.js is installed
node --version
npm --version

# Navigate to project
cd c:\wamp64\www\Corosa
```

### Command Sequence (Open 3 terminals)

**Terminal 1: Start MySQL**
```cmd
# Option A: Via WAMP Manager
c:\wamp64\wampmanager.exe
# Click "Start All Services" or just MySQL

# Option B: Via Command Line (if MySQL installed standalone)
net start MySQL80
```

**Terminal 2: Start Node.js API Server**
```cmd
cd c:\wamp64\www\Corosa\backend
npm install                    # First time only
node server.js                 # Output: "Server running on http://localhost:3000"
```

**Terminal 3: Start Apache/PHP (if not running via WAMP)**
```cmd
# WAMP starts Apache automatically, otherwise:
c:\wamp64\bin\apache\apache2.4.X\bin\httpd.exe -k start
```

### Access in Browser
```
Frontend (PHP): http://localhost/Corosa/public/driver/pages/driver-Homepage.html
Node.js API:   http://localhost:3000 (backend only)
```

---

## 🔧 DETAILED ENVIRONMENT SETUP

### MySQL Configuration

**Location**: `c:\wamp64\www\Corosa\backend\config\database.php`

**Current Defaults**:
```php
'host' => 'localhost',
'user' => 'root',
'password' => '',              // Empty in WAMP by default
'database' => 'carpooling_db'  // Check this exists
```

**If MySQL credentials are different**:
1. Edit `backend/config/database.php`
2. Update host, user, password, database name
3. Restart Node.js server

**Create Database (First Time Only)**:
```sql
-- SSH into MySQL
mysql -u root

-- Run this
CREATE DATABASE carpooling_db;
USE carpooling_db;

-- Import schema
SOURCE c:/wamp64/www/Corosa/backend/database/schema.sql;
```

---

### Node.js Dependencies

**File**: `c:\wamp64\www\Corosa\backend\package.json`

**Required Packages**:
```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "mysql2": "^3.15.3"
  }
}
```

**Install**:
```cmd
cd c:\wamp64\www\Corosa\backend
npm install
```

**Verify**:
```cmd
ls node_modules  # Should show: cors, express, mysql2
```

---

### Environment Variables (Optional)

**For Production, create `.env` file**:
```
# c:\wamp64\www\Corosa\backend\.env

MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=carpooling_db
NODE_PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost
```

**Update server.js to use**:
```javascript
require('dotenv').config();  // Add this at top

const PORT = process.env.NODE_PORT || 3000;
```

---

## 📋 FULL STARTUP PROCEDURE (Recommended Order)

### Step 1: Verify Project Structure (2 minutes)
```cmd
cd c:\wamp64\www\Corosa

# Check directories exist
dir /s public\driver\pages
dir /s backend\api
dir /s backend\classes

# Check files exist
type backend\server.js
type backend\package.json
type backend\config\database.php
```

### Step 2: Install Dependencies (2 minutes)
```cmd
cd c:\wamp64\www\Corosa\backend
npm install
# Should complete with "added X packages"

# Verify
npm list
# Shows installed packages
```

### Step 3: Test MySQL Connection (2 minutes)
```cmd
# Check if MySQL running
tasklist | find "mysqld"
# Output: mysqld.exe should be listed

# Test connection
mysql -u root -h localhost
# Type: exit

# Or from Node.js:
cd c:\wamp64\www\Corosa\backend
node -e "const mysql = require('mysql2/promise'); console.log('MySQL installed')"
```

### Step 4: Start Services

**Terminal 1** (10 seconds):
```cmd
# Start WAMP
c:\wamp64\wampmanager.exe
# Wait for orange/green icons in system tray
```

**Terminal 2** (5 seconds):
```cmd
cd c:\wamp64\www\Corosa\backend
npm install          # Should be instant on subsequent runs
node server.js
# Output: "Server running on http://localhost:3000"
# Keep this terminal open
```

**Terminal 3** (Open browser):
```
Navigate to: http://localhost/Corosa/public/driver/pages/driver-Homepage.html
```

### Step 5: Test Functionality (3 minutes)

**In Browser DevTools (F12)**:
```javascript
// Check if dashboard data loads
// Should see stats populated in driver-Homepage

// Check if API calls work
fetch('../backend/api/driver.php?id=1')
  .then(r => r.json())
  .then(d => console.log(d))
// Should return driver data
```

**Check Console for Errors**:
```
F12 → Console → Should be empty or only warnings
```

---

## 🚀 RUNNING REMOTELY (Cloud/Server)

### Prerequisites
- Hosting provider with PHP + Node.js support (e.g., AWS, Azure, DigitalOcean)
- SSH access to server
- MySQL database (RDS or local)

### Deployment Steps

#### Option A: Traditional PHP Hosting + Separate Node.js

**1. Upload PHP Files**:
```bash
# Via FTP or git clone
sftp user@server.com
put -r public/ /var/www/html/Corosa/
put backend/api/driver/php/* /var/www/html/Corosa/backend/api/driver/php/
```

**2. Deploy Node.js on Separate Port**:
```bash
ssh user@server.com
cd /var/www/corosa/backend

# Install Node.js (if not present)
curl https://nodejs.org/dist/v18.0.0/node-v18.0.0-linux-x64.tar.xz | tar xJ

# Install dependencies
npm install

# Start with PM2 (process manager)
npm install -g pm2
pm2 start server.js --name "corosa-api"
pm2 save
```

**3. Update Frontend API Calls**:
```javascript
// In driver-Homepage.html, change:
fetch(`../backend/api/driver.php`)  // PHP endpoint

// To:
fetch(`http://api.yourserver.com:3000/api/driver`)  // Node.js endpoint

// Or use environment config:
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'http://api.yourserver.com:3000' 
  : 'http://localhost:3000'
```

**4. Configure CORS**:
```javascript
// In backend/server.js
app.use(cors({
  origin: "http://yourserver.com",  // Change from localhost
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
```

#### Option B: Full Node.js Stack (Recommended)

Migrate all PHP to Express.js, then deploy as single Node.js app:
```bash
# One-click deployment on Heroku, Vercel, AWS
node server.js
# All endpoints available at single URL
```

---

## ⚙️ CONFIGURATION BY ENVIRONMENT

### Local Development (Current Setup)

| Component | URL | Status |
|---|---|---|
| **Frontend** | http://localhost/Corosa/public/ | ✅ Apache |
| **Node.js API** | http://localhost:3000 | ✅ Running |
| **MySQL** | localhost:3306 | ✅ Local |
| **PHP API** | http://localhost/Corosa/backend/api/ | ✅ Apache |

**Config File**: `backend/config/database.php`
```php
'host' => 'localhost',
'user' => 'root',
'password' => '',
```

### Production (Remote Server)

| Component | URL | Status |
|---|---|---|
| **Frontend** | https://yourserver.com/corosa/ | HTTPS |
| **Node.js API** | https://api.yourserver.com:3000 | HTTPS |
| **MySQL** | managed-db.example.com:3306 | Remote RDS |
| **PHP API** | https://yourserver.com/api/ | HTTPS |

**Config File**: `backend/config/database.php`
```php
'host' => 'your-db-server.rds.amazonaws.com',
'user' => 'dbadmin',
'password' => 'secure-password',
'database' => 'carpooling_production'
```

---

## 🔌 PORTS & SERVICES

### Local Ports (Ensure Not in Use)

```
Port 80      : Apache (WAMP)         - http://localhost
Port 443     : HTTPS (Apache)
Port 3000    : Node.js API           - http://localhost:3000
Port 3306    : MySQL                 - localhost
```

**Check if Port is in Use**:
```cmd
netstat -ano | findstr :3000
# If shows: PID XXXX is using it
# Kill: taskkill /PID XXXX /F
```

### Firewall Rules (If Running on Network)

**Allow Remote Access to Node.js**:
```
Inbound Rule: Port 3000, TCP, All IPs → Allow
```

**Then Access From Another Machine**:
```
http://192.168.1.100:3000  (replace with your machine IP)
```

---

## 🧪 TESTING CHECKLIST

### After Startup (Run These Tests)

**1. MySQL Connection**:
```cmd
mysql -u root -e "SELECT 1;"
# Output: 1 (connection successful)
```

**2. Node.js Server**:
```
Browser: http://localhost:3000
Expected: Cannot GET / (expected, no root route)
```

**3. PHP Server**:
```
Browser: http://localhost/Corosa/public/
Expected: Index page loads
```

**4. Frontend Pages**:
```
Browser: http://localhost/Corosa/public/driver/pages/driver-Homepage.html
Expected: Dashboard loads, stats visible
```

**5. API Endpoints (Test in Browser Console)**:
```javascript
// Test Node.js API
fetch('http://localhost:3000/api/trips')
  .then(r => r.json())
  .then(d => console.log('Node.js OK', d))

// Test PHP API
fetch('http://localhost/Corosa/backend/api/driver.php?id=1')
  .then(r => r.json())
  .then(d => console.log('PHP OK', d))
```

**6. Authentication**:
```javascript
// Check localStorage has user data
console.log(localStorage.getItem('userData'))
// Output: {"id":1,"name":"John","role":"driver"}
```

---

## 🐛 TROUBLESHOOTING

### Issue: "Cannot connect to MySQL"

**Cause**: MySQL not running or wrong credentials

**Fix**:
```cmd
# Start MySQL
net start MySQL80

# Test connection
mysql -u root -h localhost
# If error: credentials wrong, update backend/config/database.php

# Restart Node.js
# (Terminal 2) Ctrl+C then: node server.js
```

---

### Issue: "Cannot GET localhost:3000"

**Cause**: Node.js server not running or port taken

**Fix**:
```cmd
# Check if running
tasklist | find "node"
# If not listed: start in Terminal 2

# Check port in use
netstat -ano | findstr :3000
# If showing a PID: kill it
taskkill /PID <PID> /F

# Restart Node.js
node server.js
```

---

### Issue: "CORS Error: Access denied"

**Cause**: Frontend and backend on different origins

**Fix**:
```javascript
// In backend/server.js
app.use(cors({
  origin: "http://localhost",  // Change if accessing from different host
  credentials: true             // Add this
}));

// Restart Node.js
```

---

### Issue: "Cannot POST /api/trips"

**Cause**: Endpoint not implemented

**Fix**:
```cmd
# Check backend/api/shared/js/trip.js exists
# Verify in server.js: app.use("/api/trips", tripsRouter);
# Restart: node server.js
```

---

## 📊 STARTUP VERIFICATION CHECKLIST

- [ ] MySQL running: `tasklist | find "mysqld"`
- [ ] Node.js running: `node -e "console.log('OK')"`
- [ ] Apache running: Browser shows http://localhost
- [ ] Port 3000 free: `netstat -ano | findstr :3000`
- [ ] Files exist: `dir backend/server.js`
- [ ] Dependencies installed: `dir node_modules/express`
- [ ] Database created: `mysql -e "USE carpooling_db; SHOW TABLES;"`
- [ ] Frontend loads: http://localhost/Corosa/public/driver/pages/
- [ ] API responds: http://localhost:3000 (shows "Cannot GET /")

---

## 🎯 SUMMARY

| Task | Command | Expected Output |
|---|---|---|
| **Start MySQL** | `net start MySQL80` | Service started |
| **Install Dependencies** | `npm install` | added X packages |
| **Start Node.js** | `node server.js` | Server running on localhost:3000 |
| **Check Frontend** | Browse to http://localhost/Corosa/ | Pages load |
| **Test API** | `fetch('http://localhost:3000/api/trips')` | JSON response |

**Time Required**:
- First time setup: 10-15 minutes
- Subsequent startups: 30 seconds

