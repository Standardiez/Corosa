(function () {
    'use strict';

    function fmtLatLng(latLng) {
        return latLng.lat.toFixed(6) + ', ' + latLng.lng.toFixed(6);
    }

    function haversineDistance(a, b) {
        // returns km
        const toRad = x => x * Math.PI / 180;
        const R = 6371; // km
        const dLat = toRad(b.lat - a.lat);
        const dLng = toRad(b.lng - a.lng);
        const lat1 = toRad(a.lat);
        const lat2 = toRad(b.lat);
        const sinDLat = Math.sin(dLat / 2);
        const sinDLng = Math.sin(dLng / 2);
        const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
        const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
        return R * c;
    }

    function loadData() {
        try {
            const pickupCoords = JSON.parse(sessionStorage.getItem('pickupCoords'));
            const pickupAddress = sessionStorage.getItem('pickupLocation');
            const dropoffCoords = JSON.parse(sessionStorage.getItem('dropoffCoords'));
            const dropoffAddress = sessionStorage.getItem('dropoffLocation');
            const selectedRide = JSON.parse(sessionStorage.getItem('selectedRide'));

            if (!pickupCoords || !dropoffCoords || !selectedRide) {
                alert('Missing trip or ride data. Please start over.');
                window.location.href = 'select-pickup.html';
                return null;
            }

            return { pickupCoords, pickupAddress, dropoffCoords, dropoffAddress, selectedRide };
        } catch (e) {
            console.error('Error reading session data', e);
            alert('Missing trip or ride data. Please start over.');
            window.location.href = 'select-pickup.html';
            return null;
        }
    }

    function currencyFormat(n) {
        return '₱' + n.toFixed(2);
    }

    function render() {
        const data = loadData();
        if (!data) return;
        const { pickupCoords, pickupAddress, dropoffCoords, dropoffAddress, selectedRide } = data;

        document.getElementById('pickup-location').textContent = pickupAddress || fmtLatLng(pickupCoords);
        document.getElementById('dropoff-location').textContent = dropoffAddress || fmtLatLng(dropoffCoords);

        const driverMid = selectedRide.driver.middleInitial ? selectedRide.driver.middleInitial + '. ' : '';
        document.getElementById('driver-name').textContent = `${selectedRide.driver.firstName} ${driverMid}${selectedRide.driver.lastName}`.trim();
        document.getElementById('driver-employment').textContent = selectedRide.driver.employmentStatus || '';
        document.getElementById('driver-vehicle').textContent = [selectedRide.vehicle.model, selectedRide.vehicle.year || ''].join(' ').trim();
        document.getElementById('driver-capacity').textContent = `${selectedRide.vehicle.availableSeats}/${selectedRide.vehicle.totalCapacity}`;

        // Fare estimate: base + per_km * distance
        const distanceKm = haversineDistance(pickupCoords, dropoffCoords);
        const base = 20.00;
        const perKm = 8.00;
        const distanceCharge = perKm * distanceKm;
        const total = parseFloat((base + distanceCharge).toFixed(2));

        document.getElementById('fare-base').textContent = currencyFormat(base);
        document.getElementById('fare-distance').textContent = distanceKm.toFixed(2) + ' km';
        document.getElementById('fare-perkm').textContent = currencyFormat(perKm) + ' / km';
        document.getElementById('fare-total').textContent = currencyFormat(total);

        // Back button returns to request-ride (so user can choose another ride)
        const backBtn = document.getElementById('back-btn');
        backBtn.addEventListener('click', function () {
            window.history.back();
        });

        const confirmBtn = document.getElementById('confirm-btn');
        confirmBtn.addEventListener('click', function () {
            confirmRide({
                pickupCoords,
                dropoffCoords,
                selectedRide,
                fare: {
                    base,
                    perKm,
                    distanceKm,
                    total
                },
                confirmBtn
            });
        });
    }

    async function confirmRide({ pickupCoords, dropoffCoords, selectedRide, fare, confirmBtn }) {
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            alert('Please log in before confirming a ride.');
            window.location.href = 'login.html';
            return;
        }

        const tripId = sessionStorage.getItem('selectedTripId') || selectedRide.tripId || selectedRide.id;
        if (!tripId) {
            alert('Missing trip information. Please select a ride again.');
            window.location.href = 'request-ride.html';
            return;
        }

        const paymentMethodSelect = document.getElementById('payment-method');
        const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : 'cash';

        confirmBtn.disabled = true;
        const originalText = confirmBtn.textContent;
        confirmBtn.textContent = 'Confirming...';

        const bookingPayload = {
            passenger_id: Number(userId),
            start_lat: pickupCoords.lat,
            start_long: pickupCoords.lng,
            end_lat: dropoffCoords.lat,
            end_long: dropoffCoords.lng,
            payment_type: paymentMethod,
            total_cost: fare.total,
            booking_confirmation: true
        };

        try {
            const bookingResponse = await fetch('/Corosa/backend/api/bookings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload)
            });
            const bookingResult = await bookingResponse.json();

            if (!bookingResult.success) {
                throw new Error(bookingResult.message || 'Failed to create booking');
            }

            const bookingId = bookingResult.data && bookingResult.data.booking_id;
            if (!bookingId) {
                throw new Error('Booking created but no booking_id returned.');
            }

            sessionStorage.setItem('bookingId', bookingId);

            const tripAssignmentPayload = {
                booking_id: bookingId,
                trip_id: Number(tripId),
                seat_number: null,
                assignment_status: 'confirmed',
                payment_type: paymentMethod,
                total_cost: fare.total,
                booking_confirmation: true
            };

            const assignmentResponse = await fetch('/Corosa/backend/api/trip_assignment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tripAssignmentPayload)
            });
            const assignmentResult = await assignmentResponse.json();

            if (!assignmentResult.success) {
                throw new Error(assignmentResult.message || 'Failed to create trip assignment');
            }

            const assignmentId = assignmentResult.data && assignmentResult.data.assignment_id;
            if (assignmentId) {
                sessionStorage.setItem('assignmentId', assignmentId);
            }

            sessionStorage.setItem('bookingConfirmed', 'true');
            sessionStorage.setItem('confirmedPaymentMethod', paymentMethod);
            sessionStorage.setItem('fareTotal', fare.total.toString());

            alert('Ride confirmed! Opening live ride status...');
            window.location.href = 'ride-status.html';
        } catch (error) {
            console.error('Error confirming ride:', error);
            alert(error.message || 'Failed to confirm ride. Please try again.');
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
            return;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }

})();