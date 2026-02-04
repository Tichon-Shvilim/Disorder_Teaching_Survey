import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  GraduationCap, 
  Search,
  UserCheck,
  BookOpen
} from 'lucide-react';
import { getAllClasses, deleteClass } from '../studentManagement/Api-Requests/ClassAPIService';
import type { Class } from '../studentManagement/Api-Requests/ClassAPIService';
import { getAllItems } from '../user/Api-Requests/genericRequests';
import type UserModel from '../user/UserModel';
import { toast } from 'react-toastify';

const ClassList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<UserModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch classes from API
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [classesResponse, usersResponse] = await Promise.all([
        getAllClasses(),
        getAllItems<UserModel[]>('api/users/')
      ]);
      
      setClasses(classesResponse.data);
      
      // Filter only teachers
      const teacherUsers = usersResponse.data.filter(user => 
        user.role.toLowerCase() === 'teacher'
      );
      setTeachers(teacherUsers);
    } catch (err: unknown) {
      console.error('Error fetching classes:', err);
      setError(t('classes.failedToLoad', 'Failed to load classes'));
      toast.error(t('classes.failedToLoad', 'Failed to load classes'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Helper function to get teacher name by ID
  const getTeacherName = (teacherId: string): string => {
    const teacher = teachers.find(t => t.id?.toString() === teacherId);
    return teacher ? teacher.name : 'Unknown Teacher';
  };

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleDeleteClass = async (classId: string) => {
    if (window.confirm(t('classes.confirmDelete', 'Are you sure you want to delete this class? This action cannot be undone.'))) {
      try {
        await deleteClass(classId);
        setClasses(classes.filter(cls => cls._id !== classId));
        toast.success(t('classes.dleteSuccess', 'Class deleted successfully'));
      } catch (err: unknown) {
        console.error('Error deleting class:', err);
        toast.error(t('classes.deleteFailed', 'Failed to delete class'));
      }
    }
  };

  const filteredClasses = classes.filter(cls => 
    cls.classNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClass = () => {
    navigate('../addClass');
  };

  const handleEditClass = (classId: string) => {
    navigate(`${classId}/edit`);
  };

  const handleViewClass = (classId: string) => {
    navigate(`${classId}`);
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

  if (error) {
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
          <p style={{ fontWeight: '500', margin: '0 0 12px 0' }}>{error}</p>
          <button 
            onClick={fetchClasses}
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
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
          >
            {t('students.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      //background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)', 
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen style={{ height: '32px', width: '32px', color: '#2563eb' }} />
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              color: '#111827', 
              margin: 0 
            }}>
              {t('classes.title', 'Class Management')}
            </h1>
          </div>
          <button
            onClick={handleAddClass}
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
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            <Plus style={{ height: '20px', width: '20px' }} />
            <span>{t('classes.addClass', 'Add Class')}</span>
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ position: 'relative', maxWidth: '384px' }}>
            <Search style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              height: '20px', 
              width: '20px', 
              color: '#9ca3af' 
            }} />
            <input
              type="text"
              placeholder={t('classes.searchClasses', 'Search classes...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '16px',
                paddingTop: '12px',
                paddingBottom: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            />
          </div>
        </div>

        {/* Classes Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '24px' 
        }}>
          {filteredClasses.map((classItem) => (
            <div
              key={classItem._id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                direction: isRTL ? 'rtl' : 'ltr'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={() => handleViewClass(classItem._id)}
            >
              {/* Class Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '16px', 
                marginBottom: '20px' 
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
                  fontSize: '20px',
                  boxShadow: '0 4px 8px rgba(139, 92, 246, 0.3)'
                }}>
                  {classItem.classNumber}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '24px', 
                    fontWeight: '700', 
                    color: '#111827', 
                    margin: '0 0 8px 0',
                    direction: isRTL ? 'rtl' : 'ltr',
                    textAlign: isRTL ? 'right' : 'left'
                  }}>
                    {t('classes.class', 'Class')} {classItem.classNumber}
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    justifyContent: isRTL ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      flexDirection: isRTL ? 'row-reverse' : 'row'
                    }}>
                      <UserCheck style={{ 
                        height: '16px', 
                        width: '16px', 
                        color: '#059669' 
                      }} />
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#059669', 
                        fontWeight: '500',
                        direction: isRTL ? 'rtl' : 'ltr',
                        display: 'inline-block',
                        textAlign: isRTL ? 'right' : 'left'
                      }}>
                        {classItem.teachers.length} {classItem.teachers.length === 1 ? t('classes.teacher', 'Teacher') : t('classes.teachers', 'Teachers')}
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      flexDirection: isRTL ? 'row-reverse' : 'row'
                    }}>
                      <Users style={{ 
                        height: '16px', 
                        width: '16px', 
                        color: '#2563eb' 
                      }} />
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#2563eb', 
                        fontWeight: '500',
                        direction: isRTL ? 'rtl' : 'ltr',
                        display: 'inline-block',
                        textAlign: isRTL ? 'right' : 'left'
                      }}>
                        {classItem.students.length} {classItem.students.length === 1 ? t('classes.student', 'Student') : t('classes.students', 'Students')}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClass(classItem._id);
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#4b5563',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                      e.currentTarget.style.color = '#1f2937';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.color = '#4b5563';
                    }}
                    title={t('classes.editClass', 'Edit Class')}
                  >
                    <Edit style={{ height: '16px', width: '16px' }} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClass(classItem._id);
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fca5a5',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#dc2626',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';
                      e.currentTarget.style.borderColor = '#f87171';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef2f2';
                      e.currentTarget.style.borderColor = '#fca5a5';
                    }}
                    title={t('classes.deleteClass', 'Delete Class')}
                  >
                    <Trash2 style={{ height: '16px', width: '16px' }} />
                  </button>
                </div>
              </div>

              {/* Class Details */}
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f8fafc', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '12px' 
                }}>
                  <div>
                    <h4 style={{ 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#6b7280', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      margin: '0 0 4px 0',
                      textAlign: isRTL ? 'right' : 'left'
                    }}>
                      {t('classes.teachersLabel', 'Teachers')}
                    </h4>
                    <div style={{ fontSize: '14px', color: '#1f2937' }}>
                      {classItem.teachers.length > 0 ? (
                        classItem.teachers.slice(0, 2).map((teacherId) => (
                          <div key={teacherId} style={{ marginBottom: '2px', direction: isRTL ? 'rtl' : 'ltr' }}>
                            {getTeacherName(teacherId)}
                          </div>
                        ))
                      ) : (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic', display: 'block', textAlign: isRTL ? 'right' : 'left' }} dir={isRTL ? 'rtl' : 'ltr'}>
                          {t('classes.noTeachersAssignedShort', 'No teachers assigned')}
                        </span>
                      )}
                      {classItem.teachers.length > 2 && (
                        <div style={{ color: '#6b7280', fontSize: '12px' }}>
                          +{classItem.teachers.length - 2} {t('classes.more', 'more')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#6b7280', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      margin: '0 0 4px 0',
                      textAlign: isRTL ? 'right' : 'left'
                    }}>
                      {t('classes.studentsLabel', 'Students')}
                    </h4>
                    <div style={{ fontSize: '14px', color: '#1f2937' }}>
                      {classItem.students.length > 0 ? (
                        classItem.students.slice(0, 2).map((student) => (
                          <div key={student._id} style={{ marginBottom: '2px', direction: isRTL ? 'rtl' : 'ltr' }}>
                            {student.name}
                          </div>
                        ))
                      ) : (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic', display: 'block', textAlign: isRTL ? 'right' : 'left' }} dir={isRTL ? 'rtl' : 'ltr'}>
                          {t('classes.noStudentsAssignedShort', 'No students assigned')}
                        </span>
                      )}
                      {classItem.students.length > 2 && (
                        <div style={{ color: '#6b7280', fontSize: '12px' }}>
                          +{classItem.students.length - 2} {t('classes.more', 'more')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewClass(classItem._id);
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                }}
              >
                <GraduationCap style={{ height: '16px', width: '16px' }} />
                <span>{t('classes.manageClass', 'Manage Class')}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredClasses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <BookOpen style={{ 
              height: '64px', 
              width: '64px', 
              color: '#9ca3af', 
              margin: '0 auto 16px' 
            }} />
            <div style={{ 
              color: '#6b7280', 
              fontSize: '20px', 
              marginBottom: '8px' 
            }}>
              {t('classes.noClassesFound', 'No classes found')}
            </div>
            <p style={{ color: '#9ca3af', margin: 0 }}>
              {searchTerm ? t('classes.adjustSearch', 'Try adjusting your search criteria') : t('classes.getStarted', 'Get started by adding your first class')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassList;
