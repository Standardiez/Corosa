/*
  select-dropoff.js

  This script extends select-pickup.js functionality to include:
  1. Display of the previously selected pickup location
  2. Google Maps initialization for drop-off point selection
  3. Coordinate and location name display for the selected drop-off point
*/

(function () {
    'use strict';

    // Default center for Baguio City
    const DEFAULT_CENTER = { lat: 16.4023, lng: 120.5960 };

    // Google Maps API Key
    const GOOGLE_MAPS_API_KEY = 'AIzaSyBsoZUgOFGSg7oXvdgstZuduXjNPIp_S3k';

    // Helper: format coordinates
    function fmtLatLng(latLng) {
        return latLng.lat.toFixed(6) + ', ' + latLng.lng.toFixed(6);
    }

    // Load pickup location from URL parameters or sessionStorage
    function loadPickupLocation() {
        const params = new URLSearchParams(window.location.search);
        const pickupEl = document.getElementById('pickup-location');

        // Try to get location from URL parameters first
        let pickupLocation = params.get('pickup');
        let pickupCoords = params.get('coords');

        // Fallback to sessionStorage if not in URL
        if (!pickupLocation) {
            pickupLocation = sessionStorage.getItem('pickupLocation');
            pickupCoords = sessionStorage.getItem('pickupCoords');
        }

        if (pickupEl) {
            if (pickupLocation) {
                pickupEl.textContent = pickupLocation;
            } else {
                pickupEl.textContent = 'No pickup location selected';
                // Optionally redirect back to pickup selection
                // window.location.href = 'select-pickup.html';
            }
        }

        // Return coordinates for map centering
        if (pickupCoords) {
            try {
                return JSON.parse(pickupCoords);
            } catch (e) {
                console.error('Invalid pickup coordinates:', e);
            }
        }
        return null;
    }

    // Write coordinate and location readout
    function setSelectedLocationInfo(coords, address = '') {
        const el = document.getElementById('selected-coords');
        const nextBtn = document.getElementById('next-btn');

        if (el) {
            const coordsText = fmtLatLng(coords);
            el.textContent = address ? `${address} (${coordsText})` : coordsText;
        }

        // Enable the next button when we have coordinates
        if (nextBtn) {
            nextBtn.disabled = false;
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

    // Initialize map once API is loaded
    window.initMap = function () {
        const mapEl = document.getElementById('map');
        if (!mapEl) return;

        // Get pickup location coordinates or use default
        const pickupCoords = loadPickupLocation() || DEFAULT_CENTER;

        // Create map centered on pickup location
        const map = new google.maps.Map(mapEl, {
            center: pickupCoords,
            zoom: 14,
            mapTypeControl: false,
            streetViewControl: false,
        });

        // Create a draggable marker in the center
        const marker = new google.maps.Marker({
            position: DEFAULT_CENTER,
            map: map,
            draggable: true,
            title: 'Drag to choose drop-off point'
        });

        // Create a marker for pickup location (non-draggable)
        new google.maps.Marker({
            position: pickupCoords,
            map: map,
            draggable: false,
            title: 'Pickup location',
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#FF0000',
                fillOpacity: 1,
                strokeWeight: 0,
                scale: 8
            }
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
    };

    // Dynamically load Google Maps JS API
    function loadGoogleMaps() {
        if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
            // Show hint to developer in the map element
            const mapEl = document.getElementById('map');
            if (mapEl) {
                mapEl.textContent = 'Google Maps API key not configured. Replace YOUR_API_KEY_HERE in public/js/select-dropoff.js.';
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

    // Setup back button handler
    function setupBackButton() {
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                // Navigate back to pickup selection
                window.location.href = 'select-pickup.html';
            });
        }
    }

    // Start loading after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadGoogleMaps();
            setupBackButton();
        });
    } else {
        loadGoogleMaps();
        setupBackButton();
    }

})();