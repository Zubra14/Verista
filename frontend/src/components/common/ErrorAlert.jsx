// Create file: src/components/common/ErrorAlert.jsx
import React from "react";
import { useBreakpoint } from "../../utils/responsiveHelpers";

const ErrorAlert = ({ message, onRetry, className = "" }) => {
  const isMobile = useBreakpoint('md', 'smaller');

  return (
    <div
      className={`flex flex-col items-center justify-center h-full bg-gray-50 p-3 sm:p-6 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full max-w-md text-center">
        <svg
          className={`mx-auto ${isMobile ? 'h-10 w-10' : 'h-12 w-12'} text-red-500`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium mt-3`}>
          Something went wrong
        </h3>
        <p className={`mt-2 ${isMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
          {message || "An error occurred while loading the map"}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ minHeight: isMobile ? '44px' : 'auto' }}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
