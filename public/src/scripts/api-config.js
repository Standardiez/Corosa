/**
 * API Configuration for Corosa Frontend
 * This file contains the base URL and utility functions for API calls
 */

// API Base URL - Update this to match your backend server URL
// For local development with PHP built-in server: 'http://localhost:8000'
// For XAMPP/WAMP: 'http://localhost/corosa/backend'
// For production: Update with your actual domain
const API_BASE_URL = 'http://localhost:8000/backend';

/**
 * API Endpoints
 */
const API_ENDPOINTS = {
    TRIPS: '/api/trip.php',
    USERS: '/api/users.php',
    BOOKINGS: '/api/bookings.php',
    DRIVERS: '/api/driver.php',
    VEHICLES: '/api/vehicle.php',
    REVIEWS: '/api/reviews.php',
    HISTORY: '/api/history.php',
    ADDRESS: '/api/address.php',
    EMERGENCY_CONTACT: '/api/emergency_contact.php',
    TRIP_ASSIGNMENT: '/api/trip_assignment.php'
};

/**
 * Make API request with error handling
 * @param {string} endpoint - API endpoint (e.g., API_ENDPOINTS.TRIPS)
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} data - Request body data (optional)
 * @param {object} params - URL query parameters (optional)
 * @returns {Promise<object>} Response data
 */
async function apiRequest(endpoint, method = 'GET', data = null, params = null) {
    try {
        let url = `${API_BASE_URL}${endpoint}`;
        
        // Add query parameters if provided
        if (params) {
            const queryString = new URLSearchParams(params).toString();
            url += `?${queryString}`;
        }

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            // Include credentials if needed (for cookies/auth)
            // credentials: 'include'
        };

        // Add request body for POST/PUT requests
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Check if API returned success
        if (!result.success) {
            throw new Error(result.message || 'API request failed');
        }

        return result;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

/**
 * Get all trips with driver and vehicle information
 * @returns {Promise<Array>} Array of trip objects with driver info
 */
async function getAllTrips() {
    try {
        const response = await apiRequest(API_ENDPOINTS.TRIPS, 'GET');
        const trips = response.data || [];
        
        // Transform trips to match frontend format
        return trips.map(trip => ({
            id: trip.trip_id?.toString() || '',
            tripId: trip.trip_id,
            driverId: trip.driver_id,
            driverName: trip.first_name && trip.last_name 
                ? `${trip.first_name} ${trip.middle_initial ? trip.middle_initial + '. ' : ''}${trip.last_name}` 
                : 'Unknown Driver',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${trip.first_name || 'driver'}`,
            carModel: trip.vehicle_model || 'Unknown Vehicle',
            userType: trip.employment_status || 'student',
            seatsAvailable: trip.available_seats || 0,
            rating: 4.5, // Default rating - can be enhanced with reviews API
            startLocation: { 
                lat: 0, 
                lng: 0, 
                name: trip.starting_location || 'Unknown Location' 
            },
            endLocation: { 
                lat: 0, 
                lng: 0, 
                name: trip.end_location || 'Unknown Location' 
            },
            time: trip.created_at ? formatDate(trip.created_at) : 'Today',
            rideDistance: trip.ride_distance || 0,
            rideStatus: trip.ride_status || 'scheduled'
        }));
    } catch (error) {
        console.error('Error fetching trips:', error);
        return [];
    }
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
        return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

/**
 * Get trip by ID
 * @param {number} tripId - Trip ID
 * @returns {Promise<object|null>} Trip object or null
 */
async function getTripById(tripId) {
    try {
        const response = await apiRequest(API_ENDPOINTS.TRIPS, 'GET', null, { trip_id: tripId });
        return response.data || null;
    } catch (error) {
        console.error('Error fetching trip:', error);
        return null;
    }
}

/**
 * Get trips by driver ID
 * @param {number} driverId - Driver ID
 * @returns {Promise<Array>} Array of trip objects
 */
async function getTripsByDriverId(driverId) {
    try {
        const response = await apiRequest(API_ENDPOINTS.TRIPS, 'GET', null, { driver_id: driverId });
        return response.data || [];
    } catch (error) {
        console.error('Error fetching driver trips:', error);
        return [];
    }
}

/**
 * Create a new trip
 * @param {object} tripData - Trip data
 * @returns {Promise<object>} Created trip data
 */
async function createTrip(tripData) {
    try {
        const response = await apiRequest(API_ENDPOINTS.TRIPS, 'POST', tripData);
        return response.data;
    } catch (error) {
        console.error('Error creating trip:', error);
        throw error;
    }
}

/**
 * Create a new booking
 * @param {object} bookingData - Booking data
 * @returns {Promise<object>} Created booking data
 */
async function createBooking(bookingData) {
    try {
        const response = await apiRequest(API_ENDPOINTS.BOOKINGS, 'POST', bookingData);
        return response.data;
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
}

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<object|null>} User object or null
 */
async function getUserById(userId) {
    try {
        const response = await apiRequest(API_ENDPOINTS.USERS, 'GET', null, { user_id: userId });
        return response.data || null;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} User object or null
 */
async function getUserByEmail(email) {
    try {
        const response = await apiRequest(API_ENDPOINTS.USERS, 'GET', null, { email: email });
        return response.data || null;
    } catch (error) {
        console.error('Error fetching user by email:', error);
        return null;
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_BASE_URL,
        API_ENDPOINTS,
        apiRequest,
        getAllTrips,
        getTripById,
        getTripsByDriverId,
        createTrip,
        createBooking,
        getUserById,
        getUserByEmail
    };
}

