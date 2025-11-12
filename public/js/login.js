/*
  Login integration notes for backend developer

  Endpoint (example): POST /backend/api/login.php
    - Payload: { email, password }
    - Returns on success: { success: true, userId: 123, message: 'Logged in', token?: '...' }
    - Returns on failure: { success: false, message: 'Invalid credentials' }

  Security notes:
    - Prefer server-side session creation with HttpOnly cookie rather than returning raw tokens in JS.
    - Ensure TLS (HTTPS) in production.

  To enable real backend calls, set useBackend = true and update the endpoint variable below.
*/

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");

  function setError(fieldName, message) {
    const el = document.querySelector(`[data-error-for="${fieldName}"]`);
    if (el) el.textContent = message || "";
  }

  function clearErrors() {
    document
      .querySelectorAll("[data-error-for]")
      .forEach((e) => (e.textContent = ""));
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors();

    const data = new FormData(form);
    const email = (data.get("email") || "").trim();
    const password = data.get("password") || "";

    let valid = true;
    if (!email) {
      setError("email", "Email is required");
      valid = false;
    }
    if (!password) {
      setError("password", "Password is required");
      valid = false;
    }
    if (!valid) return;

    const payload = { email, password };
    console.log("Login payload (mock):", payload);

    const useBackend = true; // change to true to enable real endpoint
    if (useBackend) {
      // full project-aware path (when served from http://localhost/Corosa/...)
      const endpoint = "/Corosa/backend/api/login.php";
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((r) => r.json())
        .then((resp) => {
          if (resp && resp.success) {
            if (resp.userId) {
              sessionStorage.setItem("userId", resp.userId);
            }
            sessionStorage.setItem("userEmail", email);
            window.location.href = "select-pickup.html";
          } else {
            setError("password", resp.message || "Invalid credentials");
          }
        })
        .catch((err) => {
          console.error("Login failed", err);
          alert("Could not connect to the server.");
        });
    }
  });
});
