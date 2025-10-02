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

    const handlePatientSelect = (e) => {
        const patientId = e.target.value;
        setSelectedPatient(patientId);
        
        if (patientId) {
            const patient = patients.find(p => p.id.toString() === patientId);
            if (patient) {
                setFormData(prev => ({
                    ...prev,
                    patient_full_name: patient.full_name || '',
                    patient_birth_date: patient.birth_date || '',
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                patient_full_name: '',
                patient_birth_date: '',
            }));
        }
    };

    const handlePreview = () => {
        if (!formData.patient_full_name.trim()) {
            alert('يرجى إدخال اسم المريض أولاً');
            return;
        }
        setShowPreview(true);
    };

    const handleSave = async () => {
        if (!formData.patient_full_name.trim() || !formData.leave_duration_days) {
            alert('يرجى ملء جميع البيانات المطلوبة');
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
            
            // إنشاء الشهادة
            const certificateData = {
                patientId: patient.id,
                issueDate: formData.issue_date,
                leaveDurationDays: parseInt(formData.leave_duration_days),
                diagnosis: formData.diagnosis || 'غير محدد',
                pdfPath: null // سيتم إضافة مسار PDF لاحقاً
            };
            
            const savedCertificate = await window.api.addCertificate(certificateData);
            
            alert(`تم حفظ الشهادة بنجاح!\nرقم الشهادة: ${savedCertificate.id}\nالمريض: ${patient.full_name}`);
            
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
            
        } catch (error) {
            console.error('Error creating certificate:', error);
            alert('حدث خطأ أثناء حفظ الشهادة: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const generatePreviewHTML = () => {
        return `
            <div style="
                width: 21cm;
                min-height: 29.7cm;
                padding: 2.5cm;
                margin: 0 auto;
                background: white;
                border: 2px solid #000;
                font-family: Arial, sans-serif;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
            ">
                <header style="text-align: center; line-height: 1.4; font-size: 14px; font-weight: bold;">
                    <span>République algérienne démocratique et populaire</span><br>
                    <span>Ministère de la santé</span><br>
                    <span>${formData.clinic_name}</span>
                </header>

                <h1 style="text-align: center; text-decoration: underline; font-size: 18px; margin: 50px 0;">
                    CERTIFICAT MEDICAL
                </h1>

                <main style="font-size: 16px; line-height: 2.5; flex-grow: 1;">
                    <p style="margin: 20px 0;">
                        Je soussigné(e), Dr <strong>${formData.doctor_name}</strong> atteste que :
                    </p>
                    <p style="margin: 20px 0;">
                        M./Mme <strong>${formData.patient_full_name}</strong> né(e) LE <strong>${formData.patient_birth_date}</strong> à <strong>${formData.patient_birth_place}</strong>.
                    </p>
                    <p style="margin: 20px 0;">
                        Nécessite un arrêt de travail de ( <strong>${formData.leave_duration_days}</strong> ) jours à compter de ce jour.
                    </p>
                    <p style="margin: 20px 0;">
                        Ce certificat est délivré à la demande de l'intéressé(e) pour faire valoir ce que de droit.
                    </p>
                </main>

                <footer style="
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-top: 50px;
                    font-size: 16px;
                ">
                    <div style="text-align: left;">
                        <span>${formData.issue_place} le : ${formData.issue_date}</span>
                    </div>
                    <div style="text-align: center;">
                        <span>le médecin :</span>
                    </div>
                </footer>
            </div>
        `;
    };

    return (
        <div className="certificate-container">
            <div className="form-section">
                <h2>إنشاء شهادة طبية جديدة</h2>
                
                {/* اختيار مريض من القائمة */}
                <div className="form-group">
                    <label htmlFor="patient_select">اختيار مريض من القائمة (اختياري)</label>
                    <select 
                        id="patient_select" 
                        value={selectedPatient} 
                        onChange={handlePatientSelect}
                        className="patient-select"
                    >
                        <option value="">-- اختر مريض أو أدخل بيانات جديدة --</option>
                        {patients.map(patient => (
                            <option key={patient.id} value={patient.id}>
                                {patient.full_name} - {patient.national_id || 'بلا رقم وطني'}
                            </option>
                        ))}
                    </select>
                </div>

                <form className="form-grid">
                    {/* Row 1 */}
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
                                placeholder="أدخل الاسم الكامل أو ابدأ الكتابة للبحث"
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

                    {/* Row 2 */}
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

                    <hr className="divider" />

                    {/* Row 3 - Default values */}
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

                    {/* Row 4 */}
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
                </form>

                {/* أزرار العمل */}
                <div className="action-buttons">
                    <button 
                        type="button" 
                        onClick={handlePreview}
                        className="btn-preview"
                        disabled={!formData.patient_full_name.trim()}
                    >
                        معاينة الشهادة
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSave}
                        className="btn-save"
                        disabled={loading || !formData.patient_full_name.trim() || !formData.leave_duration_days}
                    >
                        {loading ? 'جاري الحفظ...' : 'حفظ وإنشاء PDF'}
                    </button>
                </div>
            </div>

            {/* معاينة الشهادة */}
            {showPreview && (
                <div className="preview-section">
                    <div className="preview-header">
                        <h3>معاينة الشهادة الطبية</h3>
                        <button 
                            onClick={() => setShowPreview(false)}
                            className="close-preview"
                        >
                            ✕
                        </button>
                    </div>
                    <div 
                        className="certificate-preview"
                        dangerouslySetInnerHTML={{ __html: generatePreviewHTML() }}
                    />
                </div>
            )}
        </div>
    );
}

export default CreateCertificateForm;