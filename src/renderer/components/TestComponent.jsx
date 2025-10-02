import React, { useState, useEffect } from 'react';

const TestComponent = () => {
  const [testStatus, setTestStatus] = useState('جاري التحميل...');
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const checkAPI = async () => {
      try {
        if (window.api) {
          setTestStatus('✅ API متصل - اختبار قاعدة البيانات...');
          const allPatients = await window.api.getPatients();
          setPatients(allPatients);
          setTestStatus('✅ قاعدة البيانات تعمل بنجاح!');
        } else {
          setTestStatus('❌ API غير متاح');
        }
      } catch (error) {
        setTestStatus('❌ خطأ في قاعدة البيانات');
      }
    };

    const timer = setTimeout(checkAPI, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: 'Tajawal, Arial, sans-serif'
    }}>
      <h1 style={{ color: '#2c3e50' }}>🏥 تطبيق الشهادات الطبية</h1>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h3>حالة النظام:</h3>
        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{testStatus}</p>
      </div>

      {patients.length > 0 && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#e9f7ef', 
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <h3>المرضى المسجلين ({patients.length}):</h3>
          {patients.map((patient, index) => (
            <div key={patient.id} style={{ 
              padding: '10px', 
              margin: '5px 0',
              backgroundColor: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <strong>{patient.full_name}</strong> - الهوية: {patient.national_id}
              <br />
              <small>تاريخ الميلاد: {patient.birth_date}</small>
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#fff3cd', 
        borderRadius: '8px',
        margin: '20px 0',
        fontSize: '14px'
      }}>
        <p><strong>للمطورين:</strong> افحص Console للاطلاع على تفاصيل اختبار قاعدة البيانات</p>
      </div>
    </div>
  );
};

export default TestComponent;