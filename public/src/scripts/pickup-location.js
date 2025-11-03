// Pickup locations data
const pickupLocations = [
    {
        id: "downtown",
        name: "Downtown Apartments",
        address: "123 Main Street",
    },
    {
        id: "westside",
        name: "Westside Residences",
        address: "456 West Avenue",
    },
    {
        id: "northquarter",
        name: "North Quarter",
        address: "789 North Boulevard",
    },
    {
        id: "eastvillage",
        name: "East Village",
        address: "321 East Road",
    },
    {
        id: "southpark",
        name: "South Park Area",
        address: "654 South Lane",
    }
];

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const destinationId = urlParams.get('destination');
const destinationName = urlParams.get('name');
const destinationAddress = urlParams.get('address');

function showDestinationInfo() {
    const destinationInfo = document.getElementById('destination-info');
    if (destinationName && destinationInfo) {
        destinationInfo.innerHTML = `
            <p class="text-sm text-muted-foreground mb-1">Going to:</p>
            <div class="flex items-center gap-2">
                <h3 class="font-semibold text-lg">${destinationName}</h3>
                <span class="badge bg-secondary text-secondary-foreground">Destination</span>
            </div>
            <p class="text-sm text-muted-foreground mt-1">${destinationAddress}</p>
        `;
    } else {
        destinationInfo.style.display = 'none';
    }
}

function renderPickupLocations() {
    const container = document.getElementById('pickup-locations');
    if (!container) return;

    pickupLocations.forEach(location => {
        const card = document.createElement('div');
        card.className = 'ride-card p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.dataset.id = location.id;

        card.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg class="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>
                    <div>
                        <h3 class="font-semibold text-lg">${location.name}</h3>
                        <p class="text-sm text-muted-foreground">${location.address}</p>
                    </div>
                </div>
                <svg class="w-5 h-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"></path>
                </svg>
            </div>
        `;

        // Handle click and keyboard events
        card.addEventListener('click', () => handlePickupSelect(location.id));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePickupSelect(location.id);
            }
        });

        container.appendChild(card);
    });
}

function handlePickupSelect(pickupId) {
    // Add visual selection feedback
    document.querySelectorAll('.ride-card').forEach(el => {
        el.classList.remove('border-primary', 'bg-primary/5');
    });
    const selectedCard = document.querySelector(`.ride-card[data-id="${pickupId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('border-primary', 'bg-primary/5');
    }

    const pickup = pickupLocations.find(p => p.id === pickupId);

    // Navigate to dashboard with both destination and pickup params
    setTimeout(() => {
        const params = new URLSearchParams({
            destination: destinationId || '',
            destinationName: destinationName || '',
            destinationAddress: destinationAddress || '',
            pickup: pickupId,
            pickupName: pickup?.name || '',
            pickupAddress: pickup?.address || ''
        });
        window.location.href = `select-ride.html?${params.toString()}`;
    }, 300);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    showDestinationInfo();
    renderPickupLocations();

    // Handle back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => window.history.back());
    }
});