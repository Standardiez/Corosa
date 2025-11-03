-- Corosa Database Schema
-- PostgreSQL Database Setup for University Carpooling App

-- Create database (run this first)
-- CREATE DATABASE corosa_db;

-- Connect to the database
-- \c corosa_db;

-- USER Table ; ONLY contains user data
CREATE TABLE IF NOT EXISTS user (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_initial VARCHAR(10),
    last_name VARCHAR(100) NOT NULL,
    birthdate DATE,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile_number VARCHAR(11),
    address_id INT REFERENCES address(address_id) ON DELETE SET NULL,
    disabilities TEXT,
    employment_status VARCHAR(50),
    account_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hashed_password VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
CREATE INDEX IF NOT EXISTS idx_user_status ON user(account_status);

INSERT INTO user (first_name, middle_initial, last_name, birthdate, email, mobile_number, 
emergency_contact_id, address_id, disabilities, employment_status, account_status, hashed_password) VALUES
('John', 'A', 'Doe', '2000-05-15', '2253123@slu.edu.ph', '+9923232131', 1, 1, 'None', 'student', 'active', '$2y$10$'),
('Jane', 'B', 'Smith', '1999-08-22', '2243215@slu.edu.ph', '+9982372372', 2, 2, 'None', 'student', 'active', '$2y$10$'),
('Ethan', 'C', 'Winters', '1998-12-05', 'WintersDaddy@slu.edu.ph', '+9923456789', 3, 3, NULL, 'faculty', 'active', '$2y$10$'),
('David', 'D', 'Martinez', '2001-03-10', 'cyberpunk@slu.edu.ph', '+9932145678', 1, 2, 'faculty', 'student', 'active', '$2y$10$'),
('Lee', 'G', 'Hoon', '1997-09-09', 'woozi@slu.edu.ph', '+9945678123', 2, 1, NULL, 'staff', 'active', '$2y$10$');

-- DRIVER Table ; ONLY contains users THAT ARE drivers
CREATE TABLE IF NOT EXISTS driver (
    driver_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES user(user_id) ON DELETE CASCADE,
    driver_license_image VARCHAR(255)
);

-- Sample Data
INSERT INTO driver (user_id, driver_license_image) VALUES
(1, 'john_license.png'),
(3, 'ethan_license.png');

-- VEHICLE Table ; Contains vehicle data
CREATE TABLE IF NOT EXISTS vehicle (
    plate_number VARCHAR(20) PRIMARY KEY,
    driver_id INT REFERENCES driver(driver_id) ON DELETE CASCADE,
    vehicle_model VARCHAR(100),
    seat_capacity INT CHECK (seat_capacity > 0),
    vehicle_status VARCHAR(50) DEFAULT 'available'
);

-- Sample Data
INSERT INTO vehicle (plate_number, driver_id, vehicle_model, seat_capacity, vehicle_status) VALUES
('ABC-1234', 1, 'Toyota Vios 2018', 4, 'available'),
('PEO-763', 2, 'Toyota Wigo 2024', 3, 'available');

-- ADDRESS Table ; Contains user address
CREATE TABLE IF NOT EXISTS address (
    address_id SERIAL PRIMARY KEY,
    address_street VARCHAR(255),
    address_barangay VARCHAR(255),
    address_unit VARCHAR(255)
);

-- Sample Data
INSERT INTO address (address_street, address_barangay, address_unit) VALUES
('Maryheights Road', 'San Luis', 'Unit 2B'),
('Pines Avenue', 'Camp 7', 'Block 5 Lot 10'),
('University Drive', 'Greenhills', 'Dorm 3-Room 4');

-- EMERGENCY_CONTACT Table ; Contains emergency contacts of users
CREATE TABLE emergency_contact (
    contact_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20) NOT NULL
);

-- Sample Data
INSERT INTO emergency_contact (user_id, contact_name, contact_number) VALUES
(1, 'Hannah Montana', '+639101112233'),
(1, 'Marco Santos', '+639121314151'),
(2, 'Liza Rivera', '+639161718192');

-- TRIP Table ; Contains the travel data
CREATE TABLE IF NOT EXISTS trip (
    trip_id SERIAL PRIMARY KEY,
    driver_id INT REFERENCES driver(driver_id) ON DELETE CASCADE,
    starting_location VARCHAR(255) NOT NULL,
    end_location VARCHAR(255) NOT NULL,
    available_seats INT CHECK (available_seats >= 0),
    ride_distance NUMERIC(10,2),
    ride_status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data
INSERT INTO trip (driver_id, starting_location, end_location, available_seats, ride_distance, ride_status) VALUES
(1, 'Maryheights', 'University Main Gate', 3, 2.5, 'scheduled'),
(2, 'Camp 7', 'Maryheights', 2, 3.8, 'scheduled');

-- BOOKINGS Table ; Contains the bookings data done by a user
CREATE TABLE IF NOT EXISTS bookings (
    booking_id SERIAL PRIMARY KEY,
    passenger_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pick_up_location VARCHAR(255),
    drop_off_location VARCHAR(255),
    payment_type VARCHAR(50),
    total_cost NUMERIC(10,2),
    booking_confirmation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data
INSERT INTO bookings (passenger_id, pick_up_location, drop_off_location, payment_type, total_cost, booking_confirmation) VALUES
(2, 'Gate 3', 'Main Gate', 'Cash', 50.00, TRUE),
(2, 'Dorm 3', 'Camp 7', 'GCash', 75.00, TRUE);

-- TRIP_ASSIGNMENT Table ; Bridges the TRIP and BOOKING Tables for easier management of data 
CREATE TABLE IF NOT EXISTS trip_assignment (
    assignment_id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(booking_id) ON DELETE CASCADE,
    trip_id INT REFERENCES trip(trip_id) ON DELETE CASCADE,
    seat_number INT,
    assignment_status VARCHAR(50) DEFAULT 'confirmed',
    payment_type VARCHAR(50),
    total_cost NUMERIC(10,2),
    booking_confirmation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data
INSERT INTO trip_assignment (booking_id, trip_id, seat_number, assignment_status, payment_type, total_cost, booking_confirmation) VALUES
(1, 1, 2, 'confirmed', 'Cash', 50.00, TRUE),
(2, 2, 1, 'confirmed', 'GCash', 75.00, TRUE);

-- REVIEWS Table ; Contains the reviews of the users of the trip
CREATE TABLE IF NOT EXISTS reviews (
    review_id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(booking_id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data
INSERT INTO reviews (booking_id, rating, comment) VALUES
(1, 5, 'Very comfortable ride!'),
(2, 4, 'Smooth trip, friendly driver.');

-- HISTORY Table ; Contains the history of a user
CREATE TABLE IF NOT EXISTS history (
    history_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data
INSERT INTO history (user_id, status) VALUES
(1, 'Trip completed'),
(2, 'Booking created'),
(3, 'Driver approved');
