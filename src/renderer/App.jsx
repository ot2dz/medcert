import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CreateCertificateForm from './pages/CreateCertificate';
import PatientManagement from './pages/PatientManagement';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="app-container-full">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="content">
        {activeTab === 'create' && <CreateCertificateForm />}
        {activeTab === 'manage' && <PatientManagement />}
      </main>
    </div>
  );
}

export default App;