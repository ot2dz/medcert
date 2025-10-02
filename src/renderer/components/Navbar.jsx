import React from 'react';
import './Navbar.css';

function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h2 className="navbar-title">🏥 تطبيق الشهادات الطبية</h2>
        <div className="navbar-tabs">
          <button 
            className={`nav-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            📋 إنشاء شهادة
          </button>
          <button 
            className={`nav-button ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            👥 إدارة المرضى
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;