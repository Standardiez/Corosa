// Mock data for users
const users = [
    { id: 1, name: "John Doe", email: "john@example.com", registrationDate: "2025-11-22" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", registrationDate: "2025-11-23" },
    { id: 3, name: "Alice Johnson", email: "alice@example.com", registrationDate: "2025-11-24" },
];

// Function to populate table
function populateTable() {
    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = ""; // Clear existing rows

    users.forEach(user => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.registrationDate}</td>
            <td>
                <button class="btn btn-success" onclick="approveUser(${user.id})">
                    <i class='bx bx-check'></i> Approve
                </button>
                <button class="btn btn-danger" onclick="rejectUser(${user.id})">
                    <i class='bx bx-x'></i> Reject
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Approve function
function approveUser(id) {
    alert(`User ID ${id} approved!`);
    // Here you can implement actual API calls to approve the user
}

// Reject function
function rejectUser(id) {
    alert(`User ID ${id} rejected!`);
    // Here you can implement actual API calls to reject the user
}

// Initialize table on page load
window.onload = populateTable;
