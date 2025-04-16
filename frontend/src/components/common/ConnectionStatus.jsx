import React from "react";
import { useLocation } from "react-router-dom";
import { connectionState } from "../../lib/supabase";
import { ROOT_PATHS } from "../../utils/constants";
import { useBreakpoint } from "../../utils/responsiveHelpers";

const ConnectionStatus = () => {
  const location = useLocation();
  const [isConnected, setIsConnected] = React.useState(
    connectionState.isConnected()
  );
  const [isChecking, setIsChecking] = React.useState(false);
  const isMobile = useBreakpoint('md', 'smaller');

  // Use the shared ROOT_PATHS constant for consistent path checking
  const isPublicPage = ROOT_PATHS.includes(location.pathname);

  React.useEffect(() => {
    // Set up listener for connection state changes
    const unsubscribe = connectionState.addListener((connected, error) => {
      setIsConnected(connected);
      setIsChecking(connectionState.isChecking());
    });

    // Clean up on unmount
    return () => unsubscribe();
  }, []);

  // Don't show anything if connected or on public pages
  if ((isConnected && !isChecking) || isPublicPage) return null;

  // Adjust positioning for mobile
  const positionClass = isMobile 
    ? "fixed bottom-16 right-3 z-50" // Moved up to avoid conflict with nav
    : "fixed bottom-4 right-4 z-50";

  return (
    <div
      className={`${positionClass} px-3 py-2 rounded-md shadow-md ${
        isChecking ? "bg-yellow-100" : "bg-red-100"
      }`}
      role="status"
      aria-live="polite"
    >
      {isChecking ? (
        <div className="flex items-center">
          <div 
            className="animate-spin mr-2 h-4 w-4 border-2 border-yellow-500 rounded-full border-t-transparent"
            aria-hidden="true"
          ></div>
          <span className={`text-yellow-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {isMobile ? "Checking..." : "Checking connection..."}
          </span>
        </div>
      ) : (
        <div className="flex items-center">
          <div 
            className="mr-2 h-3 w-3 bg-red-500 rounded-full"
            aria-hidden="true"
          ></div>
          <span className={`text-red-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Offline Mode
          </span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
