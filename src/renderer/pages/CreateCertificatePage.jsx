import React, { useState, useEffect } from 'react';
import './CreateCertificate.css';

// استيراد محتوى القالب كنص خام
import templateHtml from '../../../assets/templates/certificate-template.html?raw';

function CreateCertificatePage() {
    const [formData, setFormData] = useState({
        clinic_name: 'EPSP IN SALAH',
        doctor_name: 'HAMADI',
        patient_full_name: '',
        patient_birth_date: '',
        patient_birth_place: 'In Salah',
        leave_duration_days: '',
        issue_place: 'In Salah',
        issue_date: new Date().toISOString().split('T')[0],
    });

    const [previewHtml, setPreviewHtml] = useState('');

    useEffect(() => {
        let populatedHtml = templateHtml;
        for (const [key, value] of Object.entries(formData)) {
            // استخدام قيمة احتياطية للحقول الفارغة للحفاظ على التنسيق
            const displayValue = value || '...';
            populatedHtml = populatedHtml.replace(new RegExp(`{{${key}}}`, 'g'), displayValue);
        }
        setPreviewHtml(populatedHtml);
    }, [formData]); // هذا التأثير يعمل كلما تغيرت بيانات النموذج

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="create-certificate-page">
            <div className="form-container">
                <h2>Créer un Nouveau Certificat</h2>
                <form className="form-grid">
                    {/* حقول النموذج تبقى كما هي */}
                    <div className="form-group">
                        <label htmlFor="patient_full_name">Nom et Prénom du Patient</label>
                        <input type="text" id="patient_full_name" name="patient_full_name" value={formData.patient_full_name} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="leave_duration_days">Jours d'arrêt de travail</label>
                        <input type="number" id="leave_duration_days" name="leave_duration_days" value={formData.leave_duration_days} onChange={handleInputChange} />
                    </div>
                    {/* ... بقية الحقول تبقى كما هي ... */}
                </form>
            </div>

            <div className="preview-container">
                <h2>Aperçu en direct</h2>
                <iframe
                    srcDoc={previewHtml}
                    className="preview-iframe"
                    title="Certificate Preview"
                />
            </div>
        </div>
    );
}

export default CreateCertificatePage;