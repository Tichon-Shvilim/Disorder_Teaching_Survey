import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { getClassById, updateClass } from '../studentManagement/Api-Requests/ClassAPIService';
import type { UpdateClassRequest } from '../studentManagement/Api-Requests/ClassAPIService';
import { toast } from 'react-toastify';

const EditClass: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<UpdateClassRequest>({
    _id: id || '',
    classNumber: '',
    teachers: [],
    students: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingClass, setLoadingClass] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClass = async () => {
      try {
        setLoadingClass(true);
        const response = await getClassById(id!);
        const classData = response.data;
        setFormData({
          _id: classData._id,
          classNumber: classData.classNumber,
          teachers: classData.teachers, // Already an array of strings
          students: classData.students.map(s => s._id)
        });
      } catch (error) {
        console.error('Error fetching class:', error);
        toast.error('Failed to load class data');
        navigate('../classes');
      } finally {
        setLoadingClass(false);
      }
    };

    if (id) {
      fetchClass();
    }
  }, [id, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.classNumber.trim()) {
      newErrors.classNumber = 'Class number is required';
    } else if (formData.classNumber.length < 2) {
      newErrors.classNumber = 'Class number must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await updateClass(id!, formData);
      toast.success('Class updated successfully!');
      navigate('../classes');
    } catch (error: unknown) {
      console.error('Error updating class:', error);
      toast.error('Failed to update class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('../classes');
  };

  if (loadingClass) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '400px',
        background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)',
        minHeight: '100vh'
      }}>
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
    <div style={{ 
      padding: '24px', 
      background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)', 
      minHeight: '100vh' 
    }}>
      <div style={{ maxWidth: '512px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '32px' 
        }}>
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
            <BookOpen style={{ height: '32px', width: '32px', color: '#2563eb' }} />
            <h1 style={{ 
              fontSize: '30px', 
              fontWeight: 'bold', 
              color: '#111827', 
              margin: 0 
            }}>
              Edit Class
            </h1>
          </div>
        </div>

        {/* Form */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
          padding: '32px' 
        }}>
          <form onSubmit={handleSubmit} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '24px' 
          }}>
            {/* Class Number */}
            <div>
              <label 
                htmlFor="classNumber" 
                style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}
              >
                <BookOpen style={{ 
                  height: '16px', 
                  width: '16px', 
                  display: 'inline', 
                  marginRight: '4px' 
                }} />
                Class Number
              </label>
              <input
                type="text"
                id="classNumber"
                name="classNumber"
                value={formData.classNumber}
                onChange={handleInputChange}
                placeholder="Enter class number (e.g., א1, ב2, ג3)"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${errors.classNumber ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: errors.classNumber ? '#fef2f2' : 'white',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  if (!errors.classNumber) {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.classNumber) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              />
              {errors.classNumber && (
                <p style={{ 
                  marginTop: '4px', 
                  fontSize: '14px', 
                  color: '#dc2626' 
                }}>
                  {errors.classNumber}
                </p>
              )}
            </div>

            {/* Info Message */}
            <div style={{
              padding: '16px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '8px',
              color: '#0369a1'
            }}>
              <p style={{ margin: 0, fontSize: '14px' }}>
                <strong>Note:</strong> To manage teachers and students for this class, 
                use the class details page after saving.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              paddingTop: '24px' 
            }}>
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
                    <span>Update Class</span>
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
        {formData.classNumber && (
          <div style={{ 
            marginTop: '32px', 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '24px' 
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '500', 
              color: '#111827', 
              marginBottom: '16px' 
            }}>
              Preview
            </h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px' 
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '700',
                fontSize: '18px',
                boxShadow: '0 4px 8px rgba(139, 92, 246, 0.3)'
              }}>
                {formData.classNumber}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#111827', 
                  margin: '0 0 4px 0' 
                }}>
                  Class {formData.classNumber}
                </h4>
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '14px', 
                  margin: 0 
                }}>
                  Updated class information
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

export default EditClass;
