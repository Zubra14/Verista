// src/components/auth/TestAccountRoleSelector.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../lib/supabase';

const TestAccountRoleSelector = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser, isTestAccount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect non-test accounts immediately
    if (currentUser && !isTestAccount(currentUser.email)) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate, isTestAccount]);

  // Handle case where currentUser is not loaded yet
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse p-8 rounded-lg shadow-lg max-w-md w-full bg-white">
          <h2 className="text-2xl font-bold text-center mb-6">Loading...</h2>
        </div>
      </div>
    );
  }

  // Double-check that this is actually a test account
  if (!isTestAccount(currentUser.email)) {
    navigate('/dashboard');
    return null;
  }

  const handleRoleSelection = async (role) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First check if using the test account
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user?.email || userData.user.email !== 'veristatest@gmail.com') {
        throw new Error('This functionality is only available for the test account');
      }
      
      // Use a direct RPC call instead of table update
      const { data, error } = await supabase.rpc('set_test_account_role', { 
        new_role: role 
      });
      
      if (error) throw error;
      
      // Navigate to the appropriate dashboard
      navigate(`/dashboard/${role}`);
    } catch (err) {
      console.error('Role switching failed:', err);
      setError(`Failed to switch roles: ${err.message}`);
      toast.error(`Failed to switch roles: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Test Account: Select Role</h2>
        <p className="text-center text-gray-600 mb-6">
          Choose which dashboard you would like to access
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelection('parent')}
            className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            disabled={isLoading}
          >
            Parent Dashboard
          </button>
          
          <button
            onClick={() => handleRoleSelection('driver')}
            className="w-full p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            disabled={isLoading}
          >
            Driver Dashboard
          </button>
          
          <button
            onClick={() => handleRoleSelection('school')}
            className="w-full p-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            disabled={isLoading}
          >
            School Dashboard
          </button>
          
          <button
            onClick={() => handleRoleSelection('government')}
            className="w-full p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            disabled={isLoading}
          >
            Government Dashboard
          </button>
        </div>
        
        {isLoading && (
          <div className="mt-4 text-center text-gray-600">
            Switching to {selectedRole} role...
          </div>
        )}
        
        {error && (
          <div className="mt-4 text-center text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAccountRoleSelector;