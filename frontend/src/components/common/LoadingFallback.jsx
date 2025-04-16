import React from "react";
import LoadingSpinner from "./LoadingSpinner";
import { useBreakpoint } from "../../utils/responsiveHelpers";

/**
 * A reusable loading component that displays a spinner and a custom message
 * Used as a fallback during suspense or initial loading states
 *
 * @param {Object} props Component props
 * @param {string} props.message Custom message to display
 * @param {string} props.className Additional CSS classes
 * @param {string} props.size Size of the spinner (xs, sm, md, lg, xl)
 * @param {string} props.color Color of the spinner (blue, indigo, purple, gray, white)
 * @param {string} props.variant Display variant (default, card, overlay, minimal)
 */
const LoadingFallback = ({ 
  message = "Loading...", 
  className = "",
  size = "lg",
  color = "blue",
  variant = "default"
}) => {
  const isMobile = useBreakpoint('md', 'smaller');
  
  // Adjust size for mobile
  const responsiveSize = isMobile && size === "lg" ? "md" : size;
  
  // Different variants of the loading component with responsive heights
  const variants = {
    default: `flex flex-col items-center justify-center ${isMobile ? 'min-h-[150px]' : 'min-h-[200px]'} p-4 ${className}`,
    card: `flex flex-col items-center justify-center ${isMobile ? 'min-h-[150px] p-4' : 'min-h-[200px] p-6'} bg-white rounded-lg shadow-md ${className}`,
    overlay: `flex flex-col items-center justify-center ${isMobile ? 'min-h-[150px]' : 'min-h-[200px]'} p-4 bg-white bg-opacity-75 backdrop-blur-sm rounded-lg ${className}`,
    minimal: `flex flex-col items-center justify-center p-2 ${className}`
  };

  return (
    <div className={variants[variant] || variants.default} role="status" aria-live="polite">
      {/* Enhanced spinner with improved performance and mobile responsiveness */}
      <LoadingSpinner 
        size={responsiveSize} 
        color={color} 
        speed="normal" 
        className="mb-3"
        responsive={true}
      />

      {/* Message with proper typography and mobile optimization */}
      <p className={`${isMobile ? 'text-sm' : 'text-base'} text-${color}-600 text-center font-medium transition-opacity animate-pulse`}>
        {message}
      </p>
    </div>
  );
};

// Full-screen version for app-level loading with a more polished look
export const FullScreenLoader = ({ 
  message = "Loading application...",
  color = "blue",
  withProgress = false
}) => {
  const isMobile = useBreakpoint('md', 'smaller');
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50 transition-all duration-300"
      role="status" 
      aria-live="polite"
    >
      <div className={`${isMobile ? 'max-w-xs' : 'max-w-md'} w-full px-4`}>
        {/* Branded loading experience */}
        <div className="text-center mb-6">
          <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-800`}>Verista</h2>
          <p className="text-gray-500 text-sm">Safe Transportation Platform</p>
        </div>
        
        <LoadingSpinner 
          size={isMobile ? "lg" : "xl"} 
          color={color} 
          withText={true}
          text={message}
          className="mb-8"
          responsive={true}
        />
        
        {withProgress && (
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{width: '75%'}}></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize the component for better performance with React.memo
export default React.memo(LoadingFallback);
