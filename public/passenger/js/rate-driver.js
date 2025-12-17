(function () {
  "use strict";

  let currentPassengerId = null;
  let currentBookingId = null;
  let reviewAlreadySubmitted = false;

  function el(id) {
    return document.getElementById(id);
  }

  /**
   * Get passenger ID from localStorage or session
   */
  function getPassengerId() {
    try {
      const userDataStr = localStorage.getItem("userData");
      if (!userDataStr) return null;
      const userData = JSON.parse(userDataStr);
      return userData.id || userData.userId || userData.user_id;
    } catch (e) {
      return null;
    }
  }

  /**
   * Fetch ride details from backend
   */
  async function fetchRideDetails() {
    try {
      // Get booking ID from session storage (set by ride-status page)
      const bookingId = sessionStorage.getItem("currentBookingId");

      if (!bookingId) {
        console.error("[Rate Driver] No booking ID in session");
        alert("No ride information available.");
        window.location.href = "request-ride.html";
        return false;
      }

      currentBookingId = bookingId;
      currentPassengerId = getPassengerId();

      if (!currentPassengerId) {
        console.error("[Rate Driver] Could not get passenger ID");
        alert("User not authenticated. Please log in again.");
        window.location.href = "request-ride.html";
        return false;
      }

      console.log(
        "[Rate Driver] Fetching ride details for booking:",
        bookingId
      );

      const response = await fetch(
        `http://localhost:3000/api/reviews/ride-details/${bookingId}`
      );

      if (!response.ok) {
        console.error(
          "[Rate Driver] Failed to fetch ride details:",
          response.status
        );
        alert("Could not load ride details.");
        return false;
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        console.error("[Rate Driver] Invalid response:", result);
        alert("Could not load ride details.");
        return false;
      }

      // Check if review already submitted
      if (result.data.existingReview) {
        reviewAlreadySubmitted = true;
        console.log("[Rate Driver] Review already submitted for this ride");
      }

      renderRideDetails(result.data);
      return true;
    } catch (error) {
      console.error("[Rate Driver] Error fetching ride details:", error);
      alert("Error loading ride: " + error.message);
      return false;
    }
  }

  /**
   * Render ride details from database
   */
  function renderRideDetails(rideData) {
    // Driver info
    const d = rideData.driver;
    el("driver-name").textContent =
      (d.firstName || "Unknown") + " " + (d.lastName || "Driver");
    el("driver-vehicle").textContent = rideData.vehicle
      ? rideData.vehicle.model || rideData.vehicle.licensePlate || "Vehicle"
      : "Vehicle";

    // Vehicle capacity
    let capacityText = "";
    if (rideData.vehicle && rideData.vehicle.capacity) {
      capacityText = rideData.vehicle.capacity + " seats";
    }
    el("driver-capacity").textContent = capacityText;

    // Avatar: use initials
    const initials = (
      (d.firstName || "").charAt(0) + (d.lastName || "").charAt(0)
    ).toUpperCase();
    el("driver-avatar").textContent = initials || "👤";

    // If review already submitted, show message
    if (reviewAlreadySubmitted) {
      const existingReview = rideData.existingReview;
      if (existingReview) {
        const submitBtn = el("submit-btn");
        const commentsField = el("comments");

        // Populate existing review data
        document.querySelectorAll(".star").forEach((star) => {
          const value = parseInt(star.getAttribute("data-value"), 10);
          if (value <= existingReview.rating) {
            star.classList.add("filled");
            star.textContent = "★";
          }
        });

        commentsField.value = existingReview.comment || "";
        commentsField.disabled = true;
        submitBtn.textContent = "Review Already Submitted";
        submitBtn.disabled = true;

        // Show info message
        const infoDiv = document.createElement("div");
        infoDiv.style.cssText =
          "background:#e8f5e9;color:#2e7d32;padding:12px;border-radius:6px;margin:12px 0;border-left:4px solid #2e7d32";
        infoDiv.textContent =
          "✓ You have already submitted a review for this ride on " +
          new Date(existingReview.created_at).toLocaleDateString();
        const container = el("submit-btn").parentElement;
        container.parentElement.insertBefore(infoDiv, container);
      }
    }
  }

  // star widget
  function setupStars() {
    const starEls = Array.from(document.querySelectorAll(".star"));
    let current = 0;

    function setRating(n) {
      current = n;
      starEls.forEach((s) => {
        const v = parseInt(s.getAttribute("data-value"), 10);
        if (v <= n) {
          s.classList.add("filled");
          s.textContent = "★";
        } else {
          s.classList.remove("filled");
          s.textContent = "☆";
        }
      });
    }

    starEls.forEach((s) => {
      if (!reviewAlreadySubmitted) {
        s.addEventListener("click", function () {
          setRating(parseInt(this.getAttribute("data-value"), 10));
        });
        s.addEventListener("mouseover", function () {
          const v = parseInt(this.getAttribute("data-value"), 10);
          setRating(v);
        });
        s.addEventListener("mouseout", function () {
          setRating(current);
        });
      }
    });

    return { getRating: () => current, setRating };
  }

  /**
   * Submit review to backend database
   */
  async function submitReviewToBackend(rating, comments) {
    try {
      console.log("[Rate Driver] Submitting review to backend...");

      const payload = {
        bookingId: currentBookingId,
        passengerId: currentPassengerId,
        rating: rating,
        comment: comments || null,
      };

      const response = await fetch("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit review");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Review submission failed");
      }

      console.log("[Rate Driver] Review submitted successfully");
      return true;
    } catch (error) {
      console.error("[Rate Driver] Error submitting review:", error);
      throw error;
    }
  }

  async function init() {
    // Load ride details from backend
    const loaded = await fetchRideDetails();
    if (!loaded) return;

    const starWidget = setupStars();

    el("skip-btn").addEventListener("click", function () {
      // Redirect to landing page
      window.location.href = "request-ride.html";
    });

    el("submit-btn").addEventListener("click", async function () {
      if (reviewAlreadySubmitted) {
        // Button should be disabled, but just in case
        alert("You have already submitted a review for this ride.");
        return;
      }

      const rating = starWidget.getRating();
      const comments = el("comments").value.trim();

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        alert("Please select a star rating (1-5 stars)");
        return;
      }

      try {
        // Disable button during submission
        this.disabled = true;
        this.textContent = "Submitting...";

        // Submit to backend
        await submitReviewToBackend(rating, comments);

        // Show success message
        alert("Review submitted successfully! Thank you for your feedback.");

        // Redirect to request ride page
        window.location.href = "request-ride.html";
      } catch (error) {
        console.error("[Rate Driver] Submission error:", error);
        alert("Failed to submit review: " + error.message);

        // Re-enable button
        this.disabled = false;
        this.textContent = "Submit rating";
      }
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
