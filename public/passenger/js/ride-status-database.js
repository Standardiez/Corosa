/*
 * ============================================================================
 * RIDE STATUS PAGE - Passenger Ride Tracking and Review System
 * ============================================================================
 *
 * PURPOSE:
 * 1. Display real ride data fetched from database
 * 2. Show driver, route, and payment information
 * 3. Integrate review submission directly in ride-status page
 * 4. Handle real-time status updates from backend
 *
 * DATA SOURCE: Database (no mock data)
 * ARCHITECTURE: Database-driven, no frontend-only state
 *
 * ============================================================================
 */

(function () {
  "use strict";

  // Get booking ID from URL or session
  function getBookingId() {
    const params = new URLSearchParams(window.location.search);
    const bookingId =
      params.get("bookingId") || sessionStorage.getItem("bookingId");
    return bookingId;
  }

  // Format date and time
  function formatDateTime(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }

  // Format currency
  function formatCurrency(amount) {
    if (!amount) return "—";
    return "₱" + parseFloat(amount).toFixed(2);
  }

  // Generate initials from first and last name
  function generateInitials(firstName, lastName) {
    const first = (firstName || "").charAt(0).toUpperCase();
    const last = (lastName || "").charAt(0).toUpperCase();
    return first + last || "?";
  }

  // Fetch ride details from database
  async function fetchRideDetails(bookingId) {
    try {
      // Use centralized API config if available, otherwise fallback
      const apiBase =
        window.API_CONFIG?.NODE_API_BASE || "http://localhost:3000";
      const url = `${apiBase}/api/passenger/ride-details/${bookingId}`;

      console.log("[RideStatus] Fetching ride details from:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        console.error("Error fetching ride details:", result.message);
        return null;
      }

      // Fetch existing review separately
      try {
        const reviewUrl = `${apiBase}/api/reviews/booking/${bookingId}`;
        const reviewResponse = await fetch(reviewUrl);
        if (reviewResponse.ok) {
          const reviewResult = await reviewResponse.json();
          if (reviewResult.success && reviewResult.data) {
            result.data.review = reviewResult.data;
          }
        }
      } catch (reviewError) {
        console.warn("[RideStatus] Could not fetch review:", reviewError);
      }

      return result.data;
    } catch (error) {
      console.error("Error fetching ride details:", error);
      return null;
    }
  }

  // Submit review to database
  async function submitReview(bookingId, passengerId, rating, comment) {
    try {
      // Use centralized API config if available, otherwise fallback
      const apiBase =
        window.API_CONFIG?.NODE_API_BASE || "http://localhost:3000";
      const url = `${apiBase}/api/reviews`;

      console.log("[RideStatus] Submitting review to:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          passengerId,
          rating: parseInt(rating),
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error submitting review:", error);
      return { success: false, message: "Failed to submit review" };
    }
  }

  // Display ride details in UI
  function displayRideDetails(data) {
    if (!data || !data.booking) return;

    const booking = data.booking;
    const driver = data.driver;
    const review = data.review;

    // Populate Route Details section
    document.getElementById(
      "rate-pickup-location"
    ).textContent = `${booking.start_lat.toFixed(
      4
    )}, ${booking.start_long.toFixed(4)}`;

    document.getElementById(
      "rate-dropoff-location"
    ).textContent = `${booking.end_lat.toFixed(4)}, ${booking.end_long.toFixed(
      4
    )}`;

    document.getElementById("rate-date-time").textContent = formatDateTime(
      booking.created_at
    );

    // Calculate rough distance (simple formula)
    const distance =
      Math.sqrt(
        Math.pow(booking.end_lat - booking.start_lat, 2) +
          Math.pow(booking.end_long - booking.start_long, 2)
      ) * 111; // Rough km conversion
    document.getElementById("rate-distance").textContent =
      distance.toFixed(2) + " km";

    // Populate Payment Details section
    document.getElementById("rate-fare").textContent = formatCurrency(
      booking.total_cost * 0.9
    );
    document.getElementById("rate-service-fee").textContent = formatCurrency(
      booking.total_cost * 0.1
    );
    document.getElementById("rate-payment-method").textContent =
      booking.payment_type || "—";
    document.getElementById("rate-total-paid").textContent = formatCurrency(
      booking.total_cost
    );

    // Populate Driver Information section
    if (driver && driver.first_name && driver.last_name) {
      console.log(
        "[RideStatus] Setting driver name:",
        driver.first_name,
        driver.last_name
      );
      document.getElementById(
        "rate-driver-name"
      ).textContent = `${driver.first_name} ${driver.last_name}`;

      // Set avatar initials
      const initials = generateInitials(driver.first_name, driver.last_name);
      document.getElementById("rate-driver-avatar").textContent = initials;
    } else {
      console.warn("[RideStatus] Driver data missing or incomplete:", driver);
      // Show placeholder if driver not yet assigned
      document.getElementById("rate-driver-name").textContent =
        "Driver not yet assigned";
      document.getElementById("rate-driver-avatar").textContent = "—";
    }

    // Store booking and driver data for review submission
    const container = document.querySelector(".rate-review-container");
    if (container) {
      container.setAttribute("data-booking-id", booking.booking_id);
      container.setAttribute("data-driver-id", driver?.user_id || "");
      container.setAttribute("data-passenger-id", booking.passenger_id);
    }

    // If review already exists, populate it
    if (review) {
      displayExistingReview(review);
    }
  }

  // Display existing review (if already submitted)
  function displayExistingReview(review) {
    // Highlight selected stars
    document.querySelectorAll(".star-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelector(`.star-btn[data-rating="${review.rating}"]`)
      ?.classList.add("active");

    // Display comment
    const commentField = document.getElementById("reviewComment");
    if (commentField) {
      commentField.value = review.comment || "";
      updateCommentCounter();
    }

    // Show success message
    const statusEl = document.getElementById("reviewStatus");
    if (statusEl) {
      statusEl.textContent = "Review already submitted";
      statusEl.className = "status-message success";
    }

    // Disable submit button (already reviewed)
    const submitBtn = document.querySelector(".btn-submit-review");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Review Submitted";
    }
  }

  // Update comment character counter
  function updateCommentCounter() {
    const textarea = document.getElementById("reviewComment");
    const counter = document.getElementById("commentCounter");
    if (textarea && counter) {
      counter.textContent = textarea.value.length + " / 500";
    }
  }

  // Initialize page
  async function initialize() {
    const bookingId = getBookingId();

    if (!bookingId) {
      console.error("No booking ID provided");
      document.querySelector(".rate-review-section").innerHTML =
        '<p style="color: red;">Error: No booking information found.</p>';
      return;
    }

    // Fetch and display ride details
    const rideData = await fetchRideDetails(bookingId);
    if (rideData) {
      displayRideDetails(rideData);
    }

    // Setup star rating interaction
    setupStarRating();

    // Setup comment counter
    const commentField = document.getElementById("reviewComment");
    if (commentField) {
      commentField.addEventListener("input", updateCommentCounter);
    }

    // Setup review submission
    setupReviewSubmission();

    // Setup back button
    setupBackButton();

    // Setup report issue button
    setupReportButton();
  }

  // Setup star rating interaction
  function setupStarRating() {
    const starButtons = document.querySelectorAll(".star-btn");

    starButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const rating = btn.getAttribute("data-rating");

        // Clear previous selection
        starButtons.forEach((b) => b.classList.remove("active"));

        // Highlight selected and all previous stars
        starButtons.forEach((b) => {
          if (parseInt(b.getAttribute("data-rating")) <= parseInt(rating)) {
            b.classList.add("active");
          }
        });
      });

      // Hover effect
      btn.addEventListener("mouseover", () => {
        const rating = btn.getAttribute("data-rating");
        starButtons.forEach((b) => {
          if (parseInt(b.getAttribute("data-rating")) <= parseInt(rating)) {
            b.style.opacity = "0.7";
          } else {
            b.style.opacity = "1";
          }
        });
      });
    });

    // Reset on mouse leave
    document
      .querySelector(".star-container")
      ?.addEventListener("mouseleave", () => {
        starButtons.forEach((b) => (b.style.opacity = "1"));
      });
  }

  // Setup review submission
  function setupReviewSubmission() {
    const submitBtn = document.querySelector(".btn-submit-review");
    if (!submitBtn) return;

    submitBtn.addEventListener("click", async () => {
      const container = document.querySelector(".rate-review-container");
      const bookingId = container.getAttribute("data-booking-id");
      const passengerId = container.getAttribute("data-passenger-id");

      // Get selected rating
      const selectedRating = document.querySelector(".star-btn.active");
      if (!selectedRating) {
        alert("Please select a rating");
        return;
      }

      const rating = selectedRating.getAttribute("data-rating");
      const comment = document.getElementById("reviewComment").value;

      // Submit to backend
      const result = await submitReview(
        bookingId,
        passengerId,
        rating,
        comment
      );

      const statusEl = document.getElementById("reviewStatus");
      if (result.success) {
        statusEl.textContent = "Review submitted successfully.";
        statusEl.className = "status-message success";
        submitBtn.disabled = true;
        submitBtn.textContent = "Review Submitted";
      } else {
        statusEl.textContent = "Error: " + result.message;
        statusEl.className = "status-message error";
      }
    });
  }

  // Setup back to rides button
  function setupBackButton() {
    const backBtn = document.querySelector('.btn-back[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        // Use navigation helper if available
        if (window.navigateToShared) {
          window.navigateToShared("landing-page.html");
        } else {
          window.location.href =
            "/Corosa/public/shared/pages/landing-page.html";
        }
      });
    }
  }

  // Setup report issue button
  function setupReportButton() {
    const reportBtn = document.querySelector(".btn-report");
    if (reportBtn) {
      reportBtn.addEventListener("click", () => {
        alert("Report issue functionality - coming soon");
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
