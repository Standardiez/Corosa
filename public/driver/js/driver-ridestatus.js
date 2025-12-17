/**
 * Driver Ride Status Controller
 * Handles 3-stage ride status progression and completion
 */

let currentTripId = null;
let currentRide = null;
let pollInterval = null;
let isLoading = false;
let loadAttempts = 0;
let driverId = null;
const MAX_LOAD_ATTEMPTS = 3;

document.addEventListener("DOMContentLoaded", function () {
  console.log("[Driver Ride Status] Page loaded");

  // Get trip ID from sessionStorage or URL
  currentTripId =
    sessionStorage.getItem("lastCreatedTripId") ||
    new URLSearchParams(window.location.search).get("tripId");

  if (!currentTripId) {
    console.error("[Driver Ride Status] No trip ID found");
    console.log("[Driver Ride Status] sessionStorage:", sessionStorage.getItem("lastCreatedTripId"));
    console.log("[Driver Ride Status] URL params:", new URLSearchParams(window.location.search).toString());
    showError("Ride ID not found. Returning to dashboard...");
    setTimeout(() => {
      window.location.href = "driver-Homepage.html";
    }, 2000);
    return;
  }

  console.log("[Driver Ride Status] Loaded with tripId:", currentTripId);
  console.log("[Driver Ride Status] userData in localStorage:", localStorage.getItem("userData") ? "EXISTS" : "MISSING");

  // Disable button until data loads
  const updateBtn = document.getElementById("update-status-btn");
  if (updateBtn) {
    updateBtn.disabled = true;
    updateBtn.textContent = "Loading ride...";
  }

  // Get driver ID first, then load ride
  getDriverId()
    .then(() => {
      return loadRideStatus();
    })
    .then(() => {
      console.log("[Driver Ride Status] Initial load complete");
      // Enable button after first successful load
      if (updateBtn) {
        updateBtn.disabled = false;
      }
      // Poll for updates every 3 seconds only after initial load
      pollInterval = setInterval(loadRideStatus, 3000);
      console.log("[Driver Ride Status] Polling started");
    })
    .catch((error) => {
      console.error("[Driver Ride Status] Initial load failed:", error);
      showError("Failed to load ride: " + error.message);
    });

  // Setup event listeners
  document
    .getElementById("update-status-btn")
    .addEventListener("click", handleStatusUpdate);
  document
    .getElementById("cancel-ride-btn")
    .addEventListener("click", handleCancelRide);
  document
    .getElementById("back-btn")
    .addEventListener("click", function () {
      window.location.href = "driver-Homepage.html";
    });
});

/**
 * Get driver ID from backend
 */
async function getDriverId() {
  try {
    const userDataStr = localStorage.getItem("userData");
    if (!userDataStr) {
      throw new Error("User data not found in localStorage");
    }

    const userData = JSON.parse(userDataStr);
    const userId = userData.id || userData.userId || userData.user_id;

    if (!userId) {
      throw new Error("User ID not found in userData");
    }

    console.log("[Driver Ride Status] Getting driver ID for user:", userId);

    const response = await fetch(
      "http://localhost:3000/api/driver/get-driver-id",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId }),
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = `Failed to get driver ID: HTTP ${response.status}`;
      
      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const text = await response.text();
          console.error("[Driver Ride Status] Non-JSON error from get-driver-id:", text);
        }
      } catch (parseError) {
        console.error("[Driver Ride Status] Error parsing get-driver-id error response:", parseError);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success || !data.driverId) {
      throw new Error(data.message || "Driver ID not found in response");
    }

    driverId = data.driverId;
    console.log("[Driver Ride Status] Driver ID:", driverId);
    return driverId;
  } catch (error) {
    console.error("[Driver Ride Status] Error getting driver ID:", error);
    throw new Error("Unable to get driver ID: " + error.message);
  }
}

/**
 * Load current ride status from backend
 */
