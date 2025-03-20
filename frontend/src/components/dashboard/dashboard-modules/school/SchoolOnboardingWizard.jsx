// src/components/dashboard/dashboard-modules/school/SchoolOnboardingWizard.jsx
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const SchoolOnboardingWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    schoolName: "",
    address: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    studentCount: "",
    existingSystem: "none",
    systemDetails: "",
    preferredIntegration: "csv",
    additionalNotes: "",
  });

  const integrationOptions = [
    {
      id: "csv",
      name: "CSV Import/Export",
      description: "Simple data exchange via CSV files",
    },
    {
      id: "api",
      name: "API Integration",
      description: "Direct connection with your systems via our API",
    },
    {
      id: "edAdmin",
      name: "Ed-Admin Connector",
      description: "Specialized connector for Ed-Admin systems",
    },
    {
      id: "sageSchool",
      name: "Sage School Management",
      description: "Integration with Sage School Management",
    },
    {
      id: "classDojo",
      name: "ClassDojo",
      description: "Connect with your ClassDojo account",
    },
  ];

  const existingSystemOptions = [
    { id: "none", name: "None/Manual Records" },
    { id: "edAdmin", name: "Ed-Admin" },
    { id: "sageSchool", name: "Sage School Management" },
    { id: "classDojo", name: "ClassDojo" },
    { id: "custom", name: "Custom System" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    // Validate current step
    if (step === 1) {
      if (
        !formData.schoolName ||
        !formData.contactPerson ||
        !formData.contactEmail
      ) {
        toast.error("Please fill all required fields");
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Here would be the API call to save the onboarding data
    toast.success("Onboarding information submitted successfully");
    navigate("/dashboard/school/integration");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">School System Integration Setup</h2>
        <p className="text-gray-600 mt-2">
          Complete this wizard to set up integration with your existing systems
        </p>

        {/* Progress indicators */}
        <div className="mt-6 flex items-center">
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= i
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {i}
              </div>
              {i < 3 && (
                <div
                  className={`h-1 w-full ${
                    step > i ? "bg-blue-600" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        {/* Step 1: School Information */}
        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">School Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Count
                  </label>
                  <input
                    type="number"
                    name="studentCount"
                    value={formData.studentCount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Current Systems */}
        {step === 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Current System Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Existing School Management System
                </label>
                <select
                  name="existingSystem"
                  value={formData.existingSystem}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {existingSystemOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.existingSystem === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System Details
                  </label>
                  <input
                    type="text"
                    name="systemDetails"
                    value={formData.systemDetails}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Please specify your system"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Integration Method
                </label>
                <div className="space-y-2 mt-2">
                  {integrationOptions.map((option) => (
                    <div key={option.id} className="flex items-center">
                      <input
                        type="radio"
                        id={option.id}
                        name="preferredIntegration"
                        value={option.id}
                        checked={formData.preferredIntegration === option.id}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={option.id} className="ml-2">
                        <span className="block text-sm font-medium text-gray-700">
                          {option.name}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {option.description}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Final Details */}
        {step === 3 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Additional Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes or Requirements
                </label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Any specific requirements or questions..."
                ></textarea>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-800">Next Steps</h4>
                <p className="text-sm text-blue-600 mt-1">
                  After submitting this form, our integration team will contact
                  you within 1-2 business days to begin the setup process.
                  You'll be assigned a dedicated integration specialist to guide
                  you through the entire process.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolOnboardingWizard;
