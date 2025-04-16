/**
 * Responsive Helper Utilities
 * A set of utility functions for handling responsive design consistently across components
 */
import React, { useState, useEffect } from 'react';

// Breakpoint definitions matching Tailwind config (values in pixels)
export const breakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

/**
 * Check if the current viewport matches a media query
 * @param {string} query - CSS media query
 * @returns {boolean} - Whether the media query matches
 */
export const matchesMediaQuery = (query) => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia(query).matches;
};

/**
 * Check if the viewport is smaller than a breakpoint
 * @param {string} breakpoint - Breakpoint name (xs, sm, md, lg, xl, 2xl)
 * @returns {boolean} - Whether the viewport is smaller than the breakpoint
 */
export const isSmallerThan = (breakpoint) => {
  const width = breakpoints[breakpoint];
  if (!width || typeof window === 'undefined') return false;
  return window.innerWidth < width;
};

/**
 * Check if the viewport is larger than a breakpoint
 * @param {string} breakpoint - Breakpoint name (xs, sm, md, lg, xl, 2xl)
 * @returns {boolean} - Whether the viewport is larger than the breakpoint
 */
export const isLargerThan = (breakpoint) => {
  const width = breakpoints[breakpoint];
  if (!width || typeof window === 'undefined') return false;
  return window.innerWidth >= width;
};

/**
 * React hook to track if the viewport is mobile sized
 * @returns {boolean} - Whether the viewport is mobile sized
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoints.md : false
  );
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkSize = () => {
      setIsMobile(window.innerWidth < breakpoints.md);
    };
    
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);
  
  return isMobile;
};

/**
 * React hook to track viewport size against a specific breakpoint
 * @param {string} breakpoint - Breakpoint name (xs, sm, md, lg, xl, 2xl)
 * @param {string} comparison - Comparison type ('smaller', 'larger', or 'equal')
 * @returns {boolean} - Whether the comparison is true
 */
export const useBreakpoint = (breakpoint, comparison = 'larger') => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkBreakpoint = () => {
      const width = breakpoints[breakpoint];
      if (!width) return;
      
      if (comparison === 'smaller') {
        setMatches(window.innerWidth < width);
      } else if (comparison === 'larger') {
        setMatches(window.innerWidth >= width);
      } else if (comparison === 'equal') {
        const nextBreakpoint = Object.keys(breakpoints).find(
          bp => breakpoints[bp] > width
        );
        const nextWidth = nextBreakpoint ? breakpoints[nextBreakpoint] : Infinity;
        setMatches(window.innerWidth >= width && window.innerWidth < nextWidth);
      }
    };
    
    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint, comparison]);
  
  return matches;
};

/**
 * Get the current active breakpoint
 * @returns {string} - Current breakpoint name
 */
export const getCurrentBreakpoint = () => {
  if (typeof window === 'undefined') return 'md';
  
  const width = window.innerWidth;
  const sortedBreakpoints = Object.entries(breakpoints)
    .sort((a, b) => b[1] - a[1]); // Sort by value descending
  
  for (const [name, value] of sortedBreakpoints) {
    if (width >= value) {
      return name;
    }
  }
  
  return 'xs';
};

/**
 * Format classes specifically for responsive design
 * Helps make responsive class names more readable
 * @param {Object} classMap - Object with breakpoint-specific classes
 * @returns {string} - Compiled class string
 * 
 * Example:
 * formatResponsiveClasses({
 *   base: 'grid-cols-1',
 *   md: 'grid-cols-2',
 *   lg: 'grid-cols-3'
 * })
 * // Returns: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
 */
export const formatResponsiveClasses = (classMap) => {
  if (!classMap || typeof classMap !== 'object') return '';
  
  return Object.entries(classMap)
    .map(([breakpoint, classes]) => {
      if (breakpoint === 'base') return classes;
      return `${breakpoint}:${classes}`;
    })
    .join(' ');
};

/**
 * Calculate appropriate font size based on screen width
 * Useful for fluid typography
 * @param {number} minSize - Minimum font size (px)
 * @param {number} maxSize - Maximum font size (px)
 * @param {number} minWidth - Minimum viewport width (px)
 * @param {number} maxWidth - Maximum viewport width (px)
 * @returns {string} - CSS calc function for font size
 */
export const fluidFontSize = (
  minSize = 16,
  maxSize = 24,
  minWidth = breakpoints.sm,
  maxWidth = breakpoints.xl
) => {
  return `calc(${minSize}px + (${maxSize} - ${minSize}) * ((100vw - ${minWidth}px) / (${maxWidth} - ${minWidth})))`;
};

export default {
  breakpoints,
  matchesMediaQuery,
  isSmallerThan,
  isLargerThan,
  useIsMobile,
  useBreakpoint,
  getCurrentBreakpoint,
  formatResponsiveClasses,
  fluidFontSize
};