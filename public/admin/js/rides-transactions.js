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
    try {
        // Fetch real data from Node.js API
        const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
        const response = await fetch(`${apiBase}/api/trips?action=getAllForAdmin`);
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
            const trips = result.data;
            
            // Calculate statistics from real data
            const stats = {
                totalRides: trips.length,
                activeRides: trips.filter(t => t.ride_status === 'active').length,
                availableRides: trips.filter(t => t.ride_status === 'available').length,
                completedToday: trips.filter(t => {
                    const today = new Date().toDateString();
                    const tripDate = new Date(t.created_at).toDateString();
                    return t.ride_status === 'completed' && tripDate === today;
                }).length
            };

            document.getElementById('stat-total-rides').textContent = stats.totalRides;
            document.getElementById('stat-active-rides').textContent = stats.activeRides;
            document.getElementById('stat-total-revenue').textContent = formatCurrency(0); // TODO: Calculate from transactions
            document.getElementById('stat-completed-today').textContent = stats.completedToday;
        } else {
            // Fallback to mock data
            loadMockStatistics();
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        loadMockStatistics();
    }
}

/**
 * Load mock statistics (fallback)
 */
function loadMockStatistics() {
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
        // Fetch real data from Node.js API
        const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
        const response = await fetch(`${apiBase}/api/trips?action=getAllForAdmin`);
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
            // Process rides and get geocoded addresses
            const ridesWithAddresses = await Promise.all(result.data.map(async (trip) => {
                const routeText = await formatRouteWithGeocoding(
                    trip.start_lat, 
                    trip.start_long, 
                    trip.end_lat, 
                    trip.end_long
                );

                return {
                    id: trip.trip_id,
                    driver: `${trip.first_name || ''} ${trip.middle_initial ? trip.middle_initial + '. ' : ''}${trip.last_name || ''}`.trim(),
                    passenger: trip.passenger_count > 0 ? `${trip.passenger_count} passenger(s)` : 'No passengers',
                    route: routeText,
                    datetime: trip.created_at,
                    status: trip.ride_status,
                    fare: calculateFare(trip.ride_distance || 0),
                    passengers: trip.passenger_count || 0,
                    availableSeats: trip.available_seats,
                    vehicle: trip.vehicle_model || 'N/A'
                };
            }));

            allRides = ridesWithAddresses;
            filteredData = [...allRides];
            renderRidesTable();
            updatePagination();
        } else {
            console.error('Failed to load rides:', result.message);
            // Fallback to mock data if API fails
            allRides = generateMockRides();
            filteredData = [...allRides];
            renderRidesTable();
            updatePagination();
        }

    } catch (error) {
        console.error('Error loading rides:', error);
        showError('Failed to load rides data. Using demo data.');
        // Fallback to mock data on error
        allRides = generateMockRides();
        filteredData = [...allRides];
        renderRidesTable();
        updatePagination();
    }
}

/**
 * Format route with reverse geocoding
 */
async function formatRouteWithGeocoding(startLat, startLng, endLat, endLng) {
    try {
        // Google Maps API key (same as used in passenger pages)
        const API_KEY = 'AIzaSyBsoZUgOFGSg7oXvdgstZuduXjNPIp_S3k';
        
        // Get both addresses in parallel
        const [startAddress, endAddress] = await Promise.all([
            reverseGeocode(startLat, startLng, API_KEY),
            reverseGeocode(endLat, endLng, API_KEY)
        ]);

        return `${startAddress} → ${endAddress}`;
    } catch (error) {
        console.error('Geocoding error:', error);
        // Fallback to coordinates if geocoding fails
        const start = `${parseFloat(startLat).toFixed(4)}, ${parseFloat(startLng).toFixed(4)}`;
        const end = `${parseFloat(endLat).toFixed(4)}, ${parseFloat(endLng).toFixed(4)}`;
        return `${start} → ${end}`;
    }
}

/**
 * Reverse geocode coordinates to address
 */
