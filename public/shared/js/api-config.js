/**
 * API Configuration for Corosa Application
 * 
 * This file centralizes all API endpoint configurations to make it easy to
 * switch between local development and Docker deployment.
 * 
 * Usage:
 *   <script src="/shared/js/api-config.js"></script>
 *   <script>
 *     const apiUrl = API_CONFIG.NODE_API_BASE;
 *     fetch(`${apiUrl}/api/trips`);
 *   </script>
 */

(function() {
    'use strict';

    // Detect if we're running in Docker or local environment
    // In Docker, the frontend is served from port 8080
    const isDocker = window.location.port === '8080' || 
                     window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

    // Get the current hostname and protocol for dynamic API URL construction
    const getHostname = () => {
        // For LAN access, use the current hostname
        return window.location.hostname;
    };

    const getProtocol = () => {
        return window.location.protocol;
    };

    // API Configuration
    const API_CONFIG = {
        // Node.js API (Express server) - runs on port 3000
        NODE_API_BASE: (() => {
            if (isDocker) {
                // In Docker, Node API is on a different container
                // Use the hostname from the browser (works for LAN access)
                return `${getProtocol()}//${getHostname()}:3000`;
            } else {
                // Local development
                return 'http://localhost:3000';
            }
        })(),

        // PHP API Base (Apache server) - runs on port 8080 in Docker, or same origin locally
        PHP_API_BASE: (() => {
            if (isDocker) {
                // In Docker, PHP API is on the same container as the frontend
                return '/backend/api';
            } else {
                // Local development (WAMP) - adjust if needed
                return '/Corosa/backend/api';
            }
        })(),

        // Full PHP API paths (for convenience)
        PHP_API: {
            LOGIN: '/backend/api/shared/php/login.php',
            USERS: '/backend/api/shared/php/users.php',
            ADDRESS: '/backend/api/shared/php/address.php',
            REVIEWS: '/backend/api/shared/php/reviews.php'
        }
    };

    // Make API_CONFIG available globally
    window.API_CONFIG = API_CONFIG;

    // Log configuration in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('[API Config] Environment:', isDocker ? 'Docker' : 'Local');
        console.log('[API Config] Node API Base:', API_CONFIG.NODE_API_BASE);
        console.log('[API Config] PHP API Base:', API_CONFIG.PHP_API_BASE);
    }
})();

