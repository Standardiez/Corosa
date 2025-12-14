/*
  select-dropoff.js

  This script extends select-pickup.js functionality to include:
  1. Display of the previously selected pickup location
  2. Google Maps initialization for drop-off point selection
  3. Coordinate and location name display for the selected drop-off point
*/

(function () {
  "use strict";

  // Store the current selected location and coordinates
  let currentLocation = {
    address: "",
    coords: null,
  };

  // Default center for Baguio City
  const DEFAULT_CENTER = { lat: 16.4023, lng: 120.596 };

  // Google Maps API Key
  const GOOGLE_MAPS_API_KEY = "AIzaSyBsoZUgOFGSg7oXvdgstZuduXjNPIp_S3k";

  // Helper: format coordinates
  function fmtLatLng(latLng) {
    return latLng.lat.toFixed(6) + ", " + latLng.lng.toFixed(6);
  }

  // Load pickup location from URL parameters or sessionStorage
  function loadPickupLocation() {
    const params = new URLSearchParams(window.location.search);
    const pickupEl = document.getElementById("pickup-location");

    // Get flow intent
    const flowIntent = sessionStorage.getItem("flowIntent") || "passenger";

    // Try to get location from URL parameters first
    let pickupLocation = params.get("pickup");
    let pickupCoords = params.get("coords");

    // Fallback to sessionStorage (check based on flow intent)
    if (!pickupLocation) {
      if (flowIntent === "driver") {
        pickupLocation = sessionStorage.getItem("driverPickupLocation");
        pickupCoords = sessionStorage.getItem("driverPickupCoords");
      } else {
        pickupLocation = sessionStorage.getItem("pickupLocation");
        pickupCoords = sessionStorage.getItem("pickupCoords");
      }
    }

    if (pickupEl) {
      if (pickupLocation) {
        pickupEl.textContent = pickupLocation;
      } else {
        pickupEl.textContent = "No pickup location selected";
        // Optionally redirect back to pickup selection
        // window.location.href = 'select-pickup.html';
      }
    }

    // Return coordinates for map centering
    if (pickupCoords) {
      try {
        return JSON.parse(pickupCoords);
      } catch (e) {
        console.error("Invalid pickup coordinates:", e);
      }
    }
    return null;
  }

  // Write coordinate and location readout
  function setSelectedLocationInfo(coords, address = "") {
    const el = document.getElementById("selected-coords");
    const nextBtn = document.getElementById("next-btn");

    console.log("DEBUG: setSelectedLocationInfo called with:", {
      coords,
      address,
      addressIsEmpty: address === "",
      addressIsUndefined: address === undefined,
      addressTrimmed: (address || "").trim(),
    });

    if (el) {
      const coordsText = fmtLatLng(coords);
      el.textContent = address ? `${address} (${coordsText})` : coordsText;

      // Store the current selection
      currentLocation.address = address || coordsText;
      currentLocation.coords = coords;

      console.log("DEBUG: currentLocation updated to:", currentLocation);
    }

    // Enable the next button when we have coordinates
    if (nextBtn) {
      nextBtn.disabled = false;
    }
  }

  // Get location details using reverse geocoding
  async function getLocationDetails(latLng) {
    const geocoder = new google.maps.Geocoder();
    console.log("DEBUG: getLocationDetails called with:", latLng);
    try {
      const response = await geocoder.geocode({ location: latLng });
      console.log("DEBUG: Geocoder response:", response);

      if (response.results[0]) {
        // Try to find the most relevant place name
        const result = response.results[0];
        let locationName = "";

        // First try to find a point of interest or establishment
        const poi = result.address_components.find(
          (component) =>
            component.types.includes("point_of_interest") ||
            component.types.includes("establishment")
        );

        if (poi) {
          locationName = poi.long_name;
          console.log("DEBUG: Found POI:", locationName);
        } else {
          // If no POI, try to construct an address from street + sublocality
          const street = result.address_components.find((component) =>
            component.types.includes("route")
          );
          const area = result.address_components.find(
            (component) =>
              component.types.includes("sublocality") ||
              component.types.includes("neighborhood")
          );

          if (street && area) {
            locationName = `${street.long_name}, ${area.long_name}`;
            console.log("DEBUG: Found street + area:", locationName);
          } else if (street) {
            locationName = street.long_name;
            console.log("DEBUG: Found street only:", locationName);
          } else if (area) {
            locationName = area.long_name;
            console.log("DEBUG: Found area only:", locationName);
          } else {
            // Fallback to formatted address, but try to keep it concise
            locationName = result.formatted_address
              .split(",")
              .slice(0, 2)
              .join(",");
            console.log("DEBUG: Using formatted address:", locationName);
          }
        }
        console.log("DEBUG: Final locationName to return:", locationName);
        return locationName;
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
    }
    console.log("DEBUG: getLocationDetails returning empty string");
    return "";
  }

  // Initialize map once API is loaded
  window.initMap = function () {
    const mapEl = document.getElementById("map");
    if (!mapEl) return;

    // Get pickup location coordinates or use default
    const pickupCoords = loadPickupLocation() || DEFAULT_CENTER;

    // Create map centered on pickup location
    const map = new google.maps.Map(mapEl, {
      center: pickupCoords,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
    });

    // Create a draggable marker in the center
    const marker = new google.maps.Marker({
      position: pickupCoords,
      map: map,
      draggable: true,
      title: "Drag to choose drop-off point",
    });

    // Create a marker for pickup location (non-draggable)
    new google.maps.Marker({
      position: pickupCoords,
      map: map,
      draggable: false,
      title: "Pickup location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#FF0000",
        fillOpacity: 1,
        strokeWeight: 0,
        scale: 8,
      },
    });

    // Update readout initially
    const initialPos = marker.getPosition().toJSON();
    getLocationDetails(initialPos).then((address) => {
      setSelectedLocationInfo(initialPos, address);
    });

    // When marker is dragged, update readout
    marker.addListener("dragend", async function () {
      const pos = marker.getPosition().toJSON();
      const address = await getLocationDetails(pos);
      setSelectedLocationInfo(pos, address);
    });

    // When map is clicked, move marker and update readout
    map.addListener("click", async function (e) {
      const latLng = e.latLng.toJSON();
      marker.setPosition(latLng);
      const address = await getLocationDetails(latLng);
      setSelectedLocationInfo(latLng, address);
    });
  };

  // Dynamically load Google Maps JS API
  function loadGoogleMaps() {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "YOUR_API_KEY_HERE") {
      // Show hint to developer in the map element
      const mapEl = document.getElementById("map");
      if (mapEl) {
        mapEl.textContent =
          "Google Maps API key not configured. Replace YOUR_API_KEY_HERE in public/js/select-dropoff.js.";
      }
      return;
    }

    // Build URL with callback to initMap
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      GOOGLE_MAPS_API_KEY
    )}&libraries=geocoding&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = function () {
      const mapEl = document.getElementById("map");
      if (mapEl)
        mapEl.textContent =
          "Failed to load Google Maps. Check your API key and network.";
    };
    document.head.appendChild(script);
  }

  // Setup back button handler
  function setupBackButton() {
    const backBtn = document.getElementById("back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        // Navigate back to pickup selection
        window.location.href = "../pages/select-pickup.html";
      });
    }
  }

  // Setup next button handler
  function setupNextButton() {
    const nextBtn = document.getElementById("next-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        console.log("DEBUG: Next button clicked");
        console.log("DEBUG: currentLocation =", currentLocation);

        if (currentLocation.coords) {
          // Get flow intent from sessionStorage
          const flowIntent =
            sessionStorage.getItem("flowIntent") || "passenger";

          console.log("DEBUG: flowIntent =", flowIntent);
          console.log(
            "DEBUG: All sessionStorage keys:",
            Object.keys(sessionStorage)
          );
          console.log(
            "DEBUG: currentLocation.address =",
            currentLocation.address
          );
          console.log(
            "DEBUG: currentLocation.coords =",
            currentLocation.coords
          );

          // Store drop-off location based on flow intent
          if (flowIntent === "driver") {
            console.log("DEBUG: Redirecting to DRIVER makeride page");
            console.log(
              "DEBUG: Storing driverDropoffLocation =",
              currentLocation.address
            );
            sessionStorage.setItem(
              "driverDropoffLocation",
              currentLocation.address
            );
            sessionStorage.setItem(
              "driverDropoffCoords",
              JSON.stringify(currentLocation.coords)
            );
            console.log(
              "DEBUG: After storing, driverDropoffLocation =",
              sessionStorage.getItem("driverDropoffLocation")
            );
            // Redirect to driver makeride page
            window.location.href = "../../driver/pages/driver-makeride.html";
          } else {
            console.log("DEBUG: Redirecting to PASSENGER request-ride page");
            sessionStorage.setItem("dropoffLocation", currentLocation.address);
            sessionStorage.setItem(
              "dropoffCoords",
              JSON.stringify(currentLocation.coords)
            );
            // Redirect to passenger request-ride page
            window.location.href = "../pages/request-ride.html";
          }
        } else {
          console.error(
            "DEBUG: No coords in currentLocation!",
            currentLocation
          );
        }
      });
    }
  }

  // Start loading after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      loadGoogleMaps();
      setupBackButton();
      setupNextButton();
    });
  } else {
    loadGoogleMaps();
    setupBackButton();
    setupNextButton();
  }
})();
