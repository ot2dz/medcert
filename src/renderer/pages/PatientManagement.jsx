import React, { useState, useEffect } from 'react';
import './PatientManagement.css';

function PatientManagement() {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientCertificates, setPatientCertificates] = useState([]);
    const [patientStats, setPatientStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCreatedAt, setEditingCreatedAt] = useState(false);
    const [newCreatedAt, setNewCreatedAt] = useState('');
    const [editingCertificateDate, setEditingCertificateDate] = useState(null);
    const [newCertificateDate, setNewCertificateDate] = useState('');

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const result = await window.api.getPatients();
            setPatients(result || []);
            
            // تحميل إحصائيات كل مريض
            const stats = {};
            for (const patient of result || []) {
                try {
                    const certificates = await window.api.getCertificatesByPatient(patient.id);
                    stats[patient.id] = {
                        certificatesCount: certificates.length,
                        lastCertificateDate: certificates.length > 0 ? certificates[0].created_at : null
                    };
                } catch (error) {
                    console.error(`Error loading stats for patient ${patient.id}:`, error);
                    stats[patient.id] = { certificatesCount: 0, lastCertificateDate: null };
                }
            }
            setPatientStats(stats);
        } catch (error) {
            console.error('Error loading patients:', error);
            alert('حدث خطأ أثناء تحميل قائمة المرضى');
        } finally {
            setLoading(false);
        }
    };

    const loadPatientCertificates = async (patientId) => {
        try {
            setLoading(true);
            const certificates = await window.api.getCertificatesByPatient(patientId);
            setPatientCertificates(certificates || []);
        } catch (error) {
            console.error('Error loading patient certificates:', error);
            alert('حدث خطأ أثناء تحميل شهادات المريض');
        } finally {
            setLoading(false);
        }
    };

    const handlePatientSelect = async (patient) => {
        setSelectedPatient(patient);
        await loadPatientCertificates(patient.id);
    };

    const handlePrintCertificate = async (certificate) => {
        try {
            if (certificate.pdf_path && window.api.printPDF) {
                await window.api.printPDF(certificate.pdf_path);
                alert('تم فتح ملف PDF للطباعة');
            } else {
                alert('ملف PDF غير متوفر لهذه الشهادة');
            }
        } catch (error) {
            console.error('Error printing certificate:', error);
            alert('حدث خطأ أثناء طباعة الشهادة');
        }
    };

    const handleDeleteCertificate = async (certificateId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه الشهادة؟ لا يمكن التراجع عن هذا الإجراء.')) {
            return;
        }

        try {
            setLoading(true);
            await window.api.deleteCertificate(certificateId);
            // إعادة تحميل شهادات المريض
            await loadPatientCertificates(selectedPatient.id);
            // تحديث إحصائيات المريض
            const updatedCertificates = await window.api.getCertificatesByPatient(selectedPatient.id);
            setPatientStats(prev => ({
                ...prev,
                [selectedPatient.id]: {
                    certificatesCount: updatedCertificates.length,
                    lastCertificateDate: updatedCertificates.length > 0 ? updatedCertificates[0].created_at : null
                }
            }));
            alert('تم حذف الشهادة بنجاح');
        } catch (error) {
            console.error('Error deleting certificate:', error);
            alert('حدث خطأ أثناء حذف الشهادة');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePDF = async (certificate) => {
        try {
            setLoading(true);
            const result = await window.api.generatePDFFromCertificate(certificate.id);
            
            if (result.success) {
                alert(`تم إنشاء PDF بنجاح!\nالملف: ${result.filename}`);
                
                // إعادة تحميل شهادات المريض لإظهار التحديث
                await loadPatientCertificates(selectedPatient.id);
            } else {
                throw new Error(result.error || 'فشل في إنشاء PDF');
            }
        } catch (error) {
            console.error('Error creating PDF:', error);
            alert('حدث خطأ أثناء إنشاء PDF: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCreatedAt = async () => {
        if (!newCreatedAt || !selectedPatient) {
            alert('يرجى إدخال تاريخ صحيح');
            return;
        }

        const formattedOldDate = formatDate(selectedPatient.created_at);
        const formattedNewDate = formatDate(newCreatedAt);
        
        if (!window.confirm(`هل أنت متأكد من تغيير تاريخ التسجيل؟\n\nمن: ${formattedOldDate}\nإلى: ${formattedNewDate}\n\nهذا التغيير سيؤثر على ترتيب المرضى وسجلات النظام.`)) {
            return;
        }

        try {
            setLoading(true);
            await window.api.updatePatientCreatedAt(selectedPatient.id, newCreatedAt);
            
            // تحديث البيانات المحلية
            setSelectedPatient(prev => ({
                ...prev,
                created_at: newCreatedAt
            }));
            
            // إعادة تحميل قائمة المرضى لتحديث العرض
            await loadPatients();
            
            setEditingCreatedAt(false);
            setNewCreatedAt('');
            alert(`تم تحديث تاريخ التسجيل بنجاح\nالتاريخ الجديد: ${formattedNewDate}`);
        } catch (error) {
            console.error('Error updating created_at:', error);
            alert('حدث خطأ أثناء تحديث تاريخ التسجيل: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartEditCreatedAt = () => {
        setEditingCreatedAt(true);
        // تحويل التاريخ إلى تنسيق input[type="date"]
        const date = new Date(selectedPatient.created_at);
        const formattedDate = date.toISOString().split('T')[0];
        setNewCreatedAt(formattedDate);
    };

    const handleCancelEditCreatedAt = () => {
        setEditingCreatedAt(false);
        setNewCreatedAt('');
    };

    const handleStartEditCertificateDate = (certificate) => {
        setEditingCertificateDate(certificate.id);
        // تحويل التاريخ إلى تنسيق input[type="date"]
        const date = new Date(certificate.issue_date);
        const formattedDate = date.toISOString().split('T')[0];
        setNewCertificateDate(formattedDate);
    };

    const handleUpdateCertificateDate = async (certificateId) => {
        if (!newCertificateDate) {
            alert('يرجى إدخال تاريخ صحيح');
            return;
        }

        const certificate = patientCertificates.find(c => c.id === certificateId);
        const formattedOldDate = formatDate(certificate.issue_date);
        const formattedNewDate = formatDate(newCertificateDate);
        
        if (!window.confirm(`هل أنت متأكد من تغيير تاريخ إصدار الشهادة؟\n\nالشهادة رقم: ${certificate.id}\nمن: ${formattedOldDate}\nإلى: ${formattedNewDate}\n\nهذا التغيير سيؤثر على محتوى الشهادة المطبوعة.`)) {
            return;
        }

        try {
            setLoading(true);
            await window.api.updateCertificateIssueDate(certificateId, newCertificateDate);
            
            // تحديث البيانات المحلية
            setPatientCertificates(prev => 
                prev.map(cert => 
                    cert.id === certificateId 
                        ? { ...cert, issue_date: newCertificateDate }
                        : cert
                )
            );
            
            setEditingCertificateDate(null);
            setNewCertificateDate('');
            alert(`تم تحديث تاريخ إصدار الشهادة بنجاح\nالتاريخ الجديد: ${formattedNewDate}`);
        } catch (error) {
            console.error('Error updating certificate issue date:', error);
            alert('حدث خطأ أثناء تحديث تاريخ إصدار الشهادة: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEditCertificateDate = () => {
        setEditingCertificateDate(null);
        setNewCertificateDate('');
    };

    const filteredPatients = patients.filter(patient =>
        patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.national_id && patient.national_id.includes(searchTerm))
    );

    const formatDate = (dateString) => {
        if (!dateString) return 'غير محدد';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    };

    return (
        <div className="patient-management">
            <div className="patient-management-header">
                <h1>إدارة المرضى</h1>
                <p className="subtitle">عرض وإدارة بيانات المرضى وشهاداتهم الطبية</p>
            </div>

            <div className="management-container">
                {/* قائمة المرضى - الجانب الأيسر */}
                <div className="patients-list-section">
                    <div className="section-header">
                        <h2>قائمة المرضى ({patients.length})</h2>
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="البحث عن مريض..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <div className="patients-list">
                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                                <p>جاري التحميل...</p>
                            </div>
                        ) : filteredPatients.length > 0 ? (
                            filteredPatients.map(patient => (
                                <div
                                    key={patient.id}
                                    className={`patient-card ${selectedPatient?.id === patient.id ? 'selected' : ''}`}
                                    onClick={() => handlePatientSelect(patient)}
                                >
                                    <div className="patient-info">
                                        <h3 className="patient-name">{patient.full_name}</h3>
                                        <div className="patient-details">
                                            <span className="birth-date">
                                                📅 {formatDate(patient.birth_date)}
                                            </span>
                                            {patient.national_id && (
                                                <span className="national-id">
                                                    🆔 {patient.national_id}
                                                </span>
                                            )}
                                        </div>
                                        <div className="patient-stats">
                                            <span className="registration-date">
                                                📝 مسجل في: {formatDate(patient.created_at)}
                                            </span>
                                            <span className="certificates-count">
                                                📄 {patientStats[patient.id]?.certificatesCount || 0} شهادة
                                            </span>
                                            {patientStats[patient.id]?.lastCertificateDate && (
                                                <span className="last-certificate">
                                                    🕒 آخر شهادة: {formatDate(patientStats[patient.id].lastCertificateDate)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="patient-arrow">
                                        ←
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-patients">
                                <div className="no-patients-icon">👥</div>
                                <p>لا توجد مرضى {searchTerm ? 'مطابقون للبحث' : 'مسجلون'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* تفاصيل المريض والشهادات - الجانب الأيمن */}
                <div className="patient-details-section">
                    {selectedPatient ? (
                        <>
                            <div className="patient-header">
                                <div className="patient-avatar">
                                    👤
                                </div>
                                <div className="patient-main-info">
                                    <h2>{selectedPatient.full_name}</h2>
                                    <div className="patient-meta">
                                        <span>تاريخ الميلاد: {formatDate(selectedPatient.birth_date)}</span>
                                        {selectedPatient.national_id && (
                                            <span>الرقم الوطني: {selectedPatient.national_id}</span>
                                        )}
                                        <div className="created-at-section">
                                            {editingCreatedAt ? (
                                                <div className="edit-created-at">
                                                    <input
                                                        type="date"
                                                        value={newCreatedAt}
                                                        onChange={(e) => setNewCreatedAt(e.target.value)}
                                                        className="date-input"
                                                    />
                                                    <div className="edit-buttons">
                                                        <button 
                                                            onClick={handleUpdateCreatedAt}
                                                            className="btn btn-success"
                                                            disabled={loading}
                                                        >
                                                            ✓ حفظ
                                                        </button>
                                                        <button 
                                                            onClick={handleCancelEditCreatedAt}
                                                            className="btn btn-secondary"
                                                            disabled={loading}
                                                        >
                                                            ✗ إلغاء
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="created-at-display">
                                                    <span>تاريخ التسجيل: {formatDate(selectedPatient.created_at)}</span>
                                                    <button 
                                                        onClick={handleStartEditCreatedAt}
                                                        className="btn-edit-date"
                                                        title="تعديل تاريخ التسجيل"
                                                    >
                                                        ✏️
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="certificates-section">
                                <h3>الشهادات الطبية ({patientCertificates.length})</h3>
                                
                                {loading ? (
                                    <div className="loading-container">
                                        <div className="loading-spinner"></div>
                                        <p>جاري تحميل الشهادات...</p>
                                    </div>
                                ) : patientCertificates.length > 0 ? (
                                    <div className="certificates-list">
                                        {patientCertificates.map(certificate => (
                                            <div key={certificate.id} className="certificate-card">
                                                <div className="certificate-header">
                                                    <span className="certificate-id">شهادة #{certificate.id}</span>
                                                    <div className="certificate-date-section">
                                                        {editingCertificateDate === certificate.id ? (
                                                            <div className="edit-certificate-date">
                                                                <input
                                                                    type="date"
                                                                    value={newCertificateDate}
                                                                    onChange={(e) => setNewCertificateDate(e.target.value)}
                                                                    className="date-input-small"
                                                                />
                                                                <div className="edit-buttons-small">
                                                                    <button 
                                                                        onClick={() => handleUpdateCertificateDate(certificate.id)}
                                                                        className="btn-save-small"
                                                                        disabled={loading}
                                                                        title="حفظ"
                                                                    >
                                                                        ✓
                                                                    </button>
                                                                    <button 
                                                                        onClick={handleCancelEditCertificateDate}
                                                                        className="btn-cancel-small"
                                                                        disabled={loading}
                                                                        title="إلغاء"
                                                                    >
                                                                        ✗
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="certificate-date-display">
                                                                <span className="certificate-date">
                                                                    {formatDate(certificate.issue_date)}
                                                                </span>
                                                                <button 
                                                                    onClick={() => handleStartEditCertificateDate(certificate)}
                                                                    className="btn-edit-certificate-date"
                                                                    title="تعديل تاريخ الإصدار"
                                                                >
                                                                    ✏️
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="certificate-details">
                                                    <div className="certificate-info">
                                                        <div className="info-item">
                                                            <span className="label">مدة الإجازة:</span>
                                                            <span className="value">{certificate.leave_duration_days} يوم</span>
                                                        </div>
                                                        
                                                        {certificate.diagnosis && (
                                                            <div className="info-item">
                                                                <span className="label">التشخيص:</span>
                                                                <span className="value">{certificate.diagnosis}</span>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="info-item">
                                                            <span className="label">تاريخ الإنشاء:</span>
                                                            <span className="value">{formatDate(certificate.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="certificate-actions">
                                                    {certificate.pdf_path ? (
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => handlePrintCertificate(certificate)}
                                                        >
                                                            🖨️ طباعة
                                                        </button>
                                                    ) : (
                                                        <span className="no-pdf-notice">PDF غير متوفر</span>
                                                    )}
                                                    <button
                                                        className="btn btn-success"
                                                        onClick={() => handleCreatePDF(certificate)}
                                                        title="إنشاء PDF للشهادة"
                                                    >
                                                        📄 إنشاء PDF
                                                    </button>
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={() => handleDeleteCertificate(certificate.id)}
                                                        title="حذف الشهادة"
                                                    >
                                                        🗑️ حذف
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-certificates">
                                        <div className="no-certificates-icon">📄</div>
                                        <p>لا توجد شهادات طبية لهذا المريض</p>
                                        <small>يمكنك إنشاء شهادة جديدة من صفحة إنشاء الشهادات</small>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="no-selection">
                            <div className="no-selection-icon">👈</div>
                            <h3>اختر مريضاً من القائمة</h3>
                            <p>اختر مريضاً من القائمة الجانبية لعرض تفاصيله وشهاداته الطبية</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PatientManagement;