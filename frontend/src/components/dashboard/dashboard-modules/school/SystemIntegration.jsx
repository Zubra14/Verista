// src/components/dashboard/dashboard-modules/school/SystemIntegration.jsx
import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import Papa from "papaparse";
import supabase from "../../../../lib/supabase";
import LoadingSpinner from "../../../common/LoadingSpinner";

const SystemIntegration = () => {
  const [importType, setImportType] = useState("students");
  const [exportType, setExportType] = useState("students");
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importStats, setImportStats] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const fileInputRef = useRef(null);

  // Available integration types
  const integrationTypes = [
    { id: "students", name: "Students" },
    { id: "routes", name: "Routes" },
    { id: "vehicles", name: "Vehicles" },
    { id: "schedules", name: "Schedules" },
  ];

  // Available connectors
  const availableConnectors = [
    { id: "csv", name: "CSV Import/Export" },
    { id: "api", name: "API Integration" },
    { id: "edAdmin", name: "Ed-Admin Connector" },
    { id: "sageSchool", name: "Sage School Management" },
    { id: "classDojo", name: "ClassDojo" },
  ];

  // Fetch API keys on component mount
  React.useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const { data, error } = await supabase
          .from("api_keys")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setApiKeys(data || []);
      } catch (err) {
        console.error("Error fetching API keys:", err);
        toast.error("Failed to load API keys");
      }
    };

    fetchApiKeys();
  }, []);

  // Handle file import
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportStats(null);

    try {
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const { data, errors, meta } = results;

          if (errors.length > 0) {
            throw new Error(
              `CSV parsing errors: ${errors.map((e) => e.message).join(", ")}`
            );
          }

          // Process data based on import type
          const processedData = data.map((row) => {
            // Process each row based on import type
            switch (importType) {
              case "students":
                return {
                  student_id: row.student_id || row.id,
                  name:
                    row.name ||
                    `${row.first_name || ""} ${row.last_name || ""}`.trim(),
                  grade: row.grade,
                  class: row.class,
                  parent_name: row.parent_name,
                  parent_contact: row.parent_contact || row.parent_phone,
                  pickup_address: row.pickup_address || row.address,
                  route_id: row.route_id,
                };
              case "routes":
                return {
                  route_id: row.route_id || row.id,
                  name: row.name || row.route_name,
                  start_location: row.start_location,
                  end_location: row.end_location,
                  morning_departure: row.morning_departure,
                  afternoon_departure: row.afternoon_departure,
                };
              // Add other cases for different import types
              default:
                return row;
            }
          });

          // Import to database
          const { data: importData, error } = await supabase
            .from(importType)
            .upsert(processedData, {
              onConflict: "student_id",
              ignoreDuplicates: false,
            });

          if (error) throw error;

          setImportStats({
            total: data.length,
            imported: data.length - (meta.warnings?.length || 0),
            errors: meta.warnings?.length || 0,
          });

          toast.success(`Successfully imported ${data.length} ${importType}`);
        },
        error: (error) => {
          throw error;
        },
      });
    } catch (err) {
      console.error("Import error:", err);
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = null; // Reset file input
      }
    }
  };

  // Handle data export
  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Fetch data based on export type
      const { data, error } = await supabase.from(exportType).select("*");

      if (error) throw error;

      // Convert to CSV
      const csv = Papa.unparse(data);

      // Create download link
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${exportType}_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Successfully exported ${data.length} ${exportType}`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Generate new API key
  const handleGenerateApiKey = async (e) => {
    e.preventDefault();

    if (!newKeyName.trim()) {
      toast.error("Please provide a name for the API key");
      return;
    }

    try {
      // Call Supabase function to generate key
      const { data, error } = await supabase.rpc("generate_api_key", {
        key_name: newKeyName,
      });

      if (error) throw error;

      // Update API keys list
      setApiKeys([data, ...apiKeys]);
      setNewKeyName("");
      setShowNewKeyForm(false);

      toast.success("API key generated successfully");
    } catch (err) {
      console.error("Error generating API key:", err);
      toast.error(`Failed to generate API key: ${err.message}`);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">School System Integration</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Import Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Import Data</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Type
            </label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {integrationTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileImport}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isImporting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Upload a CSV file with headers matching {importType} fields
            </p>
          </div>

          {isImporting && (
            <div className="flex items-center justify-center my-4">
              <LoadingSpinner size="md" />
              <span className="ml-2">Importing data...</span>
            </div>
          )}

          {importStats && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-blue-800 mb-2">
                Import Results
              </h4>
              <ul>
                <li>Total records: {importStats.total}</li>
                <li>Successfully imported: {importStats.imported}</li>
                <li>Errors: {importStats.errors}</li>
              </ul>
            </div>
          )}

          <div className="mt-6">
            <h4 className="font-semibold mb-2">Available Connectors</h4>
            <div className="space-y-2">
              {availableConnectors.map((connector) => (
                <div
                  key={connector.id}
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-grow">
                    <h5 className="font-medium">{connector.name}</h5>
                    <p className="text-sm text-gray-500">
                      {connector.id === "csv"
                        ? "Import/export data via CSV files"
                        : `Connect with ${connector.name} API`}
                    </p>
                  </div>
                  <button className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200">
                    {connector.id === "csv" ? "Active" : "Configure"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Export and API Section */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Export Data</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Type
              </label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {integrationTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isExporting ? "Exporting..." : "Export to CSV"}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">API Integration</h3>

            <p className="text-sm text-gray-600 mb-4">
              Connect your school management system directly using our API.
              Generate an API key to get started.
            </p>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Your API Keys</h4>
                <button
                  onClick={() => setShowNewKeyForm(!showNewKeyForm)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showNewKeyForm ? "Cancel" : "Generate New Key"}
                </button>
              </div>

              {showNewKeyForm && (
                <form
                  onSubmit={handleGenerateApiKey}
                  className="mb-4 p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="API Key Name"
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                    <button
                      type="submit"
                      className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create
                    </button>
                  </div>
                </form>
              )}

              {apiKeys.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Created
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {apiKeys.map((key) => (
                        <tr key={key.id}>
                          <td className="px-4 py-2 text-sm">{key.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {new Date(key.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <button className="text-blue-600 hover:text-blue-800 mr-2">
                              View
                            </button>
                            <button className="text-red-600 hover:text-red-800">
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No API keys generated yet
                </p>
              )}
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-2">API Documentation</h4>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm">
                  Access our comprehensive API documentation to integrate your
                  systems:
                </p>
                <a
                  href="/api/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  View API Documentation
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemIntegration;
