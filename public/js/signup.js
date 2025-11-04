/*
    Integration notes for backend developer

    Endpoint: POST /backend/api/users.php
        - The frontend will send the following fields (names in form 'name' attributes):
            firstName, middleInitial, lastName, birthdate, email, mobile,
            street, barangay, city, disabilities, employment, password

        - Preferred content type: application/json (also accept form-encoded for compatibility)

        - Example JSON payload:
            {
                "firstName":"Juan",
                "middleInitial":"P",
                "lastName":"Dela Cruz",
                "birthdate":"1995-07-21",
                "email":"juan@example.com",
                "mobile":"09171234567",
                "street":"123 Main St",
                "barangay":"Barangay 1",
                "city":"Maryheights",
                "disabilities":"none",
                "employment":"student",
                "password":"(plain text from client)"
            }

        - IMPORTANT: The server MUST hash passwords server-side (e.g., password_hash in PHP) and never store or return the plain password.

        - Expected JSON response on success:
            { "success": true, "userId": 123, "message": "Account created" }

        - Expected JSON response on validation error:
            { "success": false, "errors": { "email": "Email already in use", "mobile": "Invalid format" } }

        - CORS / CSRF notes:
            * If the API is on a different origin, enable CORS with appropriate Access-Control-Allow-Origin.
            * For CSRF protection, consider issuing a cookie token or require an anti-CSRF token in a hidden input.

    To connect: uncomment the fetch() block below and set the endpoint variable to match your API path.
*/

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

        // Build a payload object for later integration
        const payload = Object.fromEntries(data.entries());
        console.log('Signup payload (mock):', payload);

        /*
           To enable real backend submission:
           1) Set `useBackend` to true and update `endpoint` to match the server route.
           2) Server should accept JSON (application/json) or form-encoded data.
        */
        const useBackend = false; // change to true to enable

        if (useBackend) {
            const endpoint = '/backend/api/users.php'; // adjust if your API path differs
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(resp => {
                    if (resp && resp.success) {
                        // on success you might redirect to login or user dashboard
                        alert(resp.message || 'Account created');
                        window.location.href = '/pages/index.html';
                    } else if (resp && resp.errors) {
                        // map server-side validation errors to form fields
                        Object.keys(resp.errors).forEach(f => setError(f, resp.errors[f]));
                    } else {
                        alert('Unexpected server response');
                    }
                })
                .catch(err => {
                    console.error('Signup request failed', err);
                    alert('Could not connect to the server. Please try again later.');
                });
        } else {
            // Mock submission: show a friendly message and clear the form (in real app, POST to backend)
            alert('Account created (mock). In the final app this will submit to the server.');
            form.reset();
        }
    });
});
