import React, { useState } from 'react';
import './CreateCertificate.css';

function CreateCertificateForm() {
    const [formData, setFormData] = useState({
        clinic_name: 'EPSP IN SALAH',
        doctor_name: 'HAMADI',
        patient_full_name: '',
        patient_birth_date: '',
        patient_birth_place: 'In Salah',
        leave_duration_days: '',
        issue_place: 'In Salah',
        issue_date: new Date().toISOString().split('T')[0], // تاريخ اليوم
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="form-container">
            <h2>Créer un Nouveau Certificat</h2>
            <form className="form-grid">
                {/* Row 1 */}
                <div className="form-group">
                    <label htmlFor="patient_full_name">Nom et Prénom du Patient</label>
                    <input type="text" id="patient_full_name" name="patient_full_name" value={formData.patient_full_name} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="leave_duration_days">Jours d'arrêt de travail</label>
                    <input type="number" id="leave_duration_days" name="leave_duration_days" value={formData.leave_duration_days} onChange={handleInputChange} />
                </div>

                {/* Row 2 */}
                <div className="form-group">
                    <label htmlFor="patient_birth_date">Date de Naissance</label>
                    <input type="date" id="patient_birth_date" name="patient_birth_date" value={formData.patient_birth_date} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="patient_birth_place">Lieu de Naissance</label>
                    <input type="text" id="patient_birth_place" name="patient_birth_place" value={formData.patient_birth_place} onChange={handleInputChange} />
                </div>

                <hr className="divider" />

                {/* Row 3 - Default values */}
                <div className="form-group">
                    <label htmlFor="doctor_name">Nom du Médecin</label>
                    <input type="text" id="doctor_name" name="doctor_name" value={formData.doctor_name} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="clinic_name">Nom de l'établissement</label>
                    <input type="text" id="clinic_name" name="clinic_name" value={formData.clinic_name} onChange={handleInputChange} />
                </div>

                {/* Row 4 */}
                <div className="form-group">
                    <label htmlFor="issue_place">Fait à</label>
                    <input type="text" id="issue_place" name="issue_place" value={formData.issue_place} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="issue_date">Le</label>
                    <input type="date" id="issue_date" name="issue_date" value={formData.issue_date} onChange={handleInputChange} />
                </div>
            </form>
        </div>
    );
}

export default CreateCertificateForm;