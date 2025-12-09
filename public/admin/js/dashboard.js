/**
 * Admin Dashboard JavaScript
 * Handles data fetching and display for the admin dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    loadDashboardData();
    loadRecentActivity();

    // Set active nav link
    setActiveNavLink();
});

/**
 * Load dashboard statistics
 */
async function loadDashboardData() {
    try {
        // Fetch statistics from API
        // For now, using mock data - replace with actual API calls

        // TODO: Replace with actual API endpoints
        // const usersResponse = await fetch('/Corosa/backend/api/users.php?action=count');
        // const vehiclesResponse = await fetch('/Corosa/backend/api/vehicle.php?action=count');
        // const ridesResponse = await fetch('/Corosa/backend/api/trip.php?action=activeCount');
        // const reportsResponse = await fetch('/Corosa/backend/api/reports.php?action=pendingCount');

        // Mock data for demonstration
        const stats = {
            totalUsers: 156,
            totalVehicles: 42,
            activeRides: 8,
            pendingReports: 3
        };

        // Update UI
        document.getElementById('total-users').textContent = stats.totalUsers;
        document.getElementById('total-vehicles').textContent = stats.totalVehicles;
        document.getElementById('active-rides').textContent = stats.activeRides;
        document.getElementById('pending-reports').textContent = stats.pendingReports;

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard statistics');
    }
}

/**
 * Load recent activity feed
 */
async function loadRecentActivity() {
    try {
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/Corosa/backend/api/activity.php?limit=5');
        // const activities = await response.json();

        // Mock activity data
        const activities = [
            {
                type: 'user',
                icon: 'bx-user-plus',
                iconClass: 'user',
                title: 'New user registered',
                description: 'Juan Dela Cruz signed up as a passenger',
                time: '2 minutes ago'
            },
            {
                type: 'vehicle',
                icon: 'bx-car',
                iconClass: 'vehicle',
                title: 'Vehicle approved',
                description: 'Toyota Vios 2020 (ABC-1234) has been verified',
                time: '15 minutes ago'
            },
            {
                type: 'ride',
                icon: 'bx-trip',
                iconClass: 'ride',
                title: 'Ride completed',
                description: 'Trip from SLU Main to Maryheights completed successfully',
                time: '1 hour ago'
            },
            {
                type: 'report',
                icon: 'bx-message-error',
                iconClass: 'report',
                title: 'New report submitted',
                description: 'User reported a payment issue',
                time: '3 hours ago'
            },
            {
                type: 'user',
                icon: 'bx-user-check',
                iconClass: 'user',
                title: 'User verified',
                description: 'Maria Santos account has been verified',
                time: '5 hours ago'
            }
        ];

        displayRecentActivity(activities);

    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

/**
 * Display recent activity in the UI
 */
function displayRecentActivity(activities) {
    const activityList = document.getElementById('activity-list');

    if (!activities || activities.length === 0) {
        activityList.innerHTML = `
            <div class="empty-state">
                <i class='bx bx-time-five'></i>
                <p>No recent activity</p>
            </div>
        `;
        return;
    }

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.iconClass}">
                <i class='bx ${activity.icon}'></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
            </div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
}

/**
 * Set active navigation link based on current page
 */
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.admin-nav-link');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Show error message
 */
function showError(message) {
    // Simple error display - can be enhanced with better UI
    console.error(message);
    // TODO: Implement toast notification or modal
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Get relative time string
 */
function getRelativeTime(timestamp) {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

// Export functions for use in other modules if needed
window.adminDashboard = {
    loadDashboardData,
    loadRecentActivity,
    formatNumber,
    getRelativeTime
};