async function loadRideStatus() {
  if (isLoading) {
    console.log("[Driver Ride Status] Already loading, skipping duplicate request");
    return;
  }

  isLoading = true;

  try {
    console.log(
      `[Driver Ride Status] Fetching status for trip ${currentTripId}`
    );

    // Use the driverId fetched during getDriverId()
    if (!driverId) {
      throw new Error("Driver ID not available. Please reload the page.");
    }

    // Fetch specific trip details
    const response = await fetch(
      `http://localhost:3000/api/driver/rides/${driverId}/${currentTripId}`
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const text = await response.text();
          console.error("[Driver Ride Status] Non-JSON error response:", text);
          errorMessage = "Server returned an error (check console for details)";
        }
      } catch (parseError) {
        console.error("[Driver Ride Status] Error parsing error response:", parseError);
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch trip");
    }

    currentRide = result.data;
    loadAttempts = 0; // Reset attempts on success

    console.log("[Driver Ride Status] Current ride:", currentRide);

    // Update UI with ride data
    updateRideDisplay();
  } catch (error) {
    console.error("[Driver Ride Status] Error loading ride:", error);
    loadAttempts++;

    // Try retrying if it's the first load and we have attempts left
    if (loadAttempts < MAX_LOAD_ATTEMPTS && !currentRide) {
      console.log(
        `[Driver Ride Status] Retrying... (attempt ${loadAttempts}/${MAX_LOAD_ATTEMPTS})`
      );
      setTimeout(() => {
        isLoading = false;
        loadRideStatus();
      }, 1000);
      return;
    }

    if (currentRide === null) {
      showError("Unable to load ride data: " + error.message);
    }
  } finally {
    isLoading = false;
  }
}

/**
 * Update UI with ride status and details
 */
function updateRideDisplay() {
  if (!currentRide) return;

  const status = currentRide.ride_status;

  // Status mapping for 4-stage flow
  const statusMap = {
    available: 0,
    on_the_way: 1,        // Stage 1: Driver on the Way
    in_progress: 2,       // Stage 2: Ride In Progress
    arrived: 3,           // Stage 3: Arrived at Destination
    completed: 4,         // Stage 4: Completed
  };

  const currentStage = statusMap[status] || 0;

  // Update progress stages - show all stages with proper checkmarks
  const stageElements = document.querySelectorAll(".stage");

  stageElements.forEach((el, index) => {
    // index 0 = stage 1, index 1 = stage 2, etc.
    const stageNum = index + 1;

    if (stageNum < currentStage) {
      // Completed stages - show checkmark
      el.classList.add("completed");
      el.classList.remove("active");
      const circle = el.querySelector(".stage-circle");
      if (circle && !circle.querySelector("i")) {
        circle.innerHTML = '<i class="bx bx-check" style="font-size: 1.25rem"></i>';
      }
    } else if (stageNum === currentStage) {
      // Current stage - highlight as active
      el.classList.add("active");
      el.classList.remove("completed");
    } else {
      // Future stages - plain circles with numbers
      el.classList.remove("active", "completed");
    }
  });

  // Update progress line
  const progressLine = document.querySelector(".progress-line-fill");
  if (progressLine) {
    const percentage = (currentStage / 4) * 100;
    progressLine.style.width = percentage + "%";
  }

  // Update ride info display
  updateRideInfo();

  // Update button state and label
  const updateBtn = document.getElementById("update-status-btn");
  if (!updateBtn) return;

  // Status to button label mapping
  const buttonLabels = {
    available: "Driver On The Way",
    on_the_way: "Ride In Progress",
    in_progress: "Mark As Complete",
    arrived: "Completed",
    completed: "View Rating",
  };

  const buttonLabel = buttonLabels[status] || "Update Status";
  updateBtn.textContent = buttonLabel;

  // Enable/disable button based on current status
  if (status === "completed") {
    updateBtn.disabled = false;
    updateBtn.classList.add("completed");
  } else {
    updateBtn.disabled = false;
    updateBtn.classList.remove("completed");
  }
}

/**
 * Update displayed ride information
 */
function updateRideInfo() {
  if (!currentRide) return;

  // Get ride info container
  const infoContainer = document.querySelector(".ride-info");
  if (infoContainer) {
    infoContainer.innerHTML = `
      <div class="info-item">
        <label>Status</label>
        <span class="status-badge ${currentRide.ride_status}">${capitalizeStatus(
          currentRide.ride_status
        )}</span>
      </div>
      <div class="info-item">
        <label>Available Seats</label>
        <span>${currentRide.available_seats}</span>
      </div>
      <div class="info-item">
        <label>Trip Started</label>
        <span>${new Date(currentRide.created_at).toLocaleString()}</span>
      </div>
    `;
  }
}

/**
 * Handle status update button click
 */
