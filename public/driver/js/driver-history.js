/**
 * Driver History Controller
 * Displays completed trips with earnings and passenger details
 */

let driverId = null;
let completedTrips = [];

document.addEventListener("DOMContentLoaded", async function () {
  console.log("[Driver History] Page loaded");

  try {
    // Get driver ID from backend
    await getDriverId();
    console.log("[Driver History] Loaded with driverId:", driverId);

    // Load completed trips
    loadCompletedTrips();
  } catch (error) {
    console.error("[Driver History] Initialization error:", error);
    showError(error.message || "Failed to initialize");
  }

  // Setup event listeners
  const backBtn = document.getElementById("back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      window.location.href = "driver-Homepage.html";
    });
  }
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

    console.log("[Driver History] Getting driver ID for user:", userId);

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
          console.error("[Driver History] Non-JSON error from get-driver-id:", text);
        }
      } catch (parseError) {
        console.error("[Driver History] Error parsing get-driver-id error response:", parseError);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success || !data.driverId) {
      throw new Error(data.message || "Driver ID not found in response");
    }

    driverId = data.driverId;
    console.log("[Driver History] Driver ID:", driverId);
    return driverId;
  } catch (error) {
    console.error("[Driver History] Error getting driver ID:", error);
    throw new Error("Unable to get driver ID: " + error.message);
  }
}

/**
 * Load completed trips from backend
 */
async function loadCompletedTrips() {
  try {
    console.log(
      "[Driver History] Fetching completed trips for driver",
      driverId
    );

    const response = await fetch(
      `http://localhost:3000/api/driver/trips/${driverId}/completed`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch trips: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch trips");
    }

    completedTrips = result.data || [];

    console.log(
      "[Driver History] Fetched",
      completedTrips.length,
      "completed trips"
    );

    // Update UI
    displayTripsHistory();

    if (completedTrips.length === 0) {
      showEmptyState();
    }
  } catch (error) {
    console.error("[Driver History] Error loading trips:", error);
    showError(error.message || "Failed to load trip history");
  }
}

/**
 * Display completed trips in table/list format
 */
function displayTripsHistory() {
  const container = document.getElementById("trips-container") ||
    document.querySelector(".trips-list") || {
      innerHTML: "",
    };

  if (completedTrips.length === 0) {
    return;
  }

  let html = '<div class="trips-table-wrapper">';
  html += '<table class="trips-table">';
  html += `
    <thead>
      <tr>
        <th>Trip ID</th>
        <th>Date</th>
        <th>Passengers</th>
        <th>Earnings</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
  `;

  completedTrips.forEach((trip) => {
    const date = new Date(trip.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const earnings = (trip.total_earnings || 0).toFixed(2);
    const passengers = trip.passenger_count || 0;

    html += `
      <tr class="trip-row" data-trip-id="${trip.trip_id}">
        <td>${trip.trip_id}</td>
        <td>${date}</td>
        <td>${passengers} ${passengers === 1 ? "passenger" : "passengers"}</td>
        <td>₱${earnings}</td>
        <td>
          <span class="status-badge completed">
            ${capitalizeStatus(trip.ride_status)}
          </span>
        </td>
      </tr>
    `;
  });

  html += `
    </tbody>
    </table>
    </div>
  `;

  // Try to inject into page
  const container_el = document.getElementById("trips-container");
  if (container_el) {
    container_el.innerHTML = html;
  } else {
    // Fallback: create modal or alert with data
    console.log("[Driver History] Displaying trips data:", completedTrips);
    displayTripsModal();
  }

  // Add event listeners for trip rows
  document.querySelectorAll(".trip-row").forEach((row) => {
    row.addEventListener("click", function () {
      const tripId = this.getAttribute("data-trip-id");
      showTripDetails(tripId);
    });
  });
}

/**
 * Display trips in a modal (fallback UI)
 */
function displayTripsModal() {
  let html = '<div class="history-container">';
  html += '<div class="history-header"><h2>Trip History</h2></div>';
  html += '<div class="history-list">';

  if (completedTrips.length === 0) {
    html += '<p class="no-trips">No completed trips yet</p>';
  } else {
    completedTrips.forEach((trip) => {
      const date = new Date(trip.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const earnings = (trip.total_earnings || 0).toFixed(2);
      const passengers = trip.passenger_count || 0;

      html += `
        <div class="trip-card">
          <div class="trip-header">
            <h3>Trip #${trip.trip_id}</h3>
            <span class="trip-date">${date}</span>
          </div>
          <div class="trip-info">
            <div class="info-row">
              <span>Passengers:</span>
              <strong>${passengers}</strong>
            </div>
            <div class="info-row">
              <span>Earnings:</span>
              <strong>₱${earnings}</strong>
            </div>
            <div class="info-row">
              <span>Status:</span>
              <span class="status-badge">${capitalizeStatus(trip.ride_status)}</span>
            </div>
          </div>
        </div>
      `;
    });
  }

  html += "</div></div>";

  // Inject into main content area
  const mainContent = document.querySelector("main") || document.body;
  const historyDiv = document.createElement("div");
  historyDiv.innerHTML = html;

  // Add styles
  const styles = `
    <style>
      .history-container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 1rem;
      }
      .history-header {
        margin-bottom: 2rem;
      }
      .history-header h2 {
        font-size: 1.75rem;
        font-weight: 700;
      }
      .history-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .trip-card {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 1.5rem;
        background: white;
        transition: box-shadow 0.2s;
      }
      .trip-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .trip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        border-bottom: 1px solid #f3f4f6;
        padding-bottom: 1rem;
      }
      .trip-header h3 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0;
      }
      .trip-date {
        color: #6b7280;
        font-size: 0.875rem;
      }
      .trip-info {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .info-row span {
        color: #6b7280;
      }
      .info-row strong {
        color: #1f2937;
        font-weight: 600;
      }
      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
        background: #d1fae5;
        color: #065f46;
      }
      .no-trips {
        text-align: center;
        color: #6b7280;
        padding: 2rem;
        font-size: 1rem;
      }
    </style>
  `;

  document.head.insertAdjacentHTML("beforeend", styles);
  mainContent.insertAdjacentElement("afterbegin", historyDiv);
}

/**
 * Show details for a specific trip (modal/expandable)
 */
function showTripDetails(tripId) {
  const trip = completedTrips.find((t) => t.trip_id == tripId);

  if (!trip) {
    showError("Trip not found");
    return;
  }

  const date = new Date(trip.created_at).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const message = `
Trip #${trip.trip_id}
Date: ${date}
Passengers: ${trip.passenger_count}
Total Earnings: ₱${(trip.total_earnings || 0).toFixed(2)}
Status: ${capitalizeStatus(trip.ride_status)}
  `;

  alert(message);
}

/**
 * Show empty state
 */
function showEmptyState() {
  const container = document.getElementById("trips-container");
  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No Completed Trips</h3>
        <p>You haven't completed any trips yet. Start a new ride to see your history here.</p>
        <button onclick="window.location.href='driver-Homepage.html'" class="btn btn-primary">
          Go to Dashboard
        </button>
      </div>
    `;
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
