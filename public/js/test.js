document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('signupForm');
    
    if (!form) {
        console.error('Signup form not found!');
        return;
    }

    console.log('Form found and script loaded!');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('Form submitted!');

        const formData = new FormData(form);
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            mobile: formData.get('mobile'),
            password: formData.get('password')
        };

        console.log('Sending data:', data);

        try {
            const response = await fetch('/Corosa/backend/api/test-register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            console.log('Response status:', response.status);
            
            const result = await response.json();
            console.log('Server response:', result);

            if (result.success) {
                alert('Account created successfully!');
                window.location.href = '../pages/login.html';
            } else {
                alert('Error: ' + (result.message || 'Failed to create account'));
            }
        } catch (error) {
            console.error('Error during signup:', error);
            alert('Error during signup. Check console for details.');
        }
    });
});