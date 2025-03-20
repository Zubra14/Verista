// src/lib/supabaseErrorHandler.js
import { toast } from "react-toastify";

/**
 * Specialized error handler for Supabase policy and permission errors
 */
export const handlePolicyError = (error, context = "operation") => {
  console.error("Policy error detected:", error);

  // Check for recursion error which is common in RLS policies
  if (
    error?.message?.includes("recursion detected in policy") ||
    error?.code === "42P17"
  ) {
    toast.error(
      `Database policy error detected. Please contact support with code: POLICY-${
        error.code || "RECURSION"
      }`,
      {
        autoClose: false,
      }
    );
    return {
      type: "policy_error",
      message: "Permission settings are preventing data access",
      details: error.message,
      code: error.code,
    };
  }

  // Check for permission errors
  if (
    error?.message?.includes("permission denied") ||
    error?.message?.includes("Limited permissions") ||
    error?.code === "42501"
  ) {
    toast.warning(`Limited data access. Some features may be unavailable.`, {
      autoClose: 10000,
    });
    return {
      type: "permission_error",
      message: "You have limited permissions for this operation",
      details: error.message,
      code: error.code,
    };
  }

  // Handle server errors (500)
  if (
    error?.status === 500 ||
    (typeof error?.message === "string" && error?.message.includes("500"))
  ) {
    toast.error(`Server error encountered. Using local data where available.`, {
      autoClose: 7000,
    });
    return {
      type: "server_error",
      message: "The database server encountered an error",
      details: error.message,
      code: error.status || 500,
    };
  }

  // Default error
  toast.error(`Error during ${context}: ${error?.message || "Unknown error"}`, {
    autoClose: 5000,
  });

  return {
    type: "general_error",
    message: `Error during ${context}`,
    details: error?.message,
    code: error?.code || "UNKNOWN",
  };
};

/**
 * Check if an error is related to policy recursion
 */
export const isPolicyRecursionError = (error) => {
  if (!error) return false;

  return (
    error.code === "42P17" ||
    (error.message && error.message.includes("recursion detected in policy")) ||
    (error.details && error.details.includes("infinite recursion"))
  );
};

/**
 * Handle query errors with fallback options
 */
export const safeQuery = async (
  queryPromise,
  fallbackData = null,
  context = "query"
) => {
  try {
    const result = await queryPromise;

    if (result.error) {
      handlePolicyError(result.error, context);
      return { data: fallbackData, error: result.error, usedFallback: true };
    }

    return { data: result.data, error: null, usedFallback: false };
  } catch (error) {
    handlePolicyError(error, context);
    return { data: fallbackData, error, usedFallback: true };
  }
};

export default {
  handlePolicyError,
  isPolicyRecursionError,
  safeQuery,
};
