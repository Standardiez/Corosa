/**
 * DRIVER BOOKING REQUESTS HANDLER
 * Manages display and action of passenger booking requests
 *
 * - Fetch pending requests from backend
 * - Display with passenger info, locations, and actions
 * - Handle accept/reject with immediate UI update
 * - Show seat availability changes
 */

class DriverBookingRequests {
  constructor() {
    this.requestsList = document.getElementById("requestsList");
    this.emptyState = document.getElementById("emptyState");
    this.loadingSpinner = document.getElementById("loadingSpinner");
    this.filterSelect = document.getElementById("filterSelect");
    this.refreshBtn = document.getElementById("refreshBtn");
    this.errorMsg = document.getElementById("errorMsg");

    this.requests = [];
    this.filteredRequests = [];

    this.init();
  }

  /**
   * Initialize booking requests handler
   */
  init() {
    // Event listeners
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener("click", () => this.loadRequests());
    }

    if (this.filterSelect) {
      this.filterSelect.addEventListener("change", () => this.applyFilter());
    }

    // Load requests on page load
    this.loadRequests();
  }

  /**
   * Load booking requests from backend
   */
  async loadRequests() {
    try {
      this.showLoading(true);
      this.errorMsg.style.display = "none";

      // Get driver ID
      const userData = JSON.parse(localStorage.getItem("userData"));
      const driverId = userData.userId;

      // Fetch requests
      const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
      const response = await fetch(
        `${apiBase}/api/driver/bookings/${driverId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const result = await response.json();

      if (result.success) {
        this.requests = result.data || [];
        this.applyFilter();
      } else {
        this.showError(result.message || "Failed to load requests");
      }
    } catch (error) {
      console.error("Error loading requests:", error);
      this.showError("Error loading requests: " + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Apply current filter to requests
   */
  applyFilter() {
    const filterValue = this.filterSelect.value;

    if (filterValue === "all") {
      this.filteredRequests = [...this.requests];
    } else {
      this.filteredRequests = this.requests.filter(
        (req) => req.status === filterValue
      );
    }

    this.renderRequests();
  }

  /**
   * Render requests list
   */
  renderRequests() {
    if (this.filteredRequests.length === 0) {
      this.requestsList.style.display = "none";
      this.emptyState.style.display = "block";
      return;
    }

    this.requestsList.style.display = "block";
    this.emptyState.style.display = "none";

    this.requestsList.innerHTML = this.filteredRequests
      .map(
        (req) => `
      <div class="booking-request" data-booking-id="${req.booking_id}">
        <div class="request-header">
          <div class="passenger-info">
            <h3>${req.passenger_name}</h3>
            <p class="passenger-phone">
              <i class="bx bx-phone"></i> ${req.passenger_phone}
            </p>
          </div>
          <div class="request-status">
            <span class="status-badge status-${req.status}">${this.formatStatus(
          req.status
        )}</span>
          </div>
        </div>

        <div class="request-details">
          <div class="route-info">
            <div class="location-item pickup">
              <i class="bx bx-map-pin"></i>
              <div>
                <p class="location-label">Pickup</p>
                <p class="location-address">${req.pickup_address}</p>
              </div>
            </div>
            <div class="route-line"></div>
            <div class="location-item dropoff">
              <i class="bx bx-location-plus"></i>
              <div>
                <p class="location-label">Dropoff</p>
                <p class="location-address">${req.dropoff_address}</p>
              </div>
            </div>
          </div>

          <div class="request-meta">
            <p><strong>Trip Date:</strong> ${this.formatDate(
              req.departure_time
            )}</p>
            <p><strong>Seats Requested:</strong> ${req.seats_requested}</p>
            <p><strong>Passenger Points:</strong> <span class="points">${
              req.passenger_points || 0
            }</span></p>
          </div>
        </div>

        <div class="request-actions">
          ${this.getActionButtons(req)}
        </div>
      </div>
    `
      )
      .join("");

    // Add event listeners to action buttons
    this.addActionListeners();
  }

  /**
   * Get action buttons based on request status
   */
  getActionButtons(req) {
    if (req.status === "pending") {
      return `
        <button class="btn-accept" data-booking-id="${req.booking_id}">
          <i class="bx bx-check"></i> Accept Request
        </button>
        <button class="btn-reject" data-booking-id="${req.booking_id}">
          <i class="bx bx-x"></i> Reject Request
        </button>
      `;
    } else if (req.status === "confirmed") {
      return `
        <button class="btn-confirmed" disabled>
          <i class="bx bx-check-circle"></i> Confirmed
        </button>
      `;
    } else if (req.status === "rejected") {
      return `
        <button class="btn-rejected" disabled>
          <i class="bx bx-x-circle"></i> Rejected
        </button>
      `;
    }
    return "";
  }

  /**
   * Add event listeners to action buttons
   */
  addActionListeners() {
    // Accept buttons
    document.querySelectorAll(".btn-accept").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const bookingId = btn.dataset.bookingId;
        await this.acceptRequest(bookingId);
      });
    });

    // Reject buttons
    document.querySelectorAll(".btn-reject").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const bookingId = btn.dataset.bookingId;
        await this.rejectRequest(bookingId);
      });
    });
  }

  /**
   * Accept booking request
   */
  async acceptRequest(bookingId) {
    if (!confirm("Accept this booking request?")) {
      return;
    }

    try {
      const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
      const response = await fetch(
        `${apiBase}/api/driver/bookings/${bookingId}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const result = await response.json();

      if (result.success) {
        // Update request in local array
        const req = this.requests.find((r) => r.booking_id == bookingId);
        if (req) {
          req.status = "confirmed";
          this.applyFilter();
          this.showSuccess(
            `Booking request accepted! Seats remaining: ${result.seatsRemaining}`
          );
        }
      } else {
        this.showError(result.message || "Failed to accept request");
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      this.showError("Error: " + error.message);
    }
  }

  /**
   * Reject booking request
   */
  async rejectRequest(bookingId) {
    if (!confirm("Reject this booking request?")) {
      return;
    }

    try {
      const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
      const response = await fetch(
        `${apiBase}/api/driver/bookings/${bookingId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const result = await response.json();

      if (result.success) {
        // Update request in local array
        const req = this.requests.find((r) => r.booking_id == bookingId);
        if (req) {
          req.status = "rejected";
          this.applyFilter();
          this.showSuccess("Booking request rejected");
        }
      } else {
        this.showError(result.message || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      this.showError("Error: " + error.message);
    }
  }

  /**
   * Format status for display
   */
  formatStatus(status) {
    const statusMap = {
      pending: "⏳ Pending",
      confirmed: "✓ Confirmed",
      rejected: "✗ Rejected",
      completed: "✓ Completed",
      cancelled: "⊘ Cancelled",
    };
    return statusMap[status] || status;
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch (e) {
      return dateString;
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    this.errorMsg.textContent = message;
    this.errorMsg.style.display = "block";
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    alert("✅ " + message);
  }

  /**
   * Show/hide loading spinner
   */
  showLoading(show) {
    if (this.loadingSpinner) {
      this.loadingSpinner.style.display = show ? "block" : "none";
    }
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  window.bookingRequests = new DriverBookingRequests();
});
