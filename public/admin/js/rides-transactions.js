/**
 * Rides & Transactions Management
 * Admin page for monitoring active rides and transaction history
 */

// State management
let currentTab = 'rides';
let currentPage = 1;
let itemsPerPage = 10;
let allRides = [];
let allTransactions = [];
let filteredData = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadStatistics();
    loadRidesData();
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
        loadRidesData();
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
 * Load rides data
 */
async function loadRidesData() {
    try {
        // TODO: Replace with actual API call
        // const response = await fetch('/Corosa/backend/api/trip.php?action=getAllWithDetails');
        // allRides = await response.json();

        // Mock rides data
        allRides = generateMockRides();
        filteredData = [...allRides];
        
        renderRidesTable();
        updatePagination();

    } catch (error) {
        console.error('Error loading rides:', error);
        showError('Failed to load rides data');
    }
}

/**
 * Load transactions data
 */
async function loadTransactionsData() {
    try {
        // TODO: Replace with actual API call
        // const response = await fetch('/Corosa/backend/api/transactions.php');
        // allTransactions = await response.json();

        // Mock transactions data
        allTransactions = generateMockTransactions();
        filteredData = [...allTransactions];
        
        renderTransactionsTable();
        updatePagination();

    } catch (error) {
        console.error('Error loading transactions:', error);
        showError('Failed to load transactions data');
    }
}

/**
 * Generate mock rides data
 */
function generateMockRides() {
    const statuses = ['active', 'completed', 'cancelled'];
    const drivers = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Reyes', 'Ana Garcia'];
    const passengers = ['Jose Rizal', 'Andres Bonifacio', 'Apolinario Mabini', 'Emilio Aguinaldo'];
    const routes = [
        { from: 'SLU Main', to: 'Maryheights' },
        { from: 'Session Road', to: 'SM Baguio' },
        { from: 'Camp John Hay', to: 'Burnham Park' },
        { from: 'Mines View', to: 'Teacher\'s Camp' }
    ];

    const rides = [];
    for (let i = 1; i <= 25; i++) {
        const status = i <= 8 ? 'active' : (Math.random() > 0.1 ? 'completed' : 'cancelled');
        const route = routes[Math.floor(Math.random() * routes.length)];
        const date = new Date();
        date.setHours(date.getHours() - Math.floor(Math.random() * 72));

        rides.push({
            id: 1000 + i,
            driver: drivers[Math.floor(Math.random() * drivers.length)],
            passenger: passengers[Math.floor(Math.random() * passengers.length)],
            route: `${route.from} → ${route.to}`,
            datetime: date.toISOString(),
            status: status,
            fare: (50 + Math.random() * 100).toFixed(2)
        });
    }

    return rides.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
}

/**
 * Generate mock transactions data
 */
function generateMockTransactions() {
    const paymentMethods = ['Cash', 'GCash', 'PayMaya', 'Bank Transfer'];
    const users = ['Jose Rizal', 'Andres Bonifacio', 'Apolinario Mabini', 'Emilio Aguinaldo'];
    
    const transactions = [];
    for (let i = 1; i <= 30; i++) {
        const date = new Date();
        date.setHours(date.getHours() - Math.floor(Math.random() * 72));
        const status = Math.random() > 0.05 ? 'completed' : 'pending';

        transactions.push({
            id: 'TXN' + (5000 + i),
            rideId: 1000 + Math.floor(Math.random() * 25) + 1,
            user: users[Math.floor(Math.random() * users.length)],
            paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            amount: (50 + Math.random() * 100).toFixed(2),
            datetime: date.toISOString(),
            status: status
        });
    }

    return transactions.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
}

/**
 * Render rides table
 */
function renderRidesTable() {
    const tbody = document.getElementById('rides-table-body');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class='bx bx-inbox'></i>
                        <p>No rides found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(ride => `
        <tr>
            <td><strong>#${ride.id}</strong></td>
            <td>${ride.driver}</td>
            <td>${ride.passenger}</td>
            <td>${ride.route}</td>
            <td>${formatDateTime(ride.datetime)}</td>
            <td><span class="status-badge ${ride.status}">${ride.status}</span></td>
            <td><strong>${formatCurrency(ride.fare)}</strong></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewRideDetails(${ride.id})" title="View Details">
                        <i class='bx bx-show'></i>
                    </button>
                    ${ride.status === 'active' ? `
                        <button class="action-btn" onclick="monitorRide(${ride.id})" title="Monitor">
                            <i class='bx bx-map'></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Render transactions table
 */
function renderTransactionsTable() {
    const tbody = document.getElementById('transactions-table-body');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class='bx bx-inbox'></i>
                        <p>No transactions found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(txn => `
        <tr>
            <td><strong>${txn.id}</strong></td>
            <td>#${txn.rideId}</td>
            <td>${txn.user}</td>
            <td>${txn.paymentMethod}</td>
            <td><strong>${formatCurrency(txn.amount)}</strong></td>
            <td>${formatDateTime(txn.datetime)}</td>
            <td><span class="status-badge ${txn.status}">${txn.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewTransactionDetails('${txn.id}')" title="View Details">
                        <i class='bx bx-show'></i>
                    </button>
                    <button class="action-btn" onclick="downloadReceipt('${txn.id}')" title="Download Receipt">
                        <i class='bx bx-download'></i>
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
    const dateFrom = document.getElementById('filter-date-from').value;
    const dateTo = document.getElementById('filter-date-to').value;

    const sourceData = currentTab === 'rides' ? allRides : allTransactions;
    filteredData = sourceData.filter(item => {
        // Status filter
        if (status !== 'all' && item.status !== status) {
            return false;
        }

        // Date range filter
        const itemDate = new Date(item.datetime);
        if (dateFrom && itemDate < new Date(dateFrom)) {
            return false;
        }
        if (dateTo && itemDate > new Date(dateTo + 'T23:59:59')) {
            return false;
        }

        return true;
    });

    currentPage = 1;
    
    if (currentTab === 'rides') {
        renderRidesTable();
    } else {
        renderTransactionsTable();
    }
    
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
    
    if (currentTab === 'rides') {
        renderRidesTable();
    } else {
        renderTransactionsTable();
    }
    
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
