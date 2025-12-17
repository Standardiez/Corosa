/*
 * ============================================================================
 * RIDE CONFIRMATION PAGE - JavaScript Controller
 * ============================================================================
 *
 * PURPOSE:
 * This script manages the ride confirmation page where passengers:
 * 1. Review trip details (pickup/dropoff locations)
 * 2. See driver and vehicle information
 * 3. View fare breakdown calculation
 * 4. Select payment method
 * 5. Confirm the booking (creates database records)
 *
 * DATA FLOW:
 * sessionStorage → Load & Display → User Confirms → API Calls → Database → Navigate
 *
 * DEPENDENCIES:
 * - sessionStorage data from previous pages (select-pickup, select-dropoff, request-ride)
 * - Backend APIs: /api/bookings.php, /api/trip_assignment.php
 * - ride-confirmation.html (UI structure)
 *
 * NEXT PAGE: ride-status.html (after successful confirmation)
 * ============================================================================
 */

(function () {
  "use strict"; // Enforce stricter parsing and error handling in JavaScript

  // ========================================================================
  // UTILITY FUNCTIONS - Helper functions for data formatting and calculations
  // ========================================================================

  /**
   * Format GPS coordinates as a readable string
   *
   * @param {Object} latLng - Coordinates object with lat and lng properties
   * @returns {string} Formatted string like "16.402300, 120.596000"
   *
   * USAGE: Display fallback when human-readable address is not available
   */
  function fmtLatLng(latLng) {
    return latLng.lat.toFixed(6) + ", " + latLng.lng.toFixed(6);
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   *
   * HAVERSINE FORMULA EXPLANATION:
   * - Calculates the "great-circle distance" between two points on a sphere
   * - Accounts for Earth's curvature (not flat-map Pythagorean distance)
   * - More accurate than simple coordinate subtraction for distances
   *
   * MATHEMATICAL STEPS:
   * 1. Convert latitude/longitude differences from degrees to radians
   * 2. Apply haversine function: h = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
   * 3. Calculate central angle: c = 2 × atan2(√h, √(1-h))
   * 4. Multiply by Earth's radius to get distance: d = R × c
   *
   * @param {Object} a - Start point with {lat, lng} properties
   * @param {Object} b - End point with {lat, lng} properties
   * @returns {number} Distance in kilometers
   *
   * EXAMPLE:
   * haversineDistance({lat: 16.4023, lng: 120.5960}, {lat: 16.4080, lng: 120.5969})
   * // Returns: ~0.65 km
   */
  function haversineDistance(a, b) {
    // Helper function: Convert degrees to radians
    const toRad = (x) => (x * Math.PI) / 180;

    // Earth's radius in kilometers (mean radius)
    const R = 6371;

    // Calculate differences in latitude and longitude (in radians)
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);

    // Convert individual latitudes to radians
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    // Apply haversine formula
    // sin²(Δlat/2) and sin²(Δlng/2)
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);

    // h = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
    const h =
      sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

    // Calculate central angle: c = 2 × atan2(√h, √(1-h))
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

    // Return distance: d = R × c
    return R * c;
  }

  /**
   * Load and validate all required data from sessionStorage
   *
   * DATA SOURCES (set by previous pages):
   * - pickupCoords: Set by select-pickup.html - {lat, lng} object
   * - pickupLocation: Human-readable address from Google Maps Geocoding API
   * - dropoffCoords: Set by select-dropoff.html - {lat, lng} object
   * - dropoffLocation: Human-readable address from Google Maps Geocoding API
   * - selectedRide: Set by request-ride.html - Complete ride object with driver/vehicle info
   *
   * VALIDATION:
   * - Checks if all critical data exists (coords and ride selection)
   * - Missing data → Alert user and redirect to start of booking flow
   * - Invalid JSON → Caught by try-catch, same error handling
   *
   * WHY THIS IS IMPORTANT:
   * - Prevents errors from undefined data access
   * - Ensures user followed proper booking flow sequence
   * - Handles edge cases (page refresh, direct URL typing, session expiration)
   *
   * @returns {Object|null} Data object with all session data, or null if invalid/missing
   */
  function loadData() {
    try {
      // STEP 1: Read all data from sessionStorage
      // JSON.parse() converts JSON strings back to JavaScript objects
      const pickupCoords = JSON.parse(sessionStorage.getItem("pickupCoords"));
      const pickupAddress = sessionStorage.getItem("pickupLocation");
      const dropoffCoords = JSON.parse(sessionStorage.getItem("dropoffCoords"));
      const dropoffAddress = sessionStorage.getItem("dropoffLocation");
      const selectedRide = JSON.parse(sessionStorage.getItem("selectedRide"));

      // STEP 2: Validate that critical data exists
      // Addresses are optional (can show coordinates instead), but coords and ride are required
      if (!pickupCoords || !dropoffCoords || !selectedRide) {
        alert("Missing trip or ride data. Please start over.");
        if (window.navigateToPassenger) {
          window.navigateToPassenger('select-pickup.html');
        } else {
          window.location.href = "/passenger/pages/select-pickup.html";
        }
        return null;
      }

      // STEP 3: Return all data as a single object
      return {
        pickupCoords,
        pickupAddress,
        dropoffCoords,
        dropoffAddress,
        selectedRide,
      };
    } catch (e) {
      // ERROR HANDLING: Catches JSON parsing errors or other exceptions
      console.error("Error reading session data", e);
      alert("Missing trip or ride data. Please start over.");
      if (window.navigateToPassenger) {
        window.navigateToPassenger('select-pickup.html');
      } else {
        window.location.href = "/passenger/pages/select-pickup.html";
      }
      return null;
    }
  }

  /**
   * Format a number as Philippine Peso currency
   *
   * @param {number} n - Amount to format
   * @returns {string} Formatted currency string like "₱70.00"
   *
   * EXAMPLE:
   * currencyFormat(70) → "₱70.00"
   * currencyFormat(8.5) → "₱8.50"
   */
  function currencyFormat(n) {
    return "₱" + n.toFixed(2); // toFixed(2) ensures always 2 decimal places
  }

  // ========================================================================
  // MAIN RENDER FUNCTION - Display all information on the page
  // ========================================================================
  /**
   * Main function that loads data and displays all trip/driver/fare information
   *
   * RESPONSIBILITIES:
   * 1. Load and validate session data
   * 2. Display pickup/dropoff locations
   * 3. Display driver information (name, employment, vehicle)
   * 4. Calculate and display fare breakdown
   * 5. Setup event handlers for Back and Confirm buttons
   *
   * EXECUTION: Called automatically when DOM is ready (see bottom of file)
   */
  function render() {
    // STEP 1: Load data from sessionStorage
    const data = loadData();
    if (!data) return; // Exit if data is missing (loadData() already handled redirect)

    // Destructure data object for easier access
    const {
      pickupCoords,
      pickupAddress,
      dropoffCoords,
      dropoffAddress,
      selectedRide,
    } = data;

    // ====================================================================
    // STEP 2: DISPLAY TRIP LOCATIONS
    // ====================================================================
    // Use human-readable address if available, otherwise show formatted coordinates
    document.getElementById("pickup-location").textContent =
      pickupAddress || fmtLatLng(pickupCoords);
    document.getElementById("dropoff-location").textContent =
      dropoffAddress || fmtLatLng(dropoffCoords);

    // ====================================================================
    // STEP 3: DISPLAY DRIVER INFORMATION
    // ====================================================================

    // Format driver's full name with middle initial
    // EXAMPLE: "John A. Doe" or "John Doe" (if no middle initial)
    const driverMid = selectedRide.driver.middleInitial
      ? selectedRide.driver.middleInitial + ". "
      : "";
    document.getElementById("driver-name").textContent =
      `${selectedRide.driver.firstName} ${driverMid}${selectedRide.driver.lastName}`.trim();

    // Display employment status (e.g., "Student", "Employee")
    document.getElementById("driver-employment").textContent =
      selectedRide.driver.employmentStatus || "";

    // Format vehicle display: "Toyota Vios 2018" or just "Toyota Vios" (if year missing)
    document.getElementById("driver-vehicle").textContent = [
      selectedRide.vehicle.model,
      selectedRide.vehicle.year || "",
    ]
      .join(" ")
      .trim();

    // Display seat availability: "3/4" (3 available out of 4 total capacity)
    document.getElementById(
      "driver-capacity"
    ).textContent = `${selectedRide.vehicle.availableSeats}/${selectedRide.vehicle.totalCapacity}`;

    // ====================================================================
    // STEP 4: CALCULATE AND DISPLAY FARE BREAKDOWN
    // ====================================================================

    /*
     * FARE CALCULATION ALGORITHM:
     * Total = Base Fare + (Distance in km × Rate per km)
     *
     * PRICING STRUCTURE:
     * - Base fare: ₱20.00 (charged for any ride, regardless of distance)
     * - Per-kilometer rate: ₱8.00/km
     *
     * EXAMPLE:
     * Distance: 6.25 km
     * Base: ₱20.00
     * Distance charge: 6.25 × ₱8.00 = ₱50.00
     * Total: ₱20.00 + ₱50.00 = ₱70.00
     */

    // Calculate distance using Haversine formula (accounts for Earth's curvature)
    const distanceKm = haversineDistance(pickupCoords, dropoffCoords);

    // Define pricing constants
    const base = 20.0; // Base fare in pesos
    const perKm = 8.0; // Per-kilometer rate in pesos

    // Calculate distance-based charge
    const distanceCharge = perKm * distanceKm;

    // Calculate total fare (parseFloat ensures numeric type after toFixed)
    const total = parseFloat((base + distanceCharge).toFixed(2));

    // Display fare breakdown in UI
    document.getElementById("fare-base").textContent = currencyFormat(base);
    document.getElementById("fare-distance").textContent =
      distanceKm.toFixed(2) + " km";
    document.getElementById("fare-perkm").textContent =
      currencyFormat(perKm) + " / km";
    document.getElementById("fare-total").textContent = currencyFormat(total);

    // ====================================================================
    // STEP 5: SETUP EVENT HANDLERS FOR BUTTONS
    // ====================================================================

    // BACK BUTTON: Returns to previous page (request-ride.html)
    // Allows user to select a different ride if they change their mind
    const backBtn = document.getElementById("back-btn");
    backBtn.addEventListener("click", function () {
      window.history.back(); // Browser's built-in back navigation
    });

    // CONFIRM BUTTON: Creates booking in database and proceeds to ride-status
    const confirmBtn = document.getElementById("confirm-btn");
    confirmBtn.addEventListener("click", function () {
      // Pass all necessary data to confirmRide function
      confirmRide({
        pickupCoords,
        dropoffCoords,
        selectedRide,
        fare: {
          base,
          perKm,
          distanceKm,
          total,
        },
        confirmBtn, // Pass button reference to disable it during request
      });
    });
  }

  // ========================================================================
  // CONFIRM RIDE FUNCTION - Creates booking and trip assignment in database
  // ========================================================================
  /**
   * Handles the ride confirmation process by creating database records
   *
   * PROCESS OVERVIEW (Two-Phase Database Operation):
   * Phase 1: Create booking record
   *   - POST to /api/bookings.php
   *   - Store passenger trip details (coords, payment, cost)
   *   - Returns booking_id
   *
   * Phase 2: Create trip assignment record
   *   - POST to /api/trip_assignment.php
   *   - Link booking to specific trip/driver
   *   - Automatically decrements available seats in trips table
   *   - Returns assignment_id
   *
   * WHY TWO SEPARATE API CALLS:
   * - Bookings table: Stores passenger's trip request (can exist without driver)
   * - Trip assignment: Links passenger booking to driver's trip (N:M relationship)
   * - Separation allows for future features (rebooking, multiple assignment attempts)
   *
   * ERROR HANDLING:
   * - No userId → Redirect to login
   * - No tripId → Redirect to request-ride
   * - API failures → Show error message, re-enable button for retry
   *
   * @param {Object} params - All required data for confirmation
   * @param {Object} params.pickupCoords - Pickup GPS coordinates
   * @param {Object} params.dropoffCoords - Dropoff GPS coordinates
   * @param {Object} params.selectedRide - Ride/driver information
   * @param {Object} params.fare - Calculated fare breakdown
   * @param {HTMLElement} params.confirmBtn - Button element reference
   */
  async function confirmRide({
    pickupCoords,
    dropoffCoords,
    selectedRide,
    fare,
    confirmBtn,
  }) {
    // ====================================================================
    // VALIDATION PHASE: Check prerequisites before making API calls
    // ====================================================================

    // STEP 1: Verify user is logged in
    const userId = sessionStorage.getItem("userId");
    if (!userId) {
      alert("Please log in before confirming a ride.");
      if (window.navigateToShared) {
        window.navigateToShared('login.html');
      } else {
        window.location.href = "/shared/pages/login.html";
      }
      return;
    }

    // STEP 2: Get trip ID (needed for linking booking to driver's trip)
    // Try multiple sources for backward compatibility
    const tripId =
      sessionStorage.getItem("selectedTripId") ||
      selectedRide.tripId ||
      selectedRide.id;
    if (!tripId) {
      alert("Missing trip information. Please select a ride again.");
      if (window.navigateToPassenger) {
        window.navigateToPassenger('request-ride.html');
      } else {
        window.location.href = "/passenger/pages/request-ride.html";
      }
      return;
    }

    // STEP 3: Get selected payment method from dropdown
    const paymentMethodSelect = document.getElementById("payment-method");
    const paymentMethod = paymentMethodSelect
      ? paymentMethodSelect.value
      : "cash";

    // ====================================================================
    // UI FEEDBACK: Disable button and show loading state
    // ====================================================================
    // Prevents duplicate submissions if user clicks multiple times
    confirmBtn.disabled = true;
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = "Confirming...";

    // ====================================================================
    // PHASE 1: CREATE BOOKING RECORD
    // ====================================================================

    /*
     * Build booking payload matching backend API expectations
     *
     * FIELD EXPLANATIONS:
     * - passenger_id: Links to users table (foreign key)
     * - start_lat/start_long: Pickup GPS coordinates
     * - end_lat/end_long: Dropoff GPS coordinates
     * - payment_type: "cash" or "card"
     * - total_cost: Calculated fare amount
     * - booking_confirmation: true = confirmed booking (vs. pending/draft)
     */
    const bookingPayload = {
      passenger_id: Number(userId),
      trip_id: Number(tripId),
      start_lat: pickupCoords.lat,
      start_long: pickupCoords.lng,
      end_lat: dropoffCoords.lat,
      end_long: dropoffCoords.lng,
      payment_type: paymentMethod,
      total_cost: fare.total,
    };

    console.log(
      "[ConfirmRide] Booking Payload: " + JSON.stringify(bookingPayload)
    );

    try {
      // ================================================================
      // API CALL 1: Create booking record
      // ================================================================
      /*
       * POST request to bookings API
       *
       * WHAT HAPPENS ON BACKEND:
       * 1. bookings.php receives JSON data
       * 2. Validates required fields exist
       * 3. Creates Bookings class instance
       * 4. Calls Bookings::create() method
       * 5. Executes INSERT INTO bookings (...) VALUES (...)
       * 6. Returns auto-generated booking_id
       *
       * EXPECTED RESPONSE (success):
       * { success: true, message: "...", data: { booking_id: 456 } }
       *
       * EXPECTED RESPONSE (error):
       * { success: false, message: "Missing required fields..." }
       */
      // Use centralized API config if available, otherwise fallback
      const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
      const bookingResponse = await fetch(
        `${apiBase}/api/bookings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingPayload),
        }
      );
      const bookingResult = await bookingResponse.json();

      // Check if booking creation was successful
      if (!bookingResult.success) {
        throw new Error(bookingResult.message || "Failed to create booking");
      }

      // Extract booking_id from response
      const bookingId = bookingResult.data && bookingResult.data.booking_id;
      if (!bookingId) {
        throw new Error("Booking created but no booking_id returned.");
      }

      // Store booking_id and assignment_id for next page
      sessionStorage.setItem("bookingId", bookingId);
      const assignmentId =
        bookingResult.data && bookingResult.data.assignment_id;
      if (assignmentId) {
        sessionStorage.setItem("assignmentId", assignmentId);
      }

      // ================================================================
      // PHASE 3: STORE CONFIRMATION DATA & NAVIGATE
      // ================================================================

      /*
       * Store booking confirmation data for ride-status.html
       *
       * DATA USAGE:
       * - bookingId: Already stored (for API queries)
       * - assignmentId: Already stored (for future cancellation feature)
       * - bookingConfirmed: Flag that booking process is complete
       * - confirmedPaymentMethod: Display on status page
       * - fareTotal: Display on status page, used for receipt generation
       */
      sessionStorage.setItem("bookingConfirmed", "true");
      sessionStorage.setItem("confirmedPaymentMethod", paymentMethod);
      sessionStorage.setItem("fareTotal", fare.total.toString());

      // Store confirmation data and navigate to ride status page
      sessionStorage.setItem("bookingStatus", "pending");
      sessionStorage.setItem("bookingCreatedAt", new Date().toISOString());
      console.log(
        "[ConfirmRide] Booking created with status: pending. Navigating to ride-status..."
      );

      // Navigate to ride status page to show "Waiting for driver's approval" message
      if (window.navigateToPassenger) {
        window.navigateToPassenger('ride-status.html');
      } else {
        window.location.href = "/passenger/pages/ride-status.html";
      }
    } catch (error) {
      // ================================================================
      // ERROR HANDLING: Handle any failures during the confirmation process
      // ================================================================
      /*
       * POSSIBLE ERRORS:
       * - Network errors (server down, no internet)
       * - API errors (validation failures, database errors)
       * - JSON parsing errors
       * - Timeout errors
       *
       * USER EXPERIENCE:
       * - Show error message (from server or generic)
       * - Re-enable Confirm button
       * - Restore original button text
       * - User can retry the operation
       */
      console.error("Error confirming ride:", error);
      alert(error.message || "Failed to confirm ride. Please try again.");

      // Re-enable button so user can retry
      confirmBtn.disabled = false;
      confirmBtn.textContent = originalText;
      return;
    }
  }

  // ========================================================================
  // INITIALIZATION - Run render() when DOM is ready
  // ========================================================================
  /*
   * EXECUTION TIMING:
   * - If DOM is still loading: Wait for DOMContentLoaded event
   * - If DOM already loaded: Execute render() immediately
   *
   * WHY THIS CHECK IS NEEDED:
   * - Script might load before or after DOM is ready
   * - Using DOMContentLoaded ensures all HTML elements exist before accessing them
   * - Prevents "cannot read property of null" errors
   *
   * ALTERNATIVE APPROACHES:
   * - Put <script> tag at end of <body> (ensures DOM loaded)
   * - Use defer attribute on <script> tag
   * - Use window.onload (waits for ALL resources, slower)
   *
   * CURRENT APPROACH BENEFIT:
   * - Works regardless of script tag placement
   * - Executes as soon as DOM ready (doesn't wait for images/CSS)
   */
  if (document.readyState === "loading") {
    // DOM still loading - wait for it
    document.addEventListener("DOMContentLoaded", render);
  } else {
    // DOM already loaded - execute immediately
    render();
  }
})(); // End of IIFE - immediately invokes the function
