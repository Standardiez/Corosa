# Corosa Project Structure

## Overview
Corosa is a carpooling web application for SLU Maryheights campus with a clear separation between frontend and backend components.

## Directory Structure

```
Corosa/
├── 📁 backend/                     # Server-side PHP application
│   ├── 📁 api/                     # REST API endpoints
│   │   ├── address.php             # Address management API
│   │   ├── bookings.php            # Ride booking API
│   │   ├── driver.php              # Driver information API
│   │   ├── emergency_contact.php   # Emergency contacts API
│   │   ├── history.php             # User activity history API
│   │   ├── login.php               # Authentication API
│   │   ├── reviews.php             # Rating and review API
│   │   ├── trip.php                # Trip management API
│   │   ├── trip_assignment.php     # Booking assignments API
│   │   ├── users.php               # User management API
│   │   └── vehicle.php             # Vehicle information API
│   │
│   ├── 📁 classes/                 # PHP OOP classes (Models)
│   │   ├── Address.php             # Address data model
│   │   ├── Bookings.php            # Booking management class
│   │   ├── Driver.php              # Driver data model
│   │   ├── EmergencyContact.php    # Emergency contact model
│   │   ├── History.php             # User history model
│   │   ├── Reviews.php             # Review and rating model
│   │   ├── Trip.php                # Trip data model
│   │   ├── TripAssignment.php      # Assignment management class
│   │   ├── User.php                # User data model
│   │   └── Vehicle.php             # Vehicle data model
│   │
│   ├── 📁 config/                  # Configuration files
│   │   └── database.php            # MySQL database configuration
│   │
│   └── 📁 database/                # Database schema
│       └── schema.sql              # MySQL database structure
│
├── 📁 public/                      # Frontend web application
│   ├── 📁 assets/                  # Static assets
│   │   ├── corosa-logo.png         # Application logo
│   │   └── slu-maryheights-campus.jpg # Campus background image
│   │
│   ├── 📁 instructions/            # Development guidelines
│   │   └── css-design-guide.txt    # CSS styling guidelines
│   │
│   ├── 📁 js/                      # JavaScript application logic
│   │   ├── header-auth.js          # Header authentication logic
│   │   ├── login.js                # Login form functionality
│   │   ├── rate-and-review.js      # Review system interface
│   │   ├── rate-driver.js          # Driver rating widget
│   │   ├── request-ride.js         # Ride request interface
│   │   ├── ride-confirmation.js    # Booking confirmation logic
│   │   ├── ride-status.js          # Real-time ride tracking
│   │   ├── select-dropoff.js       # Drop-off location picker
│   │   ├── select-pickup.js        # Pickup location picker
│   │   ├── signup.js               # User registration form
│   │   └── user-profile.js         # User profile management
│   │
│   ├── 📁 pages/                   # HTML user interfaces
│   │   ├── index.html              # Landing page
│   │   ├── login.html              # User login page
│   │   ├── signup.html             # User registration page
│   │   ├── select-pickup.html      # Pickup location selection
│   │   ├── select-dropoff.html     # Drop-off location selection
│   │   ├── request-ride.html       # Available rides listing
│   │   ├── ride-confirmation.html  # Booking confirmation
│   │   ├── ride-status.html        # Live ride tracking
│   │   ├── rate-driver.html        # Driver rating interface
│   │   ├── RateAndReview.html      # Review submission page
│   │   └── user-profile.html       # User profile page
│   │
│   ├── 📁 scripts/                 # Additional scripts (empty)
│   │
│   └── 📁 styles/                  # CSS stylesheets
│       └── styles.css              # Main application stylesheet
│
├── 📁 .vscode/                     # VS Code configuration
│   └── settings.json               # Editor settings
│
├── 📄 .gitignore                   # Git ignore rules
├── 📄 CARPOOLING_BOOKING_FLOW_ANALYSIS.md # Booking flow documentation
├── 📄 COMPLETE_API_DOCUMENTATION.md # API reference guide
├── 📄 DOM_API_ANALYSIS.md          # Frontend DOM usage analysis
├── 📄 RIDE_CONFIRMATION_ANALYSIS.md # Confirmation process analysis
└── 📄 TECHNOLOGIES_DOCUMENTATION.md # Technology stack documentation
```

## Architecture Layers

### **Frontend Layer** (`public/`)
- **Pages**: 11 HTML files for user interfaces
- **Scripts**: 11 JavaScript files for client-side logic
- **Styles**: Vanilla CSS with design system
- **Assets**: Images and static resources

### **Backend Layer** (`backend/`)
- **API Endpoints**: 11 PHP files providing REST services
- **Data Models**: 10 PHP classes for business logic
- **Configuration**: Database and server settings
- **Database Schema**: MySQL table definitions

### **Documentation Layer** (Root)
- Technical analysis documents
- API documentation
- Development guidelines
- Project specifications

## Key Features by Directory

| Directory | Purpose | Key Technologies |
|-----------|---------|------------------|
| `backend/api/` | REST API endpoints | PHP, JSON, MySQL |
| `backend/classes/` | Data models & business logic | PHP OOP, PDO |
| `public/pages/` | User interface views | HTML5, Semantic markup |
| `public/js/` | Client-side functionality | ES6+ JavaScript, Fetch API |
| `public/styles/` | Visual design system | CSS3, Custom properties |
| `backend/database/` | Data persistence layer | MySQL, Relational schema |

## Data Flow

```
Frontend (HTML/JS/CSS) ↔ API Endpoints (PHP) ↔ Data Models (PHP Classes) ↔ Database (MySQL)
```

## Development Environment

- **Server**: WAMP Stack (Windows, Apache, MySQL, PHP)
- **Frontend**: Modern browsers with ES6+ support
- **Database**: MySQL 8.0+ with InnoDB engine
- **Version Control**: Git with GitHub integration

---

*Structure documented: November 19, 2025*  
*Total Files: 50+ across frontend, backend, and documentation*  
*Architecture: Full-stack web application with REST API*