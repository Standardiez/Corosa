class MapView {
    constructor(containerId) {
        this.mapContainer = document.getElementById(containerId);
        this.map = null;
        this.markers = [];
        // Use dynamic loader: try local file or localStorage, otherwise prompt
        this.ensureGoogleMaps();
    }

    async ensureGoogleMaps() {
        try {
            // Try to read from local file first
            const response = await fetch('/src/assets/google-maps-key.txt');
            if (response.ok) {
                const key = await response.text();
                if (key.trim()) {
                    await this.loadGoogleMapsScript(key.trim(), () => this.initializeMap());
                    return;
                }
            }
        } catch (e) {
            console.log('No key file found, checking localStorage...');
        }

        // Try localStorage next
        try {
            const key = localStorage.getItem('google-maps-key');
            if (key) {
                await this.loadGoogleMapsScript(key, () => this.initializeMap());
                return;
            }
        } catch (e) {
            console.log('No key in localStorage, showing prompt...');
        }

        // If no key found, show the prompt
        this.showKeyPrompt();
    }

    async initializeMap() {
        // Default center (London)
        const defaultCenter = { lat: 51.5074, lng: -0.1278 };

        this.map = new google.maps.Map(this.mapContainer, {
            center: defaultCenter,
            zoom: 12,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
        });
    }

    showKeyPrompt() {
        this.mapContainer.innerHTML = `
            <div class="h-full w-full flex items-center justify-center bg-muted/30 rounded-lg p-8">
                <div class="text-center space-y-4 max-w-md">
                    <h3 class="text-lg font-semibold">Google Maps API Key Required</h3>
                    <p class="text-sm text-muted-foreground">
                        To display the map, please add a key to <code>src/assets/google-maps-key.txt</code> (gitignored),
                        or paste your key here to store locally for this machine.
                    </p>
                    <div class="flex gap-2">
                        <input type="text" id="google-maps-key-input" placeholder="Enter Google Maps API key"
                               class="pl-9 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <button id="google-maps-key-save" class="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
                            Load Map
                        </button>
                    </div>
                    <p class="text-xs text-muted-foreground">Tip: create <code>src/assets/google-maps-key.txt</code> with the key to avoid this prompt.</p>
                </div>
            </div>
        `;

        // Wire up the button after DOM insertion
        setTimeout(() => {
            const btn = document.getElementById('google-maps-key-save');
            if (btn) btn.addEventListener('click', () => this.setGoogleMapsKey());
        }, 0);
    }

    async setGoogleMapsKey() {
        const keyInput = document.getElementById('google-maps-key-input');
        if (!keyInput) return;
        const key = keyInput.value.trim();
        if (!key) return;

        try { localStorage.setItem('google-maps-key', key); } catch (e) {}

        try {
            await this.loadGoogleMapsScript(key, () => this.initializeMap());
        } catch (e) {
            this.mapContainer.querySelector('.text-sm').textContent = 'Failed to load Google Maps with the provided key. Check the key and network.';
        }
    }

    loadGoogleMapsScript(key, onReady) {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) { onReady(); resolve(); return; }
            const cbName = '__uniride_init_map_' + Date.now();
            window[cbName] = () => { try { delete window[cbName]; } catch(_) {} ; onReady(); resolve(); };
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&callback=${cbName}`;
            script.async = true; script.defer = true;
            script.onerror = () => { try { delete window[cbName]; } catch(_) {} ; reject(new Error('Failed to load Google Maps script')); };
            document.head.appendChild(script);
        });
    }

    addRideMarkers(rides) {
        this.clearMarkers();

        if (!this.map) return;

        rides.forEach(ride => {
            // Start location marker
            const startMarker = new google.maps.Marker({
                position: { lat: ride.startLocation.lat, lng: ride.startLocation.lng },
                map: this.map,
                title: ride.startLocation.name,
                label: 'S',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: (function(){ const v = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(); return v ? `hsl(${v})` : '#ef4444'; })(),
                    fillOpacity: 1,
                    strokeWeight: 0,
                    scale: 10
                }
            });

            const startInfoWindow = new google.maps.InfoWindow({
                content: `<div class="p-2"><strong>Start:</strong> ${ride.startLocation.name}</div>`
            });

            startMarker.addListener('click', () => {
                startInfoWindow.open(this.map, startMarker);
            });

            // End location marker
            const endMarker = new google.maps.Marker({
                position: { lat: ride.endLocation.lat, lng: ride.endLocation.lng },
                map: this.map,
                title: ride.endLocation.name,
                label: 'U',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: (function(){ const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(); return v ? `hsl(${v})` : '#0ea5a4'; })(),
                    fillOpacity: 1,
                    strokeWeight: 0,
                    scale: 10
                }
            });

            const endInfoWindow = new google.maps.InfoWindow({
                content: `<div class="p-2"><strong>End:</strong> ${ride.endLocation.name}</div>`
            });

            endMarker.addListener('click', () => {
                endInfoWindow.open(this.map, endMarker);
            });

            this.markers.push(startMarker, endMarker);

            // Draw route line between markers
            const routePath = new google.maps.Polyline({
                path: [
                    { lat: ride.startLocation.lat, lng: ride.startLocation.lng },
                    { lat: ride.endLocation.lat, lng: ride.endLocation.lng }
                ],
                geodesic: true,
                strokeColor: (function(){ const v = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(); return v ? `hsl(${v})` : '#ef4444'; })(),
                strokeOpacity: 0.5,
                strokeWeight: 2
            });

            routePath.setMap(this.map);
            this.markers.push(routePath);
        });
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            if (marker instanceof google.maps.Polyline) {
                marker.setMap(null);
            } else {
                marker.setMap(null);
            }
        });
        this.markers = [];
    }
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mapView = new MapView('map');
});