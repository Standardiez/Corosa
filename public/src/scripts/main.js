// Load API configuration
let apiLoaded = false;

// Application state (accessible globally)
const state = {
    rides: [],
    isLoading: false,
    error: null
};

// Make state globally accessible
window.state = state;

// Load API script dynamically
function loadAPIScript() {
    return new Promise((resolve, reject) => {
        if (apiLoaded) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = '../scripts/api-config.js';
        script.onload = () => {
            apiLoaded = true;
            resolve();
        };
        script.onerror = () => {
            reject(new Error('Failed to load API configuration'));
        };
        document.head.appendChild(script);
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    // Only initialize if rides-list element exists
    const ridesList = document.getElementById('rides-list');
    if (!ridesList) return;
    
    // Load API configuration
    await loadAPIScript();
    
    // Load rides from API
    await loadRides();
    
    // Setup search functionality
    const searchInput = document.querySelector('input[placeholder="Search rides..."], input[placeholder="Search destination..."]');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredRides = state.rides.filter(ride => 
                ride.driverName.toLowerCase().includes(searchTerm) ||
                ride.startLocation.name.toLowerCase().includes(searchTerm) ||
                ride.endLocation.name.toLowerCase().includes(searchTerm)
            );
            renderRides(filteredRides);
        });
    }
});

// Load rides from API
async function loadRides() {
    state.isLoading = true;
    state.error = null;
    
    try {
        // Show loading state
        const ridesList = document.getElementById('rides-list');
        if (ridesList) {
            ridesList.innerHTML = '<div class="text-center py-8"><p class="text-muted-foreground">Loading rides...</p></div>';
        }
        
        // Fetch rides from API
        const rides = await getAllTrips();
        state.rides = rides;
        
        // Render rides
        renderRides(rides);
        
        // Show message if no rides found
        if (rides.length === 0 && ridesList) {
            ridesList.innerHTML = '<div class="text-center py-8"><p class="text-muted-foreground">No rides available at the moment.</p></div>';
        }
    } catch (error) {
        console.error('Error loading rides:', error);
        state.error = error.message;
        
        // Show error message
        const ridesList = document.getElementById('rides-list');
        if (ridesList) {
            ridesList.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-500 mb-2">Failed to load rides</p>
                    <p class="text-sm text-muted-foreground">${error.message}</p>
                    <button onclick="loadRides()" class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                        Retry
                    </button>
                </div>
            `;
        }
    } finally {
        state.isLoading = false;
    }
}

// Handle ride request
function handleRequestRide(ride) {
    const params = new URLSearchParams({
        rideId: ride.id,
        driverName: ride.driverName,
        avatar: ride.avatar,
        carModel: ride.carModel,
        userType: ride.userType,
        startLocation: ride.startLocation.name,
        endLocation: ride.endLocation.name,
        time: ride.time,
        rating: ride.rating.toString()
    });
    window.location.href = `./request-ride.html?${params.toString()}`;
}

// Render rides list
function renderRides(rides) {
    const ridesList = document.getElementById('rides-list');
    if (!ridesList) return;

    // Clear existing content
    ridesList.innerHTML = '';
    
    // Show message if no rides
    if (rides.length === 0) {
        ridesList.innerHTML = '<div class="text-center py-8"><p class="text-muted-foreground">No rides available at the moment.</p></div>';
        return;
    }

    // Render each ride
    rides.forEach(ride => {
        const rideElement = document.createElement('div');
        rideElement.innerHTML = generateRideCard(ride);
        ridesList.appendChild(rideElement);

        // Add event listener to the request button
        const requestButton = rideElement.querySelector(`[data-ride-id="${ride.id}"]`);
        if (requestButton) {
            requestButton.addEventListener('click', () => handleRequestRide(ride));
        }
    });

    // Update map markers if map is initialized
    if (window.mapView) {
        window.mapView.addRideMarkers(rides);
    }
}

// Format rating stars
function formatRatingStars(rating) {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
}

// Generate ride card HTML
function generateRideCard(ride) {
    return `
        <div class="ride-card mb-4">
            <div class="ride-card__content">
                <div class="ride-card__header">
                    <div class="flex items-center gap-3">
                        <div class="ride-card__avatar">
                            <img src="${ride.avatar}" alt="${ride.driverName}" class="w-full h-full object-cover">
                        </div>
                        <div class="ride-card__info">
                            <h3 class="font-semibold text-lg">${ride.driverName}</h3>
                            <div class="flex items-center gap-2">
                                <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-secondary text-secondary-foreground">
                                    ${ride.userType === 'student' ? 'Student' : 'Employee'}
                                </span>
                                <div class="flex items-center gap-1 text-muted-foreground">
                                    <span class="text-xs">${ride.carModel}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        <span class="text-yellow-500">${formatRatingStars(ride.rating)}</span>
                        <span class="text-sm text-muted-foreground">${ride.rating}</span>
                    </div>
                </div>

                <div class="space-y-3 mt-3">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center flex-shrink-0">
                            <svg class="h-4 w-4 text-secondary-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm text-muted-foreground">Pickup Location</p>
                            <p class="font-medium truncate">${ride.startLocation.name}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <svg class="h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm text-muted-foreground">Destination</p>
                            <p class="font-medium truncate">${ride.endLocation.name}</p>
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-border/50 mt-3">
                    <div class="flex items-center gap-2">
                        <svg class="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span class="text-sm font-medium">
                            ${ride.seatsAvailable} ${ride.seatsAvailable === 1 ? 'seat' : 'seats'} left
                        </span>
                    </div>
                    <span class="text-sm text-muted-foreground">${ride.time}</span>
                </div>

                <button 
                    class="w-full mt-3 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                    data-ride-id="${ride.id}"
                >
                    Request Ride
                </button>
            </div>
        </div>
    `;
}