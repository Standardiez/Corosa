# Technologies & Languages Documentation
## Corosa Carpooling Application

---

## Overview

The Corosa project is a full-stack web application for carpooling services at SLU Maryheights campus. It implements a modern web architecture using a combination of frontend and backend technologies to provide a comprehensive ride-sharing platform.

---

## Frontend Technologies

### **HTML5**
- **Usage**: Semantic markup for all user interfaces
- **Files**: `public/pages/*.html` (11 HTML files)
- **Features**:
  - Semantic HTML elements (`<header>`, `<main>`, `<section>`, etc.)
  - Form validation attributes
  - Accessibility attributes (ARIA labels, roles)
  - Mobile-responsive viewport meta tags
  - Modern HTML5 document structure

### **CSS3 (Vanilla)**
- **Usage**: Complete styling system without frameworks
- **File**: `public/styles/styles.css` (512+ lines)
- **Architecture**:
  - CSS Custom Properties (CSS Variables) for design system
  - Flexbox and Grid layouts
  - Modern CSS reset and normalization
  - Responsive design with media queries
  - Component-based styling approach
- **Features**:
  - HSL color system for consistency
  - Spacing system with rem units
  - Custom button and form components
  - Animation and transition effects
  - Mobile-first responsive design

### **JavaScript (ES6+)**
- **Usage**: Client-side application logic and interactivity
- **Files**: `public/js/*.js` (11 JavaScript files, ~3,200 lines total)
- **Modern Features**:
  - ES6+ syntax (arrow functions, destructuring, template literals)
  - Async/await for API calls
  - Fetch API for HTTP requests
  - Local/Session Storage for state management
  - DOM manipulation with modern APIs
  - Event delegation and handling
- **Patterns**:
  - IIFE (Immediately Invoked Function Expressions)
  - Module-like organization
  - Promise-based asynchronous programming
  - Object-oriented programming concepts

### **External JavaScript Libraries & APIs**

#### **Google Maps JavaScript API**
- **Usage**: Interactive maps and location services
- **Features**:
  - Real-time map rendering
  - Marker placement and customization
  - Directions API integration
  - Geocoding services
  - Route planning and visualization
  - Custom map controls and styling

#### **Boxicons**
- **Usage**: Icon library for UI elements
- **Integration**: CDN-based icon font
- **Features**: Scalable vector icons for buttons and interface elements

---

## Backend Technologies

### **PHP 7.4+**
- **Usage**: Server-side application logic and API endpoints
- **Architecture**: Object-Oriented Programming (OOP)
- **Files**:
  - `backend/api/*.php` (11 API endpoint files)
  - `backend/classes/*.php` (10 class files)
  - `backend/config/database.php` (Database configuration)

#### **PHP Features Used**:
- **Object-Oriented Programming**: Classes, inheritance, encapsulation
- **PDO (PHP Data Objects)**: Database abstraction layer
- **Exception Handling**: Try-catch error handling
- **JSON APIs**: RESTful API endpoints
- **Password Hashing**: Secure password storage
- **Session Management**: User authentication
- **Input Validation**: Security and data integrity

#### **API Architecture**:
- **RESTful Design**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **JSON Communication**: Request/response format
- **Error Handling**: Structured error responses
- **Authentication**: Token-based user sessions
- **CORS Support**: Cross-origin resource sharing

### **MySQL 8.0+**
- **Usage**: Relational database management system
- **File**: `backend/database/schema.sql`
- **Database Design**:
  - Normalized relational schema
  - Foreign key relationships
  - InnoDB storage engine
  - AUTO_INCREMENT primary keys
  - TIMESTAMP fields for audit trails
  - Referential integrity constraints

#### **Database Tables**:
- `users` - User account information
- `address` - Address information
- `emergency_contact` - Emergency contacts
- `driver` - Driver-specific data
- `vehicle` - Vehicle information
- `trip` - Trip/ride offerings
- `bookings` - Ride bookings
- `trip_assignment` - Booking-trip relationships
- `reviews` - Driver/ride reviews
- `history` - User activity history

---

## Development & Deployment Technologies

### **WAMP Stack**
- **W**indows - Operating system
- **A**pache - Web server
- **M**ySQL - Database server
- **P**HP - Server-side language

### **Docker Support**
- **File**: `Dockerfile.nodejs`
- **Purpose**: Containerization for Node.js applications
- **Features**:
  - Node.js 18 base image
  - Dependency management
  - Port exposure configuration
  - Production-ready container setup

### **Version Control**
- **Git**: Source code management
- **File**: `.gitignore` - Version control exclusions
- **Platform**: GitHub (Repository: kazryll/Corosa)

---

## Architecture Patterns

### **Frontend Architecture**
- **Pattern**: Single Page Application (SPA) characteristics
- **Navigation**: Client-side routing with `window.location.href`
- **State Management**: Browser storage (localStorage/sessionStorage)
- **Communication**: REST API calls via Fetch API
- **Error Handling**: User-friendly error messages and fallbacks

### **Backend Architecture**
- **Pattern**: Model-View-Controller (MVC) inspired
- **Models**: PHP classes (`backend/classes/`)
- **Controllers**: API endpoints (`backend/api/`)
- **Data Layer**: MySQL database with PDO
- **Security**: Input validation, password hashing, SQL injection prevention

### **Database Architecture**
- **Design**: Third Normal Form (3NF)
- **Relationships**: One-to-many and many-to-many relationships
- **Constraints**: Foreign keys, unique constraints, NOT NULL constraints
- **Indexing**: Primary keys and foreign key indexing

---

## Security Implementations

