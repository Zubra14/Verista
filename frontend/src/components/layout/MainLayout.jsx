// src/components/layout/MainLayout.jsx
import React, { useEffect, useState } from "react";
import { connectionState, testSupabaseConnection } from "../../lib/supabase";

const MainLayout = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasConnectionIssue, setHasConnectionIssue] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (navigator.onLine) {
        const { success } = await testSupabaseConnection(false);
        setHasConnectionIssue(!success);
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      checkConnection();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    checkConnection();

    // Periodic check
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {(!isOnline || hasConnectionIssue) && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white p-2 text-center z-50">
          {!isOnline
            ? "You are currently offline. Using cached data."
            : "Connection issues detected. Some features may be limited."}
        </div>
      )}
      {children}
    </div>
  );
};

export default MainLayout;
