/*
 * ============================================================================
 * RIDE STATUS PAGE - Real-time Ride Tracking and Animation System
 * ============================================================================
 *
 * PURPOSE:
 * This script creates a sophisticated real-time ride tracking experience that:
 * 1. Displays live ride status with 3-stage progress indicator
 * 2. Shows animated Google Maps with driver movement simulation
 * 3. Renders realistic turn-by-turn navigation using Google Directions API
 * 4. Provides smooth car marker animation along actual road paths
 *
 * COMPLEXITY LEVEL: VERY HIGH
 * - Advanced Google Maps API integration
 * - Complex mathematical calculations (Haversine formula)
 * - Sophisticated animation timing and interpolation
 * - Multi-phase asynchronous route planning
 * - Performance-optimized frame-by-frame animation
 *
 * ANIMATION SYSTEM:
 * The script implements a custom animation engine that:
 * - Fetches real driving directions from Google
 * - Breaks routes into individual turn-by-turn steps
 * - Animates car marker smoothly along each road segment
 * - Uses realistic timing based on actual driving speeds
 * - Handles animation fallbacks for API failures
 *
 * DATA FLOW:
 * sessionStorage → Load Trip Data → Initialize Map → Fetch Directions →
 * Animate Car Movement → Update Progress Stages → Complete Journey
 *
 * ============================================================================
 */

