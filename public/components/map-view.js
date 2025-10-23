class MapView {
    constructor(containerId) {
        this.mapContainer = document.getElementById(containerId);
        this.map = null;
        this.markers = [];
        this.initializeMap();
    }

    async initializeMap() {
        // Try to get token from localStorage
        const mapboxToken = localStorage.getItem('mapbox-token');
        
        if (!mapboxToken) {
            this.showTokenPrompt();
            return;
        }

        mapboxgl.accessToken = mapboxToken;
        
        this.map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [-0.1278, 51.5074], // Default to London
            zoom: 12
        });

        this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    showTokenPrompt() {
        this.mapContainer.innerHTML = `
            <div class="h-full w-full flex items-center justify-center bg-muted/30 rounded-lg p-8">
                <div class="text-center space-y-4 max-w-md">
                    <h3 class="text-lg font-semibold">Mapbox Token Required</h3>
                    <p class="text-sm text-muted-foreground">
                        To display the map, please enter your Mapbox public token. Get one for free at 
                        <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
                            mapbox.com
                        </a>
                    </p>
                    <div class="flex gap-2">
                        <input type="text" id="mapbox-token-input" placeholder="Enter Mapbox token" 
                               class="pl-9 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <button onclick="window.mapView.setMapboxToken()" class="px-4 py-2 bg-primary text-white rounded-md">
                            Load Map
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setMapboxToken() {
        const tokenInput = document.getElementById('mapbox-token-input');
        const token = tokenInput.value.trim();
        
        if (token) {
            localStorage.setItem('mapbox-token', token);
            this.initializeMap();
        }
    }

    addRideMarkers(rides) {
        this.clearMarkers();

        if (!this.map) return;

        rides.forEach(ride => {
            // Start location marker
            const startEl = document.createElement('div');
            startEl.className = 'map-marker map-marker--start';
            startEl.textContent = 'S';
            
            const startMarker = new mapboxgl.Marker(startEl)
                .setLngLat([ride.startLocation.lng, ride.startLocation.lat])
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`<div class="p-2"><strong>Start:</strong> ${ride.startLocation.name}</div>`)
                )
                .addTo(this.map);
            
            // End location marker
            const endEl = document.createElement('div');
            endEl.className = 'map-marker map-marker--end';
            endEl.textContent = 'U';
            
            const endMarker = new mapboxgl.Marker(endEl)
                .setLngLat([ride.endLocation.lng, ride.endLocation.lat])
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`<div class="p-2"><strong>End:</strong> ${ride.endLocation.name}</div>`)
                )
                .addTo(this.map);

            this.markers.push(startMarker, endMarker);
        });
    }

    clearMarkers() {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
    }
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mapView = new MapView('map');
});