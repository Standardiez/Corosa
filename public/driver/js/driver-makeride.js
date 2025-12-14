/**
 * DRIVER MAKERIDE HANDLER
 * Manages ride creation flow: location selection → time/seats input → submission
 *
 * Uses sessionStorage for state persistence across page navigation
 * Integrates with Google Maps or similar for route visualization
 */

class DriverRideFlow {
  constructor() {
    // Form elements
    this.form = document.getElementById("rideCreationForm");
    this.pickupInput = document.getElementById("pickupLocation");
    this.dropoffInput = document.getElementById("dropoffLocation");
    this.departureTimeInput = document.getElementById("departureTime");
    this.seatsInput = document.getElementById("availableSeats");
    this.submitBtn = document.getElementById("submitRideBtn");

    // Status indicators
    this.pickupStatus = document.getElementById("pickupStatus");
    this.dropoffStatus = document.getElementById("dropoffStatus");
    this.locationError = document.getElementById("locationError");
    this.formError = document.getElementById("formError");
    this.loadingIndicator = document.getElementById("loadingIndicator");

    // Route preview element
    this.routePreview = document.getElementById("routePreview");
    this.routeMap = document.getElementById("routeMap");

    // State
    this.rideData = {
      startLat: null,
      startLong: null,
      startAddress: null,
      endLat: null,
      endLong: null,
      endAddress: null,
      departureTime: null,
      availableSeats: null,
    };

    this.init();
  }

  /**
   * Initialize the ride creation flow
   */
  init() {
    // Restore saved locations from sessionStorage
    this.restoreSavedLocations();

    // Event listeners
    if (this.pickupInput) {
      this.pickupInput.addEventListener("change", () =>
        this.onLocationChanged("pickup")
      );
    }
    if (this.dropoffInput) {
      this.dropoffInput.addEventListener("change", () =>
        this.onLocationChanged("dropoff")
      );
    }
    if (this.departureTimeInput) {
      this.departureTimeInput.addEventListener("change", () =>
        this.validateForm()
      );
    }
    if (this.seatsInput) {
      this.seatsInput.addEventListener("change", () => this.validateForm());
    }
    if (this.form) {
      this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    }

    // Initial validation
    this.validateForm();
  }

  /**
   * Restore saved locations from sessionStorage
   */
  restoreSavedLocations() {
    try {
      const savedPickup = sessionStorage.getItem("driverPickupLocation");
      const savedDropoff = sessionStorage.getItem("driverDropoffLocation");

      if (savedPickup && this.pickupInput) {
        this.pickupInput.value = savedPickup;
        this.rideData.startAddress = savedPickup;
        this.pickupInput.classList.add("completed");
        if (this.pickupStatus) this.pickupStatus.textContent = "✓ Selected";
      }

      if (savedDropoff && this.dropoffInput) {
        this.dropoffInput.value = savedDropoff;
        this.rideData.endAddress = savedDropoff;
        this.dropoffInput.classList.add("completed");
        if (this.dropoffStatus) this.dropoffStatus.textContent = "✓ Selected";
      }

      // Restore time and seats if available
      const savedTime = sessionStorage.getItem("driverDepartureTime");
      if (savedTime && this.departureTimeInput) {
        this.departureTimeInput.value = savedTime;
        this.rideData.departureTime = savedTime;
      }

      const savedSeats = sessionStorage.getItem("driverAvailableSeats");
      if (savedSeats && this.seatsInput) {
        this.seatsInput.value = savedSeats;
        this.rideData.availableSeats = parseInt(savedSeats);
      }
    } catch (e) {
      console.warn("Could not restore saved locations:", e);
    }
  }

  /**
   * Handle location change (pickup or dropoff)
   */
  onLocationChanged(type) {
    if (type === "pickup") {
      const value = this.pickupInput.value.trim();
      if (value) {
        this.rideData.startAddress = value;
        sessionStorage.setItem("driverPickupLocation", value);
        this.pickupInput.classList.add("completed");
        if (this.pickupStatus) this.pickupStatus.textContent = "✓ Selected";
        this.locationError.style.display = "none";
      } else {
        this.rideData.startAddress = null;
        sessionStorage.removeItem("driverPickupLocation");
        this.pickupInput.classList.remove("completed");
        if (this.pickupStatus) this.pickupStatus.textContent = "○ Not selected";
      }
    } else if (type === "dropoff") {
      const value = this.dropoffInput.value.trim();
      if (value) {
        this.rideData.endAddress = value;
        sessionStorage.setItem("driverDropoffLocation", value);
        this.dropoffInput.classList.add("completed");
        if (this.dropoffStatus) this.dropoffStatus.textContent = "✓ Selected";
        this.locationError.style.display = "none";
      } else {
        this.rideData.endAddress = null;
        sessionStorage.removeItem("driverDropoffLocation");
        this.dropoffInput.classList.remove("completed");
        if (this.dropoffStatus)
          this.dropoffStatus.textContent = "○ Not selected";
      }
    }

    // Check if both locations are selected
    this.updateLocationsUI();

    // Validate form
    this.validateForm();
  }

