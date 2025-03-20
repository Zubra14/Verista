// src/components/auth/RoleSelection.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import supabase from '../../lib/supabase';
import LoadingSpinner from '../common/LoadingSpinner';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    setIsLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Update user metadata with role
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: selectedRole }
      });

      if (updateError) throw updateError;

      // Check if profile exists
      const { data: profileData, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.user.id)
        .single();

      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        throw profileCheckError;
      }

      if (!profileData) {
        // Create profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.user.id,
            name: user.user.user_metadata?.name || user.user.email.split('@')[0],
            email: user.user.email,
            role: selectedRole,
            created_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      } else {
        // Update profile
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({ role: selectedRole })
          .eq('id', user.user.id);

        if (updateProfileError) throw updateProfileError;
      }

      toast.success(`Role set to ${selectedRole}`);
      navigate(`/dashboard/${selectedRole}`);
    } catch (error) {
      console.error('Role selection error:', error);
      toast.error(error.message || 'Failed to set role');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/favicon.svg" alt="Verista" className="h-12 w-auto mx-auto mb-2" />
          <span className="text-2xl font-bold text-blue-600">Verista</span>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Select Your Role
          </h2>
          <p className="mt-2 text-gray-600">
            Please select your role to complete your account setup
          </p>
        </div>

        <div className="bg-white py-8 px-10 shadow rounded-lg">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setSelectedRole('parent')}
              className={`w-full py-3 px-4 text-left rounded-md ${
                selectedRole === 'parent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-2">👨‍👩‍👧‍👦</span>
                <div>
                  <div className="font-medium">Parent</div>
                  <div className="text-sm opacity-80">Register as a parent with children in school</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('driver')}
              className={`w-full py-3 px-4 text-left rounded-md ${
                selectedRole === 'driver'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-2">🚗</span>
                <div>
                  <div className="font-medium">Driver</div>
                  <div className="text-sm opacity-80">Register as a school transport driver</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('school')}
              className={`w-full py-3 px-4 text-left rounded-md ${
                selectedRole === 'school'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-2">🏫</span>
                <div>
                  <div className="font-medium">School</div>
                  <div className="text-sm opacity-80">Register as a school administrator</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('government')}
              className={`w-full py-3 px-4 text-left rounded-md ${
                selectedRole === 'government'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-2">🏛️</span>
                <div>
                  <div className="font-medium">Government</div>
                  <div className="text-sm opacity-80">Register as a government official</div>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={handleRoleSelection}
              disabled={!selectedRole}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white ${
                !selectedRole
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;