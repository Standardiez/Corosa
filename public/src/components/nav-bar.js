// Navigation Bar Component
const NavBar = () => {
    return `
        <nav class="bg-primary text-primary-foreground p-4">
            <div class="container mx-auto flex justify-between items-center">
                <a href="index.html" class="text-lg font-bold">UniRide</a>
                <div class="space-x-4">
                    <a href="find-ride.html" class="hover:text-accent">Find a Ride</a>
                    <a href="pickup-location.html" class="hover:text-accent">Pickup Location</a>
                    <a href="request-ride.html" class="hover:text-accent">Request a Ride</a>
                </div>
            </div>
        </nav>
    `;
};

// Export the NavBar component
export default NavBar;