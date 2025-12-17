// Search and sort state
let searchQuery = '';

/**
 * Rides & Transactions Management
 * Admin page for monitoring active rides and transaction history
 */

// State management
let currentTab = 'users';
let currentPage = 1;
let itemsPerPage = 10;
let allUsers = [];
let filteredData = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for search and sort (apply only on button press)
    const searchInput = document.getElementById('user-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchQuery = e.target.value.toLowerCase();
        });
    }
    // Apply Filters button
    const applyBtn = document.getElementById('apply-filters');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            applyFilters();
        });
    }
    initializeEventListeners();
    loadStatistics();
    loadUserData();
    setActiveNavLink();
});

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // Tab switching (only one tab for users)
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Filters
    document.getElementById('apply-filters').addEventListener('click', applyFilters);

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));
}

/**
 * Switch between tabs
 */
function switchTab(tab) {
    currentTab = tab;
    currentPage = 1;

    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Only one tab: users
    loadUserData();
}

/**
 * Load statistics
 */
async function loadStatistics() {
    // TODO: Replace with actual API call
    // const response = await fetch('/Corosa/backend/api/users-stats.php');
    try {
        const statsResponse = await fetch('http://localhost:3000/api/user?get=stats');
        const statsResult = await statsResponse.json();
        if (!statsResult.success) {
            showError('Failed to load user statistics');
            return;
        }

        document.getElementById('stat-total-users').textContent = statsResult.data.totalUsers;
        document.getElementById('stat-active-users').textContent = statsResult.data.active;
        document.getElementById('stat-inactive-users').textContent = statsResult.data.inactive;
    } catch (error) {
        console.error('Error loading user statistics:', error);
        showError('Failed to load user statistics');
    }   
}

/**
 * Load vehicle data
 */
async function loadUserData() {
    try {
        // Fetch users from backend Node.js API
        const response = await fetch('http://localhost:3000/api/user?get=all');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
            allUsers = result.data.map(user => ({
                id: user.id,
                name: user.first_name + ' ' + user.last_name || '',
                email: user.email || '',
                mobile: user.mobile_number || '',
                birthdate: user.birthdate || '',
                occupation: user.employment_status || '',
                status: user.account_status || ''
            }));
        } else {
            allUsers = [];
        }
        filteredData = [...allUsers];
        renderUsersTable();
        updatePagination();
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users data');
    }
}

/**
 * Render users table
 */
function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class='bx bx-inbox'></i>
                        <p>No users found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(user => `
        <tr>
            <td>${user.name || ''}</td>
            <td>${user.email || ''}</td>
            <td>${user.mobile || ''}</td>
            <td>${formatDateTime(user.birthdate) || ''}</td>
            <td>${user.occupation || ''}</td>
            <td><span class="status-badge ${user.status}">${user.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewUserDetails('${user.email}')" title="View Details">
                        <i class='bx bx-eye'></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Apply filters
 */
function applyFilters() {
    const status = document.getElementById('filter-status').value;

    // Always apply status filter first
    let tempData = allUsers;
    if (status !== 'all') {
        tempData = tempData.filter(user => user.status === status);
    }

    // Then apply search filter
    if (searchQuery) {
        tempData = tempData.filter(user => {
            const searchFields = [user.name, user.email, user.mobile, user.birthdate, user.occupation]
                .map(f => (f || '').toLowerCase()).join(' ');
            return searchFields.includes(searchQuery);
        });
    }

    filteredData = tempData;

    currentPage = 1;
    renderUsersTable();
    updatePagination();
}

/**
 * Change page
 */
function changePage(delta) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const newPage = currentPage + delta;

    if (newPage < 1 || newPage > totalPages) {
        return;
    }

    currentPage = newPage;

    renderUsersTable();
    updatePagination();
}

/**
 * Update pagination controls
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    document.getElementById('pagination-info').textContent =
        `Page ${currentPage} of ${totalPages || 1}`;

    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
}

/**
 * View user details (placeholder)
 */
function viewUserDetails(email) {
    alert(`View details for User: ${email}\n\nThis will open a modal with full user information.`);
    // TODO: Implement modal with user details
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return '₱' + parseFloat(amount).toFixed(2);
}

/**
 * Format date and time
 */
function formatDateTime(isoString) {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    return `${dateStr}<br><small style="color: var(--color-muted-foreground);">${timeStr}</small>`;
}

/**
 * Set active navigation link
 */
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        const linkPage = link.getAttribute('href');
        link.classList.toggle('active', linkPage === currentPage);
    });
}

/**
 * Show error message
 */
function showError(message) {
    console.error(message);
    // TODO: Implement better error notification
    alert('Error: ' + message);
}
