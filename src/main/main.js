const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
// إعادة تفعيل قاعدة البيانات بعد حل مشكلة better-sqlite3
const { 
  db,
  initializeDatabase, 
  addPatient, 
  getPatients, 
  updatePatient, 
  updatePatientCreatedAt,
  deletePatient,
  addCertificate,
  getCertificates,
  getCertificatesByPatient,
  updateCertificate,
  updateCertificateIssueDate,
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

// دالة توليد HTML للشهادة من البيانات المحفوظة
function generateCertificateHTML(certificate) {
  const issueDate = new Date(certificate.issue_date).toLocaleDateString('en-GB');
  
  return `
    <html>
    <head>
        <style>
            body {
                width: 21cm;
                height: 29.7cm;
                margin: 0 auto;
                padding: 2.5cm;
                font-family: Arial, sans-serif;
                box-sizing: border-box;
                position: relative;
                direction: ltr;
                text-align: left;
            }
            header {
                text-align: center;
                line-height: 1.4;
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 40px;
            }
            h1 {
                text-align: center;
                text-decoration: underline;
                font-size: 18px;
                margin: 30px 0 40px 0;
            }
            main {
                font-size: 16px;
                line-height: 1.8;
                text-align: left;
            }
            footer {
                position: absolute;
                bottom: 2.5cm;
                left: 2.5cm;
                right: 2.5cm;
                display: flex;
                justify-content: space-between;
                font-size: 16px;
            }
            @page {
                size: A4;
                margin: 0;
            }
        </style>
    </head>
    <body>
        <header>
            <div>République algérienne démocratique et populaire</div>
            <div>Ministère de la santé</div>
            <div>EPSP IN SALAH</div>
        </header>

        <h1>CERTIFICAT MEDICAL</h1>

        <main>
            <p>Je soussigné(e), Dr <strong>HAMADI</strong> atteste que :</p>
            
            <p>M./Mme <strong>${certificate.patient_name || 'غير محدد'}</strong> né(e) LE <strong>${certificate.patient_birth_date || 'غير محدد'}</strong> à <strong>In Salah</strong>.</p>
            
            <p>Nécessite un arrêt de travail de ( <strong>${certificate.leave_duration_days}</strong> ) jours à compter de ce jour.</p>
            
            ${certificate.diagnosis && certificate.diagnosis !== 'غير محدد' ? 
              `<p>Diagnostic: <strong>${certificate.diagnosis}</strong></p>` : ''
            }
            
            <p>Ce certificat est délivré à la demande de l'intéressé(e) pour faire valoir ce que de droit.</p>
        </main>

        <footer>
            <div>In Salah le : ${issueDate}</div>
            <div>le médecin :</div>
        </footer>
    </body>
    </html>
  `;
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
  
  ipcMain.handle('db:updatePatientCreatedAt', (event, patientId, createdAt) => {
    return updatePatientCreatedAt(patientId, createdAt);
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
  
  ipcMain.handle('db:updateCertificateIssueDate', (event, certificateId, issueDate) => {
    return updateCertificateIssueDate(certificateId, issueDate);
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
  
  // Direct Print IPC handler - الطباعة المباشرة
  ipcMain.handle('pdf:printDirect', async (event, htmlContent) => {
    return new Promise((resolve, reject) => {
      // إنشاء نافذة مخفية للطباعة
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          enableRemoteModule: false,
          webSecurity: false
        }
      });

      // تحميل HTML content
      printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)
        .then(() => {
          // انتظار قليل لضمان تحميل المحتوى
          setTimeout(() => {
            // فتح مربع حوار الطباعة مباشرة
            printWindow.webContents.print({
              silent: false, // سيظهر مربع حوار اختيار الطابعة
              printBackground: true,
              copies: 1,
              margins: {
                marginType: 'custom',
                top: 0.5,
                bottom: 0.5,
                left: 0.5,
                right: 0.5
              }
            }, (success, failureReason) => {
              printWindow.close();
              if (success) {
                resolve({ success: true, message: 'تم فتح مربع حوار الطباعة بنجاح' });
              } else {
                // التحقق من سبب الفشل - إذا كان الإلغاء فهو ليس خطأ فعلي
                if (failureReason === 'cancelled' || failureReason === 'canceled' || 
                    failureReason === 'Print job canceled' || !failureReason) {
                  resolve({ success: true, message: 'تم إلغاء الطباعة', cancelled: true });
                } else {
                  reject(new Error(failureReason));
                }
              }
            });
          }, 1000);
        })
        .catch((error) => {
          printWindow.close();
          reject(error);
        });
    });
  });
  
  // Generate PDF from existing certificate data
  ipcMain.handle('pdf:generateFromCertificate', async (event, certificateId) => {
    try {
      // الحصول على بيانات الشهادة من قاعدة البيانات
      const certificate = db.prepare(`
        SELECT c.*, p.full_name as patient_name, p.birth_date as patient_birth_date
        FROM certificates c 
        LEFT JOIN patients p ON c.patient_id = p.id 
        WHERE c.id = ?
      `).get(certificateId);
      
      if (!certificate) {
        throw new Error('الشهادة غير موجودة');
      }
      
      // توليد HTML للشهادة
      const htmlContent = generateCertificateHTML(certificate);
      
      // توليد PDF
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `certificate_${certificate.patient_name.replace(/\s+/g, '_')}_${timestamp}.pdf`;
      const pdfPath = path.join(pdfStoragePath, filename);
      
      const pdfBuffer = await generatePDF(htmlContent);
      fs.writeFileSync(pdfPath, pdfBuffer);
      
      // تحديث مسار PDF في قاعدة البيانات
      db.prepare(`UPDATE certificates SET pdf_path = ? WHERE id = ?`).run(pdfPath, certificateId);
      
      return {
        success: true,
        pdfPath: pdfPath,
        filename: filename,
        certificate: certificate
      };
    } catch (error) {
      console.error('Error generating PDF from certificate:', error);
      return {
        success: false,
        error: error.message
      };
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