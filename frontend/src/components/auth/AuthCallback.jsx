// src/components/auth/AuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import supabase from '../../lib/supabase';
import LoadingSpinner from '../common/LoadingSpinner';

const AuthCallback = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session data
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!data.session) {
          throw new Error('No session found');
        }
        
        // Check for test account
        if (data.session.user.email === 'veristatest@gmail.com') {
          localStorage.setItem('isTestAccount', 'true');
          toast.success('Test account authenticated successfully');
          navigate('/test-account/select-role');
          return;
        }
        
        // Continue with normal flow for regular users
        console.log('User authenticated:', data.session.user);
        
        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();
        
        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create one
          // Check if user metadata has a role
          const userRole = data.session.user.user_metadata?.role || 'parent';
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.session.user.id,
              name: data.session.user.user_metadata?.name || data.session.user.email.split('@')[0],
              email: data.session.user.email,
              role: userRole,
              created_at: new Date().toISOString()
            });
          
          if (insertError) throw insertError;
          
          toast.success('Account created successfully!');
          navigate(`/dashboard/${userRole}`);
        } else if (profileError) {
          // Handle other profile retrieval errors
          throw profileError;
        } else {
          // Profile exists, redirect to dashboard
          toast.success('Logged in successfully!');
          navigate(`/dashboard/${profileData.role}`);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        toast.error(err.message || 'Authentication failed');
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Authentication Error</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <p className="mt-4 text-gray-500">Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <LoadingSpinner />
      <p className="mt-4 text-gray-600">Completing authentication...</p>
    </div>
  );
};

export default AuthCallback;