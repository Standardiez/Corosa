// select-ride.js

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const destinationName = urlParams.get('destinationName');
const destinationAddress = urlParams.get('destinationAddress');
const pickupName = urlParams.get('pickupName');
const pickupAddress = urlParams.get('pickupAddress');

function showLocationDetails() {
    const container = document.getElementById('destination-filter');
    if (!container) return;

    // Clear 'hidden' class and existing content
    container.classList.remove('hidden');
    container.innerHTML = '';

    // Add destination card if we have destination info
    if (destinationName) {
        const destinationCard = document.createElement('div');
        destinationCard.className = 'bg-primary/10 border-2 border-primary rounded-lg p-3 mb-3';
        destinationCard.innerHTML = `
            <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3 flex-1">
                    <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg class="w-5 h-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="font-bold text-base text-foreground">${destinationName}</h3>
                            <span class="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">Destination</span>
                        </div>
                        <p class="text-xs text-muted-foreground">${destinationAddress}</p>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(destinationCard);
    }

    // Add pickup card if we have pickup info
    if (pickupName) {
        const pickupCard = document.createElement('div');
        pickupCard.className = 'bg-secondary/30 border border-secondary rounded-lg p-3';
        pickupCard.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg class="w-5 h-5 text-secondary-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="font-bold text-base text-foreground">${pickupName}</h3>
                        <span class="border border-border text-xs px-2 py-0.5 rounded-full">Pickup</span>
                    </div>
                    <p class="text-xs text-muted-foreground">${pickupAddress}</p>
                </div>
            </div>
        `;
        container.appendChild(pickupCard);
    }
}

// Initialize location details when the page loads
document.addEventListener('DOMContentLoaded', () => {
    showLocationDetails();
});