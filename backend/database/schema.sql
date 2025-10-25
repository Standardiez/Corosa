-- Corosa Database Schema
-- PostgreSQL Database Setup for University Carpooling App

-- Create database (run this first)
-- CREATE DATABASE corosa_db;

-- Connect to the database
-- \c corosa_db;

-- Passengers table (Main user table)
CREATE TABLE IF NOT EXISTS passengers (
    passenger_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_initial VARCHAR(10),
    last_name VARCHAR(100) NOT NULL,
    birthdate DATE,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile_number VARCHAR(20),
    emergency_contact VARCHAR(20),
    address TEXT,
    disabilities TEXT,
    employment_status VARCHAR(50) DEFAULT 'student', -- student, employed, unemployed, self-employed
    account_status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hashed_password VARCHAR(255) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_passengers_email ON passengers(email);
CREATE INDEX IF NOT EXISTS idx_passengers_account_status ON passengers(account_status);
CREATE INDEX IF NOT EXISTS idx_passengers_employment_status ON passengers(employment_status);

-- Insert sample data for testing
INSERT INTO passengers (first_name, middle_initial, last_name, birthdate, email, mobile_number, emergency_contact, address, disabilities, employment_status, account_status, hashed_password) VALUES
('John', 'A', 'Doe', '2000-05-15', 'john.doe@university.edu', '+1234567890', '+1234567891', '123 University St, Campus City', 'None', 'student', 'active', '$2y$10$example_hash_here'),
('Jane', 'B', 'Smith', '1999-08-22', 'jane.smith@university.edu', '+1234567892', '+1234567893', '456 College Ave, Campus City', 'Visual impairment', 'student', 'active', '$2y$10$example_hash_here'),
('Mike', 'C', 'Johnson', '2001-03-10', 'mike.johnson@university.edu', '+1234567894', '+1234567895', '789 Student Blvd, Campus City', 'None', 'employed', 'active', '$2y$10$example_hash_here');

