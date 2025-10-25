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

// Render the Confirm Ride layout
function renderConfirmRide(ride) {
  const container = document.getElementById('confirmRideContainer');

  container.innerHTML = `
    <h1 class="text-2xl font-bold text-center mb-1">Confirm Your Ride</h1>
    <p class="text-gray-500 text-center mb-6 text-sm">
      Make sure information is correct before booking
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
      <select id="paymentMethod" class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500">
        <option value="" disabled selected>Select a method</option>
        <option value="cash">Cash</option>
        <option value="gcash">GCash</option>
        <option value="card">Card</option>
      </select>
    </div>

    <!-- Add a Tip -->
    <div class="border rounded-xl p-4 mb-3">
      <h3 class="font-semibold text-gray-700 mb-2">Add a Tip?</h3>
      <input 
        type="number" 
        id="tipAmount" 
        placeholder="Enter tip amount (optional)" 
        class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
      />
    </div>

    <!-- Fare -->
    <div class="border rounded-xl p-4 mb-6">
      <h3 class="font-semibold text-gray-700 mb-1">Fare</h3>
      <p class="text-gray-800 font-semibold">₱150</p>
    </div>

    <!-- Button -->
    <button id="bookButton" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition">
      Book Carosa
    </button>
  `;

  // Handle booking click
  const bookButton = document.getElementById('bookButton');
  bookButton.addEventListener('click', () => {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const tipAmount = document.getElementById('tipAmount').value;

    if (!paymentMethod) {
      alert('Please select a payment method before booking.');
      return;
    }

    alert(`✅ Ride confirmed!\n\nPayment: ${paymentMethod.toUpperCase()}\nTip: ₱${tipAmount || 0}`);
  });
}

renderConfirmRide(mockRide);
