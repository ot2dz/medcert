const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
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

// Create PDF storage directory
const pdfStoragePath = path.resolve(__dirname, '../../db/pdfs');
if (!fs.existsSync(pdfStoragePath)) {
  fs.mkdirSync(pdfStoragePath, { recursive: true });
  console.log('PDF storage directory created:', pdfStoragePath);
}

// PDF Generation function
async function generatePDF(htmlContent) {
  return new Promise((resolve, reject) => {
    // Create a hidden BrowserWindow for PDF generation
    const pdfWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: false // Disable for HTML string loading
      }
    });

    // Load the HTML content
    pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)
      .then(() => {
        // Wait a moment for content to render
        setTimeout(() => {
          // Generate PDF
          pdfWindow.webContents.printToPDF({
            format: 'A4',
            printBackground: true,
            pageRanges: '1', // Print only the first page
            preferCSSPageSize: true,
            margins: {
              top: 0.5,
              bottom: 0.5,
              left: 0.5,
              right: 0.5
            },
            landscape: false,
            displayHeaderFooter: false
          }).then((pdfBuffer) => {
            pdfWindow.close();
            resolve(pdfBuffer);
          }).catch((error) => {
            pdfWindow.close();
            reject(error);
          });
        }, 1000);
      })
      .catch((error) => {
        pdfWindow.close();
        reject(error);
      });
  });
}

// Save PDF and create certificate record
async function savePDFAndCreateCertificate(htmlContent, certificateData) {
  try {
    // Generate PDF buffer
    const pdfBuffer = await generatePDF(htmlContent);
    
    // Create unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `certificate-${certificateData.patientId}-${timestamp}.pdf`;
    const filePath = path.join(pdfStoragePath, filename);
    
    // Save PDF file
    fs.writeFileSync(filePath, pdfBuffer);
    
    // Add certificate to database with PDF path
    const certificateWithPDF = {
      ...certificateData,
      pdfPath: filePath
    };
    
    const result = await addCertificate(certificateWithPDF);
    
    return {
      success: true,
      certificate: result,
      pdfPath: filePath,
      filename: filename
    };
  } catch (error) {
    console.error('Error generating PDF and saving certificate:', error);
    throw error;
  }
}

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
  
  // PDF Generation IPC handler
  ipcMain.handle('pdf:generateAndSave', async (event, htmlContent, certificateData) => {
    try {
      return await savePDFAndCreateCertificate(htmlContent, certificateData);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  });
  
  // PDF Print IPC handler
  ipcMain.handle('pdf:print', async (event, pdfPath) => {
    try {
      const { shell } = require('electron');
      
      // Check if file exists
      if (!fs.existsSync(pdfPath)) {
        throw new Error('PDF file not found');
      }
      
      // Open PDF with default system application (which will show print option)
      const result = await shell.openPath(pdfPath);
      
      if (result) {
        // If there's an error opening the file
        throw new Error(`Could not open PDF: ${result}`);
      }
      
      return { success: true, message: 'PDF opened successfully for printing' };
    } catch (error) {
      console.error('PDF print error:', error);
      throw error;
    }
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