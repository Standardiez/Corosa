/**
 * Navigation Helper for Corosa Application
 * 
 * Provides helper functions for consistent navigation paths across the application
 * Works correctly in both Docker and local development environments
 */

(function() {
    'use strict';

    /**
     * Get the base path for navigation
     * Handles both Docker and local development paths
     */
    function getBasePath() {
        const currentPath = window.location.pathname;
        
        // Remove leading slash and split into parts
        const parts = currentPath.split('/').filter(p => p);
        
        // Find the base directory (public or Corosa)
        // In Docker: /public/shared/pages/...
        // In local: /Corosa/public/shared/pages/...
        let baseIndex = -1;
        
        if (parts.includes('public')) {
            baseIndex = parts.indexOf('public');
        } else if (parts.includes('Corosa')) {
            baseIndex = parts.indexOf('Corosa');
        }
        
        if (baseIndex >= 0) {
            // Return path up to and including 'public' or 'Corosa'
            return '/' + parts.slice(0, baseIndex + 1).join('/');
        }
        
        // Fallback: return root
        return '/';
    }

    /**
     * Detect if we're in Docker environment
     * In Docker, DocumentRoot is /var/www/html/public, so paths don't include /public/
     * In local WAMP, paths might include /Corosa/public/
     */
    function isDockerEnvironment() {
        const currentPath = window.location.pathname;
        const hostname = window.location.hostname;
        
        // Check if we're on port 8080 (Docker Apache)
        if (window.location.port === '8080') {
            return true;
        }
        
        // Check if path starts with /passenger/, /driver/, or /shared/ (without /public/ prefix)
        // This indicates Docker where DocumentRoot is /var/www/html/public
        if (/^\/(passenger|driver|shared|admin)\//.test(currentPath)) {
            return true;
        }
        
        // Check if path does NOT contain /public/ or /Corosa/ - likely Docker
        if (!currentPath.includes('/public/') && !currentPath.includes('/Corosa/')) {
            // If we're accessing root level paths like /passenger/, it's Docker
            if (/^\/(passenger|driver|shared|admin)/.test(currentPath)) {
                return true;
            }
        }
        
        // Default: assume local WAMP if path contains /Corosa/
        return false;
    }

    /**
     * Navigate to a path relative to the shared pages directory
     * @param {string} path - Path relative to shared/pages (e.g., 'login.html')
     */
    window.navigateToShared = function(path) {
        if (isDockerEnvironment()) {
            // Docker: DocumentRoot is /var/www/html/public, so paths are /shared/pages/...
            window.location.href = '/shared/pages/' + path;
        } else {
            // Local WAMP: might need /Corosa/public/shared/pages/...
            const base = getBasePath();
            let targetBase = base.replace(/\/public$/, '');
            if (!targetBase.endsWith('/')) targetBase += '/';
            window.location.href = targetBase + 'public/shared/pages/' + path;
        }
    };

    /**
     * Navigate to a path relative to passenger pages
     * @param {string} path - Path relative to passenger/pages (e.g., 'select-pickup.html')
     */
    window.navigateToPassenger = function(path) {
        if (isDockerEnvironment()) {
            // Docker: DocumentRoot is /var/www/html/public, so paths are /passenger/pages/...
            window.location.href = '/passenger/pages/' + path;
        } else {
            // Local WAMP: might need /Corosa/public/passenger/pages/...
            const base = getBasePath();
            let targetBase = base.replace(/\/public$/, '');
            if (!targetBase.endsWith('/')) targetBase += '/';
            window.location.href = targetBase + 'public/passenger/pages/' + path;
        }
    };

    /**
     * Navigate to a path relative to driver pages
     * @param {string} path - Path relative to driver/pages (e.g., 'driver-Homepage.html')
     */
    window.navigateToDriver = function(path) {
        if (isDockerEnvironment()) {
            // Docker: DocumentRoot is /var/www/html/public, so paths are /driver/pages/...
            window.location.href = '/driver/pages/' + path;
        } else {
            // Local WAMP: might need /Corosa/public/driver/pages/...
            const base = getBasePath();
            let targetBase = base.replace(/\/public$/, '');
            if (!targetBase.endsWith('/')) targetBase += '/';
            window.location.href = targetBase + 'public/driver/pages/' + path;
        }
    };

    /**
     * Get relative path from current location to target
     * Handles navigation within the same directory structure
     * @param {string} target - Target file (e.g., 'login.html' for same directory)
     */
    window.getRelativePath = function(target) {
        const currentPath = window.location.pathname;
        const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
        return currentDir + '/' + target;
    };

    /**
     * Convert relative path to absolute path
     * Handles paths like "../pages/file.html" or "../../driver/pages/file.html"
     * @param {string} relativePath - Relative path to convert
     * @returns {string} Absolute path from document root
     */
    window.getAbsolutePath = function(relativePath) {
        const currentPath = window.location.pathname;
        const parts = currentPath.split('/').filter(p => p);
        
        // Remove filename if present
        if (parts.length > 0 && parts[parts.length - 1].includes('.')) {
            parts.pop();
        }
        
        // Process relative path
        const relativeParts = relativePath.split('/').filter(p => p);
        
        for (const part of relativeParts) {
            if (part === '..') {
                if (parts.length > 0) {
                    parts.pop();
                }
            } else if (part !== '.') {
                parts.push(part);
            }
        }
        
        return '/' + parts.join('/');
    };

    console.log('[Navigation Helper] Base path:', getBasePath());
})();

