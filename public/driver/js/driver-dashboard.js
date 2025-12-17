/**
 * Driver Dashboard Module
 * Handles ride routes, pending requests, and request acceptance/decline
 */

class DriverDashboard {
  constructor() {
    this.map = null;
    this.routes = [];
    this.userId = null;
    this.driverId = null;
    this.hasRides = false;
    this.currentRide = null;
    this.refreshInterval = null; // Store interval ID for cleanup
    this.initializeOnLoad();
  }

  initializeOnLoad() {
    document.addEventListener("DOMContentLoaded", () => {
      this.getUserData();
      this.loadDashboardData();
    });
  }

  getUserData() {
    const userDataStr = localStorage.getItem("userData");
    if (!userDataStr) {
      console.error("[Dashboard] No userData in localStorage");
      window.location.href = "login.html";
      return;
    }
    const userData = JSON.parse(userDataStr);
    this.userId = userData.id || userData.userId || userData.user_id;
    console.log("[Dashboard] User ID:", this.userId);
    console.log("[Dashboard] Full userData:", userData);

    if (!this.userId) {
      console.error("[Dashboard] Could not find user ID in localStorage data");
      window.location.href = "login.html";
      return;
    }
  }

  async getDriverId() {
    try {
      // Use centralized API config if available, otherwise fallback
      const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
      const response = await fetch(
        `${apiBase}/api/driver/get-driver-id`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: this.userId }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.driverId) {
        throw new Error("Driver ID not found");
      }

      this.driverId = data.driverId;
      console.log("[Dashboard] Driver ID:", this.driverId);
      return this.driverId;
    } catch (error) {
      console.error("[Dashboard] Error getting driver ID:", error);
      throw error;
    }
  }

  async loadDashboardData() {
    try {
      console.log("[Dashboard] Loading dashboard data...");

      // Get driver ID first
      await this.getDriverId();

      // Load and display current ride
      await this.loadCurrentRide();

      // Load and display pending requests
      await this.loadPendingRequests();

      // Set up auto-refresh: reload pending requests and accepted passengers every 2 seconds
      this.setupAutoRefresh();
    } catch (error) {
      console.error("[Dashboard] Fatal error loading dashboard:", error);
      this.showMapFallback();
      this.showRequestsFallback();
    }
  }

  setupAutoRefresh() {
    // Clear existing interval if any
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Set up auto-refresh every 5 seconds (more reasonable than 2s)
    this.refreshInterval = setInterval(async () => {
      try {
        // Refresh pending requests
        await this.loadPendingRequests();

        // Refresh accepted passengers if we have a current ride
        if (this.currentRide && this.currentRide.trip_id) {
          await this.displayPassengersForRide(this.currentRide.trip_id);
        }

        // Refresh stats
        await this.fetchStats();
      } catch (error) {
        console.error("[Dashboard] Auto-refresh error:", error);
      }
    }, 5000); // 5 second refresh interval (was 2 seconds)

    console.log("[Dashboard] Auto-refresh enabled (5 second interval)");

    // Load stats immediately on first load
    this.fetchStats();
  }

  async fetchStats() {
    try {
      if (!this.driverId) {
        throw new Error("Driver ID not available");
      }

      console.log(`[Dashboard] Fetching stats for driver ${this.driverId}...`);

      // Use centralized API config if available, otherwise fallback
      const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
      const response = await fetch(
        `${apiBase}/api/driver/stats/${this.driverId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch stats");
      }

      const stats = result.data || {};
      console.log("[Dashboard] Stats fetched:", stats);

      // Update UI with stats
      this.updateStatsUI(stats);
    } catch (error) {
      console.error("[Dashboard] Error fetching stats:", error);
      // Keep existing values if fetch fails
    }
  }

  updateStatsUI(stats) {
    // Update pending requests
    const pendingEl = document.getElementById("stat-pending-requests");
    if (pendingEl) {
      pendingEl.textContent = stats.pending_requests || 0;
    }

    // Update total rides
    const totalRidesEl = document.getElementById("stat-total-rides");
    if (totalRidesEl) {
      totalRidesEl.textContent = stats.total_rides || 0;
    }

    // Update average rating
    const avgRatingEl = document.getElementById("stat-avg-rating");
    if (avgRatingEl) {
      avgRatingEl.textContent = (stats.average_rating || 0).toFixed(1);
    }

    // Update weekly earnings
    const weeklyEarningsEl = document.getElementById("stat-weekly-earnings");
    if (weeklyEarningsEl) {
      const earnings = parseFloat(stats.weekly_earnings || 0).toFixed(2);
      weeklyEarningsEl.textContent = "₱" + earnings.replace(/\.00$/, "");
    }

    console.log("[Dashboard] Stats UI updated");
  }

  async loadCurrentRide() {
    try {
      if (!this.driverId) {
        throw new Error("Driver ID not available");
      }

      // Use centralized API config if available, otherwise fallback
      const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
      const response = await fetch(
        `${apiBase}/api/driver/rides/${this.driverId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[Dashboard] Current ride response:", data);

      if (data.success && data.rides && data.rides.length > 0) {
        // Get most recent ride that's not completed or cancelled
        const activeRide = data.rides.find(
          (r) => r.ride_status !== "completed" && r.ride_status !== "cancelled"
        );

        if (activeRide) {
          this.currentRide = activeRide;
          this.hasRides = true;
          this.displayRideOnMap();
        } else {
          // No active rides - clear sections
          this.hasRides = false;
          this.clearMapAndRequests();
        }
      } else {
        this.hasRides = false;
        this.clearMapAndRequests();
      }
    } catch (error) {
      console.error("[Dashboard] Error loading current ride:", error);
      this.hasRides = false;
      this.clearMapAndRequests();
    }
  }

  clearMapAndRequests() {
    // Clear the route map
    const mapContainer = document.getElementById("map-container");
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          background: #f3f4f6;
          border-radius: 8px;
          color: #6b7280;
        ">
          <div style="text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px;">No active ride</p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">Create a new ride to get started</p>
          </div>
        </div>
      `;
    }

    // Clear pending requests container
    const pendingContainer = document.getElementById(
      "pending-requests-container"
    );
    if (pendingContainer) {
      pendingContainer.innerHTML = `
        <div style="
          padding: 20px;
          text-align: center;
          color: #6b7280;
          background: #f9fafb;
          border-radius: 8px;
        ">
          <p style="margin: 0 0 10px 0; font-size: 14px;">No pending requests</p>
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            Waiting for passengers to book your ride
          </p>
        </div>
      `;
    }

    console.log("[Dashboard] Cleared map and requests");
  }

  displayRideOnMap() {
    const mapContainer = document.getElementById("map-container");
    if (!mapContainer) return;

    // Initialize map if not already done
    if (!this.map) {
      this.initializeMap();
    }

    if (this.currentRide) {
      // Add route to map
      this.addRouteToMap(this.currentRide);

      // Show passengers booked for this ride
      this.displayPassengersForRide(
        this.currentRide.trip_id || this.currentRide.tripId
      );
    }
  }

  initializeMap() {
    const mapElement = document.getElementById("route-map");
    if (!mapElement) {
      console.error("[Dashboard] Map element not found");
      return;
    }

    const defaultCenter = { lat: 16.4023, lng: 120.596 };

    this.map = new google.maps.Map(mapElement, {
      zoom: 13,
      center: defaultCenter,
      styles: [
        {
          featureType: "poi",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    console.log("[Dashboard] Map initialized");
  }

  addRouteToMap(ride) {
    if (!this.map) return;

    console.log("[Dashboard] addRouteToMap called with ride:", ride);

    const startLat = ride.startLat || ride.start_lat;
    const startLng = ride.startLong || ride.start_long;
    const endLat = ride.endLat || ride.end_lat;
    const endLng = ride.endLong || ride.end_long;

    if (!startLat || !startLng || !endLat || !endLng) {
      console.error("[Dashboard] Missing coordinates:", {
        startLat,
        startLng,
        endLat,
        endLng,
      });
      return;
    }

    try {
      const startPos = { lat: parseFloat(startLat), lng: parseFloat(startLng) };
      const endPos = { lat: parseFloat(endLat), lng: parseFloat(endLng) };

      console.log("[Dashboard] Final positions:", { startPos, endPos });

      // Create markers
      const startMarker = new google.maps.Marker({
        position: startPos,
        map: this.map,
        title: "Pickup Location",
        icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
      });

      const endMarker = new google.maps.Marker({
        position: endPos,
        map: this.map,
        title: "Dropoff Location",
        icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      });

      console.log("[Dashboard] Markers created successfully");

      // Use Directions Service to get actual route
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map: this.map,
        suppressMarkers: true, // Use our custom markers instead
        polylineOptions: {
          strokeColor: "#E23C3C",
          strokeOpacity: 0.8,
          strokeWeight: 4,
        },
      });

      directionsService.route(
        {
          origin: startPos,
          destination: endPos,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            console.log("[Dashboard] Directions found, rendering route");
            directionsRenderer.setDirections(result);
          } else {
            // Fallback to simple polyline if directions not available
            console.warn(
              "[Dashboard] Directions not available, using simple polyline"
            );
            const routePath = [startPos, endPos];
            new google.maps.Polyline({
              path: routePath,
              geodesic: true,
              strokeColor: "#E23C3C",
              strokeOpacity: 0.8,
              strokeWeight: 4,
              map: this.map,
            });
          }

          // Fit map bounds to show both markers
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(startMarker.getPosition());
          bounds.extend(endMarker.getPosition());

          setTimeout(() => {
            this.map.fitBounds(bounds);
          }, 100);
        }
      );

      this.routes.push({
        marker: startMarker,
        endMarker: endMarker,
        line: null,
      });
    } catch (error) {
      console.error("[Dashboard] Error creating markers/polyline:", error);
    }
  }

  showMapFallback() {
    const mapContainer = document.getElementById("map-container");
    if (!mapContainer) return;

    mapContainer.innerHTML = `
      <div class="empty-state" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <i class="bx bx-map"></i>
        <p>No current ride</p>
        <small>Create a ride to see your route on the map</small>
      </div>
    `;
  }

  async displayPassengersForRide(tripId) {
    try {
      // Fetch accepted passengers (not pending requests)
      const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
      const response = await fetch(
        `${apiBase}/api/accepted-passengers/${this.driverId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[Dashboard] Accepted passengers response:", data);

      if (data.success && data.passengers) {
        // Filter passengers for this specific trip ONLY
        const tripPassengers = data.passengers.filter(
          (p) => p.trip_id === tripId
        );
        console.log(
          `[Dashboard] Filtered ${tripPassengers.length} passengers for trip ${tripId}`
        );
        this.displayPassengersList(tripPassengers);
      } else {
        this.displayPassengersList([]);
      }
    } catch (error) {
      console.error("[Dashboard] Error loading accepted passengers:", error);
      this.displayPassengersList([]);
    }
  }

  displayPassengersList(passengers) {
    const passengersSection = document.getElementById("passengers-section");
    const passengersList = document.getElementById("passengers-list");
    const cancelBtn = document.getElementById("cancel-ride-btn");

    if (!passengersSection || !passengersList) return;

    if (passengers && passengers.length > 0) {
      // Show passengers section with accepted passengers
      passengersSection.style.display = "block";
      passengersList.innerHTML = "";

      passengers.forEach((passenger) => {
        const name = `${passenger.first_name || "Unknown"} ${
          passenger.last_name || ""
        }`.trim();
        const phone = passenger.mobile_number || "N/A";
        const pickupLat = passenger.pickup_lat || passenger.start_lat;
        const pickupLng = passenger.pickup_long || passenger.start_long;
        const dropoffLat = passenger.dropoff_lat || passenger.end_lat;
        const dropoffLng = passenger.dropoff_long || passenger.end_long;

        const passengerCard = document.createElement("div");
        passengerCard.style.cssText = `
          padding: 12px;
          background: var(--color-background);
          border-radius: 6px;
          border-left: 4px solid var(--color-primary);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        `;
        passengerCard.innerHTML = `
          <div style="flex: 1;">
            <strong>${name}</strong>
            <br>
            <small style="color: var(--color-text-secondary);">📱 ${phone}</small>
          </div>
          <div style="flex: 1; font-size: 12px; color: var(--color-text-secondary); text-align: right;">
            <div>🟢 <strong>Pick:</strong> (${parseFloat(pickupLat).toFixed(
              4
            )}, ${parseFloat(pickupLng).toFixed(4)})</div>
            <div>🔴 <strong>Drop:</strong> (${parseFloat(dropoffLat).toFixed(
              4
            )}, ${parseFloat(dropoffLng).toFixed(4)})</div>
          </div>
        `;
        passengersList.appendChild(passengerCard);
      });

      // Add cancel button click handler
      if (cancelBtn) {
        cancelBtn.onclick = () => this.handleCancelRide();
      }
    } else {
      // Show "No confirmed passengers yet" message
      passengersSection.style.display = "block";
      passengersList.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--color-muted-foreground);">
          <i class="bx bx-user-x" style="font-size: 32px; opacity: 0.5;"></i>
          <p style="margin: 10px 0 5px 0;">No confirmed passengers yet.</p>
          <small>Passengers will appear here once you accept their ride requests.</small>
        </div>
      `;
    }
  }

  async handleCancelRide() {
    if (!this.currentRide) return;

    const confirmCancel = confirm(
      "Are you sure you want to cancel this ride? All passengers will be notified."
    );
    if (!confirmCancel) return;

    try {
      const tripId = this.currentRide.trip_id;
      const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
      const response = await fetch(
        `${apiBase}/api/driver/rides/${tripId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        alert("Ride cancelled successfully!");
        this.currentRide = null;
        this.hasRides = false;
        this.showMapFallback();

        // Hide passengers section
        const passengersSection = document.getElementById("passengers-section");
        if (passengersSection) {
          passengersSection.style.display = "none";
        }

        // Reload bookings
        await this.loadPendingRequests();
      } else {
        alert("Failed to cancel ride: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("[Dashboard] Error cancelling ride:", error);
      alert("Error cancelling ride. Please try again.");
    }
  }

  async loadPendingRequests() {
    try {
      if (!this.driverId) {
        throw new Error("Driver ID not available");
      }

      console.log(
        `[Dashboard] Loading pending requests for driver ${this.driverId}...`
      );

      const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
      const response = await fetch(
        `${apiBase}/api/bookings/${this.driverId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[Dashboard] Pending requests response:", data);

      const container = document.getElementById("pending-requests-container");
      if (!container) {
        console.error("[Dashboard] Container not found");
        return;
      }

      container.innerHTML = "";

      if (data.success && data.bookings && data.bookings.length > 0) {
        console.log(
          `[Dashboard] Displaying ${data.bookings.length} pending requests`
        );
        data.bookings.forEach((request) => {
          const card = this.createRequestCard(request);
          container.appendChild(card);
        });

        // Update pending requests count in stats
        const pendingElement = document.getElementById("pending-requests");
        if (pendingElement) {
          pendingElement.textContent = data.bookings.length;
        }

        console.log(
          `[Dashboard] Loaded ${data.bookings.length} pending requests`
        );
      } else {
        console.log("[Dashboard] No pending requests found");
        this.showRequestsFallback();
      }
    } catch (error) {
      console.error("[Dashboard] Error loading pending requests:", error);
      this.showRequestsFallback();
    }
  }

  showRequestsFallback() {
    const container = document.getElementById("pending-requests-container");
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state">
        <i class="bx bx-inbox"></i>
        <p>No booking requests at the moment</p>
        <small>Passengers will see your ride and send requests when you offer one</small>
      </div>
    `;
  }

  createRequestCard(request) {
    const card = document.createElement("div");
    card.className = "request-card";
    // Map Node.js field names
    const passengerName = `${request.first_name} ${request.last_name}`;
    const mobileNumber = request.mobile_number || "N/A";
    const bookingDate = request.created_at || new Date().toISOString();

    card.innerHTML = `
      <div class="request-header">
        <div class="passenger-info">
          <strong>${passengerName}</strong>
          <small>${mobileNumber}</small>
        </div>
        <span class="request-time">${this.formatTimeAMPM(bookingDate)}</span>
      </div>
      <div class="request-route">
        <p><i class="bx bx-map"></i> ${request.start_address || "Pickup"} → ${
      request.end_address || "Dropoff"
    }</p>
        <small>Seats requested: 1</small>
      </div>
      <div class="request-actions">
        <button class="btn btn-small btn-primary accept-btn" data-booking-id="${
          request.booking_id
        }" data-trip-id="${request.trip_id}">
          Accept
        </button>
        <button class="btn btn-small btn-outline decline-btn" data-booking-id="${
          request.booking_id
        }" data-trip-id="${request.trip_id}">
          Decline
        </button>
      </div>
    `;

    const acceptBtn = card.querySelector(".accept-btn");
    const declineBtn = card.querySelector(".decline-btn");

    acceptBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await this.handleAcceptRequest(request.booking_id, request.trip_id);
    });

    declineBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await this.handleDeclineRequest(request.booking_id, request.trip_id);
    });

    return card;
  }

  formatTimeAMPM(dateString) {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? "0" + minutes : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  async handleAcceptRequest(bookingId, tripId) {
    try {
      const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
      const response = await fetch(
        `${apiBase}/api/bookings/${bookingId}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tripId: tripId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log("[Dashboard] Request accepted successfully");
        alert("✓ Booking request accepted!");
        this.loadPendingRequests();
        this.loadCurrentRide(); // Refresh ride to update passenger list
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("[Dashboard] Error accepting request:", error);
      alert("Error accepting request. Please try again.");
    }
  }

  async handleDeclineRequest(bookingId, tripId) {
    try {
      const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
      const response = await fetch(
        `${apiBase}/api/bookings/${bookingId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tripId: tripId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log("[Dashboard] Request declined successfully");
        alert("Booking request declined");
        this.loadPendingRequests();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("[Dashboard] Error declining request:", error);
      alert("Error declining request. Please try again.");
    }
  }
}

// Initialize dashboard when script loads
new DriverDashboard();

// Initialize dashboard when script loads
new DriverDashboard();