(function () {
  "use strict";

  // ========================================================================
  // UTILITY FUNCTIONS - Basic helper functions for data formatting
  // ========================================================================

  /**
   * Format GPS coordinates as a human-readable string
   *
   * @param {Object} latLng - Coordinates object with lat and lng properties
   * @returns {string} Formatted string like "16.402300, 120.596000"
   *
   * USAGE: Fallback display when human-readable addresses aren't available
   * PRECISION: 6 decimal places (~1 meter accuracy for GPS coordinates)
   */
  function fmtLatLng(latLng) {
    return latLng.lat.toFixed(6) + ", " + latLng.lng.toFixed(6);
  }

  /**
   * Load and validate all trip data from browser session storage
   *
   * DATA SOURCES (set by previous pages in booking flow):
   * - pickupCoords: GPS coordinates from select-pickup.html
   * - pickupLocation: Human-readable pickup address
   * - dropoffCoords: GPS coordinates from select-dropoff.html
   * - dropoffLocation: Human-readable dropoff address
   * - selectedRide: Complete ride/driver info from request-ride.html
   *
   * VALIDATION LOGIC:
   * - Ensures all critical data exists before proceeding
   * - Handles JSON parsing errors gracefully
   * - Redirects user back to start if data is corrupted/missing
   * - Prevents errors from undefined data access later
   *
   * ERROR HANDLING:
   * - JSON parsing failures → Caught and handled
   * - Missing required data → User redirected to pickup selection
   * - User-friendly error messages via alert()
   *
   * @returns {Object|null} Complete trip data object or null if invalid
   */
  function loadData() {
    try {
      // STEP 1: Extract all session data (stored as JSON strings)
      const pickupCoords = JSON.parse(sessionStorage.getItem("pickupCoords"));
      const pickupAddress = sessionStorage.getItem("pickupLocation");
      const dropoffCoords = JSON.parse(sessionStorage.getItem("dropoffCoords"));
      const dropoffAddress = sessionStorage.getItem("dropoffLocation");
      const selectedRide = JSON.parse(sessionStorage.getItem("selectedRide"));

      // STEP 2: Validate critical data exists
      // Addresses are optional (can fallback to coordinates)
      // But coordinates and ride selection are mandatory
      if (!pickupCoords || !dropoffCoords || !selectedRide) {
        alert("Missing trip or ride data. Please start again.");
        window.location.href = "../pages/select-pickup.html";
        return null;
      }

      // STEP 3: Return validated data as structured object
      return {
        pickupCoords,
        pickupAddress,
        dropoffCoords,
        dropoffAddress,
        selectedRide,
      };
    } catch (e) {
      // STEP 4: Handle any JSON parsing or access errors
      console.error("Error reading session data", e);
      alert("Missing trip or ride data. Please start again.");
      window.location.href = "../pages/select-pickup.html";
      return null;
    }
  }

  // ========================================================================
  // UI STATE MANAGEMENT - Progress indicator and visual feedback
  // ========================================================================

  /**
   * Update the 3-stage ride progress indicator in the UI
   *
   * RIDE STAGES:
   * Stage 1: "Driver Approaching" - Driver heading to pickup location
   * Stage 2: "Passenger Pickup" - Driver at pickup, collecting passenger
   * Stage 3: "En Route to Destination" - Driving to dropoff location
   *
   * VISUAL STATES:
   * - 'done': Stage completed (green checkmark, filled circle)
   * - 'active': Current stage (pulsing animation, highlighted)
   * - 'pending': Future stage (grayed out, waiting state)
   *
   * HTML STRUCTURE EXPECTED:
   * <div id="stage-1" class="stage">Driver Approaching</div>
   * <div id="stage-2" class="stage">Passenger Pickup</div>
   * <div id="stage-3" class="stage">En Route</div>
   *
   * CSS CLASSES APPLIED:
   * .done { background: green; }
   * .active { background: blue; animation: pulse; }
   * .pending { background: gray; opacity: 0.5; }
   *
   * @param {number} n - Current stage number (1, 2, or 3)
   */
  function setStage(n) {
    const total = 3; // Total number of ride stages

    // Loop through all stage elements and update their visual state
    for (let i = 1; i <= total; i++) {
      const el = document.getElementById("stage-" + i);

      // Clear all existing state classes
      el.classList.remove("active", "done", "pending");

      // Apply appropriate class based on stage relationship
      if (i < n) {
        el.classList.add("done"); // Past stage - completed
      } else if (i === n) {
        el.classList.add("active"); // Current stage - in progress
      } else {
        el.classList.add("pending"); // Future stage - waiting
      }
    }

    // When ride reaches completion (stage 3), redirect to rating page
    if (n === 3) {
      console.log("[RideStatus] Ride completed! Redirecting to rating page...");

      // Get booking ID from session
      const bookingId = sessionStorage.getItem("bookingId");

      if (bookingId) {
        // Store booking ID for rate-driver page
        sessionStorage.setItem("currentBookingId", bookingId);
      }

      // Show completion message and redirect after 2 seconds
      setTimeout(function () {
        window.location.href = "rate-driver.html";
      }, 2000);
    }
  }

  // ========================================================================
  // GOOGLE MAPS INITIALIZATION & ANIMATION SYSTEM
  // ========================================================================

  /**
   * Initialize Google Maps with real-time driver tracking simulation
   *
   * MAIN FUNCTION RESPONSIBILITIES:
   * 1. Load and display trip data in UI elements
   * 2. Create interactive Google Map with custom markers
   * 3. Set up realistic car movement animation system
   * 4. Integrate with Google Directions API for route planning
   * 5. Manage two-phase journey (approach → pickup → destination)
   *
   * ANIMATION PHASES:
   * Phase 1: Driver approaches pickup location (Stage 1)
   * Phase 2: Driver travels from pickup to dropoff (Stage 2→3)
   *
   * MAP FEATURES:
   * - Custom colored markers for pickup/dropoff locations
   * - Animated car icon following realistic road paths
   * - Dynamic polylines showing planned route
   * - Auto-centering camera following car movement
   *
   * GLOBAL FUNCTION: Assigned to window.initMap for Google Maps callback
   */
  window.initMap = function () {
    // ====================================================================
    // STEP 1: DATA LOADING AND VALIDATION
    // ====================================================================
    const data = loadData();
    if (!data) return; // Exit if session data is missing/corrupted

    // Destructure loaded data for easier access
    const {
      pickupCoords,
      pickupAddress,
      dropoffCoords,
      dropoffAddress,
      selectedRide,
    } = data;

    // ====================================================================
    // STEP 2: POPULATE UI ELEMENTS WITH TRIP INFORMATION
    // ====================================================================

    // Display location information (prefer human addresses over coordinates)
    document.getElementById("pickup-location").textContent =
      pickupAddress || fmtLatLng(pickupCoords);
    document.getElementById("dropoff-location").textContent =
      dropoffAddress || fmtLatLng(dropoffCoords);

    // Display driver information in UI
    document.getElementById("driver-name").textContent =
      selectedRide.driver.firstName + " " + selectedRide.driver.lastName;
    document.getElementById("driver-employment").textContent =
      selectedRide.driver.employmentStatus || "";
    document.getElementById("driver-capacity").textContent =
      selectedRide.vehicle.availableSeats +
      "/" +
      selectedRide.vehicle.totalCapacity;

    // ====================================================================
    // STEP 3: GOOGLE MAPS SETUP AND CONFIGURATION
    // ====================================================================

    const mapEl = document.getElementById("map");
    mapEl.textContent = ""; // Clear any placeholder content

    // Calculate map center point (midpoint between pickup and dropoff)
    // This ensures both locations are visible in the initial view
    const center = {
      lat: (pickupCoords.lat + dropoffCoords.lat) / 2,
      lng: (pickupCoords.lng + dropoffCoords.lng) / 2,
    };

    // Create Google Map instance with optimized settings
    const map = new google.maps.Map(mapEl, {
      center,
      zoom: 14, // Zoom level for city-scale view
      mapTypeControl: false, // Hide map type selector (satellite/road)
      streetViewControl: false, // Hide street view control
    });

    // ====================================================================
    // STEP 4: CREATE CUSTOM MARKERS FOR LOCATIONS
    // ====================================================================

    // Pickup location marker (teal circle)
    const pickupMarker = new google.maps.Marker({
      position: pickupCoords,
      map,
      title: "Pickup",
      icon: {
        path: google.maps.SymbolPath.CIRCLE, // Built-in circle shape
        fillColor: "#2A9D8F", // Teal color
        fillOpacity: 1, // Solid fill
        strokeWeight: 0, // No border
        scale: 7, // Size multiplier
      },
    });

    // Dropoff location marker (coral circle)
    const dropMarker = new google.maps.Marker({
      position: dropoffCoords,
      map,
      title: "Drop-off",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#E76F51", // Coral color
        fillOpacity: 1,
        strokeWeight: 0,
        scale: 7,
      },
    });

    // ====================================================================
    // STEP 5: CREATE ANIMATED CAR MARKER
    // ====================================================================

    // Start car slightly offset from pickup to simulate approach
    const offset = 0.003; // ~330 meters at this latitude
    const start = {
      lat: pickupCoords.lat + offset,
      lng: pickupCoords.lng + offset,
    };

    // Custom car icon using SVG path
    // SVG represents a simple top-down car silhouette
    const carIcon = {
      path: "M3 11c0-4 3-5 9-5s9 1 9 5v6H3v-6z M7 7a3 3 0 1 1 6 0",
      fillColor: "#264653", // Dark blue-green
      fillOpacity: 1,
      strokeWeight: 0,
      scale: 0.9, // Slightly smaller than location markers
    };

    // Create car marker at starting position
    const carMarker = new google.maps.Marker({
      position: start,
      map,
      icon: carIcon,
      title: "Driver",
    });

    // ====================================================================
    // STEP 6: GOOGLE DIRECTIONS API SETUP
    // ====================================================================

    // Initialize Google Directions service for route planning
    // This service calculates optimal driving routes between points
    const directionsService = new google.maps.DirectionsService();
    let fullPath = []; // Will store complete journey path for debugging

    // ====================================================================
    // MATHEMATICAL UTILITIES - Distance and geometry calculations
    // ====================================================================

    /**
     * Calculate distance between two GPS points using Haversine formula
     *
     * HAVERSINE FORMULA EXPLAINED:
     * - Calculates great-circle distance (shortest distance on sphere surface)
     * - Accounts for Earth's curvature (more accurate than Euclidean distance)
     * - Used for precise GPS distance calculations
     *
     * MATHEMATICAL STEPS:
     * 1. Convert latitude/longitude differences to radians
     * 2. Apply haversine formula with trigonometric functions
     * 3. Calculate central angle using atan2 function
     * 4. Multiply by Earth's radius to get distance in meters
     *
     * @param {Object} a - Start point {lat, lng}
     * @param {Object} b - End point {lat, lng}
     * @returns {number} Distance in meters
     */
    function haversine(a, b) {
      const R = 6371000; // Earth's radius in meters (mean radius)
      const toRad = (x) => (x * Math.PI) / 180; // Degrees to radians converter

      // Calculate coordinate differences in radians
      const dLat = toRad(b.lat - a.lat);
      const dLon = toRad(b.lng - a.lng);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);

      // Apply haversine formula
      const sinDLat = Math.sin(dLat / 2);
      const sinDLon = Math.sin(dLon / 2);
      const aa =
        sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));

      return R * c; // Return distance in meters
    }

    /**
     * Calculate total length of a path (array of GPS coordinates)
     *
     * USAGE: Determine total distance for animation timing calculations
     * METHOD: Sum of Haversine distances between consecutive points
     *
     * @param {Array} path - Array of {lat, lng} coordinate objects
     * @returns {number} Total path length in meters
     */
    function pathLength(path) {
      let s = 0;
      for (let i = 1; i < path.length; i++) {
        s += haversine(path[i - 1], path[i]);
      }
      return s;
    }

    // ====================================================================
    // ADVANCED ANIMATION ENGINE - Smooth car movement along routes
    // ====================================================================

    /**
     * Animate car marker along Google Directions steps with realistic timing
     *
     * ANIMATION COMPLEXITY: VERY HIGH
     * This function implements a sophisticated multi-level animation system:
     *
     * LEVEL 1: Step-by-step animation (turn-by-turn directions)
     * LEVEL 2: Segment-by-segment animation within each step
     * LEVEL 3: Frame-by-frame interpolation within each segment
     *
     * TIMING CALCULATION:
     * - Uses real Google Directions timing data when available
     * - Falls back to distance-based speed calculations (~50 km/h)
     * - Applies speed multiplier for demo purposes (0.001 = very fast)
     * - Ensures minimum animation durations for smooth visual experience
     *
     * INTERPOLATION METHOD:
     * - Linear interpolation between GPS coordinate pairs
     * - requestAnimationFrame for smooth 60fps animation
     * - Proportional timing based on segment distances
     *
     * @param {Array} steps - Google Directions steps with paths and timing
     * @param {number} speedMultiplier - Animation speed control (1.0 = real time)
     * @param {Function} onProgress - Callback for each animation frame (position, progress)
     * @param {Function} onComplete - Callback when entire animation finishes
     */
    function animateSteps(steps, speedMultiplier, onProgress, onComplete) {
      // Validate input parameters
      if (!steps || steps.length === 0) {
        onComplete && onComplete();
        return;
      }

      let stepIndex = 0; // Current step being animated

      /**
       * RECURSIVE FUNCTION: Animate a single turn-by-turn step
       * Each step represents one instruction like "Turn left on Main St"
       */
      function runStep() {
        // Check if all steps completed
        if (stepIndex >= steps.length) {
          onComplete && onComplete();
          return;
        }

        const step = steps[stepIndex];
        const pts = step.path && step.path.length ? step.path : [];

        // Skip empty steps (shouldn't happen but defensive programming)
        if (pts.length === 0) {
          stepIndex++;
          runStep();
          return;
        }

        // ============================================================
        // SEGMENT ANALYSIS: Break step into distance-based segments
        // ============================================================
        const segs = []; // Array of {start, end, distance} objects
        let segTotal = 0; // Total distance for this step

        // Create segments between consecutive points in step path
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1]; // Start point
          const b = pts[i]; // End point
          const d = haversine(a, b); // Distance between points
          segs.push({ a, b, d });
          segTotal += d;
        }

        // ============================================================
        // TIMING CALCULATION: Determine step animation duration
        // ============================================================
        const defaultSpeedMsPerMeter = 1000 / 13.9; // ~50 km/h in ms/meter
        let stepDurationMs = null;

        if (step.duration && typeof step.duration === "number") {
          // Use Google's estimated duration (converted to ms)
          stepDurationMs = Math.max(
            150,
            Math.round(step.duration * 1000 * speedMultiplier)
          );
        } else if (step.distance && typeof step.distance === "number") {
          // Calculate duration from distance and default speed
          stepDurationMs = Math.max(
            150,
            Math.round(step.distance * defaultSpeedMsPerMeter * speedMultiplier)
          );
        } else {
          // Fallback duration when no timing data available
          stepDurationMs = 500;
        }

        // ============================================================
        // SEGMENT ANIMATION: Animate each segment within the step
        // ============================================================
        let sidx = 0; // Current segment being animated

        /**
         * RECURSIVE FUNCTION: Animate a single segment
         * Each segment is a straight line between two GPS points
         */
        function runSeg() {
          // Check if all segments in step completed
          if (sidx >= segs.length) {
            stepIndex++;
            runStep();
            return;
          }

          const seg = segs[sidx];

          // Calculate segment duration proportional to its distance
          const segDuration = Math.max(
            20,
            Math.round(stepDurationMs * (seg.d / Math.max(1, segTotal)))
          );
          const startTime = performance.now();

          /**
           * FRAME ANIMATION: Smooth interpolation between segment endpoints
           * Uses requestAnimationFrame for optimal performance
           */
          function frame(now) {
            // Calculate animation progress (0.0 to 1.0)
            const t = Math.min(1, (now - startTime) / segDuration);

            // Linear interpolation between start and end coordinates
            const lat = seg.a.lat + (seg.b.lat - seg.a.lat) * t;
            const lng = seg.a.lng + (seg.b.lng - seg.a.lng) * t;
            const pos = { lat, lng };

            // Calculate overall progress through entire route
            const overallProgress =
              (stepIndex + (sidx + t) / Math.max(1, segs.length)) /
              steps.length;

            // Call progress callback with current position and progress
            onProgress(pos, overallProgress);

            // Continue animation or move to next segment
            if (t < 1) {
              requestAnimationFrame(frame); // Continue this segment
            } else {
              sidx++;
              runSeg(); // Move to next segment
            }
          }
          requestAnimationFrame(frame); // Start segment animation
        }

        // Skip steps with no movement (single point)
        if (segs.length === 0) {
          stepIndex++;
          runStep();
          return;
        }

        runSeg(); // Start segment animation
      }

      runStep(); // Start step animation
    }

    // ====================================================================
    // GOOGLE DIRECTIONS API INTEGRATION
    // ====================================================================

    /**
     * Convert Google Maps LatLng object to simple coordinate object
     *
     * GOOGLE MAPS OBJECTS: Complex objects with methods like .lat(), .lng()
     * SIMPLE OBJECTS: Plain {lat, lng} objects for easier manipulation
     *
     * @param {google.maps.LatLng} ll - Google Maps LatLng object
     * @returns {Object} Simple coordinate object {lat, lng}
     */
    function toSimpleLatLng(ll) {
      return { lat: ll.lat(), lng: ll.lng() };
    }

    /**
     * Request driving directions and extract detailed path information
     *
     * GOOGLE DIRECTIONS API WORKFLOW:
     * 1. Send origin/destination to Google's routing servers
     * 2. Receive optimized driving route with turn-by-turn instructions
     * 3. Extract detailed path coordinates for smooth animation
     * 4. Parse timing and distance data for realistic movement speed
     *
     * EXTRACTED DATA STRUCTURE:
     * steps: [
     *   {
     *     path: [{lat, lng}, {lat, lng}, ...],    // Detailed coordinate path
     *     duration: 45,                           // Time in seconds
     *     distance: 650,                          // Distance in meters
     *     instructions: "Turn left on Main St"    // Human-readable instruction
     *   },
     *   ... // More steps for complete route
     * ]
     *
     * ERROR HANDLING:
     * - Network failures → Callback with error
     * - Invalid routes → Callback with error
     * - Rate limiting → Callback with error
     *
     * @param {Object} origin - Start coordinates {lat, lng}
     * @param {Object} destination - End coordinates {lat, lng}
     * @param {Function} callback - Callback function (error, result)
     */
    function getDirections(origin, destination, callback) {
      directionsService.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        function (result, status) {
          // Check if Google successfully calculated route
          if (status === "OK" && result.routes && result.routes.length) {
            const route = result.routes[0]; // Use first (best) route

            // ====================================================
            // STEP EXTRACTION: Parse Google's route into usable format
            // ====================================================
            const steps = [];

            // Each route contains legs, each leg contains steps
            route.legs.forEach((leg) => {
              leg.steps.forEach((step) => {
                const stepPath = [];

                // Extract detailed path coordinates
                if (step.path && step.path.length) {
                  // Use detailed path from Google (preferred)
                  step.path.forEach((p) => stepPath.push(toSimpleLatLng(p)));
                } else {
                  // Fallback: Use start/end points only
                  stepPath.push(toSimpleLatLng(step.start_location));
                  stepPath.push(toSimpleLatLng(step.end_location));
                }

                // Create step object with all necessary data
                steps.push({
                  path: stepPath,
                  duration:
                    step.duration && step.duration.value
                      ? step.duration.value
                      : null,
                  distance:
                    step.distance && step.distance.value
                      ? step.distance.value
                      : null,
                  instructions: step.instructions,
                });
              });
            });

            // Return success with parsed data
            callback(null, { steps, route });
          } else {
            // Return error with status information
            callback(new Error("Directions request failed: " + status));
          }
        }
      );
    }

    // ====================================================================
    // STEP 7: TWO-PHASE ANIMATION EXECUTION
    // ====================================================================

    // Set initial stage: Driver approaching pickup location
    setStage(1);

    // Animation speed control for demonstration purposes
    // 1.0 = real-time speed, 0.001 = very fast demo speed
    const SPEED_MULTIPLIER = 0.001;

    /**
     * PHASE 1: DRIVER APPROACHES PICKUP LOCATION
     *
     * PROCESS:
     * 1. Request directions from driver's starting position to pickup
     * 2. Draw route polyline on map
     * 3. Animate car marker along the calculated route
     * 4. Update progress to Stage 2 when pickup is reached
     * 5. Proceed to Phase 2 after brief pause
     */
    getDirections(start, pickupCoords, function (err1, res1) {
      if (err1) {
        // ========================================================
        // FALLBACK ANIMATION: Simple straight-line movement
        // Used when Google Directions API fails or is unavailable
        // ========================================================
        console.warn("Directions failed for approach, falling back", err1);

        // Create simple fallback path (straight lines)
        const fallbackPath = [start, pickupCoords, dropoffCoords];

        // Draw fallback route line
        const routeLine = new google.maps.Polyline({
          path: fallbackPath,
          strokeColor: "#2A9D8F", // Teal color
          strokeWeight: 4, // 4px line width
          map,
        });

        // Animate with simple path (no turn-by-turn detail)
        animateSteps(
          [{ path: fallbackPath, duration: null, distance: null }],
          SPEED_MULTIPLIER,
          function (pos) {
            carMarker.setPosition(pos); // Update car position
            map.panTo(pos); // Keep car centered on map
          },
          function () {
            setStage(3); // Jump to final stage
          }
        );
        return;
      }

      // ====================================================
      // SUCCESS PATH: Use Google Directions data
      // ====================================================

      // Extract turn-by-turn steps from Google's response
      const approachSteps = res1.steps;

      // Flatten all step paths into single overview path
      const approachOverview = [].concat(...approachSteps.map((s) => s.path));
      fullPath = fullPath.concat(approachOverview); // Store for debugging

      // Draw approach route on map
      const approachLine = new google.maps.Polyline({
        path: approachOverview,
        strokeColor: "#2A9D8F",
        strokeWeight: 4,
        map,
      });

      // Start approach animation with realistic turn-by-turn timing
      animateSteps(
        approachSteps,
        SPEED_MULTIPLIER,
        function (pos) {
          carMarker.setPosition(pos); // Update car position
          map.panTo(pos); // Keep car centered
        },
        function () {
          // ================================================
          // TRANSITION: Brief pause at pickup location
          // Simulates driver stopping to pick up passenger
          // ================================================
          setTimeout(function () {
            setStage(2); // Update to "Passenger Pickup" stage

            /**
             * PHASE 2: TRAVEL TO DESTINATION
             *
             * PROCESS:
             * 1. Request directions from pickup to dropoff
             * 2. Draw destination route on map
             * 3. Animate car to final destination
             * 4. Complete journey (Stage 3)
             */
            getDirections(pickupCoords, dropoffCoords, function (err2, res2) {
              if (err2) {
                // Fallback for destination leg
                console.warn(
                  "Directions failed for main leg, falling back",
                  err2
                );

                const fallbackPath = [pickupCoords, dropoffCoords];
                const legLine = new google.maps.Polyline({
                  path: fallbackPath,
                  strokeColor: "#2A9D8F",
                  strokeWeight: 4,
                  map,
                });

                animateSteps(
                  [{ path: fallbackPath, duration: null, distance: null }],
                  SPEED_MULTIPLIER,
                  function (pos) {
                    carMarker.setPosition(pos);
                    map.panTo(pos);
                  },
                  function () {
                    setStage(3); // Journey complete
                  }
                );
                return;
              }

              // Success: Use Google Directions for destination leg
              const legSteps = res2.steps;
              const legOverview = [].concat(...legSteps.map((s) => s.path));
              fullPath = fullPath.concat(legOverview);

              // Draw destination route
              const legLine = new google.maps.Polyline({
                path: legOverview,
                strokeColor: "#2A9D8F",
                strokeWeight: 4,
                map,
              });

              // Animate final leg to destination
              animateSteps(
                legSteps,
                SPEED_MULTIPLIER,
                function (pos) {
                  carMarker.setPosition(pos);
                  map.panTo(pos);
                },
                function () {
                  setStage(3); // Set final stage: "En Route to Destination"
                }
              );
            });
          }, 1000); // 1 second pause at pickup location
        }
      );
    });
  };

  // initialize by loading google maps script then calling initMap
  function initialize() {
    const data = loadData();
    if (!data) return;

    // CHECK IF BOOKING IS STILL PENDING
    const bookingStatus = sessionStorage.getItem("bookingStatus");
    if (bookingStatus === "pending") {
      console.log(
        "[RideStatus] Booking status is pending - showing waiting message"
      );
      showPendingApprovalMessage();
      return; // Don't load the map yet
    }

    // If not pending, load the map normally
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      "AIzaSyBsoZUgOFGSg7oXvdgstZuduXjNPIp_S3k"
    )}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  /**
   * Show "Waiting for driver's approval" message when booking is pending
   */
  function showPendingApprovalMessage() {
    const mapContainer = document.getElementById("map");
    const stagesContainer = document.getElementById("stages");

    if (mapContainer) {
      mapContainer.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                    padding: 40px 20px;
                    border-radius: 8px;
                ">
                    <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
                    <h2 style="margin: 0 0 8px 0; font-size: 24px;">Waiting for driver's approval…</h2>
                    <p style="margin: 0 0 20px 0; opacity: 0.9; max-width: 400px;">
                        Your ride request has been sent. The driver will accept or decline shortly.
                    </p>
                    <div style="
                        display: inline-block;
                        width: 40px;
                        height: 40px;
                        border: 4px solid rgba(255,255,255,0.3);
                        border-top: 4px solid white;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    "></div>
                </div>
            `;
    }

    // Hide stages initially since we're in pending state
    if (stagesContainer) {
      stagesContainer.style.display = "none";
    }

    // Add loading spinner animation
    const style = document.createElement("style");
    style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
    document.head.appendChild(style);

    // Set up auto-refresh to check if booking has been accepted
    const checkApprovalInterval = setInterval(async () => {
      try {
        const bookingId = sessionStorage.getItem("bookingId");
        if (!bookingId) return;

        // Check booking status via backend
        // Use centralized API config if available, otherwise fallback
        const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
        const response = await fetch(
          `${apiBase}/api/bookings/${bookingId}/status`
        );
        const result = await response.json();

        console.log("[RideStatus] Booking status check:", result);

        if (
          result.success &&
          result.data &&
          result.data.assignment_status === "accepted"
        ) {
          console.log("[RideStatus] Booking has been accepted! Reloading...");
          clearInterval(checkApprovalInterval);
          sessionStorage.setItem("bookingStatus", "accepted");
          window.location.reload();
        }
      } catch (error) {
        console.error("[RideStatus] Error checking booking status:", error);
      }
    }, 3000); // Check every 3 seconds
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
