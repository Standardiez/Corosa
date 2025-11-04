// Initialize Lucide icons
lucide.createIcons();

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const rideDetails = {
    id: urlParams.get('rideId') || '',
    driverName: urlParams.get('driverName') || '',
    avatar: urlParams.get('avatar') || '',
    carModel: urlParams.get('carModel') || '',
    userType: urlParams.get('userType') || '',
    startLocation: urlParams.get('startLocation') || '',
    endLocation: urlParams.get('endLocation') || '',
    time: urlParams.get('time') || '',
    rating: urlParams.get('rating') || '0',
};

// Constants
const BASE_FARE = 5.00;
let currentTip = 0;

// Initialize UI with ride details
function initializeUI() {
    // Driver info
    document.getElementById('driverName').textContent = rideDetails.driverName;
    
    // Avatar handling
    const avatarImg = document.getElementById('driverAvatar');
    const avatarFallback = document.getElementById('driverInitials');
    if (rideDetails.avatar) {
        avatarImg.src = rideDetails.avatar;
        avatarImg.style.display = 'block';
        avatarFallback.style.display = 'none';
    } else {
        avatarImg.style.display = 'none';
        avatarFallback.style.display = 'flex';
        avatarFallback.textContent = rideDetails.driverName
            .split(' ')
            .map(n => n[0])
            .join('');
    }

    // User type badge
    const userTypeBadge = document.getElementById('userTypeBadge');
    userTypeBadge.textContent = rideDetails.userType === 'student' ? 'Student' : 'Employee';
    userTypeBadge.classList.add(rideDetails.userType === 'student' ? 'bg-secondary' : 'bg-primary');

    // Car model and rating
    document.getElementById('carModel').textContent = rideDetails.carModel;
    document.getElementById('driverRating').textContent = parseFloat(rideDetails.rating).toFixed(1);

    // Route details
    document.getElementById('startLocation').textContent = rideDetails.startLocation;
    document.getElementById('endLocation').textContent = rideDetails.endLocation;
    document.getElementById('departureTime').textContent = rideDetails.time;

    // Initialize payment method radio buttons
    document.querySelectorAll('input[name="payment"]').forEach(input => {
        input.addEventListener('change', handlePaymentMethodChange);
    });

    // Initialize tip buttons
    document.querySelectorAll('.tipBtn').forEach(btn => {
        btn.addEventListener('click', handleTipButtonClick);
    });

    // Initialize custom tip input
    document.getElementById('customTip').addEventListener('input', handleCustomTipInput);

    // Initialize confirm button
    document.getElementById('confirmRide').addEventListener('click', handleConfirmRide);
}

// Handle payment method change
function handlePaymentMethodChange(e) {
    // Can be extended to handle different payment methods
    console.log('Payment method changed to:', e.target.value);
}

// Handle tip button clicks
function handleTipButtonClick(e) {
    const amount = parseFloat(e.target.dataset.amount);
    setTipAmount(amount);
    
    // Update button styles
    document.querySelectorAll('.tipBtn').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-primary-foreground');
        btn.classList.add('bg-background');
    });
    e.target.classList.add('bg-primary', 'text-primary-foreground');
    e.target.classList.remove('bg-background');

    // Clear custom tip input
    document.getElementById('customTip').value = '';
}

// Handle custom tip input
function handleCustomTipInput(e) {
    const amount = parseFloat(e.target.value) || 0;
    setTipAmount(amount);

    // Reset tip button styles
    document.querySelectorAll('.tipBtn').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-primary-foreground');
        btn.classList.add('bg-background');
    });
}

// Set tip amount and update UI
function setTipAmount(amount) {
    currentTip = amount;
    updateFareSummary();
}

// Update fare summary
function updateFareSummary() {
    const tipRow = document.getElementById('tipRow');
    const tipAmount = document.getElementById('tipAmount');
    const totalAmount = document.getElementById('totalAmount');

    if (currentTip > 0) {
        tipRow.classList.remove('hidden');
        tipAmount.textContent = `$${currentTip.toFixed(2)}`;
    } else {
        tipRow.classList.add('hidden');
    }

    const total = BASE_FARE + currentTip;
    totalAmount.textContent = `$${total.toFixed(2)}`;
}

// Show toast notification
function showToast(title, description, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `rounded-md p-4 mb-4 ${type === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`;
    toast.innerHTML = `
        <div class="flex">
            <div class="flex-1">
                <p class="font-bold">${title}</p>
                <p class="text-sm">${description}</p>
            </div>
        </div>
    `;

    const container = document.getElementById('toast-container');
    container.appendChild(toast);

    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Handle confirm ride button click
function handleConfirmRide() {
    showToast(
        'Ride Requested!',
        `Your ride with ${rideDetails.driverName} has been requested.`
    );

    // Redirect to home page after a short delay
    setTimeout(() => {
        window.location.href = '/src/pages/index.html';
    }, 2000);
}

// Initialize the UI when the page loads
document.addEventListener('DOMContentLoaded', initializeUI);