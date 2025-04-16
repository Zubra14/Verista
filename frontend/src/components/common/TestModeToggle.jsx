import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { enableTestDataMode, disableTestDataMode, isTestDataModeEnabled } from '../../lib/supabase';
import { getErrorState, resetErrorCounters } from '../../utils/testServerErrorHandling.js';
import { isPublicPage } from '../../utils/routingUtils';
import { useBreakpoint } from '../../utils/responsiveHelpers';
import '../../styles/mobile-responsive-fixes.css';

const TestModeToggle = () => {
  const [isTestMode, setIsTestMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [errorStats, setErrorStats] = useState({ errorCount: 0 });
  const location = useLocation();
  const isMobile = useBreakpoint('md', 'smaller');
  const panelRef = useRef(null);
  
  // Check if on a public page or homepage using our utility
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  const isLoginPage = location.pathname.includes('login') || location.pathname.includes('register');
  const shouldHide = isPublicPage(location.pathname) || isHomePage || isLoginPage;
  
  // Don't render on public pages or homepage - more restrictive now
  if (shouldHide) {
    return null;
  }
  
  useEffect(() => {
    // Check initial state
    setIsTestMode(isTestDataModeEnabled());
    
    // Get error stats
    setErrorStats(getErrorState());
    
    // Setup listener for changes
    const handleStorageChange = (e) => {
      if (e.key === 'verista_use_test_data') {
        setIsTestMode(e.newValue === 'true');
      }
      
      // Update stats on any relevant storage changes
      if (e.key?.includes('verista_api_error_count') || 
          e.key?.includes('verista_first_error_time') ||
          e.key?.includes('verista_use_test_data')) {
        setErrorStats(getErrorState());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Add click away listener to close the panel
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);
  
  const handleToggle = () => {
    if (isTestMode) {
      disableTestDataMode();
      // Force toggle state update
      setIsTestMode(false);
    } else {
      enableTestDataMode();
      // Force toggle state update
      setIsTestMode(true);
    }
    
    // Reload to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  const handleResetErrorCounters = (e) => {
    e.stopPropagation();
    resetErrorCounters();
    setErrorStats(getErrorState());
  };
  
  // Always show in development mode or if errors have occurred
  if (import.meta.env.MODE !== 'development' && errorStats.errorCount === 0) {
    return null;
  }

  // Adjust positioning for mobile
  const positionClasses = isMobile 
    ? "fixed bottom-16 right-4 z-50 flex flex-col items-end" 
    : "fixed bottom-4 right-4 z-50 flex flex-col items-end";
  
  return (
    <div className={positionClasses} ref={panelRef}>
      {/* Main button - larger touch target on mobile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-white shadow-lg transition-all
          ${isMobile ? 'text-base min-h-[48px] min-w-[48px]' : 'text-sm'} font-semibold
          ${isTestMode ? 'bg-amber-500' : errorStats.errorCount > 0 ? 'bg-red-500' : 'bg-blue-600'}`}
        aria-expanded={isExpanded}
        aria-haspopup="true"
      >
        <span>{isTestMode ? '🧪' : errorStats.errorCount > 0 ? '⚠️' : '🔌'}</span>
        <span>
          {isTestMode ? 'Test Mode' : 
           errorStats.errorCount > 0 ? `Server Errors: ${errorStats.errorCount}` : 
           'Live Mode'}
        </span>
        <span className="ml-1 text-xs">{isExpanded ? '▲' : '▼'}</span>
      </button>
      
      {/* Expanded panel */}
      {isExpanded && (
        <div 
          className={`mt-2 bg-white rounded-lg shadow-lg p-3 border border-gray-200
            ${isMobile ? 'w-[95vw] max-w-[300px]' : 'w-64'}`} 
          aria-live="polite"
        >
          <div className="flex justify-between items-center mb-2 border-b pb-2">
            <h3 className="font-medium">Data Connection Status</h3>
            <div className={`w-3 h-3 rounded-full ${isTestMode ? 'bg-amber-500' : errorStats.errorCount > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
          </div>
          
          <div className="mb-3">
            <div className="text-sm font-medium">Current Mode:</div>
            <div className={`text-sm ${isTestMode ? 'text-amber-600' : 'text-blue-600'}`}>
              {isTestMode ? '🧪 Using test data' : '🔌 Using real database'}
            </div>
          </div>
          
          {errorStats.errorCount > 0 && (
            <div className="mb-3 p-2 bg-red-50 rounded">
              <div className="text-sm font-medium text-red-700">Server Error Stats:</div>
              <div className="text-xs text-red-600 mt-1">
                <div>Error Count: {errorStats.errorCount}</div>
                {errorStats.firstErrorTime > 0 && (
                  <div>First Error: {new Date(errorStats.firstErrorTime).toLocaleTimeString()}</div>
                )}
                <button 
                  onClick={handleResetErrorCounters}
                  className="mt-1 text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-red-700"
                  style={{ minHeight: isMobile ? '36px' : 'auto' }}
                >
                  Reset Error Counters
                </button>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleToggle}
              className={`flex-1 py-2 rounded text-white font-medium transition-all 
                ${isMobile ? 'text-sm min-h-[44px]' : 'text-xs'} 
                ${isTestMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-amber-500 hover:bg-amber-600'}`}
              aria-label={`Switch to ${isTestMode ? 'Real Data' : 'Test Mode'}`}
            >
              Switch to {isTestMode ? 'Real Data' : 'Test Mode'}
            </button>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            {isTestMode
              ? 'Using mock data - ideal for development without a server'
              : 'Connected to real Supabase backend'}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestModeToggle;