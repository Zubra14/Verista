// src/components/dashboard/dashboard-modules/government/ComplianceReporting.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import supabase from "../../../../lib/supabase";
import LoadingSpinner from "../../../common/LoadingSpinner";

const ComplianceReporting = () => {
  const [loading, setLoading] = useState(true);
  const [complianceData, setComplianceData] = useState({
    operators: [],
    complianceRate: 0,
    pendingApprovals: 0,
    recentViolations: [],
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({
    region: "all",
    status: "all",
    period: "30",
  });

  // Fetch compliance data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // This would be an actual API call in production
        // For now, we'll use mock data

        // Simulating API response delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data
        const mockData = {
          operators: [
            {
              id: "op1",
              name: "Joburg School Transport",
              region: "Johannesburg",
              vehicles: 12,
              complianceRate: 96.5,
              lastInspection: "2025-02-15",
              status: "active",
              pendingIssues: 1,
            },
            {
              id: "op2",
              name: "Cape Town Scholars",
              region: "Cape Town",
              vehicles: 8,
              complianceRate: 94.2,
              lastInspection: "2025-01-28",
              status: "active",
              pendingIssues: 0,
            },
            {
              id: "op3",
              name: "Eastern Cape Transport",
              region: "Eastern Cape",
              vehicles: 5,
              complianceRate: 87.8,
              lastInspection: "2025-02-10",
              status: "warning",
              pendingIssues: 2,
            },
            {
              id: "op4",
              name: "Durban Student Movers",
              region: "Durban",
              vehicles: 7,
              complianceRate: 92.1,
              lastInspection: "2025-02-22",
              status: "active",
              pendingIssues: 1,
            },
            {
              id: "op5",
              name: "Township Education Ride",
              region: "Soweto",
              vehicles: 4,
              complianceRate: 83.5,
              lastInspection: "2025-01-15",
              status: "warning",
              pendingIssues: 3,
            },
          ],
          complianceRate: 92.8,
          pendingApprovals: 14,
          recentViolations: [
            {
              id: "v1",
              operatorId: "op3",
              operatorName: "Eastern Cape Transport",
              vehicleReg: "ECP-123-GP",
              violationType: "overloading",
              date: "2025-03-10",
              status: "pending_resolution",
              severity: "high",
            },
            {
              id: "v2",
              operatorId: "op5",
              operatorName: "Township Education Ride",
              vehicleReg: "SOW-456-GP",
              violationType: "expired_license",
              date: "2025-03-08",
              status: "pending_resolution",
              severity: "medium",
            },
            {
              id: "v3",
              operatorId: "op1",
              operatorName: "Joburg School Transport",
              vehicleReg: "JHB-789-GP",
              violationType: "maintenance_overdue",
              date: "2025-03-05",
              status: "resolved",
              severity: "low",
            },
          ],
        };

        setComplianceData(mockData);
      } catch (error) {
        console.error("Error fetching compliance data:", error);
        toast.error("Failed to fetch compliance data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Compliance & Licensing Dashboard</h2>
        <p className="text-gray-600">
          Monitor and manage operator compliance across South Africa
        </p>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Overall Compliance Rate
          </h3>
          <div className="mt-2 flex items-center">
            <div className="text-3xl font-bold">
              {complianceData.complianceRate}%
            </div>
            <div className="ml-2 flex items-center text-sm font-medium text-green-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>2.1%</span>
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{ width: `${complianceData.complianceRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Operators</h3>
          <div className="mt-2 flex items-center">
            <div className="text-3xl font-bold">
              {complianceData.operators.length}
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <span className="text-green-600 font-medium">
              {
                complianceData.operators.filter((op) => op.status === "active")
                  .length
              }
            </span>{" "}
            active,
            <span className="ml-1 text-yellow-600 font-medium">
              {
                complianceData.operators.filter((op) => op.status === "warning")
                  .length
              }
            </span>{" "}
            with warnings
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Pending Approvals
          </h3>
          <div className="mt-2 flex items-center">
            <div className="text-3xl font-bold">
              {complianceData.pendingApprovals}
            </div>
          </div>
          <div className="mt-2">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Review Approvals →
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Recent Violations
          </h3>
          <div className="mt-2 flex items-center">
            <div className="text-3xl font-bold">
              {complianceData.recentViolations.length}
            </div>
          </div>
          <div className="mt-2">
            <button
              onClick={() => setActiveTab("violations")}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Violations →
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between">
          <h3 className="text-lg font-medium">Filters</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 md:mt-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <select
                name="region"
                value={filters.region}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Regions</option>
                <option value="johannesburg">Johannesburg</option>
                <option value="cape-town">Cape Town</option>
                <option value="durban">Durban</option>
                <option value="eastern-cape">Eastern Cape</option>
                <option value="soweto">Soweto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="warning">Warning</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select
                name="period"
                value={filters.period}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="180">Last 6 Months</option>
                <option value="365">Last Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-4 px-6 ${
              activeTab === "overview"
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Operators Overview
          </button>
          <button
            onClick={() => setActiveTab("violations")}
            className={`py-4 px-6 ${
              activeTab === "violations"
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Compliance Violations
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`py-4 px-6 ${
              activeTab === "approvals"
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Pending Approvals
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`py-4 px-6 ${
              activeTab === "reports"
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Reports
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {activeTab === "overview" && (
          <div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Operator
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Region
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Vehicles
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Compliance
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {complianceData.operators.map((operator) => (
                  <tr key={operator.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {operator.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {operator.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {operator.region}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {operator.vehicles}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-2 text-sm font-medium">
                          {operator.complianceRate}%
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              operator.complianceRate >= 90
                                ? "bg-green-600"
                                : operator.complianceRate >= 80
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${operator.complianceRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          operator.status
                        )}`}
                      >
                        {operator.status.charAt(0).toUpperCase() +
                          operator.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a
                        href="#"
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </a>
                      <a href="#" className="text-blue-600 hover:text-blue-900">
                        Edit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "violations" && (
          <div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Violation
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Operator
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Severity
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {complianceData.recentViolations.map((violation) => (
                  <tr key={violation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {violation.violationType
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </div>
                      <div className="text-sm text-gray-500">
                        Vehicle: {violation.vehicleReg}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {violation.operatorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(violation.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(
                          violation.severity
                        )}`}
                      >
                        {violation.severity.charAt(0).toUpperCase() +
                          violation.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {violation.status
                        .split("_")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a
                        href="#"
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Details
                      </a>
                      <a href="#" className="text-blue-600 hover:text-blue-900">
                        Resolve
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Placeholder content for other tabs */}
        {activeTab === "approvals" && (
          <div className="p-6 text-center text-gray-500">
            <p>Pending Approvals content will be displayed here</p>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="p-6 text-center text-gray-500">
            <p>Reports content will be displayed here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceReporting;
