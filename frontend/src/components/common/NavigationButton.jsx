// In frontend/src/components/common/NavigationButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useBreakpoint } from "../../utils/responsiveHelpers";

const NavigationButton = ({ to, children, className, mobileClassName, ...props }) => {
  const navigate = useNavigate();
  const isMobile = useBreakpoint('md', 'smaller');

  const handleClick = () => {
    navigate(to);
  };

  const baseClass = "rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 active:scale-95 transition-transform duration-150";
  const defaultClass = isMobile ? 
    "px-3 py-2 text-sm md:px-4 md:py-2 md:text-base" : 
    "px-4 py-2";
  
  const combinedClassName = `${baseClass} ${defaultClass} ${className} ${isMobile && mobileClassName ? mobileClassName : ''}`;

  return (
    <button
      onClick={handleClick}
      className={combinedClassName}
      style={{ minHeight: isMobile ? '44px' : 'auto' }}
      {...props}
    >
      {children}
    </button>
  );
};

export default NavigationButton;
