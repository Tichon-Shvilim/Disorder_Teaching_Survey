import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, User, Calendar, GraduationCap } from 'lucide-react';
import { createStudent } from './Api-Requests/StudentAPIService';
import type { CreateStudentRequest } from './Api-Requests/StudentAPIService';
import { getAllClasses } from './Api-Requests/ClassAPIService';
import type { Class } from './Api-Requests/ClassAPIService';
import { toast } from 'react-toastify';

const AddStudent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [formData, setFormData] = useState<CreateStudentRequest>({
    name: '',
    DOB: '',
    classId: ''
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  // Fetch classes from API
  const fetchClasses = useCallback(async () => {
    try {
      const response = await getAllClasses();
      setClasses(response.data);
    } catch (err: unknown) {
      console.error('Error fetching classes:', err);
      // Don't show error toast for classes as it's not critical
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('students.nameRequired', 'Student name is required');
    }

    if (!formData.DOB) {
      newErrors.DOB = t('students.dobRequired', 'Date of birth is required');
    } else {
      const dob = new Date(formData.DOB);
      const today = new Date();
      if (dob > today) {
        newErrors.DOB = t('students.dobFuture', 'Date of birth cannot be in the future');
      }
    }

    if (!formData.classId) {
      newErrors.classId = t('students.classRequired', 'Class assignment is required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await createStudent(formData);
      toast.success(t('students.addStudentSuccess', 'Student added successfully!'));
      navigate('../students'); // Go back to students list
    } catch (error: unknown) {
      console.error('Error adding student:', error);
      toast.error(t('students.failedToAdd', 'Failed to add student. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('../students'); // Go back to students list
  };

  return (
    <div style={{ 
      padding: '24px', 
      background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)', 
      minHeight: '100vh',
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
      <div style={{ maxWidth: '512px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <button
            onClick={handleCancel}
            style={{
              marginRight: isRTL ? '0' : '16px',
              marginLeft: isRTL ? '16px' : '0',
              padding: '8px',
              color: '#4b5563',
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#111827';
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#4b5563';
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <ArrowLeft style={{ 
              height: '20px', 
              width: '20px',
              transform: isRTL ? 'scaleX(-1)' : 'none'
            }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <GraduationCap style={{ height: '32px', width: '32px', color: '#2563eb' }} />
            <h1 style={{ 
              fontSize: '30px', 
              fontWeight: 'bold', 
              color: '#111827', 
              margin: 0,
              textAlign: isRTL ? 'right' : 'left'
            }}>
              {t('students.addNewStudent', 'Add New Student')}
            </h1>
          </div>
        </div>

        {/* Form */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Student Name */}
            <div>
              <label htmlFor="name" style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '8px',
                textAlign: isRTL ? 'right' : 'left',
                direction: isRTL ? 'rtl' : 'ltr'
              }}>
                <User style={{ 
                  height: '16px', 
                  width: '16px', 
                  display: 'inline', 
                  marginRight: isRTL ? '0' : '4px',
                  marginLeft: isRTL ? '4px' : '0'
                }} />
                {t('students.studentName', 'Student Name')} <span style={{ color: '#ef4444' }}>{t('students.required', '*')}</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t('students.enterStudentName', "Enter student's full name")}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${errors.name ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: errors.name ? '#fef2f2' : 'white',
                  outline: 'none',
                  transition: 'all 0.2s',
                  textAlign: isRTL ? 'right' : 'left',
                  direction: isRTL ? 'rtl' : 'ltr'
                }}
                onFocus={(e) => {
                  if (!errors.name) {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.name) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              />
              {errors.name && (
                <p style={{ marginTop: '4px', fontSize: '14px', color: '#dc2626' }}>{errors.name}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="DOB" style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '8px',
                textAlign: isRTL ? 'right' : 'left',
                direction: isRTL ? 'rtl' : 'ltr'
              }}>
                <Calendar style={{ 
                  height: '16px', 
                  width: '16px', 
                  display: 'inline', 
                  marginRight: isRTL ? '0' : '4px',
                  marginLeft: isRTL ? '4px' : '0'
                }} />
                {t('students.dateOfBirth', 'Date of Birth')} <span style={{ color: '#ef4444' }}>{t('students.required', '*')}</span>
              </label>
              <input
                type="date"
                id="DOB"
                name="DOB"
                value={formData.DOB}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${errors.DOB ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: errors.DOB ? '#fef2f2' : 'white',
                  outline: 'none',
                  transition: 'all 0.2s',
                  textAlign: isRTL ? 'right' : 'left',
                  direction: isRTL ? 'rtl' : 'ltr'
                }}
                onFocus={(e) => {
                  if (!errors.DOB) {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.DOB) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              />
              {errors.DOB && (
                <p style={{ marginTop: '4px', fontSize: '14px', color: '#dc2626' }}>{errors.DOB}</p>
              )}
            </div>

            {/* Class Assignment */}
            <div>
              <label htmlFor="classId" style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '8px',
                textAlign: isRTL ? 'right' : 'left',
                direction: isRTL ? 'rtl' : 'ltr'
              }}>
                <GraduationCap style={{ 
                  height: '16px', 
                  width: '16px', 
                  display: 'inline', 
                  marginRight: isRTL ? '0' : '4px',
                  marginLeft: isRTL ? '4px' : '0'
                }} />
                {t('students.classAssignment', 'Class Assignment')} <span style={{ color: '#ef4444' }}>{t('students.required', '*')}</span>
              </label>
              <select
                id="classId"
                name="classId"
                value={formData.classId}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${errors.classId ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: errors.classId ? '#fef2f2' : 'white',
                  outline: 'none',
                  transition: 'all 0.2s',
                  appearance: 'none',
                  cursor: 'pointer',
                  textAlign: isRTL ? 'right' : 'left',
                  direction: isRTL ? 'rtl' : 'ltr'
                }}
                onFocus={(e) => {
                  if (!errors.classId) {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.classId) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <option value="">{t('students.selectClass', 'Select a class')}</option>
                {classes.map((classItem) => (
                  <option key={classItem._id} value={classItem._id}>
                    {classItem.classNumber}
                  </option>
                ))}
              </select>
              {errors.classId && (
                <p style={{ marginTop: '4px', fontSize: '14px', color: '#dc2626' }}>{errors.classId}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '16px', paddingTop: '24px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                {loading ? (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                ) : (
                  <>
                    <Save style={{ height: '20px', width: '20px' }} />
                    <span>{t('students.addStudent', 'Add Student')}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                style={{
                  flex: 1,
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#d1d5db';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }
                }}
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Card */}
        {(formData.name || formData.DOB || formData.classId) && (
          <div style={{ 
            marginTop: '32px', 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '24px',
            direction: isRTL ? 'rtl' : 'ltr'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '500', 
              color: '#111827', 
              marginBottom: '16px',
              textAlign: isRTL ? 'right' : 'left'
            }}>
              {t('students.preview', 'Preview')}
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '18px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <h4 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#111827', 
                  margin: '0 0 4px 0'
                }}>
                  {formData.name || t('students.studentName', 'Student Name')}
                </h4>
                {formData.classId && (
                  <p style={{ color: '#10b981', fontWeight: '500', margin: '0 0 4px 0' }}>
                    {t('students.class', 'Class')} {classes.find(c => c._id === formData.classId)?.classNumber || t('students.selectClass', 'Selected')}
                  </p>
                )}
                {formData.DOB && (
                  <p style={{ color: '#2563eb', fontWeight: '500', margin: '0 0 4px 0' }}>
                    {t('students.age', 'Age')} {Math.floor((new Date().getTime() - new Date(formData.DOB).getTime()) / (1000 * 60 * 60 * 24 * 365))}
                  </p>
                )}
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  {t('students.dateOfBirth', 'DOB')}: {formData.DOB ? new Date(formData.DOB).toLocaleDateString() : t('students.notSet', 'Not set')}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AddStudent;