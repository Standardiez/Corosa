/**
 * Driver Passenger Feedback Controller
 * Fetches and displays reviews from passengers
 */

let driverId = null;
let allReviews = [];

document.addEventListener("DOMContentLoaded", async function () {
  console.log("[Driver Feedback] Page loaded");

  try {
    // Get driver ID from backend
    await getDriverId();
    console.log("[Driver Feedback] Driver ID:", driverId);

    // Load reviews
    await loadReviews();
  } catch (error) {
    console.error("[Driver Feedback] Initialization error:", error);
    showError(error.message || "Failed to load feedback");
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

    console.log("[Driver Feedback] Getting driver ID for user:", userId);

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
          console.error("[Driver Feedback] Non-JSON error from get-driver-id:", text);
        }
      } catch (parseError) {
        console.error("[Driver Feedback] Error parsing get-driver-id error response:", parseError);
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success || !data.driverId) {
      throw new Error(data.message || "Driver ID not found in response");
    }

    driverId = data.driverId;
    console.log("[Driver Feedback] Driver ID:", driverId);
    return driverId;
  } catch (error) {
    console.error("[Driver Feedback] Error getting driver ID:", error);
    throw new Error("Unable to get driver ID: " + error.message);
  }
}

/**
 * Load reviews from backend
 */
async function loadReviews() {
  try {
    if (!driverId) {
      throw new Error("Driver ID not available");
    }

    console.log("[Driver Feedback] Fetching reviews for driver:", driverId);

    const response = await fetch(
      `http://localhost:3000/api/driver/reviews/${driverId}`
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = `Failed to fetch reviews: HTTP ${response.status}`;

      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const text = await response.text();
          console.error("[Driver Feedback] Non-JSON error response:", text);
        }
      } catch (parseError) {
        console.error("[Driver Feedback] Error parsing error response:", parseError);
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch reviews");
    }

    allReviews = result.data || [];

    console.log("[Driver Feedback] Fetched", allReviews.length, "reviews");

    // Update stats
    updateStats(result.totalReviews, result.averageRating, result.positivePercent);

    // Display reviews
    displayReviews(allReviews);

    if (allReviews.length === 0) {
      showEmptyState();
    }
  } catch (error) {
    console.error("[Driver Feedback] Error loading reviews:", error);
    showError(error.message || "Failed to load reviews");
  }
}

/**
 * Update statistics display
 */
function updateStats(totalReviews, averageRating, positivePercent) {
  const avgRatingEl = document.getElementById("avg-rating");
  const totalReviewsEl = document.getElementById("total-reviews");
  const positivePercentEl = document.getElementById("positive-percent");

  if (avgRatingEl) {
    avgRatingEl.textContent = averageRating.toFixed(1);
  }
  if (totalReviewsEl) {
    totalReviewsEl.textContent = totalReviews;
  }
  if (positivePercentEl) {
    positivePercentEl.textContent = positivePercent + "%";
  }
}

/**
 * Display reviews in feedback list
 */
function displayReviews(reviews) {
  const feedbackList = document.getElementById("feedback-list");
  if (!feedbackList) return;

  feedbackList.innerHTML = "";

  reviews.forEach((review) => {
    const stars = Array(5)
      .fill(0)
      .map((_, i) => {
        return i < review.rating
          ? '<span class="star">★</span>'
          : '<span class="star" style="color: #ddd">☆</span>';
      })
      .join("");

    const firstName = review.first_name || "Passenger";
    const lastName = review.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const initials = `${firstName.charAt(0)}${lastName.charAt(0) || ""}`.toUpperCase();

    const date = new Date(review.created_at);
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const paymentInfo = review.payment
      ? `<div class="payment-info"><strong>Payment:</strong> ₱${parseFloat(review.payment).toFixed(2)} (${review.payment_type})</div>`
      : "";

    const comment = review.comment
      ? `<div class="feedback-comment">"${review.comment}"</div>`
      : '<div class="feedback-comment no-comment">No comment provided</div>';

    const card = `
      <div class="feedback-card" data-rating="${review.rating}">
        <div class="feedback-header">
          <div class="passenger-avatar">${initials}</div>
          <div class="feedback-meta">
            <div class="passenger-name">${fullName}</div>
            <div class="trip-date">${formattedDate}</div>
          </div>
          <div class="rating-display">
            <div class="stars">
              ${stars}
            </div>
            <div class="rating-value">${review.rating}.0</div>
          </div>
        </div>
        ${paymentInfo}
        ${comment}
      </div>
    `;

    feedbackList.innerHTML += card;
  });
}

/**
 * Filter feedback by rating
 */
function filterFeedback(filter) {
  // Update active filter tab
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  event.target.classList.add("active");

  // Filter and display reviews
  let filtered = allReviews;

  if (filter === "5star") {
    filtered = allReviews.filter((r) => r.rating === 5);
  } else if (filter === "4star") {
    filtered = allReviews.filter((r) => r.rating === 4);
  } else if (filter === "3star") {
    filtered = allReviews.filter((r) => r.rating === 3);
  }

  displayReviews(filtered);

  if (filtered.length === 0) {
    showEmptyState(`No ${filter} reviews yet`);
  }
}

/**
 * Show empty state
 */
function showEmptyState(message = "No reviews yet") {
  const feedbackList = document.getElementById("feedback-list");
  if (!feedbackList) return;

  feedbackList.innerHTML = `
    <div class="empty-state">
      <i class="bx bx-star"></i>
      <p>${message}</p>
      <p style="font-size: var(--font-size-xs); margin-top: var(--spacing-sm)">
        Reviews will appear here as passengers rate your rides
      </p>
    </div>
  `;
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
  alertDiv.style.maxWidth = "400px";

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}
