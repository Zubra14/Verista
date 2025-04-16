import React from 'react';
import { useBreakpoint } from '../../utils/responsiveHelpers';

const DashboardPageHeader = ({ title, subtitle, actions, className = '' }) => {
  const isMobile = useBreakpoint('md', 'smaller');
  
  return (
    <div className={`mb-4 md:mb-6 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className={isMobile ? 'pr-2' : ''}>
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold text-gray-800 flex items-center`}>
            {title}
          </h1>
          {subtitle && (
            <p className={`mt-1 ${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className={`${isMobile ? 'mt-3 flex justify-start space-x-2 overflow-x-auto pb-2' : 'mt-0'}`}>
            {actions}
          </div>
        )}
      </div>
      <div className="mt-3 md:mt-4 border-b border-gray-200"></div>
    </div>
  );
};

// Alternative version with sticky behavior for mobile
export const StickyDashboardPageHeader = ({ title, subtitle, actions, className = '' }) => {
  const isMobile = useBreakpoint('md', 'smaller');
  
  return (
    <>
      <div className={`${isMobile ? 'sticky top-0 z-10 bg-white bg-opacity-95 backdrop-blur-sm shadow-sm px-3 py-2' : 'mb-6'} ${className}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-semibold text-gray-800`}>
              {title}
            </h1>
            {!isMobile && subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {actions && (
            <div className={`${isMobile ? 'mt-1 flex justify-start space-x-2 overflow-x-auto pb-1 -mx-1 px-1' : 'mt-0'}`}>
              {actions}
            </div>
          )}
        </div>
        <div className={`${isMobile ? 'mt-2' : 'mt-4'} border-b border-gray-200`}></div>
      </div>
      {isMobile && subtitle && <p className="px-4 mt-2 text-xs text-gray-500">{subtitle}</p>}
    </>
  );
};

export default DashboardPageHeader;