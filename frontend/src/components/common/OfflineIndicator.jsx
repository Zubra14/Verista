// src/components/common/OfflineIndicator.jsx
import React, { useEffect, useState } from "react";
import { connectionState } from "../../lib/supabase";

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    // Check for pending operations
    const checkPendingOperations = async () => {
      try {
        const db = await openDB("verista-offline-db", 1);
        const tx = db.transaction("pendingOperations", "readonly");
        const store = tx.objectStore("pendingOperations");
        const count = await store.count();
        setPendingChanges(count);
      } catch (err) {
        console.error("Error checking pending operations:", err);
      }
    };

    const handleOnlineStatusChange = () => {
      setIsOffline(!navigator.onLine);
      if (navigator.onLine) {
        // When coming back online, check for pending operations
        checkPendingOperations();
      }
    };

    // Set up event listeners
    window.addEventListener("online", handleOnlineStatusChange);
    window.addEventListener("offline", handleOnlineStatusChange);

    // Set up listener for connection state changes
    const unsubscribe = connectionState.addListener((isConnected) => {
      setIsOffline(!isConnected);
      if (isConnected) {
        checkPendingOperations();
      }
    });

    // Initial check
    checkPendingOperations();

    return () => {
      window.removeEventListener("online", handleOnlineStatusChange);
      window.removeEventListener("offline", handleOnlineStatusChange);
      unsubscribe();
    };
  }, []);

  if (!isOffline && pendingChanges === 0) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 shadow-lg rounded-lg ${
        isOffline ? "bg-red-50" : "bg-yellow-50"
      }`}
    >
      <div className="p-4">
        {isOffline ? (
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                You are offline
              </h3>
              <p className="text-xs text-red-700 mt-1">
                Limited functionality available. Changes will sync when back
                online.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Syncing changes
              </h3>
              <p className="text-xs text-yellow-700 mt-1">
                {pendingChanges} pending{" "}
                {pendingChanges === 1 ? "change" : "changes"} to sync
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
