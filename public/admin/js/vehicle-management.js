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
/**
 * Rides & Transactions Management
 * Admin page for monitoring active rides and transaction history
 */

// State management
let currentTab = 'vehicles';
let currentPage = 1;
let itemsPerPage = 10;
let allRides = [];
let allTransactions = [];
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

    // Show/hide tables
    document.getElementById('rides-table-container').style.display =
        tab === 'rides' ? 'block' : 'none';
    document.getElementById('transactions-table-container').style.display =
        tab === 'transactions' ? 'block' : 'none';

    // Load appropriate data
    if (tab === 'rides') {
        loadVehicleData();
    } else {
        loadTransactionsData();
    }
}

/**
 * Load statistics
 */
async function loadStatistics() {
    // TODO: Replace with actual API call
    // const response = await fetch('/Corosa/backend/api/rides-stats.php');

    // Mock statistics
    const stats = {
        totalRides: 248,
        activeRides: 8,
        totalRevenue: 17560.00,
        completedToday: 12
    };

    document.getElementById('stat-total-rides').textContent = stats.totalRides;
    document.getElementById('stat-active-rides').textContent = stats.activeRides;
    document.getElementById('stat-total-revenue').textContent = formatCurrency(stats.totalRevenue);
    document.getElementById('stat-completed-today').textContent = stats.completedToday;
}

/**
 * Load vehicle data
 */
async function loadVehicleData() {
    try {
        // TODO: Replace with actual API call
        // const response = await fetch('/Corosa/backend/api/trip.php?action=getAllWithDetails');
        // allRides = await response.json();

        // Mock rides data
        allRides = generateMockVehicles();
        filteredData = [...allRides];

        renderVehiclesTable();
        updatePagination();

    } catch (error) {
        console.error('Error loading rides:', error);
        showError('Failed to load rides data');
    }
}

/**
 * Generate mock vehicle data
 */
function generateMockVehicles() {
    const statuses = ['active', 'inactive', 'maintenance'];
    const owners = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Reyes', 'Ana Garcia'];
    const licenses = ['D-1234567', 'D-2345678', 'D-3456789', 'D-4567890'];
    const models = ['Toyota Vios', 'Honda City', 'Mitsubishi Mirage', 'Hyundai Accent'];
    const plates = ['ABC-1234', 'XYZ-5678', 'LMN-9101', 'QRS-2345'];

    const vehicles = [];
    for (let i = 1; i <= 25; i++) {
        vehicles.push({
            owner: owners[Math.floor(Math.random() * owners.length)],
            license: licenses[Math.floor(Math.random() * licenses.length)],
            model: models[Math.floor(Math.random() * models.length)],
            plate: plates[Math.floor(Math.random() * plates.length)],
            seatCapacity: 4 + Math.floor(Math.random() * 3),
            status: statuses[Math.floor(Math.random() * statuses.length)]
        });
    }
    return vehicles;
}

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
    let tempData = allRides;
    if (status !== 'all') {
        tempData = tempData.filter(vehicle => vehicle.status === status);
    }

    // Then apply search filter
    if (searchQuery) {
        tempData = tempData.filter(vehicle => {
            const searchFields = [vehicle.owner, vehicle.driver, vehicle.license, vehicle.model, vehicle.plate]
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
 * View ride details (placeholder)
 */
function viewRideDetails(rideId) {
    alert(`View details for Ride #${rideId}\n\nThis will open a modal with full ride information.`);
    // TODO: Implement modal with ride details
}

/**
 * Monitor ride (placeholder)
 */
function monitorRide(rideId) {
    alert(`Monitor Ride #${rideId}\n\nThis will show real-time location tracking.`);
    // TODO: Implement real-time monitoring
}

/**
 * View transaction details (placeholder)
 */
function viewTransactionDetails(txnId) {
    alert(`View details for Transaction ${txnId}\n\nThis will show payment and receipt details.`);
    // TODO: Implement modal with transaction details
}

/**
 * Download receipt (placeholder)
 */
function downloadReceipt(txnId) {
    alert(`Download receipt for Transaction ${txnId}\n\nThis will generate a PDF receipt.`);
    // TODO: Implement PDF generation
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
