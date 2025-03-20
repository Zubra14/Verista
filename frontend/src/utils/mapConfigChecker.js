// src/utils/mapConfigChecker.js

/**
 * Utility to check if Google Maps API key is properly configured
 */

// Check if the Google Maps API key exists and is valid
export const checkGoogleMapsApiKey = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === '' || apiKey === 'your-api-key-here') {
      console.warn('Missing or invalid Google Maps API key');
      return {
        valid: false,
        message: 'Google Maps API key is missing or invalid. Map functionality will be limited.'
      };
    }
    
    // Minimum length check (most API keys are at least 20 chars)
    if (apiKey.length < 20) {
      console.warn('Google Maps API key appears to be too short');
      return {
        valid: false,
        message: 'Google Maps API key appears to be invalid (too short).'
      };
    }
    
    return {
      valid: true,
      key: apiKey
    };
  };
  
  // Check if Google Maps script is loaded
  export const isGoogleMapsLoaded = () => {
    return window.google && window.google.maps;
  };
  
  // Check if bus icon exists in public assets
  export const checkBusIconExists = async () => {
    try {
      const response = await fetch('/assets/bus-icon.png', { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn('Failed to check if bus icon exists:', error);
      return false;
    }
  };
  
  // Comprehensive check of all map dependencies
  export const checkMapDependencies = async () => {
    const apiKeyCheck = checkGoogleMapsApiKey();
    const mapsLoaded = isGoogleMapsLoaded();
    const iconExists = await checkBusIconExists();
    
    return {
      apiKey: apiKeyCheck,
      mapsLoaded,
      iconExists,
      allReady: apiKeyCheck.valid && mapsLoaded && iconExists
    };
  };
  
  export default {
    checkGoogleMapsApiKey,
    isGoogleMapsLoaded,
    checkBusIconExists,
    checkMapDependencies
  };