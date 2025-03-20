// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";
import { toast } from "react-toastify";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Connection state manager implementation
const connectionState = {
  _connected: navigator.onLine,
  _checking: false,
  _error: null,
  _listeners: [],

  setConnected(isConnected, error = null) {
    this._connected = isConnected;
    this._error = error;
    this._checking = false;

    // Notify listeners of state change
    if (this._listeners && this._listeners.length > 0) {
      this._listeners.forEach((listener) => listener(isConnected, error));
    }
  },

  isConnected() {
    return this._connected;
  },

  isChecking() {
    return this._checking;
  },

  getLastError() {
    return this._error;
  },

  addListener(callback) {
    if (typeof callback === "function") {
      this._listeners.push(callback);
    }
    return () => {
      this._listeners = this._listeners.filter((l) => l !== callback);
    };
  },
};

// Configurable retry parameters
const RETRY_COUNT = 3;
const RETRY_DELAY = 1000; // ms

// Create an enhanced fetch function with retry logic and error detection
const enhancedFetch = async (url, options) => {
  let lastError;
  let retryCount = 0;

  // Check if it's a critical request that should not retry on policy errors
  const isCriticalRequest = url.includes("/auth/") || url.includes("/storage/");

  while (retryCount < RETRY_COUNT) {
    try {
      const response = await fetch(url, options);

      // Handle successful responses
      if (response.ok) return response;

      // Try to parse error response to check for policy recursion
      try {
        const errorData = await response.clone().json();

        // If we detect a policy recursion error, and it's not a critical request,
        // we might want to skip retrying as it won't help
        if (
          isDatabasePolicyError(errorData) &&
          !isCriticalRequest &&
          retryCount > 0
        ) {
          console.warn("Policy recursion detected, skipping further retries");
          throw createPolicyError(errorData);
        }
      } catch (parseError) {
        // Ignore parse errors, just continue with retry
      }

      lastError = new Error(`HTTP error ${response.status}`);
      lastError.response = response;
    } catch (err) {
      lastError = err;
      console.warn(`Supabase request attempt ${retryCount + 1} failed:`, err);
    }

    // Wait before retrying
    if (retryCount < RETRY_COUNT - 1) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY * (retryCount + 1)));
    }

    retryCount++;
  }

  throw lastError;
};

// Create client with enhanced configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "verista_auth",
  },
  global: {
    headers: { "x-application-name": "verista" },
  },
  fetch: enhancedFetch,
});

// Helper function to create a properly formatted policy error
function createPolicyError(errorData) {
  const error = new Error(
    errorData.message || "Database policy recursion detected"
  );
  error.code = errorData.code || "POLICY_RECURSION";
  error.details = errorData.details;
  error.hint = errorData.hint;
  error.isPolicyError = true;
  return error;
}

// Enhanced error detection utilities
export const isDatabasePolicyError = (error) => {
  if (!error) return false;

  return (
    error?.code === "42P17" ||
    (error?.message &&
      (error.message.includes("recursion detected in policy") ||
        error.message.includes("infinite recursion"))) ||
    (error?.details &&
      (error.details.includes("infinite recursion") ||
        error.details.includes("detected in policy for relation"))) ||
    error?.isPolicyError === true
  );
};

export const isNetworkError = (error) => {
  return (
    error instanceof TypeError ||
    (error?.message &&
      (error.message.includes("network") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("Network Error")))
  );
};

// Safe table access for initialization
const safeSystemTables = [
  "pg_catalog.pg_tables",
  "pg_catalog.pg_namespace",
  "pg_catalog.pg_type",
];

// Connection initialization with proper sequencing and fallbacks
let initializationPromise = null;

export const initializeSupabase = async () => {
  if (initializationPromise) return initializationPromise;

  initializationPromise = new Promise(async (resolve, reject) => {
    try {
      // Try a safe system table first
      const { data: systemData, error: systemError } = await supabase
        .from(safeSystemTables[0])
        .select("tablename")
        .eq("schemaname", "public")
        .limit(1);

      // If system query fails, try auth check
      if (systemError) {
        const { data: authData, error: authError } =
          await supabase.auth.getSession();
        if (authError) throw authError;
      }

      connectionState.setConnected(true);
      console.log("Database initialization successful");

      // Now check if we have policy errors with problematic tables
      await verifyTableAccess();

      resolve(true);
    } catch (error) {
      console.error("Database initialization failed:", error);

      if (isDatabasePolicyError(error)) {
        // For policy errors, we still mark as connected but log the issue
        console.warn("Connected with policy limitations");
        connectionState.setConnected(true, error);
        resolve({ connected: true, limitedAccess: true, error });
      } else {
        connectionState.setConnected(false, error);
        reject(error);
      }
    }
  });

  return initializationPromise;
};

// Verify access to key tables and detect policy issues
export const verifyTableAccess = async () => {
  const criticalTables = ["profiles", "students", "vehicles", "trips"];
  const results = {};

  for (const table of criticalTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("count(*)")
        .limit(1)
        .maybeSingle();

      results[table] = { success: !error, error };

      if (error && isDatabasePolicyError(error)) {
        console.warn(`Policy issue detected with table: ${table}`, error);
        // Log the error but don't fail initialization
      }
    } catch (err) {
      results[table] = { success: false, error: err };
    }
  }

  return results;
};

// Fallback initialization that bypasses problematic tables
export const establishMinimalConnection = async () => {
  try {
    // Test connection using system catalog tables not affected by RLS
    for (const sysTable of safeSystemTables) {
      try {
        const { data, error } = await supabase
          .from(sysTable)
          .select("*")
          .limit(1);

        if (!error) {
          console.log(`System table access successful: ${sysTable}`);
          return { success: true, mode: "system-tables" };
        }
      } catch (err) {
        console.warn(`Failed accessing system table ${sysTable}:`, err);
      }
    }

    // Fall back to auth check which doesn't require table access
    const { data: authData, error: authError } =
      await supabase.auth.getSession();

    if (authError) {
      return { success: false, error: authError };
    }

    return { success: true, mode: "auth-only" };
  } catch (err) {
    return { success: false, error: err };
  }
};

// Enhanced connection test with fallbacks
export const testSupabaseConnection = async (force = false) => {
  if (!force && initializationPromise) {
    try {
      await initializationPromise;
      return { success: true };
    } catch (error) {
      // Fall through to re-test
    }
  }

  try {
    // Try multiple system tables
    for (const sysTable of safeSystemTables) {
      try {
        const { data, error } = await supabase
          .from(sysTable)
          .select("*")
          .limit(1);

        if (!error) {
          connectionState.setConnected(true);
          return { success: true, mode: "system-tables" };
        }
      } catch (err) {
        // Continue to next system table
      }
    }

    // Try fallback to auth check
    const { data: authData, error: authError } =
      await supabase.auth.getSession();

    if (authError) {
      connectionState.setConnected(false, authError);
      return { success: false, error: authError };
    }

    connectionState.setConnected(true);
    return { success: true, mode: "auth-only" };
  } catch (error) {
    connectionState.setConnected(false, error);
    return {
      success: false,
      error,
      message:
        "Unable to connect to the database. The application will work in offline mode.",
    };
  }
};

// Enhanced error handler function with comprehensive error type detection
export const handleSupabaseError = (
  error,
  customMessage = "Operation failed"
) => {
  console.error("Supabase error:", error);

  // Determine error type and appropriate message
  let errorMessage = customMessage;
  let errorType = "unknown";
  let shouldToast = true;

  if (isDatabasePolicyError(error)) {
    errorType = "policy_error";
    errorMessage =
      "Data access permission issue detected. This is a known issue that is being addressed. Please try again or contact support with code: RLS-POLICY";
  } else if (isNetworkError(error)) {
    errorType = "network_error";
    errorMessage =
      "Network connection issue. Please check your internet connection.";
  } else if (error?.code === "42703") {
    errorType = "column_error";
    errorMessage = "Database schema error. Please update your application.";
  } else if (error?.code === "23505") {
    errorType = "duplicate_error";
    errorMessage = "This record already exists.";
  } else if (error?.message) {
    // Use the error message if none of the specific types match
    errorMessage = error.message;

    // Don't display auth errors as toasts in certain cases
    if (
      error.message.includes("JWT expired") ||
      error.message.includes("Invalid token") ||
      error.message.includes("No session found")
    ) {
      shouldToast = false;
    }
  }

  // Log for analytics and debugging
  console.error(`Supabase ${errorType} error:`, error);

  // Display error to user
  if (shouldToast) {
    toast.error(errorMessage, {
      autoClose: 5000,
      closeButton: true,
    });
  }

  return { error: errorMessage, errorType };
};

// Safe data access wrapper
export const safeDataAccess = async (table, action, query = {}) => {
  try {
    let builder = supabase.from(table);

    switch (action) {
      case "select":
        builder = builder.select(query.select || "*");
        break;
      case "insert":
        builder = builder.insert(query.data);
        break;
      case "update":
        builder = builder.update(query.data);
        break;
      case "delete":
        builder = builder.delete();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Apply filters if provided
    if (query.filters) {
      for (const [key, value] of Object.entries(query.filters)) {
        builder = builder.eq(key, value);
      }
    }

    // Apply limit if provided
    if (query.limit) {
      builder = builder.limit(query.limit);
    }

    // Execute the query
    const { data, error } = await builder;

    if (error) {
      // Handle policy errors with clear information
      if (isDatabasePolicyError(error)) {
        console.warn(`Policy error accessing ${table}`, error);
        return {
          data: null,
          error: {
            message: `Permission issue accessing ${table}`,
            details: error.details || error.message,
            code: error.code || "POLICY_ERROR",
          },
        };
      }
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error(`Error in safeDataAccess for ${table}:`, err);
    return { data: null, error: err };
  }
};

// Connection status tracker
let isOnline = navigator.onLine;
export const getConnectionStatus = () => isOnline;

// Update connection status
window.addEventListener("online", () => {
  isOnline = true;
  connectionState.setConnected(true);
  toast.success("Connection restored. Synchronizing data...");

  // Reinitialize connection when coming back online
  initializeSupabase().catch((error) => {
    console.error("Failed to reinitialize connection:", error);
  });
});

window.addEventListener("offline", () => {
  isOnline = false;
  connectionState.setConnected(false);
  toast.warn("You are offline. Limited functionality available.");
});

export { connectionState };
export default supabase;
