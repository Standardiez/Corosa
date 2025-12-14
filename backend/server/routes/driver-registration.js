/**
 * DRIVER REGISTRATION ENDPOINT - NODE.JS
 * Handles driver profile creation and vehicle registration
 * 
 * Endpoint: POST /api/driver/register
 * Requires: userId, email, plateNumber, vehicleModel, seatCapacity, driverLicenseBase64
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const router = express.Router();

// Configure upload directory
const uploadDir = path.join(__dirname, '../../assets/driver-licenses');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * POST /api/driver/register
 * Register user as a driver with vehicle details
 */
router.post('/register', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { userId, email, plateNumber, vehicleModel, seatCapacity, driverLicenseBase64, driverLicenseType } = req.body;

    // ====================================================================
    // VALIDATION
    // ====================================================================
    const errors = {};

    if (!userId) errors.userId = 'User ID is required';
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (!plateNumber) {
      errors.plateNumber = 'Plate number is required';
    }

    if (!vehicleModel) {
      errors.vehicleModel = 'Vehicle model is required';
    }

    if (!seatCapacity || parseInt(seatCapacity) < 2 || parseInt(seatCapacity) > 8) {
      errors.seatCapacity = 'Valid seat capacity (2-8) is required';
    }

    if (!driverLicenseBase64) {
      errors.driverLicenseImage = 'Driver license image is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // ====================================================================
    // SAVE UPLOADED IMAGE FILE
    // ====================================================================
    let fileName;
    try {
      const timestamp = Date.now();
      const ext = driverLicenseType || 'jpg';
      fileName = `DL_${userId}_${timestamp}.${ext.replace('image/', '')}`;
      const filePath = path.join(uploadDir, fileName);

      // Convert base64 to buffer and write to file
      const buffer = Buffer.from(driverLicenseBase64, 'base64');
      fs.writeFileSync(filePath, buffer);
    } catch (fileError) {
      console.error('File write error:', fileError);
      return res.status(500).json({
        success: false,
        message: 'Failed to save driver license image',
        errors: { driverLicenseImage: 'save_failed' }
      });
    }

    // ====================================================================
    // DATABASE CONNECTION
    // ====================================================================
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'corosa_db'
    });

    try {
      // ====================================================================
      // VERIFY USER EXISTS
      // ====================================================================
      const [userRows] = await connection.execute(
        'SELECT user_id FROM users WHERE user_id = ? AND email = ?',
        [userId, email]
      );

      if (userRows.length === 0) {
        // Clean up uploaded file
        fs.unlinkSync(path.join(uploadDir, fileName));

        return res.status(404).json({
          success: false,
          message: 'User not found',
          errors: { user: 'not_found' }
        });
      }

      // ====================================================================
      // CHECK IF ALREADY DRIVER
      // ====================================================================
      const [driverRows] = await connection.execute(
        'SELECT driver_id FROM driver WHERE user_id = ?',
        [userId]
      );

      if (driverRows.length > 0) {
        // Clean up uploaded file
        fs.unlinkSync(path.join(uploadDir, fileName));

        return res.status(400).json({
          success: false,
          message: 'User is already registered as a driver',
          errors: { driver: 'already_driver' }
        });
      }

      // ====================================================================
      // CREATE DRIVER RECORD
      // ====================================================================
      const [driverResult] = await connection.execute(
        'INSERT INTO driver (user_id, driver_license_image) VALUES (?, ?)',
        [userId, fileName]
      );

      const driverId = driverResult.insertId;

      // ====================================================================
      // CREATE VEHICLE RECORD
      // ====================================================================
      try {
        await connection.execute(
          'INSERT INTO vehicle (plate_number, driver_id, vehicle_model, seat_capacity, vehicle_status) VALUES (?, ?, ?, ?, ?)',
          [plateNumber.toUpperCase(), driverId, vehicleModel, parseInt(seatCapacity), 'available']
        );
      } catch (vehicleError) {
        // If vehicle creation fails, delete driver record
        await connection.execute('DELETE FROM driver WHERE driver_id = ?', [driverId]);
        
        // Clean up uploaded file
        fs.unlinkSync(path.join(uploadDir, fileName));

        if (vehicleError.message.includes('Duplicate entry') || vehicleError.message.includes('unique')) {
          return res.status(400).json({
            success: false,
            message: 'Plate number already registered',
            errors: { plateNumber: 'already_exists' }
          });
        }

        throw vehicleError;
      }

      // ====================================================================
      // SUCCESS
      // ====================================================================
      res.status(201).json({
        success: true,
        driverId: driverId,
        vehicleId: plateNumber.toUpperCase(),
        message: 'Driver profile created successfully. You can now log in as a driver.'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Driver registration error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

module.exports = router;

