const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// تحديد مسار قاعدة البيانات داخل مجلد db
const dbPath = path.resolve(__dirname, '../../db/app.sqlite');
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