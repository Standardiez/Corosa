(function(){
    'use strict';

    function fmtLatLng(latLng){
        return latLng.lat.toFixed(6) + ', ' + latLng.lng.toFixed(6);
    }

    function haversineDistance(a,b){
        // returns km
        const toRad = x => x * Math.PI/180;
        const R = 6371; // km
        const dLat = toRad(b.lat - a.lat);
        const dLng = toRad(b.lng - a.lng);
        const lat1 = toRad(a.lat);
        const lat2 = toRad(b.lat);
        const sinDLat = Math.sin(dLat/2);
        const sinDLng = Math.sin(dLng/2);
        const h = sinDLat*sinDLat + Math.cos(lat1)*Math.cos(lat2)*sinDLng*sinDLng;
        const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
        return R * c;
    }

    function loadData(){
        try{
            const pickupCoords = JSON.parse(sessionStorage.getItem('pickupCoords'));
            const pickupAddress = sessionStorage.getItem('pickupLocation');
            const dropoffCoords = JSON.parse(sessionStorage.getItem('dropoffCoords'));
            const dropoffAddress = sessionStorage.getItem('dropoffLocation');
            const selectedRide = JSON.parse(sessionStorage.getItem('selectedRide'));

            if(!pickupCoords || !dropoffCoords || !selectedRide){
                alert('Missing trip or ride data. Please start over.');
                window.location.href = 'select-pickup.html';
                return null;
            }

            return {pickupCoords,pickupAddress,dropoffCoords,dropoffAddress,selectedRide};
        }catch(e){
            console.error('Error reading session data',e);
            alert('Missing trip or ride data. Please start over.');
            window.location.href = 'select-pickup.html';
            return null;
        }
    }

    function currencyFormat(n){
        return '₱' + n.toFixed(2);
    }

    function render(){
        const data = loadData();
        if(!data) return;
        const {pickupCoords,pickupAddress,dropoffCoords,dropoffAddress,selectedRide} = data;

        document.getElementById('pickup-location').textContent = pickupAddress || fmtLatLng(pickupCoords);
        document.getElementById('dropoff-location').textContent = dropoffAddress || fmtLatLng(dropoffCoords);

        document.getElementById('driver-name').textContent = selectedRide.driver.firstName + ' ' + selectedRide.driver.lastName;
        document.getElementById('driver-employment').textContent = selectedRide.driver.employmentStatus || '';
        document.getElementById('driver-vehicle').textContent = selectedRide.vehicle.model + ' ' + (selectedRide.vehicle.year || '');
        document.getElementById('driver-capacity').textContent = selectedRide.vehicle.availableSeats + '/' + selectedRide.vehicle.totalCapacity;

        // Fare estimate: base + per_km * distance
        const distanceKm = haversineDistance(pickupCoords, dropoffCoords);
        const base = 20.00;
        const perKm = 8.00;
        const distanceCharge = perKm * distanceKm;
        const total = base + distanceCharge;

        document.getElementById('fare-base').textContent = currencyFormat(base);
        document.getElementById('fare-distance').textContent = distanceKm.toFixed(2) + ' km';
        document.getElementById('fare-perkm').textContent = currencyFormat(perKm) + ' / km';
        document.getElementById('fare-total').textContent = currencyFormat(total);

        // Back button returns to request-ride (so user can choose another ride)
        const backBtn = document.getElementById('back-btn');
        backBtn.addEventListener('click', function(){
            window.history.back();
        });

        // Confirm button: simulate booking
        const confirmBtn = document.getElementById('confirm-btn');
        confirmBtn.addEventListener('click', function(){
            // In real app we'd call backend API here
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Confirming...';
            setTimeout(function(){
                // Clear selectedRide to prevent accidental re-submission
                sessionStorage.removeItem('selectedRide');
                alert('Ride confirmed! The driver will contact you shortly.');
                // Redirect to home or bookings page
                window.location.href = 'index.html';
            }, 1200);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }

})();