async function handleStatusUpdate() {
  if (!currentRide) {
    console.error("[Driver Ride Status] currentRide is null", {
      currentRide,
      currentTripId,
      isLoading,
    });

    showError("Ride data not loaded yet. Please wait a moment and try again...");

    // Force reload ride data
    if (!isLoading) {
      await loadRideStatus();
    }

    return;
  }

  const currentStatus = currentRide.ride_status;

  // If ride is completed and button says "View Rating", redirect to ratings page
  if (currentStatus === "completed") {
    console.log("[Driver Ride Status] Redirecting to ratings page");
    window.location.href = "driver-passengerfeedback.html";
    return;
  }

  // Determine next status - follow the strict 4-stage progression
  let nextStatus;
  
  if (currentStatus === "available") {
    nextStatus = "on_the_way";
  } else if (currentStatus === "on_the_way") {
    nextStatus = "in_progress";
  } else if (currentStatus === "in_progress") {
    nextStatus = "arrived";
  } else if (currentStatus === "arrived") {
    nextStatus = "completed";
  } else {
    showError("Ride is already completed");
    return;
  }

  console.log(
    `[Driver Ride Status] Updating status: ${currentStatus} -> ${nextStatus}`
  );

  try {
    const updateBtn = document.getElementById("update-status-btn");
    if (updateBtn) {
      updateBtn.disabled = true;
      updateBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Updating...';
    }

    const response = await fetch(
      `http://localhost:3000/api/driver/rides/${currentTripId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newStatus: nextStatus }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to update status");
    }

    console.log(
      `[Driver Ride Status] Status updated successfully to: ${nextStatus}`
    );

    // Show human-readable success message from backend
    const successMessage = result.humanReadable 
      ? `Ride status updated: ${result.humanReadable}`
      : result.message || "Status updated successfully";
    
    showSuccess(successMessage);

    // Update local ride object
    currentRide.ride_status = nextStatus;

    // Update UI immediately
    updateRideDisplay();

    // If completed, redirect after showing message
    if (nextStatus === "completed") {
      setTimeout(() => {
        // Clear session data
        sessionStorage.removeItem("lastCreatedTripId");
        sessionStorage.removeItem("currentRideId");
        sessionStorage.removeItem("currentRoute");

        // Clear localStorage ride data
        localStorage.removeItem("currentActiveRide");

        // Redirect to dashboard
        window.location.href = "driver-Homepage.html";
      }, 2000);
    }
  } catch (error) {
    console.error("[Driver Ride Status] Error updating status:", error);
    showError(error.message || "Failed to update ride status");

    // Re-enable button on error
    const updateBtn = document.getElementById("update-status-btn");
    if (updateBtn) {
      updateBtn.disabled = false;
      updateBtn.textContent = document.getElementById("update-status-btn").textContent || "Update Status";
    }

    // Reload ride data to get fresh state from backend
    await loadRideStatus();
  }
}

/**
 * Handle cancel ride button click
 */
async function handleCancelRide() {
  if (!currentRide) {
    showError("Ride data not available");
    return;
  }

  if (currentRide.ride_status !== "available") {
    showError(
      "Only rides that are 'available' can be cancelled. Current status: " +
        capitalizeStatus(currentRide.ride_status)
    );
    return;
  }

  // Confirm cancellation
  if (!confirm("Are you sure you want to cancel this ride?")) {
    return;
  }

  console.log(`[Driver Ride Status] Cancelling ride ${currentTripId}`);

  try {
    const response = await fetch(
      `http://localhost:3000/api/driver/rides/${currentTripId}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to cancel ride");
    }

    console.log("[Driver Ride Status] Ride cancelled successfully");
    showSuccess("Ride cancelled successfully. Redirecting...");

    // Clear session data
    sessionStorage.removeItem("lastCreatedTripId");
    clearInterval(pollInterval);

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = "driver-Homepage.html";
    }, 1500);
  } catch (error) {
    console.error("[Driver Ride Status] Error cancelling ride:", error);
    showError(error.message || "Failed to cancel ride");
  }
}

/**
 * Capitalize status string for display
 */
function capitalizeStatus(status) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Show success message
 */
function showSuccess(message) {
  const alertDiv = document.createElement("div");
  alertDiv.className = "alert alert-success";
  alertDiv.textContent = message;
  alertDiv.style.position = "fixed";
  alertDiv.style.top = "20px";
  alertDiv.style.right = "20px";
  alertDiv.style.padding = "15px 20px";
  alertDiv.style.borderRadius = "8px";
  alertDiv.style.backgroundColor = "#4CAF50";
  alertDiv.style.color = "white";
  alertDiv.style.zIndex = "9999";
  alertDiv.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

/**
 * Show error message
 */
function showError(message) {
  const alertDiv = document.createElement("div");
  alertDiv.className = "alert alert-error";
  alertDiv.textContent = message;
  alertDiv.style.position = "fixed";
  alertDiv.style.top = "20px";
  alertDiv.style.right = "20px";
  alertDiv.style.padding = "15px 20px";
  alertDiv.style.borderRadius = "8px";
  alertDiv.style.backgroundColor = "#f44336";
  alertDiv.style.color = "white";
  alertDiv.style.zIndex = "9999";
  alertDiv.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

// Cleanup on page unload
window.addEventListener("beforeunload", function () {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});
