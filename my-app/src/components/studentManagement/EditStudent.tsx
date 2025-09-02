import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Calendar, GraduationCap } from 'lucide-react';
import { getStudentById, updateStudent, checkClassTransfer } from './Api-Requests/StudentAPIService';
import type { UpdateStudentRequest } from './Api-Requests/StudentAPIService';
import { getAllClasses } from './Api-Requests/ClassAPIService';
import type { Class } from './Api-Requests/ClassAPIService';
import { toast } from 'react-toastify';

const EditStudent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<UpdateStudentRequest>({
    _id: id || '',
    name: '',
    DOB: '',
    classId: ''
  });
  const [originalClassId, setOriginalClassId] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudent, setLoadingStudent] = useState(true);
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

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoadingStudent(true);
        const response = await getStudentById(id!);
        const student = response.data;
        
        // Handle populated or unpopulated classId
        const classId = typeof student.classId === 'object' && student.classId !== null 
          ? student.classId._id 
          : student.classId || '';
        
        setFormData({
          _id: student._id,
          name: student.name,
          DOB: student.DOB.split('T')[0], // Format date for input
          classId: classId
        });
        setOriginalClassId(classId);
      } catch (error) {
        console.error('Error fetching student:', error);
        toast.error('Failed to load student data');
        navigate('../students');
      } finally {
        setLoadingStudent(false);
      }
    };

    if (id) {
      fetchStudent();
    }
  }, [id, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Student name is required';
    }

    if (!formData.DOB) {
      newErrors.DOB = 'Date of birth is required';
    } else {
      const dob = new Date(formData.DOB);
      const today = new Date();
      if (dob > today) {
        newErrors.DOB = 'Date of birth cannot be in the future';
      }
    }

    if (!formData.classId) {
      newErrors.classId = 'Class assignment is required';
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

    // Check if class is being changed
    if (originalClassId !== formData.classId && formData.classId) {
      try {
        const transferCheck = await checkClassTransfer(id!, formData.classId);
        
        if (transferCheck.data.needsTransfer) {
          const currentClass = transferCheck.data.currentClass!;
          const newClass = transferCheck.data.newClass!;
          
          const confirmTransfer = window.confirm(
            `התלמיד ${transferCheck.data.studentName} כרגע בכיתה "${currentClass.classNumber}".\n\n` +
            `האם ברצונך להעביר אותו לכיתה "${newClass.classNumber}"?\n` +
            `פעולה זו תסיר אותו מהכיתה הקיימת ותוסיף אותו לכיתה החדשה.`
          );
          
          if (!confirmTransfer) {
            return; // Cancel the operation
          }
        }
      } catch (error: unknown) {
        console.error('Error checking class transfer:', error);
        toast.error('שגיאה בבדיקת העברת כיתה');
        return;
      }
    }

    setLoading(true);
    
    try {
      await updateStudent(id!, formData);
      toast.success('הפרטי התלמיד עודכנו בהצלחה!');
      navigate('../students');
    } catch (error: unknown) {
      console.error('Error updating student:', error);
      toast.error('שגיאה בעדכון פרטי התלמיד. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('../students');
  };

  if (loadingStudent) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '512px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <button
            onClick={handleCancel}
            style={{
              marginRight: '16px',
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
            <ArrowLeft style={{ height: '20px', width: '20px' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <GraduationCap style={{ height: '32px', width: '32px', color: '#2563eb' }} />
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Edit Student</h1>
          </div>
        </div>

        {/* Form */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Student Name */}
            <div>
              <label htmlFor="name" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                <User style={{ height: '16px', width: '16px', display: 'inline', marginRight: '4px' }} />
                Student Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter student's full name"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${errors.name ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: errors.name ? '#fef2f2' : 'white',
                  outline: 'none',
                  transition: 'all 0.2s'
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
              <label htmlFor="DOB" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                <Calendar style={{ height: '16px', width: '16px', display: 'inline', marginRight: '4px' }} />
                Date of Birth <span style={{ color: '#ef4444' }}>*</span>
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
                  transition: 'all 0.2s'
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
              <label htmlFor="classId" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                <GraduationCap style={{ height: '16px', width: '16px', display: 'inline', marginRight: '4px' }} />
                Class Assignment <span style={{ color: '#ef4444' }}>*</span>
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
                  cursor: 'pointer'
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
                <option value="">Select a class</option>
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
                    <span>Update Student</span>
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
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Preview Card */}
        {(formData.name || formData.DOB || formData.classId) && (
          <div style={{ marginTop: '32px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '16px' }}>Preview</h3>
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
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
                  {formData.name || 'Student Name'}
                </h4>
                {formData.classId && (
                  <p style={{ color: '#10b981', fontWeight: '500', margin: '0 0 4px 0' }}>
                    Class {classes.find(c => c._id === formData.classId)?.classNumber || 'Selected'}
                  </p>
                )}
                {formData.DOB && (
                  <p style={{ color: '#2563eb', fontWeight: '500', margin: '0 0 4px 0' }}>
                    Age {Math.floor((new Date().getTime() - new Date(formData.DOB).getTime()) / (1000 * 60 * 60 * 24 * 365))}
                  </p>
                )}
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  DOB: {formData.DOB ? new Date(formData.DOB).toLocaleDateString() : 'Not set'}
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

export default EditStudent;
