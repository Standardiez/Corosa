// Mock complaints data
const complaints = [
    { id: 201, rideId: 101, driver: "John Doe", passenger: "Alice Johnson", type: "Payment", description: "Charged extra without explanation.", status: "Pending" },
    { id: 202, rideId: 102, driver: "Jane Smith", passenger: "Bob Lee", type: "Behavior", description: "Driver was rude.", status: "In Progress" },
    { id: 203, rideId: 103, driver: "Alice Johnson", passenger: "Charlie Kim", type: "Safety", description: "Driver violated traffic rules.", status: "Pending" },
];

// Populate complaints table
function populateComplaintsTable() {
    const tableBody = document.getElementById("complaintsTableBody");
    tableBody.innerHTML = "";

    complaints.forEach((complaint, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${complaint.id}</td>
            <td>${complaint.rideId}</td>
            <td>${complaint.driver}</td>
            <td>${complaint.passenger}</td>
            <td>${complaint.type}</td>
            <td>${complaint.description}</td>
            <td>${complaint.status}</td>
            <td>
                <button class="btn btn-warning" onclick="respondComplaint(${index})">
                    <i class='bx bx-reply'></i> Respond
                </button>
                <button class="btn btn-danger" onclick="escalateComplaint(${index})">
                    <i class='bx bx-user-x'></i> Escalate
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Admin responds to complaint
function respondComplaint(index) {
    const complaint = complaints[index];
    const response = prompt(`Respond to Complaint ID ${complaint.id}:\nCurrent status: ${complaint.status}\nEnter your response or action:`);

    if(response) {
        alert(`Response sent for Complaint ID ${complaint.id}: "${response}"`);
        complaints[index].status = "In Progress";
    }

    populateComplaintsTable();
}

// Escalate complaint (e.g., suspend driver)
function escalateComplaint(index) {
    const complaint = complaints[index];
    const confirmEscalate = confirm(`Are you sure you want to escalate Complaint ID ${complaint.id}? This may suspend driver ${complaint.driver}.`);

    if(confirmEscalate) {
        alert(`Complaint ID ${complaint.id} escalated.`);
        complaints[index].status = "Escalated";
    }

    populateComplaintsTable();
}

// Initialize table on page load
window.onload = populateComplaintsTable;
