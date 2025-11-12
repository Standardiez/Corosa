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
        const editBtn = document.getElementById('edit-profile-btn');
        const isEditing = editBtn.textContent.includes('Edit');

        if (isEditing) {
            // Switch to edit mode
            makeFieldsEditable();
            editBtn.innerHTML = '<i class=\'bx bx-save\' style=\'margin-right:0.5rem;\'></i>Save Changes';
            editBtn.classList.remove('btn-primary');
            editBtn.classList.add('btn-accent');
        } else {
            // Save changes
            saveProfileChanges();
            makeFieldsReadOnly();
            editBtn.innerHTML = '<i class=\'bx bx-edit\' style=\'margin-right:0.5rem;\'></i>Edit Profile';
            editBtn.classList.remove('btn-accent');
            editBtn.classList.add('btn-primary');
        }
    }

    function makeFieldsEditable() {
        const stored = getStoredUser();
        if (!stored) return;

        // Full Name fields
        const fullNameEl = document.getElementById('full-name');
        if (fullNameEl) {
            const container = fullNameEl.parentElement;
            fullNameEl.style.display = 'none';

            const nameInputs = document.createElement('div');
            nameInputs.style.display = 'grid';
            nameInputs.style.gridTemplateColumns = '2fr 1fr 2fr';
            nameInputs.style.gap = 'var(--spacing-sm)';
            nameInputs.innerHTML = `
                <input type="text" id="edit-firstName" class="input" placeholder="First Name" value="${stored.firstName || ''}" style="padding:var(--spacing-md);">
                <input type="text" id="edit-middleInitial" class="input" placeholder="M.I." value="${stored.middleInitial || ''}" maxlength="2" style="padding:var(--spacing-md);">
                <input type="text" id="edit-lastName" class="input" placeholder="Last Name" value="${stored.lastName || ''}" style="padding:var(--spacing-md);">
            `;
            container.appendChild(nameInputs);
        }

        // Birthdate
        const birthdateEl = document.getElementById('birthdate');
        if (birthdateEl) {
            replaceWithInput(birthdateEl, 'edit-birthdate', 'date', stored.birthdate || '');
        }

        // Email
        const emailEl = document.getElementById('email');
        if (emailEl) {
            replaceWithInput(emailEl, 'edit-email', 'email', stored.email || '');
        }

        // Mobile
        const mobileEl = document.getElementById('mobile');
        if (mobileEl) {
            replaceWithInput(mobileEl, 'edit-mobile', 'tel', stored.mobile || '');
        }

        // House Number
        const houseNumberEl = document.getElementById('house-number');
        if (houseNumberEl) {
            replaceWithInput(houseNumberEl, 'edit-houseNumber', 'text', stored.houseNumber || '');
        }

        // Street
        const streetEl = document.getElementById('street');
        if (streetEl) {
            replaceWithInput(streetEl, 'edit-street', 'text', stored.street || '');
        }

        // Barangay
        const barangayEl = document.getElementById('barangay');
        if (barangayEl) {
            replaceWithInput(barangayEl, 'edit-barangay', 'text', stored.barangay || '');
        }

        // Employment
        const employmentEl = document.getElementById('employment');
        if (employmentEl) {
            replaceWithInput(employmentEl, 'edit-employment', 'text', stored.employment || '');
        }

        // Disabilities
        const disabilitiesEl = document.getElementById('disabilities');
        if (disabilitiesEl) {
            replaceWithInput(disabilitiesEl, 'edit-disabilities', 'text', stored.disabilities || '');
        }
    }

    function replaceWithInput(element, id, type, value) {
        const container = element.parentElement;
        element.style.display = 'none';

        const input = document.createElement('input');
        input.type = type;
        input.id = id;
        input.className = 'input';
        input.value = value;
        input.style.padding = 'var(--spacing-md)';
        input.style.marginTop = 'var(--spacing-sm)';

        container.appendChild(input);
    }

    function makeFieldsReadOnly() {
        // Remove all edit inputs and show original elements
        const editInputs = document.querySelectorAll('[id^="edit-"]');
        editInputs.forEach(input => input.remove());

        // Show original display elements
        document.getElementById('full-name').style.display = 'block';
        document.getElementById('birthdate').style.display = 'block';
        document.getElementById('email').style.display = 'block';
        document.getElementById('mobile').style.display = 'block';
        document.getElementById('house-number').style.display = 'block';
        document.getElementById('street').style.display = 'block';
        document.getElementById('barangay').style.display = 'block';
        document.getElementById('employment').style.display = 'block';
        document.getElementById('disabilities').style.display = 'block';

        // Remove name inputs container
        const nameInputsDiv = document.querySelector('#full-name').parentElement.querySelector('div');
        if (nameInputsDiv) nameInputsDiv.remove();
    }

    function saveProfileChanges() {
        // Collect edited values
        const updatedData = {
            firstName: document.getElementById('edit-firstName')?.value || '',
            middleInitial: document.getElementById('edit-middleInitial')?.value || '',
            lastName: document.getElementById('edit-lastName')?.value || '',
            birthdate: document.getElementById('edit-birthdate')?.value || '',
            email: document.getElementById('edit-email')?.value || '',
            mobile: document.getElementById('edit-mobile')?.value || '',
            houseNumber: document.getElementById('edit-houseNumber')?.value || '',
            street: document.getElementById('edit-street')?.value || '',
            barangay: document.getElementById('edit-barangay')?.value || '',
            employment: document.getElementById('edit-employment')?.value || '',
            disabilities: document.getElementById('edit-disabilities')?.value || ''
        };

        // Update localStorage
        persistUserData(updatedData);

        // Update display fields
        const fullNameEl = document.getElementById('full-name');
        if (fullNameEl) {
            const parts = [
                updatedData.firstName,
                updatedData.middleInitial ? `${updatedData.middleInitial}.` : '',
                updatedData.lastName
            ].filter(Boolean);
            fullNameEl.textContent = parts.length ? parts.join(' ') : '—';
        }

        const birthdateEl = document.getElementById('birthdate');
        if (birthdateEl) {
            birthdateEl.textContent = formatBirthdate(updatedData.birthdate);
        }

        document.getElementById('email').textContent = safeText(updatedData.email);
        document.getElementById('mobile').textContent = safeText(updatedData.mobile);
        document.getElementById('house-number').textContent = safeText(updatedData.houseNumber);
        document.getElementById('street').textContent = safeText(updatedData.street);
        document.getElementById('barangay').textContent = safeText(updatedData.barangay);
        document.getElementById('employment').textContent = safeText(updatedData.employment);
        document.getElementById('disabilities').textContent = safeText(updatedData.disabilities, 'None');

        // TODO: Your teammate will connect this to backend
        console.log('Profile changes saved locally:', updatedData);
        alert('Profile updated successfully! (Changes saved locally only)');
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
