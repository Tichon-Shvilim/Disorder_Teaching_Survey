import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Users,
  UserCheck,
  Edit,
  Plus,
  X,
  Save
} from 'lucide-react';
import { getClassById, updateClass } from '../studentManagement/Api-Requests/ClassAPIService';
import { getAllStudents, checkClassTransfer } from '../studentManagement/Api-Requests/StudentAPIService';
import type { Class, UpdateClassRequest } from '../studentManagement/Api-Requests/ClassAPIService';
import type { Student } from '../studentManagement/Api-Requests/StudentAPIService';
import { toast } from 'react-toastify';

const ClassDetails: React.FC = () => {
  const { t } = useTranslation();
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
      setError(t('classes.failedToLoadClassData', 'Failed to load class data'));
      toast.error(t('classes.failedToLoadClassData', 'Failed to load class data'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  const fetchAllStudents = useCallback(async () => {
    try {
      const response = await getAllStudents();
      const students = response.data;
      console.log("=== FETCH ALL STUDENTS DEBUG ===");
      console.log("Total students fetched:", students.length);
      
      // Log a few students to see their structure
      if (students.length > 0) {
        console.log("Sample student data:", students.slice(0, 3).map(s => ({
          name: s.name,
          _id: s._id,
          classId: s.classId,
          classIdType: typeof s.classId
        })));
      }
      
      // Show ALL students but we'll handle class transfer validation during save
      // This allows admins to see all students and make informed decisions
      setAvailableStudents(students);
      console.log('Total students:', students.length, 'All available for selection (transfers will be confirmed)');
    } catch (err: unknown) {
      console.error('Error fetching students:', err);
      toast.error(t('classes.failedToLoadStudents', 'Failed to load students'));
    }
  }, [t]);

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
      
      console.log('Updating class with students:', {
        classId: classData._id,
        currentStudents: classData.students.map(s => s._id),
        newStudents: selectedStudents
      });
      
      await updateClass(classData._id, updateData);
      
      // Refresh the class data to show updated students
      await fetchClassData();
      
      setEditingStudents(false);
      toast.success(t('classes.studentsUpdatedSuccessfully', 'התלמידים עודכנו בהצלחה!'));
    } catch (err: unknown) {
      console.error('Error updating students:', err);
      
      // Handle specific error messages from server
      if (err && typeof err === 'object' && 'response' in err) {
        const errorWithResponse = err as { 
          response?: { 
            data?: { message?: string }; 
            status?: number;
          } 
        };
        
        const errorMessage = errorWithResponse.response?.data?.message;
        const status = errorWithResponse.response?.status;
        
        console.log('Server error:', { status, message: errorMessage });
        
        if (errorMessage) {
          // Show server error message (includes Hebrew text for multi-class conflicts)
          toast.error(errorMessage);
        } else if (status === 400) {
          toast.error(t('classes.studentAlreadyInAnotherClass', 'שגיאת קלט: אחד התלמידים כבר משוייך לכיתה אחרת'));
        } else {
          toast.error(t('classes.errorUpdatingStudents', 'שגיאה בעדכון התלמידים'));
        }
      } else {
        toast.error(t('classes.errorUpdatingStudents', 'שגיאה בעדכון התלמידים'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStudentToggle = async (studentId: string) => {
    console.log('=== STUDENT TOGGLE DEBUG ===');
    console.log('Student ID:', studentId);
    console.log('Class ID:', classData!._id);
    
    // If student is being deselected (already selected), just remove them
    if (selectedStudents.includes(studentId)) {
      console.log('Student being deselected, removing from selection');
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
      return;
    }
    
    // If student is being selected, check for class transfer
    try {
      console.log('Checking class transfer for student:', studentId);
      const transferCheck = await checkClassTransfer(studentId, classData!._id);
      console.log('Transfer check response:', transferCheck.data);
      
      if (transferCheck.data.needsTransfer) {
        const { currentClass, newClass, studentName } = transferCheck.data;
        console.log('Transfer needed:', { currentClass, newClass, studentName });
        
        // Show confirmation dialog in Hebrew
        const confirmTransfer = window.confirm(
          `התלמיד/ה ${studentName} כבר משוייך/ת לכיתה ${currentClass?.classNumber}.\n` +
          `האם ברצונך להעביר אותו/ה לכיתה ${newClass?.classNumber}?\n\n` +
          `לחיצה על "אישור" תעביר את התלמיד/ה לכיתה החדשה.\n` +
          `לחיצה על "ביטול" תבטל את הפעולה.`
        );
        
        if (confirmTransfer) {
          // User confirmed transfer, add student to selection
          console.log('User confirmed transfer, adding student to selection');
          setSelectedStudents(prev => [...prev, studentId]);
          toast.info(`${studentName} ${t('classes.willTransferToClass', 'יועבר לכיתה')} ${newClass?.classNumber}`);
        } else {
          // User declined transfer, don't add student
          console.log('User declined transfer');
          toast.info(`${t('classes.transferCancelled', 'העברת')} ${studentName} ${t('classes.toClassCancelled', 'לכיתה בוטלה')}`);
        }
      } else {
        // No transfer needed, just add the student
        console.log('No transfer needed, adding student to selection');
        setSelectedStudents(prev => [...prev, studentId]);
      }
    } catch (error) {
      console.error('Error checking class transfer:', error);
      // If check fails, still allow selection but show warning
      setSelectedStudents(prev => [...prev, studentId]);
      toast.warning(t('classes.cannotCheckClassTransfer', 'לא ניתן לבדוק אם התלמיד משוייך לכיתה אחרת. ההוספה תתבצע בכל מקרה.'));
    }
  };

  const handleBack = () => {
    navigate('/layout/classes');
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
            {error || t('classes.classNotFound', 'Class not found')}
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
            {t('classes.backToClasses', 'Back to Classes')}
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
                {t('classes.class', 'Class')} {classData.classNumber}
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
                    {classData.teachers.length} {classData.teachers.length === 1 ? t('classes.teacher', 'Teacher') : t('classes.teachers', 'Teachers')}
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
                    {classData.students.length} {classData.students.length === 1 ? t('classes.student', 'Student') : t('classes.students', 'Students')}
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
                {t('classes.teachers', 'Teachers')}
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
                        {t('classes.teacher', 'Teacher')} {index + 1}
                      </h4>
                      <p style={{ 
                        fontSize: '12px', 
                        color: '#6b7280', 
                        margin: 0 
                      }}>
                        {t('classes.id', 'ID')}: {teacherId}
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
                <p style={{ margin: 0 }}>{t('classes.noTeachersAssigned', 'No teachers assigned yet')}</p>
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
                {t('classes.students', 'Students')}
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
                      {t('classes.cancel', 'Cancel')}
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
                      {saving ? t('classes.saving', 'Saving...') : t('classes.save', 'Save')}
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
                    {t('classes.manage', 'Manage')}
                  </button>
                )}
              </div>
            </div>
            
            {editingStudents ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {availableStudents.length === 0 ? (
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
                    <p style={{ margin: 0 }}>{t('classes.noStudentsFoundInSystem', 'No students found in the system')}</p>
                  </div>
                ) : (
                  availableStudents.map((student) => {
                    const isSelected = selectedStudents.includes(student._id);
                    
                    // Determine student's current class status
                    let classStatus = '';
                    let isInCurrentClass = false;
                    let isInOtherClass = false;
                    
                    if (student.classId) {
                      if (typeof student.classId === 'object' && student.classId._id) {
                        isInCurrentClass = student.classId._id === classData?._id;
                        if (!isInCurrentClass) {
                          isInOtherClass = true;
                          classStatus = ` (${t('classes.inClass', 'in class')} ${student.classId.classNumber})`;
                        } else {
                          classStatus = ` (${t('classes.inThisClass', 'in this class')})`;
                        }
                      } else if (typeof student.classId === 'string') {
                        isInCurrentClass = student.classId === classData?._id;
                        if (!isInCurrentClass) {
                          isInOtherClass = true;
                          classStatus = ` (${t('classes.inAnotherClass', 'in another class')})`;
                        } else {
                          classStatus = ` (${t('classes.inThisClass', 'in this class')})`;
                        }
                      }
                    } else {
                      classStatus = ` (${t('classes.noClass', 'no class')})`;
                    }
                    
                    return (
                      <div
                        key={student._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                          borderRadius: '8px',
                          border: `1px solid ${isSelected ? '#2563eb' : (isInOtherClass ? '#f59e0b' : '#e2e8f0')}`,
                          marginBottom: '8px',
                          cursor: 'pointer',
                          opacity: isInOtherClass ? 0.8 : 1
                        }}
                        onClick={() => handleStudentToggle(student._id)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleStudentToggle(student._id)}
                          style={{ margin: '0 8px 0 0' }}
                        />
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: isInOtherClass 
                            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                            : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
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
                            color: isInOtherClass ? '#d97706' : '#111827', 
                            margin: '0 0 2px 0' 
                          }}>
                            {student.name}
                            <span style={{
                              fontSize: '12px',
                              color: isInOtherClass ? '#f59e0b' : (isInCurrentClass ? '#2563eb' : '#6b7280'),
                              fontWeight: '400'
                            }}>
                              {classStatus}
                            </span>
                          </h4>
                          <p style={{ 
                            fontSize: '12px', 
                            color: '#6b7280', 
                            margin: 0 
                          }}>
                            {t('classes.age', 'Age')}: {student.age || 'N/A'}
                            {isInOtherClass && (
                              <span style={{ 
                                marginLeft: '8px',
                                color: '#f59e0b',
                                fontWeight: '500'
                              }}>
                                • {t('classes.willRequestTransfer', 'Will request transfer')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
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
                            {t('classes.dob', 'DOB')}: {new Date(student.DOB).toLocaleDateString()}
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
                    <p style={{ margin: 0 }}>{t('classes.noStudentsInClass', 'No students assigned yet')}</p>
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
