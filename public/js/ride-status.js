 (function(){
    'use strict';

    // simple helpers
    function fmtLatLng(latLng){ return latLng.lat.toFixed(6) + ', ' + latLng.lng.toFixed(6); }

    function loadData(){
        try{
            const pickupCoords = JSON.parse(sessionStorage.getItem('pickupCoords'));
            const pickupAddress = sessionStorage.getItem('pickupLocation');
            const dropoffCoords = JSON.parse(sessionStorage.getItem('dropoffCoords'));
            const dropoffAddress = sessionStorage.getItem('dropoffLocation');
            const selectedRide = JSON.parse(sessionStorage.getItem('selectedRide'));

            if(!pickupCoords || !dropoffCoords || !selectedRide){
                alert('Missing trip or ride data. Please start again.');
                window.location.href = 'select-pickup.html';
                return null;
            }

            return {pickupCoords,pickupAddress,dropoffCoords,dropoffAddress,selectedRide};
        }catch(e){
            console.error('Error reading session data',e);
            alert('Missing trip or ride data. Please start again.');
            window.location.href = 'select-pickup.html';
            return null;
        }
    }

    // UI helpers
    function setStage(n){
        const total = 3;
        for(let i=1;i<=total;i++){
            const el = document.getElementById('stage-'+i);
            el.classList.remove('active','done','pending');
            if(i < n) el.classList.add('done');
            else if(i === n) el.classList.add('active');
            else el.classList.add('pending');
        }
    }

    // Map & simulation: driver approaches pickup, then goes to dropoff
    window.initMap = function(){
        const data = loadData();
        if(!data) return;
        const {pickupCoords,pickupAddress,dropoffCoords,dropoffAddress,selectedRide} = data;

        document.getElementById('pickup-location').textContent = pickupAddress || fmtLatLng(pickupCoords);
        document.getElementById('dropoff-location').textContent = dropoffAddress || fmtLatLng(dropoffCoords);
        document.getElementById('driver-name').textContent = selectedRide.driver.firstName + ' ' + selectedRide.driver.lastName;
        document.getElementById('driver-employment').textContent = selectedRide.driver.employmentStatus || '';
        document.getElementById('driver-capacity').textContent = selectedRide.vehicle.availableSeats + '/' + selectedRide.vehicle.totalCapacity;

        const mapEl = document.getElementById('map');
        mapEl.textContent = '';

        // Create the map centered between pickup & dropoff
        const center = { lat: (pickupCoords.lat + dropoffCoords.lat)/2, lng: (pickupCoords.lng + dropoffCoords.lng)/2 };
        const map = new google.maps.Map(mapEl, { center, zoom: 14, mapTypeControl:false, streetViewControl:false });

        // Add markers
        const pickupMarker = new google.maps.Marker({ position: pickupCoords, map, title:'Pickup', icon:{ path: google.maps.SymbolPath.CIRCLE, fillColor:'#2A9D8F', fillOpacity:1, strokeWeight:0, scale:7 } });
        const dropMarker = new google.maps.Marker({ position: dropoffCoords, map, title:'Drop-off', icon:{ path: google.maps.SymbolPath.CIRCLE, fillColor:'#E76F51', fillOpacity:1, strokeWeight:0, scale:7 } });

        // Car marker (starting a little offset to simulate approach)
        const offset = 0.003; // small offset
        const start = { lat: pickupCoords.lat + offset, lng: pickupCoords.lng + offset };

        const carIcon = {
            path: 'M3 11c0-4 3-5 9-5s9 1 9 5v6H3v-6z M7 7a3 3 0 1 1 6 0',
            fillColor: '#264653',
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 0.9
        };

        const carMarker = new google.maps.Marker({ position: start, map, icon: carIcon, title: 'Driver' });

        // Use DirectionsService to get realistic polylines for start->pickup and pickup->dropoff
        const directionsService = new google.maps.DirectionsService();
        let fullPath = [];

        // haversine distance helper (meters)
        function haversine(a,b){
            const R = 6371000; // meters
            const toRad = x => x * Math.PI / 180;
            const dLat = toRad(b.lat - a.lat);
            const dLon = toRad(b.lng - a.lng);
            const lat1 = toRad(a.lat);
            const lat2 = toRad(b.lat);
            const sinDLat = Math.sin(dLat/2);
            const sinDLon = Math.sin(dLon/2);
            const aa = sinDLat*sinDLat + sinDLon*sinDLon * Math.cos(lat1) * Math.cos(lat2);
            const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1-aa));
            return R * c;
        }

        function pathLength(path){
            let s = 0;
            for(let i=1;i<path.length;i++) s += haversine(path[i-1], path[i]);
            return s;
        }

        // Animate along Directions steps with real turn-by-turn pacing.
        // steps: [{ path: [{lat,lng},...], duration: <seconds>?, distance: <meters>? }, ...]
        // speedMultiplier: <number> - multiplies durations for demo (0.5 = twice as fast)
        function animateSteps(steps, speedMultiplier, onProgress, onComplete){
            if(!steps || steps.length === 0){ onComplete && onComplete(); return; }

            let stepIndex = 0;

            function runStep(){
                if(stepIndex >= steps.length){ onComplete && onComplete(); return; }
                const step = steps[stepIndex];
                const pts = step.path && step.path.length ? step.path : [];
                if(pts.length === 0){ stepIndex++; runStep(); return; }

                // compute distances for segments inside this step
                const segs = [];
                let segTotal = 0;
                for(let i=1;i<pts.length;i++){
                    const a = pts[i-1], b = pts[i];
                    const d = haversine(a,b);
                    segs.push({a,b,d});
                    segTotal += d;
                }

                // step duration (ms) - use provided duration if available, else derive from distance
                const defaultSpeedMsPerMeter = 1000 / 13.9; // example: ~50 km/h -> 13.9 m/s
                let stepDurationMs = null;
                if(step.duration && typeof step.duration === 'number'){
                    stepDurationMs = Math.max(150, Math.round(step.duration * 1000 * speedMultiplier));
                }else if(step.distance && typeof step.distance === 'number'){
                    stepDurationMs = Math.max(150, Math.round(step.distance * defaultSpeedMsPerMeter * speedMultiplier));
                }else{
                    stepDurationMs = 500; // fallback
                }

                // animate each segment proportional to its distance
                let sidx = 0;
                function runSeg(){
                    if(sidx >= segs.length){ stepIndex++; runStep(); return; }
                    const seg = segs[sidx];
                    const segDuration = Math.max(20, Math.round(stepDurationMs * (seg.d / Math.max(1, segTotal))));
                    const startTime = performance.now();

                    function frame(now){
                        const t = Math.min(1, (now - startTime) / segDuration);
                        const lat = seg.a.lat + (seg.b.lat - seg.a.lat) * t;
                        const lng = seg.a.lng + (seg.b.lng - seg.a.lng) * t;
                        const pos = {lat,lng};
                        onProgress(pos, (stepIndex + (sidx + t) / Math.max(1,segs.length)) / steps.length);
                        if(t < 1) requestAnimationFrame(frame);
                        else { sidx++; runSeg(); }
                    }
                    requestAnimationFrame(frame);
                }

                // if there's only one point (no movement), skip
                if(segs.length === 0){ stepIndex++; runStep(); return; }
                runSeg();
            }

            runStep();
        }

        // Helper to convert MVC LatLng to simple {lat,lng}
        function toSimpleLatLng(ll){ return { lat: ll.lat(), lng: ll.lng() }; }

        // Request directions for a single leg and extract per-step paths/durations
        function getDirections(origin, destination, callback){
            directionsService.route({ origin, destination, travelMode: google.maps.TravelMode.DRIVING }, function(result, status){
                if(status === 'OK' && result.routes && result.routes.length){
                    const route = result.routes[0];
                    // extract per-step paths and durations
                    const steps = [];
                    route.legs.forEach(leg => {
                        leg.steps.forEach(step => {
                            const stepPath = [];
                            if(step.path && step.path.length){
                                step.path.forEach(p => stepPath.push(toSimpleLatLng(p)));
                            } else {
                                // fallback to start/end
                                stepPath.push(toSimpleLatLng(step.start_location));
                                stepPath.push(toSimpleLatLng(step.end_location));
                            }
                            steps.push({ path: stepPath, duration: step.duration && step.duration.value ? step.duration.value : null, distance: step.distance && step.distance.value ? step.distance.value : null, instructions: step.instructions });
                        });
                    });
                    callback(null, { steps, route });
                }else{
                    callback(new Error('Directions request failed: ' + status));
                }
            });
        }

        // Try to get both legs then animate sequentially with turn-by-turn pacing
        setStage(1);
        // Speed multiplier for demo pacing. 1.0 = real durations, <1 = faster animation.
        const SPEED_MULTIPLIER = 0.001;
        getDirections(start, pickupCoords, function(err1, res1){
            if(err1){
                console.warn('Directions failed for approach, falling back', err1);
                // fallback simple interpolation
                const fallbackPath = [start, pickupCoords, dropoffCoords];
                const routeLine = new google.maps.Polyline({ path: fallbackPath, strokeColor:'#2A9D8F', strokeWeight:4, map });
                animateSteps([{path:fallbackPath, duration: null, distance: null}], SPEED_MULTIPLIER, function(pos){ carMarker.setPosition(pos); map.panTo(pos); }, function(){ setStage(3); });
                return;
            }

            // Draw approach polyline
            const approachSteps = res1.steps;
            const approachOverview = [].concat(...approachSteps.map(s => s.path));
            fullPath = fullPath.concat(approachOverview);
            const approachLine = new google.maps.Polyline({ path: approachOverview, strokeColor:'#2A9D8F', strokeWeight:4, map });

            // animate approach using step durations
            animateSteps(approachSteps, SPEED_MULTIPLIER, function(pos){ carMarker.setPosition(pos); map.panTo(pos); }, function(){
                setTimeout(function(){
                    setStage(2);
                    getDirections(pickupCoords, dropoffCoords, function(err2, res2){
                        if(err2){
                            console.warn('Directions failed for main leg, falling back', err2);
                            const fallbackPath = [pickupCoords, dropoffCoords];
                            const legLine = new google.maps.Polyline({ path: fallbackPath, strokeColor:'#2A9D8F', strokeWeight:4, map });
                            animateSteps([{path:fallbackPath, duration:null, distance:null}], SPEED_MULTIPLIER, function(pos){ carMarker.setPosition(pos); map.panTo(pos); }, function(){ setStage(3); });
                            return;
                        }

                        const legSteps = res2.steps;
                        const legOverview = [].concat(...legSteps.map(s => s.path));
                        fullPath = fullPath.concat(legOverview);
                        const legLine = new google.maps.Polyline({ path: legOverview, strokeColor:'#2A9D8F', strokeWeight:4, map });

                        // animate main leg using step durations
                        animateSteps(legSteps, SPEED_MULTIPLIER, function(pos){ carMarker.setPosition(pos); map.panTo(pos); }, function(){ setStage(3); });
                    });
                }, 1000);
            });
        });
    };

    // initialize by loading google maps script then calling initMap
    function initialize(){
        const data = loadData();
        if(!data) return;
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent('AIzaSyBsoZUgOFGSg7oXvdgstZuduXjNPIp_S3k')}&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize); else initialize();

})();
