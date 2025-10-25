const mockRide = {
  driverName: 'Sarah Johnson',
  userType: 'Student',
  carModel: 'Toyota Camry',
  rating: 4.8,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  pickupLocation: 'Downtown Apartments',
  destination: 'University Campus',
  seatsAvailable: 3,
  time: 'Today, 8:30 AM'
};

let currentStep = 1;

const statusTitles = [
  "Waiting for Confirmation",
  "Driver on the Way",
  "Passenger Pick-Up",
  "On the Way to Destination",
  "Arrived at Destination"
];

function renderRideDetails(ride) {
  document.querySelector("#driverName").textContent = ride.driverName;
  document.querySelector("#driverDetails").textContent = `${ride.userType} • ${ride.carModel}`;
  document.querySelector("#driverRating").textContent = `★ ${ride.rating}`;
  document.querySelector("#driverAvatar").src = ride.avatar;
  document.querySelector("#pickupLocation").textContent = ride.pickupLocation;
  document.querySelector("#destinationLocation").textContent = ride.destination;
}

function updateRideProgress() {
  document.getElementById("rideTitle").textContent = statusTitles[currentStep - 1];

  for (let i = 1; i <= 5; i++) {
    const circle = document.getElementById(`step${i}`);
    if (i < currentStep) {
      circle.style.backgroundColor = "green";
    } else if (i === currentStep) {
      circle.style.backgroundColor = "yellow";
    } else {
      circle.style.backgroundColor = "lightgray";
    }
  }
}

renderRideDetails(mockRide);
updateRideProgress();
