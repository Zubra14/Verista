import React from 'react';
import PropTypes from 'prop-types';
import { useBreakpoint } from '../../utils/responsiveHelpers';

/**
 * MapFallback - A component to display when Google Maps fails to load or encounters errors
 * 
 * This component provides an informative fallback UI with position information and status messages
 * to help users understand when map functionality is unavailable.
 */
const MapFallback = ({ 
  error, 
  coordinates, 
  address, 
  status, 
  lastUpdate, 
  onRetry, 
  title = "Map Unavailable",
  showRetryButton = true,
  className = "",
  additionalInfo = null,
  attemptCount = 0,
  errorTimestamp = null
}) => {
  const isMobile = useBreakpoint('md', 'smaller');
  
  // Format coordinates nicely if they exist
  const formattedCoordinates = coordinates ? 
    `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` : 
    "No coordinates available";
  
  // Format last update time if available
  const formattedTime = lastUpdate ? 
    new Date(lastUpdate).toLocaleString() : 
    "No update time available";
    
  // Get error message in a user-friendly format
  const getErrorMessage = () => {
    if (!error) return null;
    
    if (typeof error === 'string') return error;
    
    if (error.message) {
      // Google Maps specific error messages
      if (error.message.includes("Google Maps JavaScript API error")) {
        return isMobile 
          ? "Map loading error. Check network connection." 
          : "There was a problem loading the map. This might be due to an invalid API key or network issues.";
      }
      
      if (error.message.includes("MapsRequestError")) {
        return isMobile
          ? "Map request failed. Check connection."
          : "Could not load Google Maps due to a request error. Please check your internet connection.";
      }
      
      if (error.message.includes("RefererNotAllowedMapError")) {
        return isMobile
          ? "Website not authorized for Maps."
          : "This website is not authorized to use Google Maps on this page.";
      }
      
      if (error.message.includes("InvalidKeyMapError")) {
        return isMobile
          ? "Invalid Maps API key."
          : "The Google Maps API key is invalid or missing.";
      }
      
      return error.message;
    }
    
    return 'Map could not be loaded';
  };

  return (
    <div 
      className={`bg-gray-100 border border-gray-300 rounded-lg ${isMobile ? 'p-3' : 'p-4'} flex flex-col items-center ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full text-center mb-3">
        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-800`}>{title}</h3>
        {status && (
          <div className="text-sm font-medium text-amber-600 mt-1">
            Status: {status}
          </div>
        )}
      </div>

      {/* Static map representation */}
      <div className="bg-gray-200 w-full aspect-video flex flex-col items-center justify-center mb-3 rounded border border-gray-300">
        {error ? (
          <div className="text-center p-3">
            <div className="text-red-500 mb-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} mx-auto`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className={`mt-2 font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>{getErrorMessage()}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} text-gray-500 mb-2`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {coordinates && (
                <div className="absolute top-[-5px] right-[-5px] h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">📍</span>
                </div>
              )}
            </div>
            <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 text-center`}>
              Static map representation
            </div>
          </div>
        )}
      </div>

      {/* Coordinates information */}
      {coordinates && (
        <div className="bg-white w-full rounded-md p-3 mb-3 border border-gray-300 text-sm">
          <div className="font-semibold mb-1">Position Information:</div>
          <div className="grid grid-cols-1 gap-1">
            <div className={`flex ${isMobile ? 'flex-col' : 'items-start'}`}>
              <span className="font-medium mr-2">Coordinates:</span>
              <span className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'}`}>{formattedCoordinates}</span>
            </div>
            {address && (
              <div className={`flex ${isMobile ? 'flex-col' : 'items-start'}`}>
                <span className="font-medium mr-2">Address:</span>
                <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{address}</span>
              </div>
            )}
            {lastUpdate && (
              <div className={`flex ${isMobile ? 'flex-col' : 'items-start'}`}>
                <span className="font-medium mr-2">Last updated:</span>
                <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{formattedTime}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error message if provided */}
      {error && typeof error === 'object' && error.message && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-3 w-full text-sm border border-red-200">
          <div className="font-medium">Error Details:</div>
          <div className={`mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>{error.message}</div>
          {error.code && <div className="mt-1 text-xs">Code: {error.code}</div>}
          {attemptCount > 0 && (
            <div className="mt-1 text-xs">Loading attempts: {attemptCount}</div>
          )}
          {errorTimestamp && (
            <div className="mt-1 text-xs">
              Error occurred: {new Date(errorTimestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* Additional information section for route data, stops, etc. */}
      {additionalInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3 w-full text-sm">
          <div className="font-medium text-blue-800 mb-2">Additional Information:</div>
          {additionalInfo.routeId && (
            <div className="mb-1">
              <span className="font-medium mr-2">Route ID:</span>
              <span className={isMobile ? 'text-xs' : ''}>{additionalInfo.routeId}</span>
            </div>
          )}
          {additionalInfo.stops && additionalInfo.stops.length > 0 && (
            <div>
              <div className="font-medium mb-1">Route Stops:</div>
              <ul className={`list-disc list-inside pl-2 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                {additionalInfo.stops.slice(0, isMobile ? 2 : 3).map((stop, index) => (
                  <li key={index} className={index === additionalInfo.activeStopIndex ? "font-semibold" : ""}>
                    {stop.name || `Stop ${index + 1}`}
                    {stop.time && ` (${stop.time})`}
                    {index === additionalInfo.activeStopIndex && " (Active)"}
                  </li>
                ))}
                {additionalInfo.stops.length > (isMobile ? 2 : 3) && (
                  <li className="italic">+{additionalInfo.stops.length - (isMobile ? 2 : 3)} more stops</li>
                )}
              </ul>
            </div>
          )}
          {additionalInfo.message && (
            <div className={`mt-2 ${isMobile ? 'text-xs' : 'text-sm'} text-blue-700`}>{additionalInfo.message}</div>
          )}
        </div>
      )}

      {/* Troubleshooting tips for frequent errors - simplified on mobile */}
      {attemptCount > 1 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3 w-full text-sm">
          <div className="font-medium text-yellow-800 mb-1">Troubleshooting Tips:</div>
          <ul className={`list-disc list-inside pl-2 ${isMobile ? 'text-[10px]' : 'text-xs'} text-yellow-700`}>
            <li>Check your internet connection</li>
            {!isMobile && <li>Ensure location services are enabled on your device</li>}
            <li>Try refreshing the page</li>
            {!isMobile && <li>If using a VPN, try disabling it temporarily</li>}
          </ul>
        </div>
      )}

      {/* Retry button if enabled */}
      {showRetryButton && onRetry && (
        <button 
          onClick={onRetry}
          className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition duration-150 ease-in-out ${isMobile ? 'text-sm min-h-[44px] w-full' : ''}`}
          aria-label="Retry loading map"
        >
          {isMobile
            ? (attemptCount > 0 ? `Retry Map (${attemptCount + 1})` : "Retry Map")
            : (attemptCount > 0 ? `Retry Loading Map (Attempt ${attemptCount + 1})` : "Retry Loading Map")
          }
        </button>
      )}
    </div>
  );
};

MapFallback.propTypes = {
  /** Error object or message string if available */
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  
  /** Coordinates to display on the fallback {lat, lng} */
  coordinates: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }),
  
  /** Human-readable address if available */
  address: PropTypes.string,
  
  /** Current status message to display */
  status: PropTypes.string,
  
  /** Timestamp of the last location update */
  lastUpdate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  
  /** Function to call when retry button is clicked */
  onRetry: PropTypes.func,
  
  /** Title to display at the top of the fallback */
  title: PropTypes.string,
  
  /** Whether to show the retry button */
  showRetryButton: PropTypes.bool,
  
  /** Additional CSS classes to apply to the container */
  className: PropTypes.string,
  
  /** Optional additional information to display (routes, stops, etc.) */
  additionalInfo: PropTypes.object,
  
  /** Number of loading attempts made */
  attemptCount: PropTypes.number,
  
  /** Timestamp when the error occurred */
  errorTimestamp: PropTypes.oneOfType([PropTypes.number, PropTypes.instanceOf(Date)])
};

export default MapFallback;