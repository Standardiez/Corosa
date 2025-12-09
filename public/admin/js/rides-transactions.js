// Mock data for rides
const rides = [
    { id: 101, driver: "John Doe", passenger: "Alice Johnson", route: "SLU → City Center", status: "Ongoing", payment: "Pending" },
    { id: 102, driver: "Jane Smith", passenger: "Bob Lee", route: "Downtown → Airport", status: "Completed", payment: "Paid" },
    { id: 103, driver: "Alice Johnson", passenger: "Charlie Kim", route: "Market → University", status: "Ongoing", payment: "Pending" },
];

// Populate table
function populateRidesTable() {
    const tableBody = document.getElementById("ridesTableBody");
    tableBody.innerHTML = "";

    rides.forEach((ride, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${ride.id}</td>
            <td>${ride.driver}</td>
            <td>${ride.passenger}</td>
            <td>${ride.route}</td>
            <td>${ride.status}</td>
            <td>${ride.payment}</td>
            <td>
                <button class="btn btn-warning" onclick="interveneRide(${index})">
                    <i class='bx bx-exit'></i> Intervene
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Admin intervention function
function interveneRide(index) {
    const ride = rides[index];
    const action = prompt(`Admin Action for Ride ID ${ride.id}:\n1. Cancel Ride\n2. Refund\n3. Contact User\n\nEnter option number:`);

    switch(action) {
        case "1":
            alert(`Ride ID ${ride.id} canceled.`);
            rides[index].status = "Canceled";
            break;
        case "2":
            alert(`Payment for Ride ID ${ride.id} refunded.`);
            rides[index].payment = "Refunded";
            break;
        case "3":
            alert(`Contacting driver ${ride.driver} and passenger ${ride.passenger}...`);
            break;
        default:
            alert("No action taken.");
    }

    populateRidesTable();
}

// Initialize table on page load
window.onload = populateRidesTable;
