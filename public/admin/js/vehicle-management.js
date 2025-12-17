// Search and sort state
let searchQuery = '';

// Add event listeners for search and sort (apply only on button press)
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('vehicle-search-input');
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
});


// State management
let currentTab = 'vehicles';
let currentPage = 1;
let itemsPerPage = 10;
let allVehicles = [];
let filteredData = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadStatistics();
    loadVehicleData();
    setActiveNavLink();
});

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // Tab switching
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

    loadVehicleData();
}

/**
 * Load statistics
 */
async function loadStatistics() {
    // TODO: Replace with actual API call
    // const response = await fetch('/Corosa/backend/api/rides-stats.php');

    // Mock statistics
    const stats = {
        totalVehicles: 248,
        verified: 8,
        pending: 5,
        declined: 12
    };

    document.getElementById('stat-total-vehicles').textContent = stats.totalVehicles;
    document.getElementById('stat-verified-vehicles').textContent = stats.verified;
    document.getElementById('stat-pending-vehicles').textContent = stats.pending;
    document.getElementById('stat-declined-vehicles').textContent = stats.declined;
}

/**
 * Load vehicle data
 */
async function loadVehicleData() {
    try {
        // Fetch vehicle data from backend Node.js API
        const response = await fetch('http://localhost:3000/api/vehicle');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
            allVehicles = result.data.map(vehicle => ({
                owner: vehicle.driver_id || '',
                model: vehicle.vehicle_model || '',
                plate: vehicle.plate_number || '',
                seatCapacity: vehicle.seat_capacity || '',
                status: vehicle.vehicle_status || ''
            }));
        } else {
            allVehicles = [];
        }
        filteredData = [...allVehicles];
        renderVehiclesTable();
        updatePagination();
    } catch (error) {
        console.error('Error loading vehicles:', error);
        showError('Failed to load vehicles data');
    }
}

/**
 * Generate mock vehicle data
 */


/**
 * Render vehicles table
 */
function renderVehiclesTable() {
    const tbody = document.getElementById('vehicles-table-body');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class='bx bx-inbox'></i>
                        <p>No vehicles found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(vehicle => `
        <tr>
            <td>${vehicle.owner || ''}</td>
            <td>${vehicle.license || ''}</td>
            <td>${vehicle.model || ''}</td>
            <td>${vehicle.plate || ''}</td>
            <td>${vehicle.seatCapacity || ''}</td>
            <td><span class="status-badge ${vehicle.status}">${vehicle.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewVehicleDetails(${vehicle.id})" title="View Details">
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
    let tempData = allVehicles;
    if (status !== 'all') {
        tempData = tempData.filter(vehicle => vehicle.status === status);
    }

    // Then apply search filter
    if (searchQuery) {
        tempData = tempData.filter(vehicle => {
            const searchFields = [vehicle.owner, vehicle.license, vehicle.model, vehicle.plate]
                .map(f => (f || '').toLowerCase()).join(' ');
            return searchFields.includes(searchQuery);
        });
    }

    filteredData = tempData;

    currentPage = 1;
    renderVehiclesTable();
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

    renderVehiclesTable();

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