### **Frontend Security**
- **XSS Prevention**: DOM text content over innerHTML where possible
- **Input Validation**: Client-side form validation
- **Secure Storage**: Proper handling of sensitive data in localStorage
- **HTTPS**: Production deployment over secure connections

### **Backend Security**
- **SQL Injection Prevention**: PDO prepared statements
- **Password Security**: PHP password hashing (password_hash/password_verify)
- **Input Sanitization**: Data validation and cleaning
- **Error Handling**: Secure error messages without system exposure
- **Authentication**: Session-based user authentication

---

## API Integration

### **Third-Party APIs**
1. **Google Maps JavaScript API**
   - Real-time mapping and navigation
   - Geocoding and reverse geocoding
   - Directions and route optimization
   - Custom marker and polyline rendering

### **Internal API Endpoints**
- `GET/POST /api/users.php` - User management
- `GET/POST /api/login.php` - Authentication
- `GET/POST /api/bookings.php` - Ride bookings
- `GET/POST /api/trip.php` - Trip management
- `GET/POST /api/reviews.php` - Rating system
- `GET/POST /api/address.php` - Address management
- `GET/POST /api/driver.php` - Driver information
- `GET/POST /api/vehicle.php` - Vehicle management
- `GET/POST /api/trip_assignment.php` - Booking assignments
- `GET/POST /api/emergency_contact.php` - Emergency contacts
- `GET/POST /api/history.php` - User activity tracking

---

## Performance Considerations

### **Frontend Optimization**
- **Vanilla CSS**: No framework overhead
- **Optimized JavaScript**: Efficient DOM manipulation
- **Image Optimization**: Proper image formats and sizing
- **Caching**: Browser storage for user data and preferences
- **Lazy Loading**: Dynamic content loading where appropriate

### **Backend Optimization**
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Prepared Statements**: Query optimization and security
- **Error Caching**: Efficient error handling and logging

---

## Development Environment Setup

### **Requirements**
- **WAMP Server**: Apache 2.4+, MySQL 8.0+, PHP 7.4+
- **Modern Browser**: Chrome, Firefox, Safari, Edge (ES6+ support)
- **Google Maps API Key**: For mapping functionality
- **Git**: Version control system

### **Node.js Integration (Planned)**
- **Node.js 18+**: JavaScript runtime for server-side development
- **Purpose**: Real-time features and modern JavaScript backend services
- **Integration Strategy**: Hybrid approach alongside existing PHP backend

### **Optional Tools**
- **Docker**: For containerized deployment
- **VS Code**: Development environment with extensions

---

## Browser Compatibility

### **Supported Browsers**
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### **JavaScript Features Used**
- ES6+ syntax support required
- Fetch API support
- Local/Session Storage
- Modern DOM APIs
- CSS Grid and Flexbox support

---

## Node.js Integration Strategy

### **Current Architecture**
```
Frontend (HTML/CSS/JS) → PHP APIs → MySQL Database
```

### **Proposed Hybrid Architecture**
```
Frontend (HTML/CSS/JS) → PHP APIs (user management, bookings)
                       → Node.js Services (real-time features)
                       → Shared MySQL Database
```

### **Node.js Implementation Plan**

#### **Phase 1: Real-time Features**
- **WebSocket Server**: Live ride tracking updates
- **Socket.io**: Real-time communication between drivers and passengers
- **Event Broadcasting**: Ride status changes, location updates

#### **Phase 2: Enhanced Services**
- **Push Notifications**: Ride alerts and updates
- **Background Jobs**: Automated booking confirmations, reminders
- **API Gateway**: Route requests between PHP and Node.js services

#### **Phase 3: Gradual Migration (Optional)**
- **Authentication Service**: JWT-based auth replacing PHP sessions
- **Booking API**: Modern async/await patterns
- **Database ORM**: Sequelize or Prisma for MySQL interaction

### **Node.js Technology Stack**

#### **Core Technologies**
- **Express.js**: Web application framework
- **Socket.io**: Real-time bidirectional communication
- **MySQL2**: Modern MySQL driver with Promise support
- **JWT**: JSON Web Tokens for authentication
- **Nodemailer**: Email notifications
- **node-cron**: Scheduled tasks and background jobs

#### **Development Tools**
- **nodemon**: Development server with auto-restart
- **ESLint**: Code quality and style enforcement
- **Jest**: Unit testing framework
- **Postman**: API testing and documentation

### **Integration Benefits**
- **Real-time Updates**: Live ride tracking and notifications
- **Modern JavaScript**: Async/await, ES6+ features throughout stack
- **Performance**: Non-blocking I/O for concurrent operations
- **Scalability**: Microservices architecture for future growth
- **Developer Experience**: Single language across frontend and backend

### **Implementation Timeline**
1. **Week 1-2**: Set up Node.js development environment
2. **Week 3-4**: Implement WebSocket server for real-time tracking
3. **Week 5-6**: Add push notification service
4. **Week 7-8**: Create API gateway for hybrid architecture
5. **Week 9-10**: Testing and integration with existing PHP APIs

## Future Technology Considerations

### **Additional Enhancements**
- **Progressive Web App (PWA)**: Service workers, offline capability
- **Mobile Applications**: React Native leveraging Node.js APIs
- **Advanced Caching**: Redis for session storage and real-time data
- **CDN Integration**: Content delivery optimization
- **TypeScript**: Type safety across Node.js services
- **Container Orchestration**: Kubernetes for production deployment

---

*Documentation created: November 19, 2025*  
*Project: Corosa Carpooling Application*  
*Architecture: LAMP Stack (Linux/Apache/MySQL/PHP) + Modern JavaScript*