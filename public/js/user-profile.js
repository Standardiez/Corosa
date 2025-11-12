(function () {
    'use strict';

    const API_BASE = '/Corosa/backend/api';

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
            console.warn('Unable to persist merged user data', e);
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
        const fullNameEl = document.getElementById('full-name');
        if (fullNameEl) {
            const parts = [
                safeText(userData.first_name, ''),
                userData.middle_initial ? `${userData.middle_initial}.` : '',
                safeText(userData.last_name, '')
            ].filter(Boolean);
            fullNameEl.textContent = parts.length ? parts.join(' ') : '—';
        }

        const birthdateEl = document.getElementById('birthdate');
        if (birthdateEl) {
            birthdateEl.textContent = formatBirthdate(userData.birthdate);
        }

        const emailEl = document.getElementById('email');
        if (emailEl) {
            emailEl.textContent = safeText(userData.email);
        }

        const mobileEl = document.getElementById('mobile');
        if (mobileEl) {
            mobileEl.textContent = safeText(userData.mobile_number);
        }

        const houseNumberEl = document.getElementById('house-number');
        if (houseNumberEl) {
            houseNumberEl.textContent = safeText(addressData?.address_unit);
        }

        const streetEl = document.getElementById('street');
        if (streetEl) {
            streetEl.textContent = safeText(addressData?.address_street);
        }

        const barangayEl = document.getElementById('barangay');
        if (barangayEl) {
            barangayEl.textContent = safeText(addressData?.address_barangay);
        }

        const employmentEl = document.getElementById('employment');
        if (employmentEl) {
            employmentEl.textContent = safeText(userData.employment_status);
        }

        const disabilitiesEl = document.getElementById('disabilities');
        if (disabilitiesEl) {
            disabilitiesEl.textContent = safeText(userData.disabilities, 'None');
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
                email: userData.email || stored?.email || '',
                firstName: userData.first_name || stored?.firstName || '',
                middleInitial: userData.middle_initial || stored?.middleInitial || '',
                lastName: userData.last_name || stored?.lastName || '',
                birthdate: userData.birthdate || stored?.birthdate || '',
                mobile: userData.mobile_number || stored?.mobile || '',
                employment: userData.employment_status || stored?.employment || '',
                disabilities: userData.disabilities || stored?.disabilities || '',
                houseNumber: addressData?.address_unit || stored?.houseNumber || '',
                street: addressData?.address_street || stored?.street || '',
                barangay: addressData?.address_barangay || stored?.barangay || ''
            });
        } catch (error) {
            console.error('Failed to load profile data', error);
            alert('Unable to load your profile information. Please try again later.');
        }
    }

    function handleEditProfile() {
        alert('Edit profile functionality coming soon!');
    }

    function init() {
        loadProfileData();
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
