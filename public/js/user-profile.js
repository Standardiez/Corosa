(function () {
    'use strict';

    const APP_BASE_PATH = window.location.pathname.startsWith('/Corosa/') || window.location.pathname === '/Corosa'
        ? '/Corosa'
        : '';
    const API_BASE = `${window.location.origin.replace(/\/$/, '')}${APP_BASE_PATH}/backend/api`;
    let currentUserData = null;
    let currentAddressData = null;
    let isEditMode = false;

    function getStoredUser() {
        const localStr = localStorage.getItem('userData');
        if (localStr) {
            try {
                return JSON.parse(localStr);
            } catch (e) {
                console.warn('Failed to parse userData from localStorage', e);
            }
        }
        return null;
    }

    function persistUserData(partial) {
        const existing = getStoredUser() || {};
        const merged = { ...existing, ...partial };
        try {
            localStorage.setItem('userData', JSON.stringify(merged));
        } catch (e) {
            console.warn('Unable to persist userData', e);
        }
        updateHeaderInitials(merged.firstName, merged.lastName);
    }

    function updateHeaderInitials(firstName, lastName) {
        const initialsEl = document.getElementById('user-initials');
        if (!initialsEl) return;
        if (firstName && lastName) {
            initialsEl.textContent = (firstName[0] + lastName[0]).toUpperCase();
        } else {
            initialsEl.textContent = '';
        }
    }

    function formatBirthdate(value) {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function safeText(value, fallback = '—') {
        if (value === null || value === undefined || value === '') return fallback;
        return String(value);
    }

    async function fetchJson(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = await response.json();
        if (!payload.success) {
            throw new Error(payload.message || 'Request failed');
        }
        return payload.data;
    }

    async function fetchUserProfile(userId) {
        const userData = await fetchJson(`${API_BASE}/users.php?user_id=${encodeURIComponent(userId)}`);
        let addressData = null;
        if (userData.address_id) {
            try {
                addressData = await fetchJson(`${API_BASE}/address.php?address_id=${encodeURIComponent(userData.address_id)}`);
            } catch (e) {
                console.warn('Unable to fetch address data', e);
            }
        }
        return { userData, addressData };
    }

    function populateProfile({ userData, addressData }) {
        currentUserData = userData;
        currentAddressData = addressData;

        // Personal Information
        document.getElementById('first-name-display').textContent = safeText(userData.first_name);
        document.getElementById('middle-initial-display').textContent = safeText(userData.middle_initial);
        document.getElementById('last-name-display').textContent = safeText(userData.last_name);
        document.getElementById('birthdate-display').textContent = formatBirthdate(userData.birthdate);

        // Contact Information
        document.getElementById('email-display').textContent = safeText(userData.email);
        document.getElementById('mobile-display').textContent = safeText(userData.mobile_number);

        // Address
        document.getElementById('house-number-display').textContent = safeText(addressData?.address_unit);
        document.getElementById('street-display').textContent = safeText(addressData?.address_street);
        document.getElementById('barangay-display').textContent = safeText(addressData?.address_barangay);

        // Additional Information
        document.getElementById('employment-display').textContent = safeText(userData.employment_status);
        document.getElementById('disabilities-display').textContent = safeText(userData.disabilities, 'None');
    }

    function enterEditMode() {
        isEditMode = true;

        // Show edit inputs, hide display elements
        document.querySelectorAll('.profile-display').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.profile-edit').forEach(el => el.style.display = 'block');

        // Populate inputs with current values
        if (currentUserData) {
            document.getElementById('first-name-input').value = currentUserData.first_name || '';
            document.getElementById('middle-initial-input').value = currentUserData.middle_initial || '';
            document.getElementById('last-name-input').value = currentUserData.last_name || '';
            document.getElementById('birthdate-input').value = currentUserData.birthdate || '';
            document.getElementById('email-input').value = currentUserData.email || '';
            document.getElementById('mobile-input').value = currentUserData.mobile_number || '';
            document.getElementById('employment-input').value = currentUserData.employment_status || '';
            document.getElementById('disabilities-input').value = currentUserData.disabilities || '';
        }

        if (currentAddressData) {
            document.getElementById('house-number-input').value = currentAddressData.address_unit || '';
            document.getElementById('street-input').value = currentAddressData.address_street || '';
            document.getElementById('barangay-input').value = currentAddressData.address_barangay || '';
        }

        // Toggle buttons
        document.getElementById('edit-profile-btn').style.display = 'none';
        document.getElementById('save-profile-btn').style.display = 'block';
        document.getElementById('cancel-edit-btn').style.display = 'block';
    }

    function exitEditMode() {
        isEditMode = false;

        // Show display elements, hide edit inputs
        document.querySelectorAll('.profile-display').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.profile-edit').forEach(el => el.style.display = 'none');

        // Toggle buttons
        document.getElementById('edit-profile-btn').style.display = 'block';
        document.getElementById('save-profile-btn').style.display = 'none';
        document.getElementById('cancel-edit-btn').style.display = 'none';
    }

    async function saveProfileChanges() {
        const userId = sessionStorage.getItem('userId') || getStoredUser()?.userId;
        if (!userId) {
            alert('User ID not found. Please log in again.');
            return;
        }

        // Collect form data
        const userUpdate = {
            user_id: parseInt(userId),
            first_name: document.getElementById('first-name-input').value.trim(),
            middle_initial: document.getElementById('middle-initial-input').value.trim() || null,
            last_name: document.getElementById('last-name-input').value.trim(),
            birthdate: document.getElementById('birthdate-input').value || null,
            mobile_number: document.getElementById('mobile-input').value.trim(),
            employment_status: document.getElementById('employment-input').value.trim(),
            disabilities: document.getElementById('disabilities-input').value.trim() || null,
            address_id: currentUserData?.address_id || null
        };

        // Validate required fields
        if (!userUpdate.first_name || !userUpdate.last_name) {
            alert('First name and last name are required.');
            return;
        }

        // Validate mobile format if provided
        if (userUpdate.mobile_number && !/^09\d{9}$/.test(userUpdate.mobile_number)) {
            alert('Mobile number must be in format 09XXXXXXXXX');
            return;
        }

        const saveBtn = document.getElementById('save-profile-btn');
        const originalText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class=\'bx bx-loader-alt bx-spin\' style=\'margin-right:0.5rem;\'></i>Saving...';

        try {
            // Update user
            const userResponse = await fetch(`${API_BASE}/users.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userUpdate)
            });

            const userResult = await userResponse.json();
            if (!userResult.success) {
                throw new Error(userResult.message || 'Failed to update user');
            }

            // Update address if address_id exists
            if (currentUserData?.address_id) {
                const addressUpdate = {
                    address_id: currentUserData.address_id,
                    address_unit: document.getElementById('house-number-input').value.trim(),
                    address_street: document.getElementById('street-input').value.trim(),
                    address_barangay: document.getElementById('barangay-input').value.trim()
                };

                const addressResponse = await fetch(`${API_BASE}/address.php`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(addressUpdate)
                });

                const addressResult = await addressResponse.json();
                if (!addressResult.success) {
                    console.warn('Address update failed:', addressResult.message);
                }
            }

            // Reload profile data to reflect changes
            await loadProfileData();
            exitEditMode();
            alert('Profile updated successfully!');

        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save changes: ' + error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }

    async function loadProfileData() {
        const stored = getStoredUser();
        const sessionUserId = sessionStorage.getItem('userId');
        const userId = sessionUserId || stored?.userId;

        if (!userId) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const { userData, addressData } = await fetchUserProfile(userId);
            populateProfile({ userData, addressData });
            persistUserData({
                userId,
                email: userData.email || null,
                firstName: userData.first_name || '',
                middleInitial: userData.middle_initial || '',
                lastName: userData.last_name || '',
                birthdate: userData.birthdate || '',
                mobile: userData.mobile_number || '',
                employment: userData.employment_status || '',
                disabilities: userData.disabilities || ''
            });
        } catch (error) {
            console.error('Failed to load profile data', error);
            alert('Unable to load your profile information. Please try again later.');
        }
    }

    function init() {
        loadProfileData();

        // Edit button
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', enterEditMode);
        }

        // Save button
        const saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveProfileChanges);
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                exitEditMode();
                // Reload to discard changes
                loadProfileData();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
