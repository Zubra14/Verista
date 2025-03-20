// src/components/common/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, loading } = useAuth();
  
  useEffect(() => {
    // Check if this is a test account with stored role
    if (currentUser?.email === 'veristatest@gmail.com' && 
        localStorage.getItem('testAccountRole') && 
        !currentUser.role) {
      // Update current user with stored role
      currentUser.role = localStorage.getItem('testAccountRole');
    }
  }, [currentUser]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Special handling for test account - allow access to any dashboard
  if (currentUser.email === 'veristatest@gmail.com') {
    // If the URL doesn't match the stored role, redirect to role selector
    const urlRole = window.location.pathname.split('/')[2]; // Extracts role from /dashboard/role
    const storedRole = localStorage.getItem('testAccountRole');
    
    if (urlRole !== storedRole) {
      localStorage.setItem('testAccountRole', urlRole);
    }
    
    return children;
  }

  // Regular role checking for normal users
  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to={`/dashboard/${currentUser.role}`} replace />;
  }

  return children;
};

export default ProtectedRoute;