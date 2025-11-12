(function() {
    "use strict";

    const API_ENDPOINT = "../../backend/api/reviews.php";
    const TRIPS_ENDPOINT = "../../backend/api/trip.php";
    const ASSIGNMENTS_ENDPOINT = "../../backend/api/trip_assignment.php";

    const pageContainer = document.querySelector(".page-container");
    const starContainer = document.querySelector(".star-container");
    const starButtons = Array.from(document.querySelectorAll(".star-btn"));
    const commentInput = document.getElementById("reviewComment");
    const commentCounter = document.getElementById("commentCounter");
    const submitReviewBtn = document.querySelector(".btn-submit-review");
    const statusMessage = document.getElementById("reviewStatus");
    const reportButton = document.querySelector(".btn-report");
    const yearElement = document.getElementById("year");
    const viewReviewsBtn = document.querySelector(".btn-view-reviews");
    const closeReviewsBtn = document.querySelector(".btn-close-reviews");
    const reviewsPanel = document.getElementById("driverReviews");
    const reviewsBody = reviewsPanel?.querySelector(".reviews-body");

    let selectedRating = 0;
    let isSubmitting = false;
    let isFetchingReviews = false;
    let reviewsLoaded = false;
    let driverReviewsCache = null;

    initialize();

    function initialize() {
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }

        if (!starContainer || starButtons.length === 0) {
            console.warn("[Rate & Review] Star rating controls are missing from the document.");
            return;
        }

        setupStarEvents();
        setupSubmission();
        setupReportButton();
        setupCommentField();
        setupReviewsPanel();
    }

    function setupStarEvents() {
        starButtons.forEach((star) => {
            star.addEventListener("click", () => {
                selectedRating = Number.parseInt(star.dataset.rating, 10);
                updateStars();
                setStatus(`You selected a ${selectedRating}-star rating.`, "success");
            });

            star.addEventListener("mouseenter", () => {
                const hoverValue = Number.parseInt(star.dataset.rating, 10);
                highlightStars(hoverValue);
            });
        });

        starContainer.addEventListener("mouseleave", updateStars);
    }

    function setupCommentField() {
        if (!commentInput || !commentCounter) {
            return;
        }

        commentInput.addEventListener("input", updateCommentCounter);
        updateCommentCounter();
    }

    function setupSubmission() {
        if (!submitReviewBtn) {
            return;
        }

        submitReviewBtn.addEventListener("click", async () => {
            resetStatus();

            if (isSubmitting) {
                return;
            }

            if (selectedRating <= 0) {
                setStatus("Please select a star rating before submitting your review.", "error");
                return;
            }

            const bookingId = resolveBookingId();
            if (!bookingId) {
                setStatus("We could not determine which ride this review is for. Please open this page from your rides list and try again.", "error");
                return;
            }

            const createdAt = new Date();
            const comment = commentInput?.value.trim();
            const payload = {
                booking_id: Number.parseInt(bookingId, 10),
                rating: selectedRating,
                comment: comment || null,
                created_at: createdAt.toISOString()
            };

            isSubmitting = true;
            submitReviewBtn.disabled = true;
            submitReviewBtn.textContent = "Submitting...";

            try {
                const response = await fetch(API_ENDPOINT, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok || !data?.success) {
                    const errorMessage = data?.message || "Something went wrong while saving your review. Please try again.";
                    throw new Error(errorMessage);
                }

                setStatus(
                    `Review submitted successfully on ${formatDate(createdAt)}.`,
                    "success"
                );

                submitReviewBtn.disabled = true;
                submitReviewBtn.textContent = "Review Submitted";
                starButtons.forEach((button) => button.setAttribute("disabled", "true"));
                if (commentInput) {
                    commentInput.setAttribute("disabled", "true");
                }

                // Reset cached reviews so the user can refresh to see the newly added entry
                driverReviewsCache = null;
                reviewsLoaded = false;
                if (reviewsPanel?.classList.contains("active") && viewReviewsBtn?.dataset?.driverId) {
                    fetchDriverReviews(viewReviewsBtn.dataset.driverId, { forceRefresh: true });
                }
            } catch (error) {
                console.error("[Rate & Review] Review submission failed:", error);
                setStatus(error.message, "error");
                submitReviewBtn.disabled = false;
                submitReviewBtn.textContent = "Submit Review";
                if (commentInput) {
                    commentInput.removeAttribute("disabled");
                }
            } finally {
                isSubmitting = false;
            }
        });
    }

    function setupReportButton() {
        if (!reportButton) {
            return;
        }

        reportButton.addEventListener("click", () => {
            alert("Report issue functionality would be implemented here.");
        });
    }

    function setupReviewsPanel() {
        if (!viewReviewsBtn || !reviewsPanel || !reviewsBody) {
            return;
        }

        const driverId = viewReviewsBtn.dataset.driverId || pageContainer?.dataset?.driverId;

        viewReviewsBtn.addEventListener("click", () => {
            if (!driverId) {
                setStatus("Driver information is missing. Unable to fetch reviews.", "error");
                return;
            }

            toggleReviewsPanel(true);
            fetchDriverReviews(driverId);
        });

        closeReviewsBtn?.addEventListener("click", () => {
            toggleReviewsPanel(false);
        });
    }

    function resolveBookingId() {
        if (pageContainer?.dataset?.bookingId) {
            return pageContainer.dataset.bookingId;
        }

        const params = new URLSearchParams(window.location.search);
        return params.get("booking_id");
    }

    async function fetchDriverReviews(driverId, options = {}) {
        if (isFetchingReviews) {
            return;
        }

        const shouldUseCache = driverReviewsCache && !options.forceRefresh;
        if (shouldUseCache) {
            renderReviews(driverReviewsCache);
            return;
        }

        if (!reviewsBody) {
            return;
        }

        try {
            isFetchingReviews = true;
            renderLoadingState();

            const tripsResponse = await fetchJson(`${TRIPS_ENDPOINT}?driver_id=${encodeURIComponent(driverId)}`);
            if (!tripsResponse.success) {
                throw new Error(tripsResponse.message || "Failed to fetch driver trips.");
            }

            const trips = Array.isArray(tripsResponse.data) ? tripsResponse.data : [];
            if (trips.length === 0) {
                renderEmptyState("This driver has not completed any trips yet.");
                driverReviewsCache = [];
                reviewsLoaded = true;
                return;
            }

            const tripIds = trips.map((trip) => Number(trip.trip_id)).filter(Boolean);
            const bookingIdSet = new Set();

            const assignmentsPromises = tripIds.map(async (tripId) => {
                const assignmentsResponse = await fetchJson(`${ASSIGNMENTS_ENDPOINT}?trip_id=${encodeURIComponent(tripId)}`);
                if (assignmentsResponse.success && Array.isArray(assignmentsResponse.data)) {
                    assignmentsResponse.data.forEach((assignment) => {
                        if (assignment?.booking_id) {
                            bookingIdSet.add(Number(assignment.booking_id));
                        }
                    });
                }
            });

            await Promise.all(assignmentsPromises);

            if (bookingIdSet.size === 0) {
                renderEmptyState("No reviews are available for this driver yet.");
                driverReviewsCache = [];
                reviewsLoaded = true;
                return;
            }

            const reviewsResponse = await fetchJson(API_ENDPOINT);
            if (!reviewsResponse.success || !Array.isArray(reviewsResponse.data)) {
                throw new Error(reviewsResponse.message || "Unable to load reviews at this time.");
            }

            const driverReviews = reviewsResponse.data
                .filter((review) => bookingIdSet.has(Number(review.booking_id)))
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            driverReviewsCache = driverReviews;
            reviewsLoaded = true;
            renderReviews(driverReviews);
        } catch (error) {
            console.error("[Rate & Review] Failed to fetch driver reviews:", error);
            renderErrorState(error.message);
        } finally {
            isFetchingReviews = false;
        }
    }

    function updateStars() {
        starButtons.forEach((star) => {
            const starValue = Number.parseInt(star.dataset.rating, 10);
            if (starValue <= selectedRating) {
                star.classList.add("active");
                star.style.color = "#fbbf24";
            } else {
                star.classList.remove("active");
                star.style.color = "#d1d5db";
            }
        });
    }

    function highlightStars(highlightedRating) {
        starButtons.forEach((star) => {
            const starValue = Number.parseInt(star.dataset.rating, 10);
            star.style.color = starValue <= highlightedRating ? "#fbbf24" : "#d1d5db";
        });
    }

    function updateCommentCounter() {
        if (!commentInput || !commentCounter) {
            return;
        }

        const currentLength = commentInput.value.length;
        const maxLength = commentInput.getAttribute("maxlength") || 500;
        commentCounter.textContent = `${currentLength} / ${maxLength}`;
    }

    function setStatus(message, type = "success") {
        if (!statusMessage) {
            return;
        }

        statusMessage.textContent = message;
        statusMessage.classList.remove("success", "error");
        statusMessage.classList.add(type);
    }

    function resetStatus() {
        if (!statusMessage) {
            return;
        }

        statusMessage.textContent = "";
        statusMessage.classList.remove("success", "error");
    }

    function toggleReviewsPanel(show) {
        if (!reviewsPanel) {
            return;
        }

        reviewsPanel.classList.toggle("active", show);
        reviewsPanel.setAttribute("aria-expanded", String(show));
        if (show) {
            reviewsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function renderLoadingState() {
        if (!reviewsBody) {
            return;
        }
        reviewsBody.innerHTML = `<div class="empty-state">Loading reviews...</div>`;
    }

    function renderEmptyState(message) {
        if (!reviewsBody) {
            return;
        }
        reviewsBody.innerHTML = `<div class="empty-state">${message}</div>`;
    }

    function renderErrorState(message) {
        if (!reviewsBody) {
            return;
        }
        reviewsBody.innerHTML = `<div class="empty-state" style="color:#b91c1c;">${message}</div>`;
    }

    function renderReviews(reviews) {
        if (!reviewsBody) {
            return;
        }

        if (!Array.isArray(reviews) || reviews.length === 0) {
            renderEmptyState("No reviews are available for this driver yet.");
            return;
        }

        const items = reviews
            .map((review) => {
                const rating = Number(review.rating) || 0;
                const comment = review.comment?.trim();
                const createdAt = review.created_at ? formatDateTime(review.created_at) : "Unknown date";

                return `
                    <article class="review-item">
                        <div class="review-rating">
                            <span aria-hidden="true">⭐</span>
                            <span>${rating.toFixed(1)} / 5</span>
                        </div>
                        <div class="review-meta">
                            <span>Booking #${review.booking_id}</span>
                            <time datetime="${review.created_at || ""}">${createdAt}</time>
                        </div>
                        <p class="review-comment">${comment || "<em>No comment provided.</em>"}</p>
                    </article>
                `;
            })
            .join("");

        reviewsBody.innerHTML = items;
    }

    function fetchJson(url) {
        return fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        })
            .then((response) => response.json().catch(() => ({})))
            .catch((error) => {
                console.error("[Rate & Review] Network error:", error);
                throw new Error("Network error while contacting the server.");
            });
    }

    function formatDate(date) {
        return new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short"
        }).format(date);
    }

    function formatDateTime(timestamp) {
        try {
            const date = new Date(timestamp);
            return new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "numeric"
            }).format(date);
        } catch (error) {
            return "Unknown date";
        }
    }
})();