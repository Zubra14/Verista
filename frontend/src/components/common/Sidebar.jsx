import React from 'react';

export const Sidebar = ({ userType, activeSection, setActiveSection }) => {
  // Different navigation items based on user type
  const navItems = {
    parent: [
      { id: 'tracking', label: 'Live Tracking', icon: '📍' },
      { id: 'history', label: 'Trip History', icon: '📆' },
      { id: 'driver', label: 'Driver Info', icon: '👤' },
      { id: 'settings', label: 'Settings', icon: '⚙️' }
    ],
    driver: [
      { id: 'routes', label: 'My Routes', icon: '🛣️' },
      { id: 'students', label: 'Students', icon: '👨‍👩‍👧‍👦' },
      { id: 'vehicle', label: 'My Vehicle', icon: '🚐' },
      { id: 'settings', label: 'Settings', icon: '⚙️' }
    ],
    school: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'students', label: 'Students', icon: '👨‍👩‍👧‍👦' },
      { id: 'drivers', label: 'Drivers', icon: '🚗' },
      { id: 'settings', label: 'Settings', icon: '⚙️' }
    ],
    government: [
      { id: 'compliance', label: 'Compliance', icon: '✅' },
      { id: 'statistics', label: 'Statistics', icon: '📈' },
      { id: 'reports', label: 'Reports', icon: '📑' },
      { id: 'settings', label: 'Settings', icon: '⚙️' }
    ]
  };
  
  // Color themes based on user type
  const themes = {
    parent: 'blue',
    driver: 'teal',
    school: 'green',
    government: 'indigo'
  };
  
  const theme = themes[userType] || 'blue';
  const items = navItems[userType] || navItems.parent;
  
  return (
    <div className="dashboard-sidebar w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <img src="/favicon.svg" alt="Verista" className="h-8 w-auto mr-2" />
          <span className={`text-xl font-bold text-${theme}-600`}>Verista</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 nav-items">
        {items.map(item => (
          <button
            key={item.id}
            className={`w-full px-4 py-3 rounded-md flex items-center ${
              activeSection === item.id 
                ? `bg-${theme}-50 text-${theme}-600` 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveSection(item.id)}
          >
            <div className={`w-8 h-8 rounded-full ${activeSection === item.id ? `bg-${theme}-100` : 'bg-gray-100'} flex items-center justify-center text-sm mr-3`}>
              {item.icon}
            </div>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button className="w-full px-4 py-2 rounded-md flex items-center text-gray-600 hover:bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm mr-3">
            📞
          </div>
          <span className="font-medium">Support</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;