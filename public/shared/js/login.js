/*
  ============================================================================
  COROSA LOGIN SYSTEM - CLIENT-SIDE HANDLER
  ============================================================================

  PURPOSE:
    Handles user authentication on the client side. Validates input, sends
    credentials to backend API, and manages post-login actions (storing user
    data, redirecting to next page).

  FLOW:
    1. User fills in email and password on login.html
    2. User clicks "Sign in" button
    3. This script validates the inputs (client-side check)
    4. Sends credentials to backend API via AJAX (fetch)
    5. Backend verifies credentials against database
    6. If valid: Store user data in localStorage/sessionStorage, redirect
    7. If invalid: Display error message to user

  ============================================================================
  API ENDPOINT SPECIFICATION
  ============================================================================

  URL: POST /Corosa/backend/api/login.php

  REQUEST FORMAT:
    {
      "email": "user@slu.edu.ph",
      "password": "userPassword123"
    }

  SUCCESS RESPONSE:
    {
      "success": true,
      "userId": 123,
      "firstName": "John",      // Optional, for display
      "lastName": "Doe",        // Optional, for display
      "token": "jwt_token...",  // Optional, for authenticated requests
      "message": "Logged in"
    }

  ERROR RESPONSE:
    {
      "success": false,
      "message": "Invalid credentials"
    }

  ============================================================================
  SECURITY NOTES
  ============================================================================

  - Passwords are NEVER stored in localStorage or sessionStorage
  - Only send passwords over HTTPS in production (TLS/SSL)
  - Token-based auth (JWT) is optional - server can use sessions instead
  - Client-side validation is for UX only - server MUST validate everything
  - Consider using HttpOnly cookies for tokens (more secure than localStorage)

  ============================================================================
*/

// ============================================================================
// WAIT FOR PAGE TO LOAD
// ============================================================================
// DOMContentLoaded ensures all HTML elements exist before we try to access them
// Think of it as: "Don't start the show until all actors are on stage"
document.addEventListener("DOMContentLoaded", function () {
  // Get reference to the login form element from the HTML
  const form = document.getElementById("loginForm");

  // ==========================================================================
  // HELPER FUNCTION: Display error message under a specific form field
  // ==========================================================================
  // Used to show validation errors like "Email is required" or "Invalid credentials"
  //
  // HOW IT WORKS:
  //   In login.html, each input has a corresponding error div:
  //   <input name="email" ...>
  //   <div data-error-for="email"></div>  ← This div will show the error
  //
  // PARAMETERS:
  //   fieldName - Name of the field (e.g., "email", "password")
  //   message - Error text to display (e.g., "Email is required")
  function setError(fieldName, message) {
    const el = document.querySelector(`[data-error-for="${fieldName}"]`);
    if (el) el.textContent = message || "";
  }

  // ==========================================================================
  // HELPER FUNCTION: Clear all error messages
  // ==========================================================================
  // Called at the start of each form submission to reset error states
  // Finds all elements with data-error-for attribute and clears their text
  function clearErrors() {
    document
      .querySelectorAll("[data-error-for]")
      .forEach((e) => (e.textContent = ""));
  }

  // ==========================================================================
  // MAIN FORM SUBMISSION HANDLER
  // ==========================================================================
  // This function runs when user clicks "Sign in" button
  form.addEventListener("submit", function (e) {
    // ------------------------------------------------------------------------
    // STEP 1: Prevent default form behavior
    // ------------------------------------------------------------------------
    // By default, HTML forms cause a page reload when submitted
    // e.preventDefault() stops this so we can handle everything with JavaScript
    // This allows us to:
    //   - Stay on the same page (no reload)
    //   - Show loading states
    //   - Handle responses dynamically
    e.preventDefault();

    // Clear any previous error messages
    clearErrors();

    // ------------------------------------------------------------------------
    // STEP 2: Extract form data
    // ------------------------------------------------------------------------
    // FormData API reads all input fields from the form
    // We get the values of email and password fields
    const data = new FormData(form);
    const email = (data.get("email") || "").trim(); // .trim() removes whitespace
    const password = data.get("password") || "";

    // ------------------------------------------------------------------------
    // STEP 3: Client-side validation
    // ------------------------------------------------------------------------
    // Check if required fields are filled in
    // This provides immediate feedback to the user WITHOUT waiting for server
    //
    // NOTE: This is NOT secure validation! Users can bypass this easily.
    //       The server MUST also validate. This is just for better UX.
    let valid = true;
    if (!email) {
      setError("email", "Email is required");
      valid = false;
    }
    if (!password) {
      setError("password", "Password is required");
      valid = false;
    }

    // If validation failed, stop here (don't send request to server)
    if (!valid) return;

    // ------------------------------------------------------------------------
    // STEP 4: Prepare data for backend
    // ------------------------------------------------------------------------
    // Create a JavaScript object with the credentials
    // This will be converted to JSON and sent to the server
    const payload = { email, password };
    console.log("Login payload (mock):", payload);

    // ------------------------------------------------------------------------
    // STEP 5: Send request to backend API
    // ------------------------------------------------------------------------
    const useBackend = true; // Set to false to test without backend
    if (useBackend) {
      // API endpoint URL - uses centralized config for Docker/local compatibility
      const endpoint = window.API_CONFIG?.PHP_API?.LOGIN || "/backend/api/shared/php/login.php";

      // ======================================================================
      // FETCH API: Modern way to make HTTP requests in JavaScript
      // ======================================================================
      // This is like making a phone call to the server instead of mailing a letter
      // The page stays loaded while we wait for the response
      fetch(endpoint, {
        method: "POST", // We're SENDING data (not just asking for it)
        headers: { "Content-Type": "application/json" }, // Tell server we're sending JSON
        body: JSON.stringify(payload), // Convert JS object to JSON string
      })
        // ----------------------------------------------------------------------
        // STEP 6: Parse response from server
        // ----------------------------------------------------------------------
        // .then() runs when the server responds
        // First .then(): Convert response to JSON
        .then((r) => r.json())

        // Second .then(): Handle the parsed JSON data
        .then((resp) => {
          // --------------------------------------------------------------------
          // STEP 7: Handle successful login
          // --------------------------------------------------------------------
          if (resp && resp.success) {
            // ==================================================================
            // Store user data in browser storage
            // ==================================================================
            // We create a userData object to store in localStorage
            // This lets other pages know the user is logged in
            const userData = {
              userId: resp.userId || null,
              email: email,
              role: resp.role || "passenger",
              firstName: resp.firstName || "User", // Default to 'User' if not provided
              lastName: resp.lastName || "",
              token: resp.token || null,
            };

            try {
              // ================================================================
              // localStorage: Persists even after closing browser
              // ================================================================
              // Used for login state that should survive browser restarts
              // Stored as JSON string (localStorage can only store text)
              localStorage.setItem("userData", JSON.stringify(userData));

              // Store token separately for easy access in API calls
              if (resp.token) {
                localStorage.setItem("userToken", resp.token);
              }
            } catch (e) {
              // localStorage can fail if user disabled it or storage is full
              console.warn("Could not write to localStorage", e);
            }

            // ==================================================================
            // sessionStorage: Cleared when browser tab is closed
            // ==================================================================
            // Used for temporary data needed during the booking flow
            // More secure than localStorage for sensitive session data
            if (resp.userId) {
              sessionStorage.setItem("userId", resp.userId);
            }
            sessionStorage.setItem("userEmail", email);

            // ==================================================================
            // EXPLICIT ROLE-SELECTION LOGIC
            // ==================================================================
            // The user's intent (flowIntent) determines their active session role
            // This allows users registered for multiple roles to choose which to use
            //
            // Possible scenarios:
            // 1. User registered ONLY as passenger → Can only use "Book a Ride"
            // 2. User registered ONLY as driver → Must register as passenger first
            // 3. User registered as BOTH → Can choose either role
            //
            // The database returns role based on existence in driver/passenger tables
            // But flowIntent (set at index.html button click) is the user's INTENT
            // ==================================================================

            const flowIntent = sessionStorage.getItem("flowIntent");

            // =========== SCENARIO 1: User selected "Offer a Ride" (driver flow) ===========
            if (flowIntent === "driver") {
              if (userData.role !== "driver") {
                // User clicked "Offer a Ride" but isn't registered as a driver yet
                // Redirect to driver registration form
                sessionStorage.setItem("registrationPending", "driver");
                window.location.href = "../pages/driver-registration.html";
                return;
              } else {
                // User is registered as a driver and selected "Offer a Ride"
                // Proceed to driver homepage
                window.location.href =
                  "../../driver/pages/driver-Homepage.html";
                return;
              }
            }

            // =========== SCENARIO 2: User selected "Book a Ride" (passenger flow) ===========
            if (flowIntent === "passenger") {
              if (userData.role === "driver" && !isPassengerRegistered) {
                // User clicked "Book a Ride" but isn't registered as a passenger
                // Show message that passenger registration happens during signup
                alert(
                  "You are registered as a driver only. Passengers register during account creation. You can still use the passenger side of the app with your current account."
                );
                window.location.href =
                  "../../passenger/pages/landing-page.html";
                return;
              } else {
                // User is registered as passenger (or both) - proceed to booking
                window.location.href =
                  "../../passenger/pages/select-pickup.html";
                return;
              }
            }

            // =========== DEFAULT: No explicit intent set ===========
            // Fallback based on actual role from database
            if (userData.role === "driver") {
              window.location.href = "../../driver/pages/driver-Homepage.html";
            } else {
              window.location.href = "../../passenger/pages/landing-page.html";
            }
          } else {
            // --------------------------------------------------------------------
            // STEP 8: Handle failed login
            // --------------------------------------------------------------------
            // Server returned success: false
            // Show error message under password field
            setError("password", resp.message || "Invalid credentials");
          }
        })
        // ----------------------------------------------------------------------
        // STEP 9: Handle network errors
        // ----------------------------------------------------------------------
        // .catch() runs if the request fails completely (no response from server)
        // Examples: Server is down, no internet, wrong URL, etc.
        .catch((err) => {
          console.error("Login fetch error:", err);
          console.error("Endpoint attempted:", endpoint);
          alert(
            "Could not connect to the server. Check browser console for details."
          );
        });
    }
  });
});

// ============================================================================
// STORAGE COMPARISON: localStorage vs sessionStorage
// ============================================================================
//
// localStorage:
//   - Persists forever (until manually cleared)
//   - Survives browser restarts
//   - Shared across all tabs/windows of same origin
//   - Use for: Login state, user preferences
//   - Max size: ~5-10MB (varies by browser)
//
// sessionStorage:
//   - Cleared when tab/window is closed
//   - NOT shared between tabs
//   - Use for: Temporary booking data, form progress
//   - Max size: ~5-10MB (varies by browser)
//
// Example:
//   localStorage.setItem('keepMe', 'forever');     // Persists
//   sessionStorage.setItem('temporary', 'data');   // Gone when tab closes
//
// ============================================================================
