/**
 * Driver Settings Controller
 * Handles driver profile editing and vehicle information management
 */

let driverId = null;
let currentProfile = null;

document.addEventListener("DOMContentLoaded", async function () {
  console.log("[Driver Settings] Page loaded");

  try {
    // Get driver ID from backend
    await getDriverId();
    console.log("[Driver Settings] Loaded with driverId:", driverId);

    // Load profile data
    loadProfile();
  } catch (error) {
    console.error("[Driver Settings] Initialization error:", error);
    showError(error.message || "Failed to initialize");
  }

  // Setup event listeners
  const saveBtn = document.getElementById("save-profile-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", handleSaveProfile);
  }

  const cancelBtn = document.getElementById("cancel-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
      window.location.href = "driver-Homepage.html";
    });
  }

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

    console.log("[Driver Settings] Getting driver ID for user:", userId);

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
          console.error(
            "[Driver Settings] Non-JSON error from get-driver-id:",
            text
          );
        }
      } catch (parseError) {
        console.error(
          "[Driver Settings] Error parsing get-driver-id error response:",
          parseError
        );
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success || !data.driverId) {
      throw new Error(data.message || "Driver ID not found in response");
    }

    driverId = data.driverId;
    console.log("[Driver Settings] Driver ID:", driverId);
    return driverId;
  } catch (error) {
    console.error("[Driver Settings] Error getting driver ID:", error);
    throw new Error("Unable to get driver ID: " + error.message);
  }
}

/**
 * Load driver profile from backend
 */
async function loadProfile() {
  try {
    console.log("[Driver Settings] Fetching profile for driver", driverId);

    const response = await fetch(
      `http://localhost:3000/api/driver/profile/${driverId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch profile");
    }

    currentProfile = result.data;

    console.log("[Driver Settings] Profile loaded:", currentProfile);

    // Populate form with profile data
    populateForm();
  } catch (error) {
    console.error("[Driver Settings] Error loading profile:", error);
    showError(error.message || "Failed to load profile");
  }
}

/**
 * Populate form fields with profile data
 */
function populateForm() {
  if (!currentProfile) return;

  // Personal Information
  const firstNameInput = document.getElementById("first-name");
  if (firstNameInput) {
    firstNameInput.value = currentProfile.first_name || "";
  }

  const lastNameInput = document.getElementById("last-name");
  if (lastNameInput) {
    lastNameInput.value = currentProfile.last_name || "";
  }

  const emailInput = document.getElementById("email");
  if (emailInput) {
    emailInput.value = currentProfile.email || "";
  }

  const phoneInput = document.getElementById("phone-number");
  if (phoneInput) {
    phoneInput.value = currentProfile.mobile_number || "";
  }

  // Vehicle Information
  const vehicleModelInput = document.getElementById("vehicle-model");
  if (vehicleModelInput) {
    vehicleModelInput.value = currentProfile.vehicle_model || "";
  }

  const vehicleYearInput = document.getElementById("vehicle-year");
  if (vehicleYearInput) {
    vehicleYearInput.value =
      currentProfile.vehicle_year || new Date().getFullYear();
  }

  const seatCapacityInput = document.getElementById("seat-capacity");
  if (seatCapacityInput) {
    seatCapacityInput.value = currentProfile.seat_capacity || 4;
  }

  const licensePlateInput = document.getElementById("license-plate");
  if (licensePlateInput) {
    licensePlateInput.value = currentProfile.license_plate || "";
  }

  console.log("[Driver Settings] Form populated with profile data");
}

/**
 * Handle save profile button click
 */
async function handleSaveProfile() {
  try {
    console.log("[Driver Settings] Saving profile...");

    // Get form values
    const firstName = document.getElementById("first-name")?.value || "";
    const lastName = document.getElementById("last-name")?.value || "";
    const email = document.getElementById("email")?.value || "";
    const mobileNumber = document.getElementById("phone-number")?.value || "";
    const vehicleModel = document.getElementById("vehicle-model")?.value || "";
    const vehicleYear = document.getElementById("vehicle-year")?.value || "";
    const seatCapacity = document.getElementById("seat-capacity")?.value || 4;
    const licensePlate = document.getElementById("license-plate")?.value || "";

    // Validate required fields
    if (!firstName || !lastName || !email || !mobileNumber) {
      showError("First name, last name, email, and phone number are required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError("Please enter a valid email address");
      return;
    }

    // Validate phone number (at least 10 digits)
    const phoneRegex = /\d/g;
    const phoneDigits = mobileNumber.match(phoneRegex) || [];
    if (phoneDigits.length < 10) {
      showError("Phone number must have at least 10 digits");
      return;
    }

    const response = await fetch(
      `http://localhost:3000/api/driver/profile/${driverId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          mobileNumber,
          vehicleModel,
          vehicleYear: vehicleYear ? parseInt(vehicleYear) : null,
          seatCapacity: seatCapacity ? parseInt(seatCapacity) : null,
          licensePlate,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to update profile");
    }

    console.log("[Driver Settings] Profile updated successfully");
    showSuccess("Profile updated successfully!");

    // Reload profile after successful update
    setTimeout(() => {
      loadProfile();
    }, 1500);
  } catch (error) {
    console.error("[Driver Settings] Error saving profile:", error);
    showError(error.message || "Failed to save profile");
  }
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
