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
function renderFeedback(ride) {
  const container = document.getElementById('feedbackContainer');

  container.innerHTML = `
    <h1 class="text-2xl font-bold text-center mb-1">Ratings and Reviews</h1>
    <p class="text-gray-500 text-center mb-6 text-sm">
      Rate your Ride!
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


    <!-- Rate Ride Section -->
    <div class="border rounded-xl p-4 mb-3 shadow-sm">
      <h3 class="font-semibold text-gray-700 mb-2">Rate Ride</h3>
      <div class="starRating flex flex-row-reverse justify-end space-x-1 space-x-reverse">
        <input type="radio" id="ride-star5" name="ride-rating-ride" value="5" class="hidden" />
        <label for="ride-star5" class="text-gray-300 text-2xl cursor-pointer">★</label>

        <input type="radio" id="ride-star4" name="ride-rating-ride" value="4" class="hidden" />
        <label for="ride-star4" class="text-gray-300 text-2xl cursor-pointer">★</label>

        <input type="radio" id="ride-star3" name="ride-rating-ride" value="3" class="hidden" />
        <label for="ride-star3" class="text-gray-300 text-2xl cursor-pointer">★</label>

        <input type="radio" id="ride-star2" name="ride-rating-ride" value="2" class="hidden" />
        <label for="ride-star2" class="text-gray-300 text-2xl cursor-pointer">★</label>

        <input type="radio" id="ride-star1" name="ride-rating-ride" value="1" class="hidden" />
        <label for="ride-star1" class="text-gray-300 text-2xl cursor-pointer">★</label>
      </div>
    </div>

    <!-- Rate Driver Section -->
    <div class="border rounded-xl p-4 mb-3 shadow-sm">
      <h3 class="font-semibold text-gray-700 mb-2">Rate Driver</h3>
      <div class="starRating flex flex-row-reverse justify-end space-x-1 space-x-reverse">
        <input type="radio" id="driver-star5" name="ride-rating-driver" value="5" class="hidden" />
        <label for="driver-star5" class="text-gray-300 text-2xl cursor-pointer">★</label>

        <input type="radio" id="driver-star4" name="ride-rating-driver" value="4" class="hidden" />
        <label for="driver-star4" class="text-gray-300 text-2xl cursor-pointer">★</label>

        <input type="radio" id="driver-star3" name="ride-rating-driver" value="3" class="hidden" />
        <label for="driver-star3" class="text-gray-300 text-2xl cursor-pointer">★</label>

        <input type="radio" id="driver-star2" name="ride-rating-driver" value="2" class="hidden" />
        <label for="driver-star2" class="text-gray-300 text-2xl cursor-pointer">★</label>

        <input type="radio" id="driver-star1" name="ride-rating-driver" value="1" class="hidden" />
        <label for="driver-star1" class="text-gray-300 text-2xl cursor-pointer">★</label>
      </div>
    </div>

    <!-- Comments Section -->
    <div class="border rounded-xl p-4 mb-6 shadow-sm">
      <h3 class="font-semibold text-gray-700 mb-2">Comments</h3>
      <textarea 
        placeholder="Share your experience..." 
        class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        rows="3"
      ></textarea>
    </div>

    <!-- Button -->
    <button id="submitButton" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition">
      Submit Rating
    </button>
  `;

  // Handle submit click
  const bookButton = document.getElementById('submitButton');
  bookButton.addEventListener('click', () => {
  });
}

renderFeedback(mockRide);
