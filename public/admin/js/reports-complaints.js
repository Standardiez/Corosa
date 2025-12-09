/**
 * Reports & Complaints Management
 * Admin page for handling user reports and complaints
 */

// State management
let currentPage = 1;
let itemsPerPage = 10;
let allReports = [];
let filteredReports = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadStatistics();
    loadReports();
    setActiveNavLink();
});

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // Filters
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));
}

/**
 * Load statistics
 */
async function loadStatistics() {
    try {
        // TODO: Replace with actual API call
        // const response = await fetch('/Corosa/backend/api/reports-stats.php');
        // const stats = await response.json();

        // Mock statistics
        const stats = {
            total: 42,
            pending: 8,
            highPriority: 5,
            resolvedToday: 3
        };

        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-pending').textContent = stats.pending;
        document.getElementById('stat-high-priority').textContent = stats.highPriority;
        document.getElementById('stat-resolved-today').textContent = stats.resolvedToday;

    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

/**
 * Load reports data
 */
async function loadReports() {
    try {
        // TODO: Replace with actual API call
        // const response = await fetch('/Corosa/backend/api/reports.php');
        // allReports = await response.json();

        // Mock reports data
        allReports = generateMockReports();
        filteredReports = [...allReports];

        renderTable();
        updatePagination();

    } catch (error) {
        console.error('Error loading reports:', error);
        showError('Failed to load reports data');
    }
}

/**
 * Generate mock reports data
 */
function generateMockReports() {
    const types = [
        'driver_complaint',
        'passenger_complaint',
        'safety_concern',
        'payment_issue',
        'technical_issue',
        'other'
    ];

    const typeLabels = {
        'driver_complaint': 'Driver Complaint',
        'passenger_complaint': 'Passenger Complaint',
        'safety_concern': 'Safety Concern',
        'payment_issue': 'Payment Issue',
        'technical_issue': 'Technical Issue',
        'other': 'Other'
    };

    const subjects = [
        'Driver was rude and unprofessional',
        'Unsafe driving behavior',
        'Payment not received',
        'Passenger cancelled last minute',
        'App crashed during booking',
        'Vehicle condition not as described',
        'Driver took wrong route',
        'Harassment complaint',
        'Pricing discrepancy',
        'GPS not working properly',
        'Driver refused to pick up',
        'Cleanliness issue',
        'Late arrival without notice',
        'Inappropriate behavior',
        'Vehicle not matching description'
    ];

    const users = [
        'Jose Rizal',
        'Andres Bonifacio',
        'Apolinario Mabini',
        'Emilio Aguinaldo',
        'Maria Clara',
        'Juan Luna',
        'Antonio Luna'
    ];

    const statuses = ['pending', 'investigating', 'resolved', 'dismissed'];
    const priorities = ['high', 'medium', 'low'];

    const reports = [];
    for (let i = 1; i <= 42; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));

        const type = types[Math.floor(Math.random() * types.length)];
        const priority = i <= 5 ? 'high' : (i <= 15 ? 'medium' : 'low');
        const status = i <= 8 ? 'pending' :
                      (i <= 15 ? 'investigating' :
                      (Math.random() > 0.2 ? 'resolved' : 'dismissed'));

        reports.push({
            id: 'RPT' + String(2000 + i).padStart(5, '0'),
            type: type,
            typeLabel: typeLabels[type],
            reportedBy: users[Math.floor(Math.random() * users.length)],
            subject: subjects[Math.floor(Math.random() * subjects.length)],
            priority: priority,
            status: status,
            dateSubmitted: date.toISOString(),
            description: 'Detailed description of the report will be shown in the modal...',
            relatedRide: Math.random() > 0.3 ? (1000 + Math.floor(Math.random() * 50)) : null
        });
    }

    // Sort by date (newest first)
    return reports.sort((a, b) => new Date(b.dateSubmitted) - new Date(a.dateSubmitted));
}

/**
 * Render reports table
 */
