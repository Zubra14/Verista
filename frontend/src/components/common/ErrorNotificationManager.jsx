// In src/components/common/ErrorNotificationManager.jsx

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const ErrorNotificationManager = () => {
  const [activeErrors, setActiveErrors] = useState([]);
  
  useEffect(() => {
    // Create a single consolidated notification for database errors
    if (activeErrors.length > 0) {
      // Dismiss any existing database error toasts
      toast.dismiss('database-error');
      
      // Create a single notification with count
      toast.error(
        `Database connection issues (${activeErrors.length}). Some features may be limited.`, 
        {
          toastId: 'database-error',
          autoClose: false,
          closeOnClick: false,
          pauseOnHover: true
        }
      );
    }
  }, [activeErrors]);
  
  // Method to add errors
  const addError = (error) => {
    setActiveErrors(prev => [...prev, error]);
  };
  
  // Method to clear errors
  const clearErrors = () => {
    setActiveErrors([]);
    toast.dismiss('database-error');
  };
  
  // Expose methods to window for global access
  useEffect(() => {
    window.errorManager = {
      addError,
      clearErrors
    };
    
    return () => {
      delete window.errorManager;
    };
  }, []);
  
  return null; // No UI, just functionality
};

export default ErrorNotificationManager;