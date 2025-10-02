const { contextBridge, ipcRenderer } = require('electron');

// تعريض واجهة برمجة تطبيقات آمنة لعملية العرض (الواجهة)
contextBridge.exposeInMainWorld('api', {
  // دوال المرضى
  addPatient: (patient) => ipcRenderer.invoke('db:addPatient', patient),
  getPatients: () => ipcRenderer.invoke('db:getPatients'),
  updatePatient: (patient) => ipcRenderer.invoke('db:updatePatient', patient),
  updatePatientCreatedAt: (patientId, createdAt) => ipcRenderer.invoke('db:updatePatientCreatedAt', patientId, createdAt),
  deletePatient: (id) => ipcRenderer.invoke('db:deletePatient', id),
  
  // دوال الشهادات
  addCertificate: (certificate) => ipcRenderer.invoke('db:addCertificate', certificate),
  createCertificate: (certificate) => ipcRenderer.invoke('db:addCertificate', certificate),
  getCertificates: () => ipcRenderer.invoke('db:getCertificates'),
  getCertificatesByPatient: (patientId) => ipcRenderer.invoke('db:getCertificatesByPatient', patientId),
  updateCertificate: (certificate) => ipcRenderer.invoke('db:updateCertificate', certificate),
  updateCertificateIssueDate: (certificateId, issueDate) => ipcRenderer.invoke('db:updateCertificateIssueDate', certificateId, issueDate),
  deleteCertificate: (id) => ipcRenderer.invoke('db:deleteCertificate', id),
  findOrCreatePatient: (patientData) => ipcRenderer.invoke('db:findOrCreatePatient', patientData),
  
  // دوال PDF
  generateAndSavePDF: (htmlContent, certificateData) => ipcRenderer.invoke('pdf:generateAndSave', htmlContent, certificateData),
  generatePDFFromCertificate: (certificateId) => ipcRenderer.invoke('pdf:generateFromCertificate', certificateId),
  printPDF: (pdfPath) => ipcRenderer.invoke('pdf:print', pdfPath),
  printDirect: (htmlContent) => ipcRenderer.invoke('pdf:printDirect', htmlContent),
});

console.log('Preload script loaded with secure API bridge!');