function renderTable() {
    const tbody = document.getElementById('reports-table-body');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredReports.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class='bx bx-inbox'></i>
                        <p>No reports found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(report => `
        <tr>
            <td><strong>${report.id}</strong></td>
            <td><span class="type-badge">${report.typeLabel}</span></td>
            <td>${report.reportedBy}</td>
            <td>${truncateText(report.subject, 40)}</td>
            <td><span class="priority-badge ${report.priority}">${report.priority}</span></td>
            <td><span class="status-badge ${report.status}">${report.status}</span></td>
            <td>${formatDate(report.dateSubmitted)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewReport('${report.id}')" title="View Details">
                        <i class='bx bx-show'></i>
                    </button>
                    ${report.status === 'pending' || report.status === 'investigating' ? `
                        <button class="action-btn" onclick="updateStatus('${report.id}')" title="Update Status">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="action-btn" onclick="resolveReport('${report.id}')" title="Resolve">
                            <i class='bx bx-check-circle'></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Apply filters
 */
function applyFilters() {
    const type = document.getElementById('filter-type').value;
    const priority = document.getElementById('filter-priority').value;
    const status = document.getElementById('filter-status').value;
    const dateFrom = document.getElementById('filter-date-from').value;
    const dateTo = document.getElementById('filter-date-to').value;

    filteredReports = allReports.filter(report => {
        // Type filter
        if (type !== 'all' && report.type !== type) {
            return false;
        }

        // Priority filter
        if (priority !== 'all' && report.priority !== priority) {
            return false;
        }

        // Status filter
        if (status !== 'all' && report.status !== status) {
            return false;
        }

        // Date range filter
        const reportDate = new Date(report.dateSubmitted);
        if (dateFrom && reportDate < new Date(dateFrom)) {
            return false;
        }
        if (dateTo && reportDate > new Date(dateTo + 'T23:59:59')) {
            return false;
        }

        return true;
    });

    currentPage = 1;
    renderTable();
    updatePagination();
}

/**
 * Reset filters
 */
function resetFilters() {
    document.getElementById('filter-type').value = 'all';
    document.getElementById('filter-priority').value = 'all';
    document.getElementById('filter-status').value = 'all';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';

    filteredReports = [...allReports];
    currentPage = 1;
    renderTable();
    updatePagination();
}

/**
 * Change page
 */
function changePage(delta) {
    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    const newPage = currentPage + delta;

    if (newPage < 1 || newPage > totalPages) {
        return;
    }

    currentPage = newPage;
    renderTable();
    updatePagination();
}

/**
 * Update pagination controls
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

    document.getElementById('pagination-info').textContent =
        `Page ${currentPage} of ${totalPages || 1}`;

    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
}

/**
 * View report details (placeholder)
 */
function viewReport(reportId) {
    const report = allReports.find(r => r.id === reportId);

    if (report) {
        let details = `Report ID: ${report.id}\n\n`;
        details += `Type: ${report.typeLabel}\n`;
        details += `Reported By: ${report.reportedBy}\n`;
        details += `Subject: ${report.subject}\n`;
        details += `Priority: ${report.priority.toUpperCase()}\n`;
        details += `Status: ${report.status.toUpperCase()}\n`;
        details += `Date: ${formatDate(report.dateSubmitted)}\n\n`;
        details += `Description:\n${report.description}\n\n`;

        if (report.relatedRide) {
            details += `Related Ride: #${report.relatedRide}\n`;
        }

        details += `\nThis will open a detailed modal with full report information, timeline, and action history.`;

        alert(details);
    }
    // TODO: Implement modal with full report details
}

/**
 * Update report status (placeholder)
 */
function updateStatus(reportId) {
    const report = allReports.find(r => r.id === reportId);

    if (report) {
        const newStatus = prompt(
            `Update status for ${reportId}\n\nCurrent status: ${report.status}\n\nEnter new status (pending/investigating/resolved/dismissed):`,
            report.status
        );

        if (newStatus && ['pending', 'investigating', 'resolved', 'dismissed'].includes(newStatus.toLowerCase())) {
            // TODO: API call to update status
            // await fetch('/Corosa/backend/api/reports.php', {
            //     method: 'PUT',
            //     body: JSON.stringify({ id: reportId, status: newStatus })
            // });

            report.status = newStatus.toLowerCase();
            renderTable();
            loadStatistics();
            alert(`Status updated to: ${newStatus}`);
        }
    }
}

/**
 * Resolve report (placeholder)
 */
function resolveReport(reportId) {
    const report = allReports.find(r => r.id === reportId);

    if (report) {
        const resolution = prompt(
            `Resolve Report ${reportId}\n\nPlease provide resolution notes:`,
            'Report has been reviewed and appropriate action has been taken.'
        );

        if (resolution) {
            // TODO: API call to resolve report
            // await fetch('/Corosa/backend/api/reports.php', {
            //     method: 'PUT',
            //     body: JSON.stringify({
            //         id: reportId,
            //         status: 'resolved',
            //         resolution: resolution
            //     })
            // });

            report.status = 'resolved';
            renderTable();
            loadStatistics();
            alert('Report marked as resolved!');
        }
    }
}

/**
 * Format date
 */
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Truncate text
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
