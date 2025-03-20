// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import supabase, { handleSupabaseError } from '../lib/supabase';
import { testSupabaseConnection } from '../lib/supabase';

// Create the context first
const AuthContext = createContext(null);

// Create and export the provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Function to check if the account is a test account
  const isTestAccount = (email) => {
    return email === 'veristatest@gmail.com';
  };

  // Update user role function (for test account)
  const updateUserRole = async (role) => {
    if (!currentUser) return { error: { message: 'No user logged in' } };
    
    if (!isTestAccount(currentUser.email)) {
      return { error: { message: 'Role updating is only available for test accounts' } };
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      // Update local user state
      setCurrentUser({
        ...currentUser,
        role
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating role:', error);
      return { error };
    }
  };

  // Enhanced session recovery
  useEffect(() => {
    const recoverSession = async () => {
      if (!token) {
        setLoading(false);
        setSessionChecked(true);
        return;
      }

      try {
        // Check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          setToken(session.access_token);
          localStorage.setItem('token', session.access_token);
          
          // Get user profile data
          const { data: userData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.warn('Profile data not found, user may need to complete registration');
            setCurrentUser({
              ...session.user,
              isTestAccount: isTestAccount(session.user.email),
            });
          } else {
            setCurrentUser({
              ...session.user,
              ...userData,
              isTestAccount: isTestAccount(session.user.email),
            });
          }
        } else {
          // If no session, clear token
          localStorage.removeItem('token');
          setToken(null);
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Session recovery failed:', err);
        localStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
      } finally {
        setSessionChecked(true);
        setLoading(false);
      }
    };
    
    recoverSession();
    
    // Session monitoring for token refresh and expiry
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
        if (session) {
          setToken(session.access_token);
          localStorage.setItem('token', session.access_token);
        }
      } else if (event === 'SIGNED_IN' && session) {
        setToken(session.access_token);
        localStorage.setItem('token', session.access_token);
        
        // Update user data
        (async () => {
          try {
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (userError) throw userError;
            
            setCurrentUser({
              ...session.user,
              ...userData,
              isTestAccount: isTestAccount(session.user.email),
            });
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        })();
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setToken(null);
        setCurrentUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('isTestAccount');
        toast.info('You have been signed out');
      }
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [token]);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      
      // Validate input
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) throw error;

      // Special handling for test account
      if (isTestAccount(data.user.email)) {
        localStorage.setItem('token', data.session.access_token);
        localStorage.setItem('isTestAccount', 'true');
        
        setCurrentUser({
          ...data.user,
          isTestAccount: true
        });
        
        setError(null);
        toast.success('Test account login successful');
        
        return { success: true, isTestAccount: true };
      }

      // Regular user flow continues
      localStorage.setItem('token', data.session.access_token);
      setToken(data.session.access_token);
      
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (profileError) throw profileError;
      
      setCurrentUser({
        ...data.user,
        ...profileData
      });
      
      setError(null);
      toast.success('Login successful');
      return { success: true, data: profileData };
    } catch (err) {
      handleSupabaseError(err, 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      
      if (isTestAccount(userData.email)) {
        throw new Error('This email is reserved for testing purposes. Please use a different email.');
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      });

      if (error) throw error;

      const { session, user } = data;
      
      if (!session) {
        toast.info('Please check your email to confirm your registration');
        return { success: true, emailConfirmationRequired: true };
      }
      
      // Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          created_at: new Date()
        }]);
        
      if (profileError) throw profileError;
      
      localStorage.setItem('token', session.access_token);
      setToken(session.access_token);
      setCurrentUser({
        ...user,
        role: userData.role,
        name: userData.name,
        phone: userData.phone
      });
      
      setError(null);
      toast.success('Registration successful');
      return { success: true, user };
    } catch (err) {
      setError(err.message || 'Registration failed');
      toast.error(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('isTestAccount');
      setToken(null);
      setCurrentUser(null);
      toast.success('Logged out successfully');
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Logout failed');
      return { success: false, error: err };
    }
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return currentUser?.role === role;
  };

  // Additional utility methods
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success('Password reset link sent to your email');
      return { success: true };
    } catch (err) {
      return handleSupabaseError(err, 'Failed to send password reset email');
    }
  };

  // Update user profile (for all users, not just test accounts)
  const updateUserProfile = async (updates) => {
    if (!currentUser) return { error: 'No user logged in' };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      // Update local user state
      setCurrentUser({
        ...currentUser,
        ...updates
      });
      
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      return handleSupabaseError(error, 'Failed to update profile');
    }
  };

  // Test Supabase connection during app startup
  useEffect(() => {
    testSupabaseConnection().then(({ success, error }) => {
      if (success) {
        console.log('Successfully connected to Supabase');
      } else {
        console.error('Failed to connect to Supabase:', error);
      }
    });
  }, []);

  // Value to be provided to consumers
  const value = {
    currentUser,
    setCurrentUser,
    token,
    loading,
    error,
    login,
    register,
    logout,
    hasRole,
    updateUserRole,
    isTestAccount,
    isAuthenticated: !!currentUser,
    resetPassword,
    updateUserProfile,
    sessionChecked,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Create and export the hook separately
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}