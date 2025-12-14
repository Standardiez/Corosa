/**
 * Driver Create Ride Handler
 * Handles ride creation flow on driver-makeride.html
 * Displays pre-selected route and collects time/seats only
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("[Driver Create Ride] Page loaded, initializing...");
  console.log("[Driver Create Ride] sessionStorage contents:", {
    flowIntent: sessionStorage.getItem("flowIntent"),
    driverPickupLocation: sessionStorage.getItem("driverPickupLocation"),
    driverDropoffLocation: sessionStorage.getItem("driverDropoffLocation"),
    driverPickupCoords: sessionStorage.getItem("driverPickupCoords"),
    driverDropoffCoords: sessionStorage.getItem("driverDropoffCoords"),
  });

  // Initialize page
  initializeRideCreation();
  setupFormValidation();
  setupFormSubmission();
});

/**
 * Initialize the ride creation page with pre-selected locations
 */
function initializeRideCreation() {
  console.log("[Driver Create Ride] Initializing ride creation...");

  // Get pre-selected locations from sessionStorage
  let pickupLocation = sessionStorage.getItem("driverPickupLocation");
  let dropoffLocation = sessionStorage.getItem("driverDropoffLocation");
  const pickupCoords = sessionStorage.getItem("driverPickupCoords");
  const dropoffCoords = sessionStorage.getItem("driverDropoffCoords");
  let flowIntent = sessionStorage.getItem("flowIntent");

  console.log("[Driver Create Ride] Location check:", {
    pickupLocation,
    dropoffLocation,
    flowIntent,
    hasPickup: !!pickupLocation,
    hasDropoff: !!dropoffLocation,
  });

  // If we're on this page, we should be in driver mode
  // Ensure flowIntent is set correctly
  if (!flowIntent) {
    console.warn(
      "[Driver Create Ride] flowIntent not found, setting to driver"
    );
    sessionStorage.setItem("flowIntent", "driver");
    flowIntent = "driver";
  }

  // Check if locations exist
  if (!pickupLocation || !dropoffLocation) {
    console.warn("[Driver Create Ride] Missing pre-selected locations:", {
      missingPickup: !pickupLocation,
      missingDropoff: !dropoffLocation,
      pickupValue: pickupLocation,
      dropoffValue: dropoffLocation,
      flowIntent,
    });
    showError(
      "Route information missing. Please select your pickup and destination locations."
    );
    // Redirect to location selection after 3 seconds
    setTimeout(() => {
      console.log("[Driver Create Ride] Redirecting to select-pickup.html...");
      // Ensure flowIntent is set before redirecting
      sessionStorage.setItem("flowIntent", "driver");
      window.location.href = "../../passenger/pages/select-pickup.html";
    }, 3000);
    return;
  }

  console.log("[Driver Create Ride] Locations found:", {
    pickup: pickupLocation,
    dropoff: dropoffLocation,
  });

  // Display locations in the route card
  document.getElementById("pickupDisplay").textContent = pickupLocation;
  document.getElementById("dropoffDisplay").textContent = dropoffLocation;

  // Store coordinates for API submission if available
  if (pickupCoords) {
    sessionStorage.setItem("driverPickupCoordsForSubmit", pickupCoords);
  }
  if (dropoffCoords) {
    sessionStorage.setItem("driverDropoffCoordsForSubmit", dropoffCoords);
  }

  console.log("[Driver Create Ride] Route display updated");
}

/**
 * Setup form validation
 * Enable submit button only when form is complete
 */
function setupFormValidation() {
  console.log("[Driver Create Ride] Setting up form validation...");

  const form = document.getElementById("rideDetailsForm");
  const departureDateTime = document.getElementById("departureDateTime");
  const seatCount = document.getElementById("seatCount");
  const createRideBtn = document.getElementById("createRideBtn");

  // Function to check if form is valid
  function validateForm() {
    const hasDateTime = departureDateTime.value.trim() !== "";
    const hasSeats = seatCount.value.trim() !== "";

    // Enable button only if both fields are filled
    if (hasDateTime && hasSeats) {
      createRideBtn.disabled = false;
      console.log("[Driver Create Ride] Form is valid, enabling submit button");
    } else {
      createRideBtn.disabled = true;
      console.log(
        "[Driver Create Ride] Form incomplete, keeping submit button disabled"
      );
    }
  }

  // Validate on input changes
  departureDateTime.addEventListener("change", validateForm);
  seatCount.addEventListener("change", validateForm);

  // Set minimum date/time to now
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  departureDateTime.min = now.toISOString().slice(0, 16);

  console.log("[Driver Create Ride] Form validation configured");
}

/**
 * Setup form submission
 * Create ride with collected data
 */
