import React, { useState } from 'react';
import '../styles/CreateCertificateForm.css';

const CreateCertificateForm = () => {
  const [formData, setFormData] = useState({
    doctorName: '',
    clinicName: '',
    patientFullName: '',
    patientBirthDate: '',
    patientBirthPlace: '',
    leaveDurationDays: '',
    issueDate: new Date().toLocaleDateString('fr-FR')
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    // هنا سيتم إرسال البيانات لإنشاء الشهادة
  };

  const handlePreview = () => {
    // هنا سيتم عرض معاينة الشهادة
    console.log('Preview Certificate:', formData);
  };

  return (
    <div className="certificate-form-container">
      <div className="form-header">
        <h1>إنشاء شهادة طبية</h1>
        <p>قم بملء البيانات المطلوبة لإنشاء الشهادة الطبية</p>
      </div>

      <form onSubmit={handleSubmit} className="certificate-form">
        <div className="form-section">
          <h3>بيانات الطبيب والعيادة</h3>
          <div className="form-group">
            <label htmlFor="doctorName">اسم الطبيب</label>
            <input
              type="text"
              id="doctorName"
              name="doctorName"
              value={formData.doctorName}
              onChange={handleInputChange}
              placeholder="أدخل اسم الطبيب"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="clinicName">اسم العيادة</label>
            <input
              type="text"
              id="clinicName"
              name="clinicName"
              value={formData.clinicName}
              onChange={handleInputChange}
              placeholder="أدخل اسم العيادة"
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>بيانات المريض</h3>
          <div className="form-group">
            <label htmlFor="patientFullName">الاسم الكامل للمريض</label>
            <input
              type="text"
              id="patientFullName"
              name="patientFullName"
              value={formData.patientFullName}
              onChange={handleInputChange}
              placeholder="أدخل الاسم الكامل"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="patientBirthDate">تاريخ الميلاد</label>
              <input
                type="date"
                id="patientBirthDate"
                name="patientBirthDate"
                value={formData.patientBirthDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="patientBirthPlace">مكان الميلاد</label>
              <input
                type="text"
                id="patientBirthPlace"
                name="patientBirthPlace"
                value={formData.patientBirthPlace}
                onChange={handleInputChange}
                placeholder="أدخل مكان الميلاد"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>بيانات الإجازة المرضية</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="leaveDurationDays">مدة الإجازة (بالأيام)</label>
              <input
                type="number"
                id="leaveDurationDays"
                name="leaveDurationDays"
                value={formData.leaveDurationDays}
                onChange={handleInputChange}
                placeholder="عدد الأيام"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="issueDate">تاريخ الإصدار</label>
              <input
                type="date"
                id="issueDate"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handlePreview} className="btn-preview">
            معاينة الشهادة
          </button>
          <button type="submit" className="btn-generate">
            إنشاء الشهادة
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCertificateForm;