// src/components/common/ConnectivityManager.jsx
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  testSupabaseConnection,
  isDatabasePolicyError,
} from "../../lib/supabase";

const ConnectivityManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dbConnected, setDbConnected] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [notificationKey, setNotificationKey] = useState(0);
  const [lastChecked, setLastChecked] = useState(Date.now());

  const checkDatabaseConnection = useCallback(
    async (showToasts = true) => {
      // Skip frequent rechecks (throttling)
      const now = Date.now();
      if (now - lastChecked < 5000) return; // Skip if checked in last 5 seconds
      setLastChecked(now);

      const result = await testSupabaseConnection();
      setDbConnected(result.success);

      if (!result.success && isOnline) {
        setConnectionError(result);

        // Display specific messages based on error type
        if (showToasts) {
          if (result.type === "policy_error") {
            toast.error(
              result.message ||
                "Database policy issue detected. Some features may be limited.",
              {
                autoClose: false, // Keep this visible until addressed
                className: "database-error-notification",
                toastId: `db-policy-error-${notificationKey}`,
              }
            );
          } else {
            toast.warning(
              result.message ||
                "Database connection issue detected. Some features may be limited.",
              {
                autoClose: 10000, // Show for 10 seconds
                className: "database-error-notification",
                toastId: `db-conn-warning-${notificationKey}`,
              }
            );
          }
        }
      } else if (result.success && connectionError) {
        // Clear error state when connection is restored
        setConnectionError(null);
        if (showToasts) {
          toast.success("Database connection restored.", { autoClose: 3000 });
        }
      }
    },
    [isOnline, connectionError, notificationKey, lastChecked]
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.info(
        "Network connection restored. Checking database connection..."
      );
      checkDatabaseConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setDbConnected(false);
      toast.warning("You are offline. Working in limited functionality mode.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial connection check (silent on startup)
    checkDatabaseConnection(false);

    // Periodic connection checks when online
    let interval;
    if (isOnline) {
      interval = setInterval(() => checkDatabaseConnection(true), 60000); // Check every minute
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (interval) clearInterval(interval);
    };
  }, [isOnline, checkDatabaseConnection]);

  // Add notification deduplication
  useEffect(() => {
    if (!dbConnected && isOnline) {
      // Increment notification key to ensure uniqueness
      setNotificationKey((prev) => prev + 1);
    }
  }, [dbConnected, isOnline]);

  // Determine appropriate message and styling based on error type
  const getMessage = () => {
    if (!isOnline) {
      return {
        message: "You are offline. Some features may be unavailable.",
        bgColor: "bg-amber-500",
      };
    }

    if (!dbConnected) {
      if (connectionError?.type === "policy_error") {
        return {
          message:
            "Database policy error detected. Working in limited functionality mode.",
          bgColor: "bg-red-500",
        };
      } else if (connectionError?.type === "network_error") {
        return {
          message:
            "Network connection to database unavailable. Working in limited functionality mode.",
          bgColor: "bg-amber-500",
        };
      } else {
        return {
          message:
            "Database connection issue detected. Working in limited functionality mode.",
          bgColor: "bg-amber-500",
        };
      }
    }

    return null;
  };

  const errorDisplay = getMessage();

  if (!errorDisplay) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 ${errorDisplay.bgColor} text-white py-2 px-4 text-center z-50 flex justify-center items-center shadow-md`}
    >
      <span>{errorDisplay.message}</span>
      {connectionError?.type === "policy_error" && (
        <button
          className="ml-4 px-3 py-1 bg-white text-red-600 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-500"
          onClick={() => window.location.reload()}
        >
          Refresh Application
        </button>
      )}
      {connectionError?.type !== "policy_error" && (
        <button
          className="ml-4 px-3 py-1 bg-white text-amber-600 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white"
          onClick={() => checkDatabaseConnection(true)}
        >
          Retry Connection
        </button>
      )}
    </div>
  );
};

export default ConnectivityManager;
