import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { IntercomProvider } from "react-use-intercom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import supabase from './lib/supabase';
import { testSupabaseConnection } from './lib/supabase';
import { initializeApp } from './utils/appInitializer';
import ConnectivityManager from './components/common/ConnectivityManager';

// Auth provider
import { AuthProvider, useAuth } from './context/AuthContext';

// Import components
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import Hero from "./components/Hero";
import VideoSection from "./components/VideoSection";
import KeyBenefits from "./components/dashboard/KeyBenefits";
import HowItWorksSection from "./components/HowItWorksSection";
import TestimonialsSection from "./components/TestimonialsSection";
import StatsSection from "./components/StatsSection";
import ParentDashboard from "./components/dashboard/ParentDashboard";
import LoginForm from "./components/auth/LoginForm";
import SignupForm from "./components/auth/SignupForm";
import DriverDashboard from "./components/dashboard/DriverDashboard";
import SchoolDashboard from "./components/dashboard/SchoolDashboard";
import GovernmentDashboard from "./components/dashboard/GovernmentDashboard";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";
import AuthCallback from "./components/auth/AuthCallback";
import RoleSelection from "./components/auth/RoleSelection";
import TestAccountRoleSelector from "./components/auth/TestAccountRoleSelector"; // Import TestAccountRoleSelector

const INTERCOM_APP_ID = "vzrjxxpp";

// Component for authentication buttons page
const AuthButtons = () => {
  const handleSocialLogin = async (provider) => {
    try {
      // Show loading toast
      toast.info(`Connecting to ${provider}...`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // Optional parameters to pass to the OAuth provider
            prompt: 'select_account', // Forces Google to always show account selection
          }
        }
      });
      
      if (error) throw error;
      
      // User will be redirected to OAuth provider
      // No further code execution here as page will unload
    } catch (error) {
      console.error(`Error with ${provider} sign in:`, error);
      toast.error(`Failed to sign in with ${provider}: ${error.message}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">Select Your Role</h2>
          <div className="grid gap-4 mb-6">
            <a href="/login/parent" className="block w-full py-3 px-4 text-center bg-blue-600 text-white rounded-md hover:bg-blue-700">Parent</a>
            <a href="/login/driver" className="block w-full py-3 px-4 text-center bg-green-600 text-white rounded-md hover:bg-green-700">Driver</a>
            <a href="/login/school" className="block w-full py-3 px-4 text-center bg-yellow-600 text-white rounded-md hover:bg-yellow-700">School</a>
            <a href="/login/government" className="block w-full py-3 px-4 text-center bg-purple-600 text-white rounded-md hover:bg-purple-700">Government</a>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center w-full py-3 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
            
            <button
              onClick={() => handleSocialLogin('facebook')}
              className="flex items-center justify-center w-full py-3 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm mt-3"
            >
              <svg className="h-5 w-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Sign in with Facebook
            </button>
            
            <button
              onClick={() => handleSocialLogin('apple')}
              className="flex items-center justify-center w-full py-3 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm mt-3"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.7023 12.6235C16.7083 11.9857 16.8477 11.3579 17.1137 10.7832C17.3797 10.2085 17.7657 9.70073 18.2423 9.29998C17.8151 8.71405 17.26 8.24042 16.6223 7.91998C15.9847 7.59954 15.2826 7.43914 14.5743 7.44998C13.0703 7.31398 11.6223 8.42198 10.8543 8.42198C10.0703 8.42198 8.87834 7.46598 7.62234 7.49198C6.76713 7.51767 5.93525 7.77093 5.2077 8.22598C4.48016 8.68103 3.88394 9.32254 3.48034 10.084C1.69834 13.394 2.99634 18.224 4.70234 20.874C5.55634 22.174 6.55634 23.624 7.88034 23.574C9.16034 23.518 9.66234 22.746 11.2023 22.746C12.7263 22.746 13.1943 23.574 14.5443 23.542C15.9423 23.518 16.8103 22.226 17.6343 20.918C18.2636 19.9909 18.751 18.9771 19.0823 17.91C18.4936 17.6312 17.9865 17.1919 17.6178 16.6411C17.2491 16.0903 17.0323 15.4483 16.9903 14.782L16.7023 12.6235Z"/>
                <path d="M13.9323 6.01C14.6963 5.10103 15.0393 3.90823 14.8663 2.726C13.7022 2.8634 12.6547 3.53452 11.9998 4.55C11.6757 5.03153 11.4556 5.57552 11.3537 6.14682C11.2517 6.71812 11.2699 7.30464 11.4073 7.868C12.0054 7.88351 12.5963 7.73176 13.1163 7.432C13.6363 7.13223 14.0667 6.69497 14.3583 6.166L13.9323 6.01Z"/>
              </svg>
              Sign in with Apple
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

function AppContent() {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="App flex flex-col min-h-screen">
      <Routes>
        {/* Home route with enhanced UI components */}
        <Route path="/" element={
          <>
            <Navbar />
            <main>
              <Hero />
              <VideoSection />
              <KeyBenefits />
              <HowItWorksSection />
              <TestimonialsSection />
              <StatsSection />
            </main>
            <Footer />
          </>
        } />
        
        {/* Features route */}
        <Route path="/features" element={
          <>
            <Navbar />
            <main className="pt-20">
              <KeyBenefits />
              <HowItWorksSection />
            </main>
            <Footer />
          </>
        } />
        
        {/* How it works route */}
        <Route path="/how-it-works" element={
          <>
            <Navbar />
            <main className="pt-20">
              <VideoSection />
              <HowItWorksSection />
            </main>
            <Footer />
          </>
        } />
        
        {/* Authentication Routes */}
        <Route path="/login" element={
          currentUser ? <Navigate to={`/dashboard/${currentUser.role}`} replace /> : <AuthButtons />
        } />
        
        <Route path="/login/:role" element={
          currentUser ? <Navigate to={`/dashboard/${currentUser.role}`} replace /> : (
            <>
              <Navbar />
              <main className="pt-20 pb-16">
                <LoginForm />
              </main>
              <Footer />
            </>
          )
        } />
        
        <Route path="/signup" element={
          currentUser ? <Navigate to={`/dashboard/${currentUser.role}`} replace /> : (
            <>
              <Navbar />
              <main className="pt-20 pb-16">
                <SignupForm />
              </main>
              <Footer />
            </>
          )
        } />
        
        {/* Auth Callback Route */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Role Selection Route */}
        <Route path="/select-role" element={<RoleSelection />} />
        
        {/* Test Account Role Selection Route */}
        <Route path="/test-account/select-role" element={<TestAccountRoleSelector />} />
        
        {/* Dashboard Routes with Protection */}
        <Route path="/dashboard/parent/*" element={
          <ProtectedRoute requiredRole="parent">
            <ParentDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard/driver/*" element={
          <ProtectedRoute requiredRole="driver">
            <DriverDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard/school/*" element={
          <ProtectedRoute requiredRole="school">
            <SchoolDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard/government/*" element={
          <ProtectedRoute requiredRole="government">
            <GovernmentDashboard />
          </ProtectedRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}

function App() {
  // Call during app startup
  useEffect(() => {
    testSupabaseConnection().then(({ success, error }) => {
      if (success) {
        console.log('Successfully connected to Supabase');
      } else {
        console.error('Failed to connect to Supabase:', error);
      }
    });

    initializeApp();
  }, []);

  return (
    <IntercomProvider appId={INTERCOM_APP_ID}>
      <AuthProvider>
        <ConnectivityManager />
        <AppContent />
      </AuthProvider>
    </IntercomProvider>
  );
}

export default App;