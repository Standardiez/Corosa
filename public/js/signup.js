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
    }
    if (!lastName) {
      setError("lastName", "Last name is required");
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
      const response = await fetch("/Corosa/backend/api/users.php", {
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

      const result = await response.json();
      console.log("Server response:", result);

      if (result.success) {
        alert("Account created successfully!");
        window.location.href = "../pages/login.html";
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
      alert("Network error during signup. Please try again.");
    }
  });
});