function setupFormSubmission() {
  console.log("[Driver Create Ride] Setting up form submission...");

  const form = document.getElementById("rideDetailsForm");
  const createRideBtn = document.getElementById("createRideBtn");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("[Driver Create Ride] Form submitted");

    // Get user data
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userId = userData.userId || userData.id;

    if (!userId) {
      showError("User not authenticated. Please log in again.");
      setTimeout(() => {
        window.location.href = "../pages/login.html";
      }, 2000);
      return;
    }

    // Get form data
    const departureDateTime =
      document.getElementById("departureDateTime").value;
    const seatCount = document.getElementById("seatCount").value;
    const pickupLocation = sessionStorage.getItem("driverPickupLocation");
    const dropoffLocation = sessionStorage.getItem("driverDropoffLocation");
    const pickupCoords =
      sessionStorage.getItem("driverPickupCoordsForSubmit") || "";
    const dropoffCoords =
      sessionStorage.getItem("driverDropoffCoordsForSubmit") || "";

    console.log("[Driver Create Ride] Collecting ride data:", {
      driverId: userId,
      pickupLocation,
      dropoffLocation,
      departureDateTime,
      seatCount,
    });

    // Disable button and show loading state
    createRideBtn.disabled = true;
    createRideBtn.innerHTML = '<span class="spinner"></span> Creating...';
    document.getElementById("loadingState").style.display = "flex";

    try {
      // Create ride via API
      const response = await fetch("../../backend/api/trip.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "createTrip",
          driverId: userId,
          startLocation: pickupLocation,
          endLocation: dropoffLocation,
          startCoordinates: pickupCoords,
          endCoordinates: dropoffCoords,
          departureTime: new Date(departureDateTime).toISOString(),
          availableSeats: parseInt(seatCount),
          status: "scheduled",
        }),
      });

      const result = await response.json();
      console.log("[Driver Create Ride] API Response:", result);

      if (result.status === "success" || result.success) {
        console.log(
          "[Driver Create Ride] Ride created successfully:",
          result.tripId || result.id
        );

        // Store trip ID for later reference
        const tripId = result.tripId || result.id;
        if (tripId) {
          sessionStorage.setItem("lastCreatedTripId", tripId);
        }

        // Show success message and redirect
        showSuccess("Ride created successfully! Redirecting to your rides...");
        setTimeout(() => {
          // Clear location data from sessionStorage
          sessionStorage.removeItem("driverPickupLocation");
          sessionStorage.removeItem("driverPickupCoords");
          sessionStorage.removeItem("driverDropoffLocation");
          sessionStorage.removeItem("driverDropoffCoords");
          sessionStorage.removeItem("driverPickupCoordsForSubmit");
          sessionStorage.removeItem("driverDropoffCoordsForSubmit");
          sessionStorage.removeItem("flowIntent");

          // Redirect to rides list
          window.location.href = "driver-ridestatus.html";
        }, 1500);
      } else {
        showError(result.message || "Failed to create ride. Please try again.");
        console.error("[Driver Create Ride] API error:", result);

        // Re-enable button
        createRideBtn.disabled = false;
        createRideBtn.innerHTML = '<i class="bx bx-check"></i> Create Ride';
        document.getElementById("loadingState").style.display = "none";
      }
    } catch (error) {
      console.error("[Driver Create Ride] Network/submission error:", error);
      showError("Error creating ride: " + error.message);

      // Re-enable button
      createRideBtn.disabled = false;
      createRideBtn.innerHTML = '<i class="bx bx-check"></i> Create Ride';
      document.getElementById("loadingState").style.display = "none";
    }
  });

  console.log("[Driver Create Ride] Form submission configured");
}

/**
 * Show error message in banner
 */
function showError(message) {
  console.error("[Driver Create Ride] Error:", message);
  const banner = document.getElementById("errorBanner");
  if (!banner) {
    console.error("[Driver Create Ride] Error banner element not found!");
    alert(message); // Fallback to alert if banner doesn't exist
    return;
  }
  banner.className = "error-banner show";
  banner.innerHTML = `
        <div class="error-content">
            <i class="bx bx-exclamation-circle"></i>
            <span>${message}</span>
        </div>
    `;
  banner.style.display = "block";

  // Scroll to top to show error
  window.scrollTo(0, 0);
}

/**
 * Show success message
 */
function showSuccess(message) {
  console.log("[Driver Create Ride] Success:", message);
  const banner = document.getElementById("errorBanner");
  banner.className = "success-banner";
  banner.innerHTML = `
        <div class="success-content">
            <i class="bx bx-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
  banner.style.display = "block";

  // Scroll to top
  window.scrollTo(0, 0);
}

/**
 * Clear error message
 */
function clearError() {
  const banner = document.getElementById("errorBanner");
  banner.style.display = "none";
  banner.className = "";
}
