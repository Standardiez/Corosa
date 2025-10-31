// Mock ride data
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

// Render the Ride Details layout
function renderRideDetails(ride) {
  const container = document.getElementById('rideDetailsContainer');

  container.innerHTML = `
    <h1 class="text-2xl font-bold text-center mb-1">Ride Details</h1>
    <p class="text-gray-500 text-center mb-6 text-sm">
      Here's information about your ride.
    </p>

    <!-- Driver Information -->
    <div class="border rounded-xl p-4 mb-4 flex items-center gap-4">
      <img src="${ride.avatar}" alt="Driver Avatar" class="w-16 h-16 rounded-full">
      <div>
        <h2 class="font-semibold text-lg">${ride.driverName}</h2>
        <p class="text-gray-500 text-sm">${ride.userType} • ${ride.carModel}</p>
        <p class="text-red-600 text-sm font-semibold">★ ${ride.rating}</p>
      </div>
    </div>

    <!-- Route Details -->
    <div class="border rounded-xl p-4 mb-3">
      <h3 class="font-semibold text-gray-700 mb-1">Route Details</h3>
      <p><strong>Pickup:</strong> ${ride.pickupLocation}</p>
      <p><strong>Destination:</strong> ${ride.destination}</p>
    </div>

    <!-- Payment Method -->
    <div class="border rounded-xl p-4 mb-3">
      <h3 class="font-semibold text-gray-700 mb-2">Payment Method</h3>
      <p class="text-gray-800 font-semibold">Cash</p>
    </div>

    <!-- Add a Tip -->
    <div class="border rounded-xl p-4 mb-3">
      <h3 class="font-semibold text-gray-700 mb-2">Add a Tip?</h3>
      <p class="text-gray-800 font-semibold">₱10</p>
    </div>

    <!-- Fare -->
    <div class="border rounded-xl p-4 mb-6">
      <h3 class="font-semibold text-gray-700 mb-1">Fare</h3>
      <p class="text-gray-800 font-semibold">₱150</p>
    </div>

    <!-- Buttons -->
    <div class="flex gap-3">
    <button id="reportButton" class="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition">
      Report an issue
    </button>
    <button id="backButton" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition">
      Back
    </button>
  `;
}

renderRideDetails(mockRide);
