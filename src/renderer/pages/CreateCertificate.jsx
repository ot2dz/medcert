import React, { useState, useEffect } from 'react';
import './CreateCertificate.css';

function CreateCertificateForm() {
    const [formData, setFormData] = useState({
        clinic_name: 'EPSP IN SALAH',
        doctor_name: 'HAMADI',
        patient_full_name: '',
        patient_birth_date: '',
        patient_birth_place: 'In Salah',
        leave_duration_days: '',
        diagnosis: '',
        issue_place: 'In Salah',
        issue_date: new Date().toISOString().split('T')[0], // تاريخ اليوم
    });

    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastCreatedCertificate, setLastCreatedCertificate] = useState(null);
    
    // للإكمال التلقائي
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredPatients, setFilteredPatients] = useState([]);

    // تحميل قائمة المرضى عند بدء التشغيل
    useEffect(() => {
        loadPatients();
        
        // إضافة event listener لإخفاء الاقتراحات عند النقر خارجها
        const handleClickOutside = (event) => {
            if (!event.target.closest('.autocomplete-container')) {
                setShowSuggestions(false);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const loadPatients = async () => {
        try {
            if (window.api && window.api.getPatients) {
                const result = await window.api.getPatients();
                setPatients(result || []);
            }
        } catch (error) {
            console.error('Error loading patients:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // إذا كان الحقل هو اسم المريض، قم بتفعيل الإكمال التلقائي
        if (name === 'patient_full_name') {
            handlePatientNameChange(value);
        }
    };
    
    const handlePatientNameChange = (value) => {
        if (value.trim().length > 1) { // ابدأ البحث من حرفين
            const filtered = patients.filter(patient => 
                patient.full_name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredPatients(filtered.slice(0, 5)); // اعرض أول 5 نتائج فقط
            setShowSuggestions(true); // اعرض الاقتراحات حتى لو كانت فارغة
        } else {
            setShowSuggestions(false);
            setFilteredPatients([]);
        }
    };
    
    const selectPatientFromSuggestion = (patient) => {
        setFormData(prev => ({
            ...prev,
            patient_full_name: patient.full_name,
            patient_birth_date: patient.birth_date,
        }));
        setSelectedPatient(patient.id.toString());
        setShowSuggestions(false);
        setFilteredPatients([]);
    };

    const handlePreview = () => {
        if (!formData.patient_full_name.trim()) {
            alert('يرجى إدخال اسم المريض أولاً');
            return;
        }
        setShowPreview(true);
    };

    const handlePrint = async () => {
        if (!lastCreatedCertificate) {
            alert('يرجى إنشاء شهادة أولاً قبل الطباعة');
            return;
        }

        try {
            setLoading(true);
            const result = await window.api.printPDF(lastCreatedCertificate.pdfPath);
            if (result.success) {
                alert('تم فتح ملف الـ PDF للطباعة بنجاح!\nيمكنك الآن الطباعة من التطبيق الذي تم فتحه.');
            }
        } catch (error) {
            console.error('Error printing PDF:', error);
            alert('حدث خطأ أثناء فتح ملف الطباعة: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDirectPrint = async () => {
        if (!formData.patient_full_name.trim() || !formData.leave_duration_days) {
            alert('يرجى ملء جميع البيانات المطلوبة قبل الطباعة');
            return;
        }

        try {
            setLoading(true);
            
            // البحث عن المريض أو إنشاؤه
            const patientData = {
                fullName: formData.patient_full_name,
                birthDate: formData.patient_birth_date,
                nationalId: null // يمكن إضافة حقل الرقم الوطني لاحقاً
            };
            
            const patient = await window.api.findOrCreatePatient(patientData);
            
            // إنشاء بيانات الشهادة (بدون PDF)
            const certificateData = {
                patientId: patient.id,
                issueDate: formData.issue_date,
                leaveDurationDays: parseInt(formData.leave_duration_days),
                diagnosis: formData.diagnosis || 'غير محدد',
                pdfPath: null // لا نحفظ PDF في الطباعة المباشرة
            };
            
            // حفظ الشهادة في قاعدة البيانات
            const certificate = await window.api.createCertificate(certificateData);
            
            // توليد HTML للشهادة
            const htmlContent = generatePreviewHTML();
            
            // طباعة مباشرة
            const printResult = await window.api.printDirect(htmlContent);
            
            if (printResult.success && certificate.success) {
                // التحقق من حالة الإلغاء
                if (printResult.cancelled) {
                    alert(`تم حفظ الشهادة بنجاح!\nرقم الشهادة: ${certificate.certificate.id}\nالمريض: ${patient.full_name}\n\nتم إلغاء الطباعة.`);
                } else {
                    alert(`تم حفظ الشهادة وفتح مربع حوار الطباعة بنجاح!\nرقم الشهادة: ${certificate.certificate.id}\nالمريض: ${patient.full_name}`);
                }
                
                // إعادة تعيين النموذج
                setFormData({
                    clinic_name: 'EPSP IN SALAH',
                    doctor_name: 'HAMADI',
                    patient_full_name: '',
                    patient_birth_date: '',
                    patient_birth_place: 'In Salah',
                    leave_duration_days: '',
                    diagnosis: '',
                    issue_place: 'In Salah',
                    issue_date: new Date().toISOString().split('T')[0],
                });
                setSelectedPatient('');
            } else {
                throw new Error('فشل في حفظ الشهادة أو الطباعة');
            }
        } catch (error) {
            console.error('Error in direct printing:', error);
            // تجاهل أخطاء الإلغاء
            if (error.message && error.message.includes('Print job canceled')) {
                // لا نعرض رسالة خطأ للإلغاء العادي
                return;
            }
            alert('حدث خطأ أثناء الطباعة المباشرة: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const generatePreviewHTML = () => {
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
                }
                footer {
                    position: absolute;
                    bottom: 2.5cm; /* نفس البادينغ من الأسفل */
                    left: 2.5cm;
                    right: 2.5cm;
                    display: flex;
                    justify-content: space-between;
                    font-size: 16px;
                }
            </style>
        </head>
        <body>
            <header>
                République algérienne démocratique et populaire <br/>
                Ministère de la santé <br/>
                ${formData.clinic_name}
            </header>

            <h1>CERTIFICAT MEDICAL</h1>

            <main>
                <p>Je soussigné(e), Dr <strong>${formData.doctor_name}</strong> atteste que :</p>
                <p>M./Mme <strong>${formData.patient_full_name}</strong> né(e) LE <strong>${formData.patient_birth_date}</strong> à <strong>${formData.patient_birth_place}</strong>.</p>
                <p>Nécessite un arrêt de travail de ( <strong>${formData.leave_duration_days}</strong> ) jours à compter de ce jour.</p>
                ${formData.diagnosis ? `<p>Diagnostic: <strong>${formData.diagnosis}</strong></p>` : ""}
                <p>Ce certificat est délivré à la demande de l'intéressé(e) pour faire valoir ce que de droit.</p>
            </main>

            <footer>
                <div>${formData.issue_place} le : ${new Date(formData.issue_date).toLocaleDateString('en-GB')}</div>
                <div>le médecin :</div>
            </footer>
        </body>
        </html>
    `;
};



    return (
        <div className="create-certificate">
            <div className="certificate-header">
                <h1>إنشاء شهادة طبية جديدة</h1>
                <p className="certificate-subtitle">املأ البيانات المطلوبة وشاهد المعاينة الفورية</p>
            </div>
            
            <div className="certificate-container">
                {/* Form Section - Left Column */}
                <div className="form-container">
                    <h2>بيانات الشهادة</h2>

                    <form className="form-grid">
                        {/* Row 1 - Patient Name and Leave Days */}
                        <div className="form-group">
                            <label htmlFor="patient_full_name">اسم المريض الكامل *</label>
                            <div className="autocomplete-container">
                                <input 
                                    type="text" 
                                    id="patient_full_name" 
                                    name="patient_full_name" 
                                    value={formData.patient_full_name} 
                                    onChange={handleInputChange}
                                    onFocus={() => {
                                        if (formData.patient_full_name.trim().length > 0) {
                                            handlePatientNameChange(formData.patient_full_name);
                                        }
                                    }}
                                    required
                                    placeholder="أدخل الاسم الكامل"
                                    autoComplete="off"
                                />
                                {showSuggestions && (
                                    <div className="autocomplete-suggestions">
                                        {filteredPatients.length > 0 ? (
                                            filteredPatients.map(patient => (
                                                <div 
                                                    key={patient.id}
                                                    className="suggestion-item"
                                                    onClick={() => selectPatientFromSuggestion(patient)}
                                                >
                                                    <div className="suggestion-name">{patient.full_name}</div>
                                                    <div className="suggestion-details">
                                                        {patient.birth_date} - {patient.national_id || 'بلا رقم وطني'}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-suggestions">
                                                <div className="no-suggestions-icon">🔍</div>
                                                <div className="no-suggestions-text">لا توجد نتائج مطابقة</div>
                                                <div className="no-suggestions-hint">سيتم إنشاء مريض جديد عند الحفظ</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="leave_duration_days">عدد أيام الإجازة المرضية *</label>
                            <input 
                                type="number" 
                                id="leave_duration_days" 
                                name="leave_duration_days" 
                                value={formData.leave_duration_days} 
                                onChange={handleInputChange}
                                required
                                min="1"
                                placeholder="عدد الأيام"
                            />
                        </div>

                        {/* Row 2 - Birth Date and Birth Place */}
                        <div className="form-group">
                            <label htmlFor="patient_birth_date">تاريخ الميلاد</label>
                            <input 
                                type="date" 
                                id="patient_birth_date" 
                                name="patient_birth_date" 
                                value={formData.patient_birth_date} 
                                onChange={handleInputChange} 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="patient_birth_place">مكان الميلاد</label>
                            <input 
                                type="text" 
                                id="patient_birth_place" 
                                name="patient_birth_place" 
                                value={formData.patient_birth_place} 
                                onChange={handleInputChange}
                                placeholder="مكان الميلاد"
                            />
                        </div>

                        {/* Row 3 - Doctor and Clinic */}
                        <div className="form-group">
                            <label htmlFor="doctor_name">اسم الطبيب</label>
                            <input 
                                type="text" 
                                id="doctor_name" 
                                name="doctor_name" 
                                value={formData.doctor_name} 
                                onChange={handleInputChange}
                                placeholder="اسم الطبيب"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="clinic_name">اسم المؤسسة الصحية</label>
                            <input 
                                type="text" 
                                id="clinic_name" 
                                name="clinic_name" 
                                value={formData.clinic_name} 
                                onChange={handleInputChange}
                                placeholder="اسم المؤسسة"
                            />
                        </div>

                        {/* Row 4 - Issue Date and Place */}
                        <div className="form-group">
                            <label htmlFor="issue_date">تاريخ الإصدار</label>
                            <input 
                                type="date" 
                                id="issue_date" 
                                name="issue_date" 
                                value={formData.issue_date} 
                                onChange={handleInputChange} 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="issue_place">مكان الإصدار</label>
                            <input 
                                type="text" 
                                id="issue_place" 
                                name="issue_place" 
                                value={formData.issue_place} 
                                onChange={handleInputChange}
                                placeholder="مكان الإصدار"
                            />
                        </div>

                        {/* Row 5 - Diagnosis (Full Width) */}
                        <div className="form-group full-width">
                            <label htmlFor="diagnosis">التشخيص (اختياري)</label>
                            <textarea 
                                id="diagnosis" 
                                name="diagnosis" 
                                value={formData.diagnosis} 
                                onChange={handleInputChange}
                                placeholder="أدخل التشخيص إذا كان مطلوباً"
                                rows="3"
                            />
                        </div>
                    </form>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button 
                            type="button" 
                            onClick={handlePreview} 
                            className="btn btn-secondary"
                            disabled={!formData.patient_full_name.trim()}
                        >
                            معاينة كاملة
                        </button>
                        <button 
                            type="button" 
                            onClick={handleDirectPrint} 
                            className="btn btn-primary"
                            disabled={loading || !formData.patient_full_name.trim() || !formData.leave_duration_days}
                        >
                            {loading ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    جاري الطباعة...
                                </>
                            ) : (
                                <>
                                    🖨️ طباعة مباشرة
                                </>
                            )}
                        </button>
                        {lastCreatedCertificate && (
                            <button 
                                type="button" 
                                onClick={handlePrint} 
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="loading-spinner"></span>
                                        جاري الطباعة...
                                    </>
                                ) : (
                                    <>
                                        � طباعة من PDF
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Last Certificate Info */}
                    {lastCreatedCertificate && (
                        <div className="success-message">
                            آخر شهادة تم إنشاؤها: #{lastCreatedCertificate.certificate.id} للمريض {lastCreatedCertificate.patient.full_name}
                        </div>
                    )}
                </div>

                {/* Preview Section - Right Column */}
                <div className="preview-section">
                    <h2 className="section-title">معاينة فورية</h2>
                    <div className="preview-content">
                        {formData.patient_full_name.trim() && formData.leave_duration_days ? (
                            <div className="real-certificate-preview">
                                <div className="header">
                                    République algérienne démocratique et populaire<br/>
                                    Ministère de la santé<br/>
                                    <strong>{formData.clinic_name}</strong>
                                </div>

                                <div className="title">
                                    CERTIFICAT MEDICAL
                                </div>

                                <div className="content">
                                    <p>Je soussigné(e), Dr <strong>{formData.doctor_name}</strong> atteste que :</p>
                                    
                                    <p>M./Mme <strong>{formData.patient_full_name}</strong> né(e) LE <strong>{formData.patient_birth_date || '__/__/____'}</strong> à <strong>{formData.patient_birth_place}</strong>.</p>
                                    
                                    <p>Nécessite un arrêt de travail de ( <strong>{formData.leave_duration_days}</strong> ) jours à compter de ce jour.</p>
                                    
                                    {formData.diagnosis && (
                                        <p>Diagnostic: <strong>{formData.diagnosis}</strong></p>
                                    )}
                                    
                                    <p>Ce certificat est délivré à la demande de l'intéressé(e) pour faire valoir ce que de droit.</p>
                                </div>

                                <div className="footer">
                                    <div className="left">
                                        {formData.issue_place} le : {new Date(formData.issue_date).toLocaleDateString('en-GB')}
                                    </div>
                                    <div className="right">
                                        le médecin :
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="preview-placeholder">
                                املأ اسم المريض وعدد الأيام لرؤية معاينة الشهادة
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for Full Preview */}
            {showPreview && (
                <div className="modal" onClick={() => setShowPreview(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowPreview(false)}>×</button>
                        <div dangerouslySetInnerHTML={{ __html: generatePreviewHTML() }} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateCertificateForm;