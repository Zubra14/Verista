import React, { memo } from 'react';
import { useBreakpoint } from '../../utils/responsiveHelpers';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  speed = 'normal',
  withText = false,
  text = 'Loading...',
  className = '',
  responsive = true
}) => {
  const isMobile = useBreakpoint('md', 'smaller');
  
  // Adjust size based on mobile if responsive is true
  const adjustedSize = (responsive && isMobile) 
    ? (size === 'xl' ? 'lg' : size === 'lg' ? 'md' : size) 
    : size;
  
  // Size variants
  const sizeClasses = {
    xs: 'w-3 h-3 border-2',
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4'
  };
  
  // Color variants
  const colorClasses = {
    blue: 'border-blue-500',
    indigo: 'border-indigo-500',
    purple: 'border-purple-500',
    gray: 'border-gray-500',
    white: 'border-white'
  };
  
  // Speed variants
  const speedClasses = {
    slow: 'animate-spin-slow',
    normal: 'animate-spin',
    fast: 'animate-spin-fast'
  };
  
  // Text size based on spinner size
  const textSizeClasses = {
    xs: 'text-xs mt-1',
    sm: 'text-xs mt-1',
    md: 'text-sm mt-2',
    lg: 'text-base mt-2',
    xl: 'text-lg mt-3'
  };
  
  // Extract color for text
  const extractedColor = colorClasses[color]?.split('-')[1] || 'gray';
  
  return (
    <div className={`flex flex-col justify-center items-center ${className}`}>
      <div 
        className={`rounded-full border-t-transparent ${sizeClasses[adjustedSize]} ${speedClasses[speed]}`}
        style={{ 
          borderWidth: 'inherit',
          borderRightColor: extractedColor,
          borderBottomColor: extractedColor,
          borderLeftColor: extractedColor
        }}
        aria-label="loading"
        role="status"
      />
      {withText && (
        <span 
          className={`${textSizeClasses[adjustedSize]} text-${extractedColor}-500`}
          aria-live="polite"
        >
          {text}
        </span>
      )}
    </div>
  );
};

// Using memo to prevent unnecessary re-renders
export default memo(LoadingSpinner);