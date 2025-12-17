(function () {
  "use strict";

  // Check if user is logged in and update header accordingly
  function initializeHeader() {
    const userDataStr = localStorage.getItem("userData");
    const signupLink = document.getElementById("signup-link");
    const registerLink = document.getElementById("register-link");
    const userMenuBtn = document.getElementById("user-menu-btn");
    const userInitials = document.getElementById("user-initials");

    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);

        // Hide signup/login links
        if (signupLink) {
          signupLink.style.display = "none";
        }
        if (registerLink) {
          registerLink.style.display = "none";
        }

        // Show user menu button
        if (userMenuBtn) {
          userMenuBtn.classList.add("show");

          // Set user initials
          if (userInitials && userData.firstName && userData.lastName) {
            const initials = (
              userData.firstName[0] + userData.lastName[0]
            ).toUpperCase();
            userInitials.textContent = initials;
          }

          // Add click handler for user menu
          userMenuBtn.addEventListener("click", handleUserMenuClick);
        }
      } catch (e) {
        console.error("Error parsing userData", e);
      }
    } else {
      // No user logged in - show signup/login links, hide user menu
      if (signupLink) {
        signupLink.style.display = "inline-block";
      }
      if (registerLink) {
        registerLink.style.display = "inline-block";
      }
      if (userMenuBtn) {
        userMenuBtn.classList.remove("show");
      }
    }
  }

  function handleUserMenuClick(e) {
    e.preventDefault();

    // Create a simple dropdown menu
    const menu = document.createElement("div");
    menu.className = "user-dropdown-menu";
    menu.innerHTML = `
            <a href="user-profile.html"><i class='bx bx-user'></i> Profile</a>
            <button id="logout-btn" class="logout-btn"><i class='bx bx-log-out'></i> Logout</button>
        `;

    // Remove existing menu if any
    const existingMenu = document.querySelector(".user-dropdown-menu");
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    // Position the menu
    const btn = e.target.closest(".user-menu-btn");
    btn.parentNode.appendChild(menu);

    // Add logout handler
    document
      .getElementById("logout-btn")
      .addEventListener("click", handleLogout);
  }

  function handleLogout() {
    // Clear user data
    localStorage.removeItem("userData");
    localStorage.removeItem("userToken");

    // Redirect to home page
    if (window.navigateToShared) {
      window.navigateToShared('index.html');
    } else {
      window.location.href = "/shared/pages/index.html";
    }
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeHeader);
  } else {
    initializeHeader();
  }
})();
