import React from 'react';

function App() {
  return (
    <div className="container">
      <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>MedCert Application</h1>
      <p style={{ fontSize: '16px', marginBottom: '20px' }}>
        تطبيق إنشاء الشهادات الطبية
      </p>
      <p style={{ color: '#27ae60', fontWeight: 'bold' }}>
        ✅ React UI is running successfully inside Electron!
      </p>
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#ecf0f1', borderRadius: '8px' }}>
        <h3>معلومات التطبيق:</h3>
        <p>الإصدار: 1.0.0</p>
        <p>البيئة: التطوير</p>
      </div>
    </div>
  );
}

export default App;