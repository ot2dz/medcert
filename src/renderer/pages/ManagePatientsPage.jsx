import React, { useState, useEffect, useMemo } from 'react';
import './ManagePatientsPage.css';

const BLANK_FORM = { id: null, fullName: '', birthDate: '', nationalId: '' };

function ManagePatientsPage() {
    const [patients, setPatients] = useState([]);
    const [formData, setFormData] = useState(BLANK_FORM);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const result = await window.api.getPatients();
            setPatients(result.map(p => ({
                id: p.id,
                fullName: p.full_name,
                birthDate: p.birth_date,
                nationalId: p.national_id
            })));
        } catch (error) {
            console.error('Error loading patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.fullName.trim()) return;

        try {
            setLoading(true);
            
            if (isEditing) {
                await window.api.updatePatient(formData);
                console.log('Patient updated successfully');
            } else {
                await window.api.addPatient(formData);
                console.log('Patient added successfully');
            }

            resetForm();
            loadPatients();
        } catch (error) {
            console.error('Error saving patient:', error);
            alert('حدث خطأ أثناء حفظ بيانات المريض. تأكد من أن الرقم الوطني غير مكرر.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleEdit = (patient) => {
        setFormData(patient);
        setIsEditing(true);
    };

    const handleDelete = async (patientId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المريض؟')) return;

        try {
            setLoading(true);
            await window.api.deletePatient(patientId);
            console.log('Patient deleted successfully');
            loadPatients();
        } catch (error) {
            console.error('Error deleting patient:', error);
            alert('حدث خطأ أثناء حذف المريض.');
        } finally {
            setLoading(false);
        }
    };
    
    const resetForm = () => {
        setFormData(BLANK_FORM);
        setIsEditing(false);
    };

    const filteredPatients = useMemo(() => 
        patients.filter(p => 
            p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.nationalId && p.nationalId.includes(searchTerm))
        ), [patients, searchTerm]);

    return (
        <div className="manage-patients-page">
            <div className="patient-form-container">
                <h3>{isEditing ? '✏️ تعديل بيانات المريض' : '➕ إضافة مريض جديد'}</h3>
                <form onSubmit={handleSubmit} className="patient-form">
                    <div className="form-group">
                        <label htmlFor="fullName">الاسم الكامل *</label>
                        <input 
                            type="text" 
                            id="fullName"
                            name="fullName" 
                            placeholder="أدخل الاسم الكامل" 
                            value={formData.fullName} 
                            onChange={handleInputChange} 
                            required 
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="birthDate">تاريخ الميلاد</label>
                        <input 
                            type="date" 
                            id="birthDate"
                            name="birthDate" 
                            value={formData.birthDate} 
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="nationalId">الرقم الوطني</label>
                        <input 
                            type="text" 
                            id="nationalId"
                            name="nationalId" 
                            placeholder="أدخل الرقم الوطني" 
                            value={formData.nationalId} 
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="form-buttons">
                        <button type="submit" disabled={loading}>
                            {loading ? '⏳ جاري الحفظ...' : (isEditing ? '💾 حفظ التعديلات' : '➕ إضافة المريض')}
                        </button>
                        <button type="button" onClick={resetForm} disabled={loading}>
                            ❌ إلغاء
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="patient-list-container">
                <div className="list-header">
                    <h3>👥 قائمة المرضى ({filteredPatients.length})</h3>
                    <input 
                        type="text" 
                        placeholder="🔍 ابحث بالاسم أو الرقم الوطني..." 
                        className="search-bar" 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        disabled={loading}
                    />
                </div>
                
                {loading ? (
                    <div className="loading-state">⏳ جاري تحميل البيانات...</div>
                ) : filteredPatients.length === 0 ? (
                    <div className="empty-state">
                        {searchTerm ? '🔍 لم يتم العثور على نتائج مطابقة' : '📝 لا توجد مرضى مسجلين بعد'}
                    </div>
                ) : (
                    <ul className="patient-list">
                        {filteredPatients.map(patient => (
                            <li key={patient.id} className="patient-item">
                                <div className="patient-info">
                                    <div className="patient-name">{patient.fullName}</div>
                                    <div className="patient-details">
                                        {patient.nationalId && <span>🆔 {patient.nationalId}</span>}
                                        {patient.birthDate && <span>📅 {patient.birthDate}</span>}
                                    </div>
                                </div>
                                <div className="patient-actions">
                                    <button 
                                        onClick={() => handleEdit(patient)}
                                        className="edit-btn"
                                        disabled={loading}
                                        title="تعديل"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(patient.id)}
                                        className="delete-btn"
                                        disabled={loading}
                                        title="حذف"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ManagePatientsPage;