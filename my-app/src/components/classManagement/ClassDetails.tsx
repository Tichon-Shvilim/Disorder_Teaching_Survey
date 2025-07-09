import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Users, 
  UserCheck, 
  Plus,
  X,
  Save
} from 'lucide-react';
import { getClassById, updateClass } from '../studentManagement/Api-Requests/ClassAPIService';
import type { Class, UpdateClassRequest } from '../studentManagement/Api-Requests/ClassAPIService';
import { getAllStudents } from '../studentManagement/Api-Requests/StudentAPIService';
import type { Student } from '../studentManagement/Api-Requests/StudentAPIService';
import { toast } from 'react-toastify';

const ClassDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [classData, setClassData] = useState<Class | null>(null);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingStudents, setEditingStudents] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const navigate = useNavigate();

  const fetchClassData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getClassById(id!);
      setClassData(response.data);
      setSelectedStudents(response.data.students.map(s => s._id));
    } catch (err: unknown) {
      console.error('Error fetching class data:', err);
      setError('Failed to load class data');
      toast.error('Failed to load class data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAllStudents = useCallback(async () => {
    try {
      const response = await getAllStudents();
      const students = response.data;
      console.log("all students" + students.length);
      // Filter out students who are already in other classes or this class
      const available = students.filter(student => 
        !student.classNumber || student.classNumber === classData?.classNumber
      );
      setAvailableStudents(available);
      console.log('Total students:', students.length, 'Available:', available.length);
    } catch (err: unknown) {
      console.error('Error fetching students:', err);
      toast.error('Failed to load students');
    }
  }, [classData?.classNumber]);

  useEffect(() => {
    if (id) {
      fetchClassData();
    }
  }, [id, fetchClassData]);

  useEffect(() => {
    if (classData) {
      fetchAllStudents();
    }
  }, [classData, fetchAllStudents]);

  const handleSaveStudents = async () => {
    if (!classData) return;
    
    setSaving(true);
    try {
      const updateData: UpdateClassRequest = {
        _id: classData._id,
        classNumber: classData.classNumber,
        students: selectedStudents,
        teachers: classData.teachers // Keep existing teacher IDs
      };
      
      await updateClass(classData._id, updateData);
      
      // Here you would typically update each student's classNumber
      // For now, we'll just refresh the class data
      await fetchClassData();
      
      setEditingStudents(false);
      toast.success('Students updated successfully!');
    } catch (err: unknown) {
      console.error('Error updating students:', err);
      toast.error('Failed to update students');
    } finally {
      setSaving(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleBack = () => {
    navigate('../classes');
  };

  const handleEdit = () => {
    navigate(`${id}/edit`);
  };

  if (loading) {
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

  if (error || !classData) {
    return (
      <div style={{ 
        padding: '24px', 
        background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)', 
        minHeight: '100vh' 
      }}>
        <div style={{
          maxWidth: '448px',
          margin: '32px auto 0',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ fontWeight: '500', margin: '0 0 12px 0' }}>
            {error || 'Class not found'}
          </p>
          <button 
            onClick={handleBack}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              fontWeight: '500'
            }}
          >
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)', 
      minHeight: '100vh' 
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={handleBack}
              style={{
                padding: '8px',
                color: '#4b5563',
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <ArrowLeft style={{ height: '20px', width: '20px' }} />
            </button>
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
              fontSize: '20px',
              boxShadow: '0 4px 8px rgba(139, 92, 246, 0.3)'
            }}>
              {classData.classNumber}
            </div>
            <div>
              <h1 style={{ 
                fontSize: '36px', 
                fontWeight: 'bold', 
                color: '#111827', 
                margin: '0 0 4px 0' 
              }}>
                Class {classData.classNumber}
              </h1>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px' 
                }}>
                  <UserCheck style={{ 
                    height: '16px', 
                    width: '16px', 
                    color: '#059669' 
                  }} />
                  <span style={{ 
                    fontSize: '14px', 
                    color: '#059669', 
                    fontWeight: '500' 
                  }}>
                    {classData.teachers.length} Teacher{classData.teachers.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px' 
                }}>
                  <Users style={{ 
                    height: '16px', 
                    width: '16px', 
                    color: '#2563eb' 
                  }} />
                  <span style={{ 
                    fontSize: '14px', 
                    color: '#2563eb', 
                    fontWeight: '500' 
                  }}>
                    {classData.students.length} Student{classData.students.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleEdit}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
          >
            <Edit style={{ height: '16px', width: '16px' }} />
            <span>Edit Class</span>
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '24px' 
        }}>
          {/* Teachers Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px' 
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#111827', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <UserCheck style={{ height: '20px', width: '20px', color: '#059669' }} />
                Teachers
              </h2>
              <button
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus style={{ height: '14px', width: '14px' }} />
                Assign
              </button>
            </div>
            
            {classData.teachers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {classData.teachers.map((teacherId, index) => (
                  <div
                    key={teacherId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      T{index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#111827', 
                        margin: '0 0 2px 0' 
                      }}>
                        Teacher {index + 1}
                      </h4>
                      <p style={{ 
                        fontSize: '12px', 
                        color: '#6b7280', 
                        margin: 0 
                      }}>
                        ID: {teacherId}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '32px 0', 
                color: '#9ca3af' 
              }}>
                <UserCheck style={{ 
                  height: '48px', 
                  width: '48px', 
                  margin: '0 auto 12px' 
                }} />
                <p style={{ margin: 0 }}>No teachers assigned yet</p>
              </div>
            )}
          </div>

          {/* Students Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px' 
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#111827', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Users style={{ height: '20px', width: '20px', color: '#2563eb' }} />
                Students
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                {editingStudents ? (
                  <>
                    <button
                      onClick={() => setEditingStudents(false)}
                      style={{
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <X style={{ height: '14px', width: '14px' }} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveStudents}
                      disabled={saving}
                      style={{
                        backgroundColor: saving ? '#9ca3af' : '#2563eb',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Save style={{ height: '14px', width: '14px' }} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditingStudents(true)}
                    style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Edit style={{ height: '14px', width: '14px' }} />
                    Manage
                  </button>
                )}
              </div>
            </div>
            
            {editingStudents ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {availableStudents.map((student) => (
                  <div
                    key={student._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: selectedStudents.includes(student._id) ? '#eff6ff' : '#f8fafc',
                      borderRadius: '8px',
                      border: `1px solid ${selectedStudents.includes(student._id) ? '#2563eb' : '#e2e8f0'}`,
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleStudentToggle(student._id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student._id)}
                      onChange={() => handleStudentToggle(student._id)}
                      style={{ margin: '0 8px 0 0' }}
                    />
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#111827', 
                        margin: '0 0 2px 0' 
                      }}>
                        {student.name}
                      </h4>
                      <p style={{ 
                        fontSize: '12px', 
                        color: '#6b7280', 
                        margin: 0 
                      }}>
                        Age: {student.age || 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {classData.students.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {classData.students.map((student) => (
                      <div
                        key={student._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#111827', 
                            margin: '0 0 2px 0' 
                          }}>
                            {student.name}
                          </h4>
                          <p style={{ 
                            fontSize: '12px', 
                            color: '#6b7280', 
                            margin: 0 
                          }}>
                            DOB: {new Date(student.DOB).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '32px 0', 
                    color: '#9ca3af' 
                  }}>
                    <Users style={{ 
                      height: '48px', 
                      width: '48px', 
                      margin: '0 auto 12px' 
                    }} />
                    <p style={{ margin: 0 }}>No students assigned yet</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDetails;
