document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('signupForm');

    const patterns = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        mobile: /^09\d{9}$/
    };

    function setError(fieldName, message) {
        const el = document.querySelector(`[data-error-for="${fieldName}"]`);
        if (el) el.textContent = message || '';
    }

    function clearErrors() {
        document.querySelectorAll('[data-error-for]').forEach(e => e.textContent = '');
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrors();

        const data = new FormData(form);
        const firstName = data.get('firstName').trim();
        const lastName = data.get('lastName').trim();
        const birthdate = data.get('birthdate');
        const email = data.get('email').trim();
        const mobile = data.get('mobile').trim();
        const street = data.get('street').trim();
        const barangay = data.get('barangay').trim();
        const city = data.get('city').trim();
        const employment = data.get('employment');
        const password = data.get('password');
        const confirmPassword = data.get('confirmPassword');

        let valid = true;

        if (!firstName) { setError('firstName', 'First name is required'); valid = false; }
        if (!lastName) { setError('lastName', 'Last name is required'); valid = false; }
        if (!birthdate) { setError('birthdate', 'Please enter your birthdate'); valid = false; }

        if (!email || !patterns.email.test(email)) { setError('email', 'Please enter a valid email'); valid = false; }
        if (!mobile || !patterns.mobile.test(mobile)) { setError('mobile', 'Enter a valid mobile number (09XXXXXXXXX)'); valid = false; }
        if (!street || !barangay || !city) { setError('address', 'Please complete your address'); valid = false; }
        if (!employment) { setError('employment', 'Please select your employment status'); valid = false; }

        if (!password || password.length < 8) { setError('password', 'Password must be at least 8 characters'); valid = false; }
        if (password !== confirmPassword) { setError('confirmPassword', 'Passwords do not match'); valid = false; }

        if (!valid) {
            // focus on first error field if any
            const firstError = document.querySelector('[data-error-for]:not(:empty)');
            if (firstError) {
                const name = firstError.getAttribute('data-error-for');
                const input = document.getElementById(name) || document.querySelector(`#${name}`);
                if (input) input.focus();
            }
            return;
        }

        // Mock submission: show a friendly message and clear the form (in real app, POST to backend)
        // Build a payload object for later integration
        const payload = Object.fromEntries(data.entries());
        console.log('Signup payload (mock):', payload);

        // For now, just show a confirmation and reset
        alert('Account created (mock). In the final app this will submit to the server.');
        form.reset();
    });
});