  /**
   * Update UI when locations are selected
   */
  updateLocationsUI() {
    const locationsSelected =
      this.rideData.startAddress && this.rideData.endAddress;

    // Enable/disable time and seats inputs based on location selection
    if (this.departureTimeInput) {
      this.departureTimeInput.disabled = !locationsSelected;
    }
    if (this.seatsInput) {
      this.seatsInput.disabled = !locationsSelected;
    }

    // Show/hide route preview
    if (locationsSelected) {
      this.showRoutePreview();
    } else {
      this.hideRoutePreview();
    }
  }

  /**
   * Show route preview (placeholder for map integration)
   */
  showRoutePreview() {
    if (this.routePreview) {
      this.routePreview.style.display = "block";
    }
    if (this.routeMap) {
      this.routeMap.innerHTML = `
        <div style="text-align: center; padding: 20px; background: #f0f0f0; border-radius: 8px;">
          <p style="margin: 0 0 10px 0;"><strong>Route Preview</strong></p>
          <p style="margin: 0; color: #666;">
            <i class="bx bx-map"></i> From: ${this.rideData.startAddress}
          </p>
          <p style="margin: 8px 0; color: #666;">
            <i class="bx bx-location-plus"></i> To: ${this.rideData.endAddress}
          </p>
          <p style="margin: 8px 0 0 0; font-size: 0.9em; color: #999;">
            Map visualization coming soon
          </p>
        </div>
      `;
    }
  }

  /**
   * Hide route preview
   */
  hideRoutePreview() {
    if (this.routePreview) {
      this.routePreview.style.display = "none";
    }
  }

  /**
   * Validate the entire form
   */
  validateForm() {
    const isValid = this.isFormValid();

    // Enable/disable submit button
    if (this.submitBtn) {
      this.submitBtn.disabled = !isValid;
      this.submitBtn.style.opacity = isValid ? "1" : "0.5";
      this.submitBtn.style.cursor = isValid ? "pointer" : "not-allowed";
    }

    // Show/hide time and seats inputs
    if (this.rideData.startAddress && this.rideData.endAddress) {
      if (this.departureTimeInput)
        this.departureTimeInput.style.display = "block";
      if (this.seatsInput) this.seatsInput.style.display = "block";
    } else {
      if (this.departureTimeInput)
        this.departureTimeInput.style.display = "none";
      if (this.seatsInput) this.seatsInput.style.display = "none";
    }
  }

  /**
   * Check if form is valid
   */
  isFormValid() {
    return !!(
      this.rideData.startAddress &&
      this.rideData.endAddress &&
      this.rideData.departureTime &&
      this.rideData.availableSeats >= 1
    );
  }

  /**
   * Handle form submission
   */
  async handleSubmit(e) {
    e.preventDefault();

    // Update ride data from inputs
    this.rideData.departureTime = this.departureTimeInput.value;
    this.rideData.availableSeats = parseInt(this.seatsInput.value);

    // Final validation
    if (!this.isFormValid()) {
      this.showError("Please fill in all required fields");
      return;
    }

    // Show loading state
    this.showLoading(true);
    this.formError.style.display = "none";

    try {
      // Get driver ID from localStorage
      const userData = JSON.parse(localStorage.getItem("userData"));
      const driverId = userData.userId;

      // TODO: Get actual coordinates from location picker
      // For now, using placeholder coordinates
      const payload = {
        driverId: driverId,
        startLat: this.rideData.startLat || 14.5995, // Manila default
        startLong: this.rideData.startLong || 120.9842,
        startAddress: this.rideData.startAddress,
        endLat: this.rideData.endLat || 14.5995,
        endLong: this.rideData.endLong || 120.9842,
        endAddress: this.rideData.endAddress,
        departureTime: this.rideData.departureTime,
        availableSeats: this.rideData.availableSeats,
      };

      // Send to backend
      const response = await fetch("http://localhost:3000/api/driver/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        // Clear saved locations
        sessionStorage.removeItem("driverPickupLocation");
        sessionStorage.removeItem("driverDropoffLocation");
        sessionStorage.removeItem("driverDepartureTime");
        sessionStorage.removeItem("driverAvailableSeats");

        // Show success message
        alert("✅ Ride created successfully!");

        // Redirect to ride confirmation or driver homepage
        window.location.href = "driver-ridestatus.html";
      } else {
        this.showError(result.message || "Failed to create ride");
      }
    } catch (error) {
      console.error("Ride creation error:", error);
      this.showError("Error: " + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (this.formError) {
      this.formError.textContent = message;
      this.formError.style.display = "block";
    } else {
      alert("Error: " + message);
    }
  }

  /**
   * Show/hide loading indicator
   */
  showLoading(show) {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = show ? "block" : "none";
    }
    if (this.submitBtn) {
      this.submitBtn.disabled = show;
    }
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  window.driverRideFlow = new DriverRideFlow();
});
