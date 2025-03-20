import React, { useState } from 'react';

const Settings = () => {
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: true,
    pushNotifications: false,
    tripStartAlert: true,
    tripEndAlert: true,
    delayAlert: true,
    routeDeviationAlert: true
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    shareLocationWithSchool: true,
    shareContactWithDrivers: false,
    allowDataAnalytics: true
  });
  
  const handleNotificationChange = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    });
  };
  
  const handlePrivacyChange = (setting) => {
    setPrivacySettings({
      ...privacySettings,
      [setting]: !privacySettings[setting]
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <p>Manage your account settings.</p>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-500">Receive updates and alerts via email</p>
            </div>
            <button 
              onClick={() => handleNotificationChange('email')}
              className={`${
                notificationSettings.email 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span 
                className={`${
                  notificationSettings.email 
                    ? 'translate-x-5' 
                    : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
              <p className="text-sm text-gray-500">Receive updates and alerts via text message</p>
            </div>
            <button 
              onClick={() => handleNotificationChange('sms')}
              className={`${
                notificationSettings.sms 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span 
                className={`${
                  notificationSettings.sms 
                    ? 'translate-x-5' 
                    : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
              <p className="text-sm text-gray-500">Receive alerts on your mobile device</p>
            </div>
            <button 
              onClick={() => handleNotificationChange('pushNotifications')}
              className={`${
                notificationSettings.pushNotifications 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span 
                className={`${
                  notificationSettings.pushNotifications 
                    ? 'translate-x-5' 
                    : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Alert Types</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Trip Start Alerts</h4>
              <p className="text-sm text-gray-500">Notify when transportation starts</p>
            </div>
            <button 
              onClick={() => handleNotificationChange('tripStartAlert')}
              className={`${
                notificationSettings.tripStartAlert 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span 
                className={`${
                  notificationSettings.tripStartAlert 
                    ? 'translate-x-5' 
                    : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Trip End Alerts</h4>
              <p className="text-sm text-gray-500">Notify when transportation is completed</p>
            </div>
            <button 
              onClick={() => handleNotificationChange('tripEndAlert')}
              className={`${
                notificationSettings.tripEndAlert 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span 
                className={`${
                  notificationSettings.tripEndAlert 
                    ? 'translate-x-5' 
                    : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Delay Alerts</h4>
              <p className="text-sm text-gray-500">Notify when transportation is delayed</p>
            </div>
            <button 
              onClick={() => handleNotificationChange('delayAlert')}
              className={`${
                notificationSettings.delayAlert 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span 
                className={`${
                  notificationSettings.delayAlert 
                    ? 'translate-x-5' 
                    : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Route Deviation Alerts</h4>
              <p className="text-sm text-gray-500">Notify of unexpected route changes</p>
            </div>
            <button 
              onClick={() => handleNotificationChange('routeDeviationAlert')}
              className={`${
                notificationSettings.routeDeviationAlert 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span 
                className={`${
                  notificationSettings.routeDeviationAlert 
                    ? 'translate-x-5' 
                    : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Share location with school</h4>
              <p className="text-sm text-gray-500">Allow schools to see location during transportation</p>
            </div>
            <button 
              onClick={() => handlePrivacyChange('shareLocationWithSchool')}
              className={`${
                privacySettings.shareLocationWithSchool 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span 
                className={`${
                  privacySettings.shareLocationWithSchool 
                    ? 'translate-x-5' 
                    : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Share contact with drivers</h4>
              <p className="text-sm text-gray-500">Allow drivers to contact you directly</p>
            </div>
            <button 
              onClick={() => handlePrivacyChange('shareContactWithDrivers')}
              className={`${
                privacySettings.shareContactWithDrivers 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span 
                className={`${
                  privacySettings.shareContactWithDrivers 
                    ? 'translate-x-5' 
                    : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Allow data analytics</h4>
              <p className="text-sm text-gray-500">Help improve the service with anonymous usage data</p>
            </div>
            <button 
              onClick={() => handlePrivacyChange('allowDataAnalytics')}
              className={`${
                privacySettings.allowDataAnalytics 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span 
                className={`${
                  privacySettings.allowDataAnalytics 
                    ? 'translate-x-5' 
                    : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-10 flex space-x-4">
        <button
          type="button"
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Changes
        </button>
        <button
          type="button"
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
};

export default Settings;