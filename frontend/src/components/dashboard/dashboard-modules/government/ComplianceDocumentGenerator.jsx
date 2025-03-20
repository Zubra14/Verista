// src/components/dashboard/dashboard-modules/government/ComplianceDocumentGenerator.jsx
import React, { useState } from "react";
import supabase from "../../../../lib/supabase";

const ComplianceDocumentGenerator = () => {
  const [documentType, setDocumentType] = useState("operator_license");
  const [loading, setLoading] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState(null);

  const documentTypes = [
    { id: "operator_license", name: "Operator License" },
    { id: "vehicle_certificate", name: "Vehicle Compliance Certificate" },
    { id: "driver_permit", name: "Driver Permit" },
    { id: "school_approval", name: "School Transportation Approval" },
  ];

  const handleGenerateDocument = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Backend API call to generate document
      const { data, error } = await supabase.functions.invoke(
        "generate-compliance-document",
        {
          body: { documentType, formData: new FormData(e.target) },
        }
      );

      if (error) throw error;
      setGeneratedDocument(data);
    } catch (err) {
      console.error("Error generating document:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Compliance Document Generator</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleGenerateDocument}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {documentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic form fields based on document type */}
            {documentType === "operator_license" && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operator Name
                  </label>
                  <input
                    type="text"
                    name="operatorName"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Registration Number
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operating Regions
                  </label>
                  <input
                    type="text"
                    name="regions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </>
            )}

            {/* Add similar blocks for other document types */}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Validity Period (months)
              </label>
              <input
                type="number"
                name="validityPeriod"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1"
                max="60"
                defaultValue="12"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Document"}
            </button>
          </form>
        </div>

        {generatedDocument && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">Generated Document</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">
                  {generatedDocument.title}
                </span>
                <button className="text-blue-600 hover:text-blue-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
              </div>

              <div className="prose max-w-none">
                <p>
                  <strong>Document ID:</strong> {generatedDocument.id}
                </p>
                <p>
                  <strong>Issue Date:</strong>{" "}
                  {new Date(generatedDocument.issueDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Expiry Date:</strong>{" "}
                  {new Date(generatedDocument.expiryDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Issuing Authority:</strong> Department of Transport,
                  Republic of South Africa
                </p>

                <hr className="my-4" />

                {/* Document details based on type */}
                {generatedDocument.details &&
                  Object.entries(generatedDocument.details).map(
                    ([key, value]) => (
                      <p key={key}>
                        <strong>
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                          :
                        </strong>{" "}
                        {value}
                      </p>
                    )
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceDocumentGenerator;
