// src/components/dashboard/dashboard-modules/driver/MyVehicle.jsx
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import supabase from "../../../../lib/supabase";
import vehicleService from "../../../../services/vehicleService";

export const MyVehicle = () => {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maintenanceReport, setMaintenanceReport] = useState("");
  const [reportIssue, setReportIssue] = useState({
    type: "mechanical",
    description: "",
  });
  const [isFallbackData, setIsFallbackData] = useState(false);

  // Enhanced vehicle fetching with multiple fallback strategies
  const fetchVehicle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        throw new Error("Authentication error: " + userError.message);
      }

      if (!userData?.user) {
        throw new Error("Not authenticated");
      }

      // Use our specialized service to get vehicle data
      const { data, error, isFallback } = await vehicleService.getDriverVehicle(
        userData.user.id
      );

      if (error) {
        throw error;
      }

      if (isFallback) {
        toast.warning("Using demo data due to database connection issues");
        setIsFallbackData(true);
      }

      setVehicle(data);
    } catch (err) {
      console.error("Failed to load vehicle:", err);
      setError(
        "Database permission issue detected. Please try again later or contact support."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  // Submit maintenance report
  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();

    if (!maintenanceReport.trim()) {
      toast.warning("Please enter a maintenance report");
      return;
    }

    try {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user || !vehicle) {
        throw new Error("Not authenticated or no vehicle assigned");
      }

      const result = await vehicleService.submitMaintenanceReport(
        vehicle.id,
        userData.user.id,
        maintenanceReport
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      if (result.partial) {
        toast.info(
          "Maintenance report submitted, but vehicle status could not be updated"
        );
      } else {
        toast.success("Maintenance report submitted successfully");
      }

      // Update local state
      setVehicle({ ...vehicle, status: "maintenance" });
      setMaintenanceReport("");
    } catch (err) {
      console.error("Failed to submit maintenance report:", err);
      toast.error(
        "Failed to submit report: " + (err.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  // Report vehicle issue
  const handleIssueSubmit = async (e) => {
    e.preventDefault();

    if (!reportIssue.description.trim()) {
      toast.warning("Please describe the issue");
      return;
    }

    try {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user || !vehicle) {
        throw new Error("Not authenticated or no vehicle assigned");
      }

      const result = await vehicleService.reportIssue(
        vehicle.id,
        userData.user.id,
        reportIssue.type,
        reportIssue.description
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(`Issue reported: ${reportIssue.type}`);
      setReportIssue({ type: "mechanical", description: "" });
    } catch (err) {
      console.error("Failed to report issue:", err);
      toast.error(
        "Failed to report issue: " + (err.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  // Format dates safely
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  // Determine status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={fetchVehicle}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-6">
        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-md">
          <p className="text-yellow-700">
            No vehicle is currently assigned to you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {isFallbackData && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
          <p className="font-medium">Demo Mode</p>
          <p>
            Using sample data while database connection issues are being
            resolved.
          </p>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">My Vehicle</h2>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              {vehicle.make} {vehicle.model}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                vehicle.status
              )}`}
            >
              {vehicle.status?.charAt(0).toUpperCase() +
                vehicle.status?.slice(1) || "Unknown"}
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            Registration: {vehicle.registration}
          </p>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Vehicle Details</h4>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Make:</span> {vehicle.make}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Model:</span> {vehicle.model}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Registration:</span>{" "}
                  {vehicle.registration}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Capacity:</span>{" "}
                  {vehicle.capacity || "Not available"} passengers
                </p>
                <p className="text-sm">
                  <span className="font-medium">Features:</span>{" "}
                  {vehicle.features &&
                  Array.isArray(vehicle.features) &&
                  vehicle.features.length > 0
                    ? vehicle.features
                        .map((f) => f.replace("_", " "))
                        .join(", ")
                    : "None specified"}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Maintenance Information</h4>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Last Inspection:</span>{" "}
                  {formatDate(vehicle.last_inspection)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Next Inspection Due:</span>{" "}
                  {formatDate(vehicle.next_inspection_due)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Status:</span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                      vehicle.status
                    )}`}
                  >
                    {vehicle.status?.charAt(0).toUpperCase() +
                      vehicle.status?.slice(1) || "Unknown"}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Insurance:</span>{" "}
                  {vehicle.insurance_details
                    ? `${
                        vehicle.insurance_details.provider
                      } (expires ${formatDate(
                        vehicle.insurance_details.expiryDate
                      )})`
                    : "Information not available"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Daily Vehicle Check</h4>
              <form className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance Report
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="Enter any maintenance issues or observations..."
                    value={maintenanceReport}
                    onChange={(e) => setMaintenanceReport(e.target.value)}
                    disabled={loading}
                  ></textarea>
                </div>
                <div className="flex items-center">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    onClick={handleMaintenanceSubmit}
                    disabled={loading || !maintenanceReport.trim()}
                  >
                    {loading ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            </div>

            <div>
              <h4 className="font-medium mb-3">Report Issue</h4>
              <form className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={reportIssue.type}
                    onChange={(e) =>
                      setReportIssue({ ...reportIssue, type: e.target.value })
                    }
                    disabled={loading}
                  >
                    <option value="mechanical">Mechanical Issue</option>
                    <option value="electrical">Electrical Issue</option>
                    <option value="tire">Tire Problem</option>
                    <option value="damage">Vehicle Damage</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="Describe the issue in detail..."
                    value={reportIssue.description}
                    onChange={(e) =>
                      setReportIssue({
                        ...reportIssue,
                        description: e.target.value,
                      })
                    }
                    disabled={loading}
                  ></textarea>
                </div>
                <div className="flex items-center">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    onClick={handleIssueSubmit}
                    disabled={loading || !reportIssue.description.trim()}
                  >
                    {loading ? "Submitting..." : "Report Issue"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyVehicle;
