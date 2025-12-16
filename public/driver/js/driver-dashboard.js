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
      window.location.href = "login.html";
      return;
    }
    const userData = JSON.parse(userDataStr);
    this.userId = userData.id;
    console.log("[Dashboard] User ID:", this.userId);
  }

  async getDriverId() {
    try {
      const response = await fetch(`http://localhost:3000/api/driver/get-driver-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: this.userId })
      });

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
    } catch (error) {
      console.error("[Dashboard] Fatal error loading dashboard:", error);
      this.showMapFallback();
      this.showRequestsFallback();
    }
  }

  async loadCurrentRide() {
    try {
      if (!this.driverId) {
        throw new Error("Driver ID not available");
      }

      const response = await fetch(`http://localhost:3000/api/driver/rides/${this.driverId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[Dashboard] Current ride response:", data);

      if (data.success && data.rides && data.rides.length > 0) {
        // Get most recent ride
        this.currentRide = data.rides[0];
        this.hasRides = true;
        this.displayRideOnMap();
      } else {
        this.hasRides = false;
        this.showMapFallback();
      }
    } catch (error) {
      console.error("[Dashboard] Error loading current ride:", error);
      this.hasRides = false;
      this.showMapFallback();
    }
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
      this.displayPassengersForRide(this.currentRide.trip_id || this.currentRide.tripId);
    }
  }

  initializeMap() {
    const mapElement = document.getElementById("route-map");
    if (!mapElement) {
      console.error("[Dashboard] Map element not found");
      return;
    }

    const defaultCenter = { lat: 16.4023, lng: 120.5960 };

    this.map = new google.maps.Map(mapElement, {
      zoom: 13,
      center: defaultCenter,
      styles: [
        {
          featureType: "poi",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    console.log("[Dashboard] Map initialized");
  }

  addRouteToMap(ride) {
    if (!this.map) return;

    const startLat = ride.startLat || ride.start_lat;
    const startLng = ride.startLong || ride.start_long;
    const endLat = ride.endLat || ride.end_lat;
    const endLng = ride.endLong || ride.end_long;

    if (!startLat || !startLng || !endLat || !endLng) {
      console.error("[Dashboard] Missing coordinates:", ride);
      return;
    }

    const startMarker = new google.maps.Marker({
      position: { lat: parseFloat(startLat), lng: parseFloat(startLng) },
      map: this.map,
      title: "Pickup Location",
      icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
    });

    const endMarker = new google.maps.Marker({
      position: { lat: parseFloat(endLat), lng: parseFloat(endLng) },
      map: this.map,
      title: "Dropoff Location",
      icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
    });

    const routePath = [
      { lat: parseFloat(startLat), lng: parseFloat(startLng) },
      { lat: parseFloat(endLat), lng: parseFloat(endLng) }
    ];

    const routeLine = new google.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: "#E23C3C",
      strokeOpacity: 0.7,
      strokeWeight: 3,
      map: this.map
    });

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(startMarker.getPosition());
    bounds.extend(endMarker.getPosition());
    
    setTimeout(() => {
      this.map.fitBounds(bounds);
    }, 100);

    this.routes.push({ marker: startMarker, endMarker: endMarker, line: routeLine });
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
      const response = await fetch(`http://localhost:3000/api/driver/bookings/${this.driverId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[Dashboard] Bookings response:", data);

      if (data.success && data.bookings) {
        // Filter bookings for this specific trip
        const tripBookings = data.bookings.filter(b => b.trip_id === tripId);
        this.displayPassengersList(tripBookings);
      }
    } catch (error) {
      console.error("[Dashboard] Error loading passengers:", error);
    }
  }

  displayPassengersList(passengers) {
    const mapContainer = document.getElementById("map-container");
    if (!mapContainer) return;

    // Add passenger list below map
    let passengersHTML = '';
    
    if (passengers.length > 0) {
      passengersHTML = `
        <div class="passengers-list" style="margin-top: 20px; padding: 15px; background: var(--color-secondary); border-radius: 8px;">
          <h4 style="margin-top: 0;">Passengers Booked (${passengers.length})</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
      `;

      passengers.forEach(passenger => {
        const name = `${passenger.first_name} ${passenger.last_name}`;
        const phone = passenger.mobile_number || "N/A";
        passengersHTML += `
          <div style="padding: 10px; background: var(--color-background); border-radius: 6px; border-left: 3px solid var(--color-primary);">
            <strong>${name}</strong>
            <br>
            <small>${phone}</small>
          </div>
        `;
      });

      passengersHTML += `
          </div>
        </div>
      `;
    }

    // Insert after route map
    const mapElement = document.getElementById("route-map");
    if (mapElement && mapElement.parentElement) {
      const existingList = mapElement.parentElement.querySelector('.passengers-list');
      if (existingList) {
        existingList.remove();
      }
      
      if (passengers.length > 0) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = passengersHTML;
        mapElement.parentElement.appendChild(tempDiv.firstElementChild);
      }
    }
  }

  async loadPendingRequests() {
    try {
      if (!this.driverId) {
        throw new Error("Driver ID not available");
      }

      const response = await fetch(`http://localhost:3000/api/driver/bookings/${this.driverId}`);
      
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
        data.bookings.forEach(request => {
          const card = this.createRequestCard(request);
          container.appendChild(card);
        });

        // Update pending requests count in stats
        const pendingElement = document.getElementById("pending-requests");
        if (pendingElement) {
          pendingElement.textContent = data.bookings.length;
        }

        console.log(`[Dashboard] Loaded ${data.bookings.length} pending requests`);
      } else {
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
        <p><i class="bx bx-map"></i> ${request.start_address || "Pickup"} → ${request.end_address || "Dropoff"}</p>
        <small>Seats requested: 1</small>
      </div>
      <div class="request-actions">
        <button class="btn btn-small btn-primary accept-btn" data-booking-id="${request.booking_id}" data-trip-id="${request.trip_id}">
          Accept
        </button>
        <button class="btn btn-small btn-outline decline-btn" data-booking-id="${request.booking_id}" data-trip-id="${request.trip_id}">
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
      const response = await fetch(`http://localhost:3000/api/driver/bookings/${bookingId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tripId: tripId
        })
      });

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
      const response = await fetch(`http://localhost:3000/api/driver/bookings/${bookingId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tripId: tripId
        })
      });

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