async function reverseGeocode(lat, lng, apiKey) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        
        // Extract meaningful components
        const components = result.address_components;
        let street = '';
        let barangay = '';
        let city = '';
        
        // Parse address components
        components.forEach(component => {
            const types = component.types;
            
            if (types.includes('route') || types.includes('street_address')) {
                street = component.long_name;
            } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
                barangay = component.long_name;
            } else if (types.includes('locality')) {
                city = component.long_name;
            }
        });

        // Build formatted address
        if (street && barangay) {
            return `${street}, ${barangay}`;
        } else if (barangay && city) {
            return `${barangay}, ${city}`;
        } else if (street) {
            return street;
        } else if (barangay) {
            return barangay;
        } else {
            // Use formatted address as fallback
            return result.formatted_address.split(',').slice(0, 2).join(',');
        }
    }

    // If geocoding fails, return coordinates
    return `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
}

/**
 * Format route from coordinates (fallback)
 */
function formatRoute(startLat, startLng, endLat, endLng) {
    // Simple coordinate display - fallback when geocoding isn't used
    const start = `${parseFloat(startLat).toFixed(4)}, ${parseFloat(startLng).toFixed(4)}`;
    const end = `${parseFloat(endLat).toFixed(4)}, ${parseFloat(endLng).toFixed(4)}`;
    return `${start} → ${end}`;
}

/**
 * Calculate fare based on distance
 */
function calculateFare(distance) {
    const baseFare = 20;
    const perKmRate = 8;
    const total = baseFare + (distance * perKmRate);
    return total.toFixed(2);
}

/**
 * Load transactions data
 */
async function loadTransactionsData() {
    try {
        // Fetch real data from Node.js API
        const apiBase = window.API_CONFIG?.NODE_API_BASE || 'http://localhost:3000';
        const response = await fetch(`${apiBase}/api/trip-assignments?action=getAllForAdmin`);
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
            // Map database fields to display format (matches trip_assignment schema)
            allTransactions = result.data.map(transaction => {
                // Calculate distance using Haversine formula from trip coordinates
                const distance = calculateDistance(
                    transaction.start_lat,
                    transaction.start_long,
                    transaction.end_lat,
                    transaction.end_long
                );

                // Format passenger name (from users table via bookings join)
                const passengerName = `${transaction.passenger_first_name || ''} ${transaction.passenger_middle_initial ? transaction.passenger_middle_initial + '. ' : ''}${transaction.passenger_last_name || ''}`.trim() || 'Unknown';

                // Format driver name (from users table via driver join)
                const driverName = `${transaction.driver_first_name || ''} ${transaction.driver_middle_initial ? transaction.driver_middle_initial + '. ' : ''}${transaction.driver_last_name || ''}`.trim() || 'Unknown';

                return {
                    assignmentId: transaction.assignment_id,
                    tripId: transaction.trip_id,
                    passenger: passengerName,
                    driver: driverName,
                    paymentType: transaction.payment_type || 'cash',
                    totalCost: parseFloat(transaction.total_cost) || 0,
                    distance: distance.toFixed(2),
                    createdAt: transaction.created_at,
                    assignmentStatus: transaction.assignment_status || 'confirmed'
                };
            });

            filteredData = [...allTransactions];
            renderTransactionsTable();
            updatePagination();
        } else {
            console.error('Failed to load transactions:', result.message);
            // Fallback to mock data if API fails
            allTransactions = generateMockTransactions();
            filteredData = [...allTransactions];
            renderTransactionsTable();
            updatePagination();
        }

    } catch (error) {
        console.error('Error loading transactions:', error);
        showError('Failed to load transactions data. Using demo data.');
        // Fallback to mock data on error
        allTransactions = generateMockTransactions();
        filteredData = [...allTransactions];
        renderTransactionsTable();
        updatePagination();
    }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Start latitude
 * @param {number} lon1 - Start longitude
 * @param {number} lat2 - End latitude
 * @param {number} lon2 - End longitude
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
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
                <td colspan="7">
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
            <td><small>${ride.route}</small></td>
            <td>${formatDateTime(ride.datetime)}</td>
            <td><span class="status-badge ${ride.status}">${capitalizeStatus(ride.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewRideDetails(${ride.id})" title="View Details">
                        <i class='bx bx-eye'></i>
                    </button>
                    ${ride.status === 'active' || ride.status === 'pending' ? `
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
 * Capitalize status for display
 */
function capitalizeStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
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
                <td colspan="9">
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
            <td><strong>${txn.assignmentId}</strong></td>
            <td>#${txn.tripId || 'N/A'}</td>
            <td>${txn.passenger}</td>
            <td>${txn.driver}</td>
            <td>${formatPaymentType(txn.paymentType)}</td>
            <td><strong>${formatCurrency(txn.totalCost)}</strong></td>
            <td>${txn.distance} km</td>
            <td>${formatDateTime(txn.createdAt)}</td>
            <td><span class="status-badge ${txn.assignmentStatus}">${capitalizeStatus(txn.assignmentStatus)}</span></td>
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
 * Format payment type for display
 */
function formatPaymentType(type) {
    if (!type) return 'Cash';
    const lowercaseType = type.toLowerCase();
    
    // Special cases
    if (lowercaseType === 'gcash') return 'GCash';
    if (lowercaseType === 'paymaya') return 'PayMaya';
    
    // Capitalize first letter
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
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
