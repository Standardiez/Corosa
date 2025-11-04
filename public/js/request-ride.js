/*
  request-ride.js
  
  This script handles:
  1. Loading and displaying the route map between pickup and drop-off points
  2. Fetching and displaying available rides
  3. Handling ride request actions
*/

(function() {
    'use strict';

    // Google Maps API Key
    const GOOGLE_MAPS_API_KEY = 'AIzaSyBsoZUgOFGSg7oXvdgstZuduXjNPIp_S3k';

    let map, directionsService, directionsRenderer;
    let pickupLocation, dropoffLocation;

    // Load locations from session storage
    function loadLocations() {
        try {
            pickupLocation = {
                coords: JSON.parse(sessionStorage.getItem('pickupCoords')),
                address: sessionStorage.getItem('pickupLocation')
            };

            dropoffLocation = {
                coords: JSON.parse(sessionStorage.getItem('dropoffCoords')),
                address: sessionStorage.getItem('dropoffLocation')
            };

            // Update location displays
            const pickupEl = document.getElementById('pickup-location');
            const dropoffEl = document.getElementById('dropoff-location');

            if (pickupEl && pickupLocation && pickupLocation.address) {
                pickupEl.textContent = pickupLocation.address;
            }

            if (dropoffEl && dropoffLocation && dropoffLocation.address) {
                dropoffEl.textContent = dropoffLocation.address;
            }

            // Redirect if coordinates aren't set
            if (!pickupLocation || !pickupLocation.coords || !dropoffLocation || !dropoffLocation.coords) {
                alert('Please select pickup and drop-off locations first');
                window.location.href = 'select-pickup.html';
            }
        } catch (error) {
            console.error('Error loading locations:', error);
            alert('Please select pickup and drop-off locations first');
            window.location.href = 'select-pickup.html';
        }
    }

    // Initialize map and route display
    window.initMap = function() {
        const mapEl = document.getElementById('map');
        if (!mapEl) return;

        // Create the map
        map = new google.maps.Map(mapEl, {
            zoom: 13,
            center: pickupLocation.coords,
            mapTypeControl: false,
            streetViewControl: false
        });

        // Initialize the directions service and renderer
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true, // We'll add custom markers
            polylineOptions: {
                strokeColor: '#FF0000',
                strokeWeight: 4
            }
        });

        // Add custom markers for pickup and dropoff
        new google.maps.Marker({
            position: pickupLocation.coords,
            map: map,
            title: 'Pickup Location',
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#FF0000',
                fillOpacity: 1,
                strokeWeight: 0,
                scale: 8
            }
        });

        new google.maps.Marker({
            position: dropoffLocation.coords,
            map: map,
            title: 'Drop-off Location',
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#FF0000',
                fillOpacity: 1,
                strokeWeight: 0,
                scale: 8
            }
        });

        // Calculate and display route
        directionsService.route({
            origin: pickupLocation.coords,
            destination: dropoffLocation.coords,
            travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
            } else {
                console.error('Directions request failed:', status);
            }
        });
    };

    // Example available rides data - Replace with actual API call
    const availableRides = [
        {
            id: 1,
            driver: {
                firstName: 'Juan',
                lastName: 'Dela Cruz',
                employmentStatus: 'SLU Faculty'
            },
            vehicle: {
                model: 'Toyota Vios',
                year: '2020',
                availableSeats: 3,
                totalCapacity: 4
            }
        },
        {
            id: 2,
            driver: {
                firstName: 'Maria',
                lastName: 'Santos',
                employmentStatus: 'SLU Staff'
            },
            vehicle: {
                model: 'Honda City',
                year: '2021',
                availableSeats: 2,
                totalCapacity: 4
            }
        }
        // Add more sample rides as needed
    ];

    // Create DOM element for a ride card
    function createRideCard(ride) {
        const card = document.createElement('div');
        card.className = 'ride-card';

        const avatar = document.createElement('div');
        avatar.className = 'driver-avatar';
        avatar.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 8h-16v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2z" fill="currentColor"/>
            </svg>`;

        const meta = document.createElement('div');
        meta.className = 'ride-meta';
        meta.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:var(--spacing-md);">
                <div>
                    <div style="font-weight:700">${ride.driver.firstName} ${ride.driver.lastName}</div>
                    <div class="employment-status">${ride.driver.employmentStatus}</div>
                </div>
            </div>
            <div class="vehicle-row" style="margin-top:var(--spacing-sm);">
                <div>${ride.vehicle.model} ${ride.vehicle.year}</div>
                <div style="width:1px; height:16px; background:var(--color-border);"></div>
                <div class="capacity"><span>${ride.vehicle.availableSeats}/${ride.vehicle.totalCapacity}</span> seats</div>
            </div>`;

        const actionCol = document.createElement('div');
        actionCol.className = 'request-col';
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.textContent = 'Request Ride';
        btn.addEventListener('click', () => requestRide(ride.id));
        actionCol.appendChild(btn);

        card.appendChild(avatar);
        card.appendChild(meta);
        card.appendChild(actionCol);

        return card;
    }

    // Display available rides
    function displayAvailableRides() {
        const container = document.getElementById('ride-list');
        if (!container) return;

        container.innerHTML = '';
        availableRides.forEach(ride => {
            const card = createRideCard(ride);
            container.appendChild(card);
        });
    }

    // Handle ride request
    window.requestRide = function(rideId) {
        // TODO: Implement actual ride request logic
        alert(`Requesting ride ${rideId}. This feature will be implemented soon.`);
    };

    // Initialize everything when the page loads
    function initialize() {
        loadLocations();
        
        // Load Google Maps
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        // Display available rides
        displayAvailableRides();
    }

    // Start loading after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();