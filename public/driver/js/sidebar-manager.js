/**
 * SIDEBAR MANAGER
 * Manages sidebar state persistence and active item highlighting
 *
 * - Keeps sidebar visible (fixed position)
 * - Highlights active menu item based on current page
 * - Persists sidebar open/closed state in localStorage
 */

class SidebarManager {
  constructor() {
    this.sidebar = document.getElementById("sidebar");
    this.toggleBtn = document.getElementById("sidebarToggle");
    this.menuItems = document.querySelectorAll(".sidebar-menu a");

    this.SIDEBAR_STATE_KEY = "driverSidebarOpen";

    this.init();
  }

  /**
   * Initialize sidebar manager
   */
  init() {
    // Restore sidebar state from localStorage
    this.restoreState();

    // Add toggle button listener
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener("click", () => this.toggleSidebar());
    }

    // Highlight active menu item based on current page
    this.highlightActivePage();

    // Add click handlers to menu items
    this.menuItems.forEach((item) => {
      item.addEventListener("click", () => this.onMenuItemClick(item));
    });

    // Close sidebar on mobile when navigating
    if (window.innerWidth < 768) {
      this.menuItems.forEach((item) => {
        item.addEventListener("click", () => this.closeSidebar());
      });
    }
  }

  /**
   * Restore sidebar state from localStorage
   */
  restoreState() {
    const isOpen = localStorage.getItem(this.SIDEBAR_STATE_KEY) !== "false";

    if (this.sidebar) {
      if (isOpen) {
        this.sidebar.classList.remove("collapsed");
      } else {
        this.sidebar.classList.add("collapsed");
      }
    }
  }

  /**
   * Toggle sidebar open/closed
   */
  toggleSidebar() {
    if (!this.sidebar) return;

    this.sidebar.classList.toggle("collapsed");

    // Save state
    const isOpen = !this.sidebar.classList.contains("collapsed");
    localStorage.setItem(this.SIDEBAR_STATE_KEY, isOpen);
  }

  /**
   * Close sidebar
   */
  closeSidebar() {
    if (this.sidebar && !this.sidebar.classList.contains("collapsed")) {
      this.toggleSidebar();
    }
  }

  /**
   * Open sidebar
   */
  openSidebar() {
    if (this.sidebar && this.sidebar.classList.contains("collapsed")) {
      this.toggleSidebar();
    }
  }

  /**
   * Highlight the current page in the sidebar menu
   */
  highlightActivePage() {
    // Get current page filename
    const currentPage =
      window.location.pathname.split("/").pop() || "driver-Homepage.html";

    // Remove active class from all items
    this.menuItems.forEach((item) => {
      item.classList.remove("active");
    });

    // Add active class to matching item
    this.menuItems.forEach((item) => {
      const href = item.getAttribute("href");
      if (href && href.includes(currentPage)) {
        item.classList.add("active");
      }
    });
  }

  /**
   * Handle menu item click
   */
  onMenuItemClick(item) {
    // Remove active class from all items
    this.menuItems.forEach((el) => {
      el.classList.remove("active");
    });

    // Add active class to clicked item
    item.classList.add("active");
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  window.sidebarManager = new SidebarManager();
});
