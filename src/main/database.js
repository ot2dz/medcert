const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { app } = require('electron');

// تحديد مسار قاعدة البيانات في مجلد المستخدم
function getDatabasePath() {
    // في حالة التطوير، استخدام المجلد المحلي
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        return path.resolve(__dirname, '../../db/app.sqlite');
    }
    
    // في حالة التطبيق المُجمع، استخدام مجلد userData
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'db', 'app.sqlite');
}

const dbPath = getDatabasePath();
const dbDir = path.dirname(dbPath);

// التأكد من وجود مجلد db
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// إنشاء أو فتح الاتصال بقاعدة البيانات
const db = new Database(dbPath, { verbose: console.log }); // verbose لإظهار أوامر SQL في الطرفية للتأكد

function initializeDatabase() {
    console.log('Initializing database...');

    const createPatientsTable = `
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            birth_date TEXT,
            national_id TEXT UNIQUE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const createCertificatesTable = `
        CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            issue_date TEXT NOT NULL,
            leave_duration_days INTEGER,
            diagnosis TEXT,
            pdf_path TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
        );
    `;

    const createAuditLogTable = `
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            details TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    // تنفيذ الأوامر داخل معاملة واحدة
    db.transaction(() => {
        db.prepare(createPatientsTable).run();
        db.prepare(createCertificatesTable).run();
        db.prepare(createAuditLogTable).run();
    })();

    console.log('Database initialized successfully with tables: patients, certificates, audit_log.');
}

// تصدير دالة التهيئة وقاعدة البيانات لاستخدامها في أماكن أخرى
module.exports = { db, initializeDatabase };

// --- دوال CRUD للمرضى ---

function addPatient(patient) {
    const stmt = db.prepare('INSERT INTO patients (full_name, birth_date, national_id) VALUES (?, ?, ?)');
    const info = stmt.run(patient.fullName, patient.birthDate, patient.nationalId);
    return { id: info.lastInsertRowid, ...patient };
}

function getPatients() {
    const stmt = db.prepare('SELECT * FROM patients ORDER BY full_name');
    return stmt.all();
}

function updatePatient(patient) {
    const stmt = db.prepare('UPDATE patients SET full_name = ?, birth_date = ?, national_id = ? WHERE id = ?');
    const info = stmt.run(patient.fullName, patient.birthDate, patient.nationalId, patient.id);
    return info.changes > 0;
}

function updatePatientCreatedAt(patientId, createdAt) {
    const stmt = db.prepare('UPDATE patients SET created_at = ? WHERE id = ?');
    const info = stmt.run(createdAt, patientId);
    return info.changes > 0;
}

function deletePatient(id) {
    const stmt = db.prepare('DELETE FROM patients WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
}

// --- دوال CRUD للشهادات ---

function addCertificate(certificate) {
    const stmt = db.prepare(`
        INSERT INTO certificates (patient_id, issue_date, leave_duration_days, diagnosis, pdf_path) 
        VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
        certificate.patientId, 
        certificate.issueDate, 
        certificate.leaveDurationDays, 
        certificate.diagnosis, 
        certificate.pdfPath
    );
    return { id: info.lastInsertRowid, ...certificate };
}

function getCertificates() {
    const stmt = db.prepare(`
        SELECT c.*, p.full_name as patient_name, p.birth_date as patient_birth_date 
        FROM certificates c 
        LEFT JOIN patients p ON c.patient_id = p.id 
        ORDER BY c.created_at DESC
    `);
    return stmt.all();
}

function getCertificatesByPatient(patientId) {
    const stmt = db.prepare(`
        SELECT c.*, p.full_name as patient_name, p.birth_date as patient_birth_date 
        FROM certificates c 
        LEFT JOIN patients p ON c.patient_id = p.id 
        WHERE c.patient_id = ? 
        ORDER BY c.created_at DESC
    `);
    return stmt.all(patientId);
}

function updateCertificate(certificate) {
    const stmt = db.prepare(`
        UPDATE certificates 
        SET patient_id = ?, issue_date = ?, leave_duration_days = ?, diagnosis = ?, pdf_path = ? 
        WHERE id = ?
    `);
    const info = stmt.run(
        certificate.patientId, 
        certificate.issueDate, 
        certificate.leaveDurationDays, 
        certificate.diagnosis, 
        certificate.pdfPath,
        certificate.id
    );
    return info.changes > 0;
}

function updateCertificateIssueDate(certificateId, issueDate) {
    const stmt = db.prepare('UPDATE certificates SET issue_date = ? WHERE id = ?');
    const info = stmt.run(issueDate, certificateId);
    return info.changes > 0;
}

function deleteCertificate(id) {
    const stmt = db.prepare('DELETE FROM certificates WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
}

// دالة للبحث عن مريض أو إنشاؤه إذا لم يكن موجوداً
function findOrCreatePatient(patientData) {
    // البحث أولاً بالاسم وتاريخ الميلاد
    let stmt = db.prepare('SELECT * FROM patients WHERE full_name = ? AND birth_date = ?');
    let patient = stmt.get(patientData.fullName, patientData.birthDate);
    
    if (patient) {
        return patient;
    }
    
    // إذا لم يوجد، إنشاء مريض جديد
    stmt = db.prepare('INSERT INTO patients (full_name, birth_date, national_id) VALUES (?, ?, ?)');
    const info = stmt.run(patientData.fullName, patientData.birthDate, patientData.nationalId || null);
    
    return {
        id: info.lastInsertRowid,
        full_name: patientData.fullName,
        birth_date: patientData.birthDate,
        national_id: patientData.nationalId || null,
        created_at: new Date().toISOString()
    };
}

module.exports = { 
    db, 
    initializeDatabase,
    // دوال المرضى
    addPatient,
    getPatients,
    updatePatient,
    updatePatientCreatedAt,
    deletePatient,
    // دوال الشهادات
    addCertificate,
    getCertificates,
    getCertificatesByPatient,
    updateCertificate,
    updateCertificateIssueDate,
    deleteCertificate,
    findOrCreatePatient
};