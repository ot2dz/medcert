const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
// إعادة تفعيل قاعدة البيانات بعد حل مشكلة better-sqlite3
const { 
  initializeDatabase, 
  addPatient, 
  getPatients, 
  updatePatient, 
  deletePatient,
  addCertificate,
  getCertificates,
  getCertificatesByPatient,
  updateCertificate,
  deleteCertificate,
  findOrCreatePatient
} = require('./database');
// Try multiple ports for Vite dev server
const VITE_DEV_PORTS = [5173, 5174, 5175, 5176];

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
  });

  // Show window when ready to prevent white screen
  win.once('ready-to-show', () => {
    win.show();
  });

  // Function to try loading URL from different ports
  const tryLoadViteUrl = async (portIndex = 0) => {
    if (portIndex >= VITE_DEV_PORTS.length) {
      console.log('Could not connect to Vite dev server on any port');
      // Fallback to file:// protocol
      win.loadFile(path.join(__dirname, '../renderer/index.html'));
      return;
    }

    const port = VITE_DEV_PORTS[portIndex];
    const url = `http://localhost:${port}`;
    
    try {
      await win.loadURL(url);
      console.log(`Successfully connected to Vite dev server on port ${port}`);
      
      // Force reload after a short delay to ensure content loads
      setTimeout(() => {
        win.reload();
      }, 1000);
      
    } catch (err) {
      console.log(`Failed to load URL on port ${port}, trying next port...`);
      setTimeout(() => tryLoadViteUrl(portIndex + 1), 200);
    }
  };

  tryLoadViteUrl();
  
  // Open DevTools for debugging
  win.webContents.openDevTools();
};

app.whenReady().then(() => {
  // إعادة تفعيل قاعدة البيانات بعد حل مشكلة better-sqlite3
  initializeDatabase();
  
  // تسجيل مستمعين IPC
  ipcMain.handle('db:addPatient', (event, patient) => {
    return addPatient(patient);
  });
  
  ipcMain.handle('db:getPatients', () => {
    return getPatients();
  });
  
  ipcMain.handle('db:updatePatient', (event, patient) => {
    return updatePatient(patient);
  });
  
  ipcMain.handle('db:deletePatient', (event, id) => {
    return deletePatient(id);
  });
  
  // مستمعين IPC للشهادات
  ipcMain.handle('db:addCertificate', (event, certificate) => {
    return addCertificate(certificate);
  });
  
  ipcMain.handle('db:getCertificates', () => {
    return getCertificates();
  });
  
  ipcMain.handle('db:getCertificatesByPatient', (event, patientId) => {
    return getCertificatesByPatient(patientId);
  });
  
  ipcMain.handle('db:updateCertificate', (event, certificate) => {
    return updateCertificate(certificate);
  });
  
  ipcMain.handle('db:deleteCertificate', (event, id) => {
    return deleteCertificate(id);
  });
  
  ipcMain.handle('db:findOrCreatePatient', (event, patientData) => {
    return findOrCreatePatient(patientData);
  });
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});