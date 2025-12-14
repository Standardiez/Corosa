/*
  select-pickup.js

  This script dynamically loads the Google Maps JavaScript API and initializes a map
  centered on Baguio City by default. It places a draggable marker (pin) the user can
  move to choose a pickup location. The selected coordinates are displayed in the UI.

  Integration notes:
  - Replace `YOUR_API_KEY_HERE` with a valid Google Maps JavaScript API key.
  - Ensure the key has the Maps JavaScript API enabled in the Google Cloud Console.
  - This script uses the DOM API (createElement, appendChild, textContent) to inject the map.

  Behavior:
  - Default center: Baguio City (lat: 16.4023, lng: 120.5960)
  - Click on the map to move the marker to that location.
  - Drag the marker to fine-tune the pickup point.
  - Selected coords are shown in the small readout with id `selected-coords`.

*/

(function () {
    'use strict';

    // Default center for Baguio City
    const DEFAULT_CENTER = { lat: 16.4023, lng: 120.5960 };

    // Change this to true and set your key here to auto-load a real map.
    // For security, DO NOT commit real API keys to source control. Use environment configs
    // or instruct the backend/devops to inject the key during deployment.
    const GOOGLE_MAPS_API_KEY = 'AIzaSyBsoZUgOFGSg7oXvdgstZuduXjNPIp_S3k';

    // Helper: format coordinates
    function fmtLatLng(latLng) {
        return latLng.lat.toFixed(6) + ', ' + latLng.lng.toFixed(6);
    }

    // Store the current selected location and coordinates
    let currentLocation = {
        address: '',
        coords: null
    };

    // Write coordinate and location readout
    function setSelectedLocationInfo(coords, address = '') {
        const el = document.getElementById('selected-coords');
        const nextBtn = document.getElementById('next-btn');

        if (el) {
            const coordsText = fmtLatLng(coords);
            el.textContent = address ? `${address} (${coordsText})` : coordsText;

            // Store the current selection
            currentLocation.address = address || coordsText;
            currentLocation.coords = coords;
        }

        // Enable the next button when we have coordinates
        if (nextBtn) {
            nextBtn.disabled = false;
        }
    }

    // Handle next button click
    function setupNextButton() {
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                if (currentLocation.coords) {
                    // Get flow intent from sessionStorage
                    const flowIntent = sessionStorage.getItem('flowIntent') || 'passenger';
                    
                    // Store location based on flow intent
                    if (flowIntent === 'driver') {
                        sessionStorage.setItem('driverPickupLocation', currentLocation.address);
                        sessionStorage.setItem('driverPickupCoords', JSON.stringify(currentLocation.coords));
                    } else {
                        sessionStorage.setItem('pickupLocation', currentLocation.address);
                        sessionStorage.setItem('pickupCoords', JSON.stringify(currentLocation.coords));
                    }

                    // Navigate to drop-off page (same for both roles)
                    window.location.href = '../pages/select-dropoff.html';
                }
            });
        }
    }

    // Get location details using reverse geocoding
    async function getLocationDetails(latLng) {
        const geocoder = new google.maps.Geocoder();
        try {
            const response = await geocoder.geocode({ location: latLng });
            if (response.results[0]) {
                // Try to find the most relevant place name
                const result = response.results[0];
                let locationName = '';

                // First try to find a point of interest or establishment
                const poi = result.address_components.find(component =>
                    component.types.includes('point_of_interest') ||
                    component.types.includes('establishment')
                );

                if (poi) {
                    locationName = poi.long_name;
                } else {
                    // If no POI, try to construct an address from street + sublocality
                    const street = result.address_components.find(component =>
                        component.types.includes('route')
                    );
                    const area = result.address_components.find(component =>
                        component.types.includes('sublocality') ||
                        component.types.includes('neighborhood')
                    );

                    if (street && area) {
                        locationName = `${street.long_name}, ${area.long_name}`;
                    } else if (street) {
                        locationName = street.long_name;
                    } else if (area) {
                        locationName = area.long_name;
                    } else {
                        // Fallback to formatted address, but try to keep it concise
                        locationName = result.formatted_address.split(',').slice(0, 2).join(',');
                    }
                }
                return locationName;
            }
        } catch (error) {
            console.error('Geocoding failed:', error);
        }
        return '';
    }

    // Get user's current location
    async function getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                position => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                error => {
                    console.warn('Error getting location:', error.message);
                    resolve(DEFAULT_CENTER); // Fallback to default center
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    }

    // Initialize map once API is loaded
    window.initMap = async function () {
        const mapEl = document.getElementById('map');
        if (!mapEl) return;

        // Try to get user's location first
        const initialCenter = await getCurrentLocation();

        // Create map
        const map = new google.maps.Map(mapEl, {
            center: initialCenter,
            zoom: 16, // Closer zoom for current location
            mapTypeControl: false,
            streetViewControl: false,
        });

        // Create a draggable marker at the initial center
        const marker = new google.maps.Marker({
            position: initialCenter,
            map: map,
            draggable: true,
            title: 'Drag to choose pickup point',
            animation: google.maps.Animation.DROP // Add a drop animation
        });

        // Update readout initially
        const initialPos = marker.getPosition().toJSON();
        getLocationDetails(initialPos).then(address => {
            setSelectedLocationInfo(initialPos, address);
        });

        // When marker is dragged, update readout
        marker.addListener('dragend', async function () {
            const pos = marker.getPosition().toJSON();
            const address = await getLocationDetails(pos);
            setSelectedLocationInfo(pos, address);
        });

        // When map is clicked, move marker and update readout
        map.addListener('click', async function (e) {
            const latLng = e.latLng.toJSON();
            marker.setPosition(latLng);
            const address = await getLocationDetails(latLng);
            setSelectedLocationInfo(latLng, address);
        });

        // Setup location button
        const locationBtn = document.getElementById('location-btn');
        if (locationBtn) {
            locationBtn.addEventListener('click', async function() {
                try {
                    const position = await getCurrentLocation();
                    map.panTo(position);
                    map.setZoom(18); // Zoom in closer when using current location
                    marker.setPosition(position);
                    const address = await getLocationDetails(position);
                    setSelectedLocationInfo(position, address);
                    marker.setAnimation(google.maps.Animation.DROP);
                } catch (error) {
                    alert('Could not get your location. Please make sure location services are enabled.');
                }
            });
        }
    };

    // Dynamically load Google Maps JS API
    function loadGoogleMaps() {
        if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
            // Show hint to developer in the map element
            const mapEl = document.getElementById('map');
            if (mapEl) {
                mapEl.textContent = 'Google Maps API key not configured. Replace YOUR_API_KEY_HERE in public/js/select-pickup.js.';
            }
            return;
        }

        // Build URL with callback to initMap
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=geocoding&callback=initMap`;
        script.async = true;
        script.defer = true;
        script.onerror = function () {
            const mapEl = document.getElementById('map');
            if (mapEl) mapEl.textContent = 'Failed to load Google Maps. Check your API key and network.';
        };
        document.head.appendChild(script);
    }

    // Start loading after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadGoogleMaps();
            setupNextButton();
        });
    } else {
        loadGoogleMaps();
        setupNextButton();
    }

})();
