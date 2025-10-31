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

// Render the Report Issue layout
function renderReportIssue(ride) {
  const container = document.getElementById('reportIssueContainer');

  container.innerHTML = `
    <h1 class="text-2xl font-bold text-center mb-1">What Happened</h1>
    <p class="text-gray-500 text-center mb-6 text-sm">
      Tell us more about the issue
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

    <!-- Issue Details -->
    <div class="border rounded-xl p-4 mb-3">
      <h3 class="font-semibold text-gray-700 mb-1">Issue Details</h3>
      <textarea 
        placeholder="Share your experience..." 
        class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        rows="3"
      ></textarea>
    </div>

    <!-- Button -->
    
    <div class="flex gap-3">
    <button id="backButton" class="w-full bg-gray-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition">
      Back
    </button>
    <button id="submitButton" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition">
      Submit Report
    </button>
  `;
}

renderReportIssue(mockRide);
