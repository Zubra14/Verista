import React from "react";
import { useBreakpoint } from "../../utils/responsiveHelpers";

const PageHeader = ({ 
  title, 
  subtitle, 
  backgroundImage,
  action,
  condensed = false,
  className = ""
}) => {
  const isMobile = useBreakpoint('md', 'smaller');
  
  const getBackgroundStyle = () => {
    if (!backgroundImage) return {};
    
    return {
      backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.85), rgba(37, 99, 235, 0.9)), url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  };

  return (
    <div 
      className={`bg-blue-600 text-white ${condensed || isMobile ? 'py-8 md:py-12' : 'py-12 md:py-16'} ${className}`}
      style={getBackgroundStyle()}
    >
      <div className={`container mx-auto px-4 ${isMobile ? 'pt-2' : ''}`}>
        <div className="max-w-3xl mx-auto text-center">
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold ${subtitle ? 'mb-2 md:mb-4' : 'mb-0'}`}>
            {title}
          </h1>
          {subtitle && (
            <p className={`${isMobile ? 'text-base' : 'text-xl'} text-blue-100 ${action ? 'mb-4' : ''}`}>
              {subtitle}
            </p>
          )}
          {action && (
            <div className="mt-6">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Compact version for subpages
export const SubpageHeader = ({ title, subtitle, action, className = "" }) => {
  const isMobile = useBreakpoint('md', 'smaller');
  
  return (
    <div className={`bg-blue-500 text-white py-4 md:py-6 ${className}`}>
      <div className="container mx-auto px-4">
        <div className={`${action ? 'flex flex-col md:flex-row md:items-center md:justify-between' : ''}`}>
          <div className={`${action && !isMobile ? 'text-left' : 'text-center'}`}>
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-blue-100 mt-1`}>
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className={`${isMobile ? 'mt-4 flex justify-center' : ''}`}>
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
