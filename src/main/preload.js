const { contextBridge, ipcRenderer } = require('electron');

// تعريض واجهة برمجة تطبيقات آمنة لعملية العرض (الواجهة)
contextBridge.exposeInMainWorld('api', {
  // دوال المرضى
  addPatient: (patient) => ipcRenderer.invoke('db:addPatient', patient),
  getPatients: () => ipcRenderer.invoke('db:getPatients'),
  updatePatient: (patient) => ipcRenderer.invoke('db:updatePatient', patient),
  deletePatient: (id) => ipcRenderer.invoke('db:deletePatient', id),
  
  // دوال الشهادات
  addCertificate: (certificate) => ipcRenderer.invoke('db:addCertificate', certificate),
  getCertificates: () => ipcRenderer.invoke('db:getCertificates'),
  getCertificatesByPatient: (patientId) => ipcRenderer.invoke('db:getCertificatesByPatient', patientId),
  updateCertificate: (certificate) => ipcRenderer.invoke('db:updateCertificate', certificate),
  deleteCertificate: (id) => ipcRenderer.invoke('db:deleteCertificate', id),
  findOrCreatePatient: (patientData) => ipcRenderer.invoke('db:findOrCreatePatient', patientData),
});

console.log('Preload script loaded with secure API bridge!');