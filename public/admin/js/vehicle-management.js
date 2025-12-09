// Mock data for vehicles
const vehicles = [
    { owner: "John Doe", make: "Toyota", model: "Vios", year: 2019, license: "ABC-1234", insurance: "Valid", registration: "Uploaded" },
    { owner: "Jane Smith", make: "Honda", model: "Civic", year: 2020, license: "XYZ-5678", insurance: "Valid", registration: "Uploaded" },
    { owner: "Alice Johnson", make: "Ford", model: "Ranger", year: 2021, license: "DEF-9012", insurance: "Pending", registration: "Uploaded" },
];

// Function to populate vehicle table
function populateVehicleTable() {
    const tableBody = document.getElementById("vehicleTableBody");
    tableBody.innerHTML = ""; // Clear previous rows

    vehicles.forEach((vehicle, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${vehicle.owner}</td>
            <td>${vehicle.make}</td>
            <td>${vehicle.model}</td>
            <td>${vehicle.year}</td>
            <td>${vehicle.license}</td>
            <td>${vehicle.insurance}</td>
            <td>${vehicle.registration}</td>
            <td>
                <button class="btn btn-success" onclick="approveVehicle(${index})">
                    <i class='bx bx-check'></i> Approve
                </button>
                <button class="btn btn-danger" onclick="rejectVehicle(${index})">
                    <i class='bx bx-x'></i> Reject
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Approve function
function approveVehicle(index) {
    const vehicle = vehicles[index];
    alert(`Vehicle "${vehicle.make} ${vehicle.model}" approved!`);
    // Implement API call or remove from table
}

// Reject function
function rejectVehicle(index) {
    const vehicle = vehicles[index];
    alert(`Vehicle "${vehicle.make} ${vehicle.model}" rejected!`);
    // Implement API call or remove from table
}

// Initialize table on page load
window.onload = populateVehicleTable;
