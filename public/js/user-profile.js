(function() {
    'use strict';

    // Load user profile data on page load
    function loadProfileData() {
        const userDataStr = localStorage.getItem('userData');

        if (!userDataStr) {
            // No user logged in, redirect to login
            window.location.href = 'login.html';
            return;
        }

        try {
            const userData = JSON.parse(userDataStr);

            // Populate full name
            const fullNameEl = document.getElementById('full-name');
            if (fullNameEl) {
                let fullName = '';
                if (userData.firstName) fullName += userData.firstName;
                if (userData.middleInitial) fullName += ' ' + userData.middleInitial + '.';
                if (userData.lastName) fullName += ' ' + userData.lastName;
                fullNameEl.textContent = fullName || '—';
            }

            // Populate birthdate
            const birthdateEl = document.getElementById('birthdate');
            if (birthdateEl && userData.birthdate) {
                const date = new Date(userData.birthdate);
                birthdateEl.textContent = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            // Populate email
            const emailEl = document.getElementById('email');
            if (emailEl) {
                emailEl.textContent = userData.email || '—';
            }

            // Populate mobile
            const mobileEl = document.getElementById('mobile');
            if (mobileEl) {
                mobileEl.textContent = userData.mobile || '—';
            }

            // Populate address fields
            const houseNumberEl = document.getElementById('house-number');
            if (houseNumberEl) {
                houseNumberEl.textContent = userData.houseNumber || '—';
            }

            const streetEl = document.getElementById('street');
            if (streetEl) {
                streetEl.textContent = userData.street || '—';
            }

            const barangayEl = document.getElementById('barangay');
            if (barangayEl) {
                barangayEl.textContent = userData.barangay || '—';
            }

            // Populate employment
            const employmentEl = document.getElementById('employment');
            if (employmentEl) {
                employmentEl.textContent = userData.employment || '—';
            }

            // Populate disabilities
            const disabilitiesEl = document.getElementById('disabilities');
            if (disabilitiesEl) {
                disabilitiesEl.textContent = userData.disabilities || 'None';
            }

        } catch (e) {
            console.error('Error loading user profile:', e);
            window.location.href = 'login.html';
        }
    }

    // Handle edit profile button click
    function handleEditProfile() {
        // TODO: Navigate to edit profile page or enable edit mode
        alert('Edit profile functionality coming soon!');
    }

    // Initialize on DOM ready
    function init() {
        loadProfileData();

        // Add event listener for edit button
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', handleEditProfile);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
