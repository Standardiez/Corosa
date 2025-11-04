// map-dialog.js - Shared map dialog functionality
let mapDialog;
let mapInstance;
let selectedLocation = null;

function openMapDialog() {
    mapDialog = document.getElementById('map-dialog');
    mapDialog.classList.remove('hidden');

    // Initialize map if not already done
    if (!mapInstance) {
        mapInstance = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 16.4023, lng: 120.5960 }, // Baguio City, Philippines
            zoom: 14,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
        });

        // Add click listener for dropping pin
        mapInstance.addListener('click', (e) => {
            dropPin(e.latLng);
        });
    }
}

function closeMapDialog() {
    if (mapDialog) {
        mapDialog.classList.add('hidden');
    }
}

async function dropPin(latLng) {
    // Clear existing marker if any
    if (selectedLocation && selectedLocation.marker) {
        selectedLocation.marker.setMap(null);
    }

    // Create new marker
    const marker = new google.maps.Marker({
        position: latLng,
        map: mapInstance,
        draggable: true,
        animation: google.maps.Animation.DROP
    });

    // Store selected location
    selectedLocation = {
        marker: marker,
        lat: latLng.lat(),
        lng: latLng.lng()
    };

    // Get address for the selected location
    const geocoder = new google.maps.Geocoder();
    try {
        const result = await new Promise((resolve, reject) => {
            geocoder.geocode({ location: latLng }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    resolve(results[0]);
                } else {
                    reject(new Error('Geocoding failed'));
                }
            });
        });

        // Store both formatted address and place name
        selectedLocation.address = result.formatted_address;
        selectedLocation.name = result.address_components.find(
            component => component.types.includes('sublocality') ||
                        component.types.includes('locality') ||
                        component.types.includes('neighborhood')
        )?.long_name || 'Custom Location';

        // Enable confirm button and update it with location name
        const confirmBtn = document.getElementById('confirm-location-btn');
        confirmBtn.disabled = false;
        confirmBtn.textContent = `Confirm: ${selectedLocation.name}`;
    } catch (error) {
        console.error('Error getting address:', error);
        selectedLocation.address = 'Location address not available';
        selectedLocation.name = 'Custom Location';
    }
}

function confirmLocation() {
    if (!selectedLocation) return;

    // Create a custom event with the location data
    const event = new CustomEvent('locationSelected', {
        detail: {
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            address: selectedLocation.address || 'Location address not available',
            name: selectedLocation.name || 'Custom Location'
        }
    });

    // Dispatch the event
    document.dispatchEvent(event);

    // Reset confirm button
    const confirmBtn = document.getElementById('confirm-location-btn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Confirm Location';

    // Close the dialog
    closeMapDialog();
}