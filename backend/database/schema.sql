-- Corosa Database Schema
-- MySQL Database Setup — final ERD-aligned version

-- Create database (run this first)
CREATE DATABASE IF NOT EXISTS corosa_db;
USE corosa_db;

-- ADDRESS
CREATE TABLE IF NOT EXISTS address (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    address_street VARCHAR(255),
    address_barangay VARCHAR(255),
    address_unit VARCHAR(255)
) ENGINE=InnoDB;

-- EMERGENCY_CONTACT
CREATE TABLE IF NOT EXISTS emergency_contact (
    contact_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- HISTORY
CREATE TABLE IF NOT EXISTS history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- USERS
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_initial VARCHAR(10),
    last_name VARCHAR(100) NOT NULL,
    birthdate DATE,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile_number VARCHAR(20),
    address_id INT,
    disabilities TEXT,
    employment_status VARCHAR(50),
    account_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hashed_password VARCHAR(255) NOT NULL,
    FOREIGN KEY (address_id) REFERENCES address(address_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- DRIVER
CREATE TABLE IF NOT EXISTS driver (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    driver_license_image VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- VEHICLE
CREATE TABLE IF NOT EXISTS vehicle (
    plate_number VARCHAR(20) PRIMARY KEY,
    driver_id INT,
    vehicle_model VARCHAR(100),
    seat_capacity INT,
    vehicle_status VARCHAR(50) DEFAULT 'available',
    FOREIGN KEY (driver_id) REFERENCES driver(driver_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- TRIP
CREATE TABLE IF NOT EXISTS trips (
    trip_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT,
    end_lat DECIMAL(10,8),
    end_long DECIMAL(11,8),
    start_lat DECIMAL(10,8),
    start_long DECIMAL(11,8),
    available_seats INT,
    ride_distance DECIMAL(10,2),
    ride_status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES driver(driver_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    passenger_id INT,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_lat DECIMAL(10,8),
    end_long DECIMAL(11,8),
    start_lat DECIMAL(10,8),
    start_long DECIMAL(11,8),
    payment_type VARCHAR(50),
    total_cost DECIMAL(10,2),
    booking_confirmation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (passenger_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- TRIP_ASSIGNMENT
CREATE TABLE IF NOT EXISTS trip_assignment (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    trip_id INT,
    seat_number INT,
    assignment_status VARCHAR(50) DEFAULT 'confirmed',
    payment_type VARCHAR(50),
    total_cost DECIMAL(10,2),
    booking_confirmation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    rating INT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Indexes for faster geolocation queries (optional)
CREATE INDEX idx_trips_start ON trips(start_lat, start_long);
CREATE INDEX idx_trips_end ON trips(end_lat, end_long);
CREATE INDEX idx_bookings_start ON bookings(start_lat, start_long);
CREATE INDEX idx_bookings_end ON bookings(end_lat, end_long);

-- Sample Data (users must be inserted after users table exists)
INSERT INTO users (first_name, middle_initial, last_name, birthdate, email, mobile_number, address_id, disabilities, employment_status, account_status, hashed_password) VALUES
('John', 'A', 'Doe', '2000-05-15', '2253123@slu.edu.ph', '+9923232131', NULL, 'None', 'student', 'active', '$2y$10$'),
('Jane', 'B', 'Smith', '1999-08-22', '2243215@slu.edu.ph', '+9982372372', NULL, 'None', 'student', 'active', '$2y$10$');

INSERT INTO driver (user_id, driver_license_image) VALUES
(1, 'john_license.png');

INSERT INTO vehicle (plate_number, driver_id, vehicle_model, seat_capacity, vehicle_status) VALUES
('ABC-1234', 1, 'Toyota Vios 2018', 4, 'available');

INSERT INTO trips (driver_id, start_lat, start_long, end_lat, end_long, available_seats, ride_distance, ride_status) VALUES
(1, 16.4023, 120.5960, 16.4080, 120.5969, 3, 2.5, 'scheduled');

INSERT INTO bookings (passenger_id, start_lat, start_long, end_lat, end_long, payment_type, total_cost, booking_confirmation) VALUES
(2, 16.4023, 120.5960, 16.4080, 120.5969, 'Cash', 50.00, TRUE);

