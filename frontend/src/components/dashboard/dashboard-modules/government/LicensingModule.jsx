// src/components/dashboard/dashboard-modules/government/LicensingModule.jsx
import React, { useState, useEffect } from "react";
import supabase from "../../../../lib/supabase";

const LicensingModule = () => {
  const [licensingData, setLicensingData] = useState({
    totalLicenses: 0,
    activeLicenses: 0,
    pendingApprovals: 0,
    expiringLicenses: 0,
  });

  const [regulations, setRegulations] = useState([]);
  const [selectedRegulation, setSelectedRegulation] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch licensing statistics
        const { data, error } = await supabase.rpc("get_licensing_statistics");
        if (error) throw error;
        setLicensingData(data || {});

        // Fetch regulations
        const { data: regsData, error: regsError } = await supabase
          .from("government_regulations")
          .select("*")
          .order("effective_date", { ascending: false });

        if (regsError) throw regsError;
        setRegulations(regsData || []);
      } catch (err) {
        console.error("Error fetching licensing data:", err);
      }
    };

    fetchData();
  }, []);

  const handlePublishRegulation = async (e) => {
    e.preventDefault();
    // Implementation for publishing new regulations
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800">Total Licenses</h3>
          <p className="text-2xl font-bold">{licensingData.totalLicenses}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800">Active Licenses</h3>
          <p className="text-2xl font-bold">{licensingData.activeLicenses}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800">Pending Approvals</h3>
          <p className="text-2xl font-bold">{licensingData.pendingApprovals}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800">Expiring Soon</h3>
          <p className="text-2xl font-bold">{licensingData.expiringLicenses}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Transportation Regulations</h2>
          <div className="bg-white border rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Regulation Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effective Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {regulations.map((reg) => (
                  <tr key={reg.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {reg.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          reg.status === "active"
                            ? "bg-green-100 text-green-800"
                            : reg.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {reg.status.charAt(0).toUpperCase() +
                          reg.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reg.effective_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedRegulation(reg)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Publish New Regulation</h2>
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <form onSubmit={handlePublishRegulation}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Regulation Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g. School Transport Safety Act"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="4"
                  placeholder="Describe the regulation..."
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Upload
                </label>
                <input
                  type="file"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  accept=".pdf,.doc,.docx"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Publish Regulation
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicensingModule;
