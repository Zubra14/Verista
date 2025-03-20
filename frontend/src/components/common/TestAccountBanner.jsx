import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TestAccountBanner = () => {
  const { currentUser, isTestAccount } = useAuth();
  const navigate = useNavigate();
  
  if (!currentUser || !currentUser.isTestAccount) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-between bg-yellow-100 px-4 py-2 text-sm rounded-lg mt-4">
      <div>
        <span className="font-medium">Test Account Mode</span> - Currently viewing as <span className="font-medium">{currentUser.role}</span>
      </div>
      <button
        onClick={() => navigate('/test-account/select-role')}
        className="ml-4 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
      >
        Switch Role
      </button>
    </div>
  );
};

export default TestAccountBanner;