/*
    Integration notes for backend developer

    Endpoint: POST /backend/api/users.php
        - The frontend will send the following fields (names in form 'name' attributes):
            firstName, middleInitial, lastName, birthdate, email, mobile,
            houseNumber, street, barangay, disabilities, employment, password

        - Preferred content type: application/json (also accept form-encoded for compatibility)

        - Example JSON payload:
            {
                "firstName":"Juan",
                "middleInitial":"P",
                "lastName":"Dela Cruz",
                "birthdate":"1995-07-21",
                "email":"juan@example.com",
                "mobile":"09171234567",
                "houseNumber":"123",
                "street":"Main St",
                "barangay":"Barangay 1",
                "disabilities":"none",
                "employment":"student",
                "password":"(plain text from client)"
            }

        - IMPORTANT: The server MUST hash passwords server-side (e.g., password_hash in PHP) and never store or return the plain password.

        - Expected JSON response on success:
            { "success": true, "userId": 123, "message": "Account created" }

        - Expected JSON response on validation error:
            { "success": false, "errors": { "email": "Email already in use", "mobile": "Invalid format" } }

        - CORS / CSRF notes:
            * If the API is on a different origin, enable CORS with appropriate Access-Control-Allow-Origin.
            * For CSRF protection, consider issuing a cookie token or require an anti-CSRF token in a hidden input.
*/

// Validation patterns
const patterns = {
  firstName: /^[a-zA-Z'-]{1,50}$/,
  middleInitial: /^[a-zA-Z]{0,1}$/,
  lastName: /^[a-zA-Z'-]{1,50}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  mobile: /^09\d{9}$/
};

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("signupForm");
  console.log("Form element found:", form);

  if (!form) {
    console.error("Signup form not found!");
    return;
  }

  function setError(fieldName, message) {
    const el = document.querySelector(`[data-error-for="${fieldName}"]`);
    if (el) el.textContent = message || "";
  }

  function clearErrors() {
    document
      .querySelectorAll("[data-error-for]")
      .forEach((e) => (e.textContent = ""));
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("Form submission started");
    clearErrors();

    const formData = new FormData(form);
    let valid = true;

    // Get all form values first
    const firstName = formData.get("firstName")?.trim();
    const middleInitial = formData.get("middleInitial")?.trim();
    const lastName = formData.get("lastName")?.trim();
    const birthdate = formData.get("birthdate");
    const email = formData.get("email")?.trim();
    const mobile = formData.get("mobile")?.trim();
    const houseNumber = formData.get("houseNumber")?.trim();
    const street = formData.get("street")?.trim();
    const barangay = formData.get("barangay")?.trim();
    const employment = formData.get("employment");
    const disabilities = formData.get("disabilities");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    // Validation
    if (!firstName) {
      setError("firstName", "First name is required");
      valid = false;
    } else if (!patterns.firstName.test(firstName)) {
      setError("firstName", "First name can only contain letters, apostrophes, and hyphens");
      valid = false;
    }

    if (middleInitial && !patterns.middleInitial.test(middleInitial)) {
      setError("middleInitial", "Middle initial must be a single letter");
      valid = false;
    }

    if (!lastName) {
      setError("lastName", "Last name is required");
      valid = false;
    } else if (!patterns.lastName.test(lastName)) {
      setError("lastName", "Last name can only contain letters, apostrophes, and hyphens");
      valid = false;
    }
    if (!birthdate) {
      setError("birthdate", "Please enter your birthdate");
      valid = false;
    }

    if (!email || !patterns.email.test(email)) {
      setError("email", "Please enter a valid email");
      valid = false;
    }
    if (!mobile || !patterns.mobile.test(mobile)) {
      setError("mobile", "Enter a valid mobile number (09XXXXXXXXX)");
      valid = false;
    }
    if (!houseNumber || !street || !barangay) {
      setError("address", "Please complete your address");
      valid = false;
    }
    if (!employment) {
      setError("employment", "Please select your employment status");
      valid = false;
    }

    if (!password || password.length < 8) {
      setError("password", "Password must be at least 8 characters");
      valid = false;
    }
    if (password !== confirmPassword) {
      setError("confirmPassword", "Passwords do not match");
      valid = false;
    }

    if (!valid) {
      // focus on first error field if any
      const firstError = document.querySelector("[data-error-for]:not(:empty)");
      if (firstError) {
        const name = firstError.getAttribute("data-error-for");
        const input =
          document.getElementById(name) || document.querySelector(`[name="${name}"]`);
        if (input) input.focus();
      }
      return;
    }

    // Debug log before submission
    console.log("Form values before submission:", {
      firstName,
      middleInitial,
      lastName,
      birthdate,
      email,
      mobile,
      houseNumber,
      street,
      barangay,
      disabilities,
      employment,
      password: "***hidden***"
    });

    try {
      // Use centralized API config if available, otherwise fallback
      const apiBase = window.API_CONFIG?.PHP_API_BASE || '/backend/api';
      const response = await fetch(`${apiBase}/shared/php/users.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          middleInitial,
          lastName,
          birthdate,
          email,
          mobile,
          houseNumber,
          street,
          barangay,
          disabilities,
          employment,
          password,
        }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        // Try to parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Handle validation errors from server
        if (errorData.errors) {
          for (const [field, message] of Object.entries(errorData.errors)) {
            setError(field, message);
          }
        } else {
          alert(
            "Error: " +
              (errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`)
          );
        }
        return;
      }

      // Parse successful response
      let result;
      try {
        // Get response text first to check if it's valid JSON
        const responseText = await response.text();
        console.log("Raw response:", responseText);
        
        // Try to parse as JSON
        if (responseText.trim()) {
          result = JSON.parse(responseText);
        } else {
          // Empty response but status is OK - might be success
          if (response.status === 201 || response.status === 200) {
            result = { success: true, message: "Account created successfully" };
          } else {
            throw new Error("Empty response from server");
          }
        }
      } catch (e) {
        // If JSON parsing fails but status is OK, account might still be created
        console.warn("Could not parse JSON response, but status was OK:", response.status, e);
        
        // Check if we got a 201 (created) status - account was likely created
        if (response.status === 201) {
          alert("Account created successfully!");
          // Use navigation helper if available, otherwise use relative path
          if (window.navigateToShared) {
            window.navigateToShared('login.html');
          } else {
            const currentPath = window.location.pathname;
            const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
            window.location.href = basePath + '/login.html';
          }
          return;
        }
        
        // For 200 status, try to show a more helpful message
        if (response.status === 200) {
          console.warn("Received 200 OK but couldn't parse JSON - account may have been created");
          // Don't show error, just log it - the account might be created
          return;
        }
        
        throw new Error("Invalid response from server: " + e.message);
      }

      console.log("Server response:", result);

      if (result.success) {
        alert("Account created successfully!");
        // Use navigation helper if available, otherwise use relative path
        if (window.navigateToShared) {
          window.navigateToShared('login.html');
        } else {
          // Fallback: use relative path
          const currentPath = window.location.pathname;
          const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
          window.location.href = basePath + '/login.html';
        }
      } else {
        console.error("Server returned error:", result);

        // Handle validation errors from server
        if (result.errors) {
          for (const [field, message] of Object.entries(result.errors)) {
            setError(field, message);
          }
        } else {
          alert(
            "Error: " +
              (result.message || result.error || "Failed to create account")
          );
        }
      }
    } catch (error) {
      console.error("Error during signup:", error);
      // More specific error message
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        alert("Network error: Could not connect to server. Please check your connection and try again.");
      } else {
        alert("Error during signup: " + error.message);
      }
    }
  });
});