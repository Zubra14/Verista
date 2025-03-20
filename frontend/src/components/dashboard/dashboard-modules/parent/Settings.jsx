// src/components/dashboard-modules/parent/Settings.jsx
import React, { useState } from 'react';

export const Settings = () => {
  const [formData, setFormData] = useState({
    fullName: 'Maria Nkosi',
    email: 'maria.nkosi@example.com',
    phone: '+27 82 123 4567',
    language: 'English',
    notifyTripStart: true,
    notifyRouteDeviation: true,
    notifyArrival: true,
    notifySMS: false,
    notifyEmail: true,
    notifyApp: true
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    alert('Settings saved successfully!');
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Account Settings</h1>
        <p className="text-gray-500">Manage your account preferences and notification settings</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Profile Information</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>English</option>
                  <option>Zulu</option>
                  <option>Xhosa</option>
                  <option>Afrikaans</option>
                  <option>Sotho</option>
                  <option>Tswana</option>
                  <option>Venda</option>
                </select>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-b border-gray-200 -mx-6 mb-6">
              <h3 className="text-lg font-medium text-gray-800">Notification Preferences</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Trip Start Notifications</h4>
                  <p className="text-xs text-gray-500">Receive alerts when your child's trip begins</p>
                </div>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    id="notifyTripStart"
                    name="notifyTripStart"
                    checked={formData.notifyTripStart}
                    onChange={handleChange}
                    className="opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="notifyTripStart"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                      formData.notifyTripStart ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                        formData.notifyTripStart ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Route Deviation Alerts</h4>
                  <p className="text-xs text-gray-500">Get notified if the vehicle deviates from the usual route</p>
                </div>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    id="notifyRouteDeviation"
                    name="notifyRouteDeviation"
                    checked={formData.notifyRouteDeviation}
                    onChange={handleChange}
                    className="opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="notifyRouteDeviation"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                      formData.notifyRouteDeviation ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                        formData.notifyRouteDeviation ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Arrival Notifications</h4>
                  <p className="text-xs text-gray-500">Receive alerts when your child arrives at school</p>
                </div>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    id="notifyArrival"
                    name="notifyArrival"
                    checked={formData.notifyArrival}
                    onChange={handleChange}
                    className="opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="notifyArrival"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                      formData.notifyArrival ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                        formData.notifyArrival ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-b border-gray-200 -mx-6 mb-6">
              <h3 className="text-lg font-medium text-gray-800">Notification Channels</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">SMS Notifications</h4>
                  <p className="text-xs text-gray-500">Receive notifications via SMS</p>
                </div>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    id="notifySMS"
                    name="notifySMS"
                    checked={formData.notifySMS}
                    onChange={handleChange}
                    className="opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="notifySMS"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                      formData.notifySMS ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                        formData.notifySMS ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Email Notifications</h4>
                  <p className="text-xs text-gray-500">Receive notifications via email</p>
                </div>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    id="notifyEmail"
                    name="notifyEmail"
                    checked={formData.notifyEmail}
                    onChange={handleChange}
                    className="opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="notifyEmail"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                      formData.notifyEmail ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                        formData.notifyEmail ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">In-App Notifications</h4>
                  <p className="text-xs text-gray-500">Receive notifications within the Verista app</p>
                </div>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    id="notifyApp"
                    name="notifyApp"
                    checked={formData.notifyApp}
                    onChange={handleChange}
                    className="opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="notifyApp"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                      formData.notifyApp ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                        formData.notifyApp ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Security</h3>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Change Password
            </button>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-800 mb-3">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-500 mb-4">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Enable Two-Factor Authentication
            </button>
          </div>
          
          <div className="pt-4 mt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-red-600 mb-3">Danger Zone</h4>
            <p className="text-sm text-gray-500 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};