import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  UserMinus,
  GraduationCap,
  Search,
  X,
  Plus,
  BookOpen
} from 'lucide-react';
import { getClassById, updateClass } from '../studentManagement/Api-Requests/ClassAPIService';
import { getAllStudents } from '../studentManagement/Api-Requests/StudentAPIService';
import { getAllItems, updateItem } from '../user/Api-Requests/genericRequests';
import type { Class, UpdateClassRequest } from '../studentManagement/Api-Requests/ClassAPIService';
import type { Student } from '../studentManagement/Api-Requests/StudentAPIService';
import type UserModel from '../user/UserModel';
import { toast } from 'react-toastify';

const ModernClassManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [classData, setClassData] = useState<Class | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allTeachers, setAllTeachers] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  
  // Search states
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [classResponse, studentsResponse, usersResponse] = await Promise.all([
        getClassById(id),
        getAllStudents(),
        getAllItems<UserModel[]>('api/users/')
      ]);
      
      setClassData(classResponse.data);
      setAllStudents(studentsResponse.data);
      
      const teachers = usersResponse.data.filter(user => 
        user.role.toLowerCase() === 'teacher'
      );
      setAllTeachers(teachers);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load class details');
      toast.error('Failed to load class details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get available students (not in this class)
  const availableStudents = allStudents.filter(student => 
    !classData?.students.some(classStudent => classStudent._id === student._id) &&
    student.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Get available teachers (not in this class)
  const availableTeachers = allTeachers.filter(teacher => 
    !classData?.teachers.includes(teacher.id?.toString() || '') &&
    teacher.name.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  // Get teacher names for display
  const getTeacherName = (teacherId: string) => {
    const teacher = allTeachers.find(t => t.id?.toString() === teacherId);
    return teacher ? teacher.name : 'Unknown Teacher';
  };

  const handleAddStudents = async () => {
    if (!classData || selectedStudents.length === 0) return;

    try {
      const newStudents = selectedStudents.map(studentId => {
        const student = allStudents.find(s => s._id === studentId);
        return student ? {
          _id: student._id,
          name: student.name,
          DOB: student.DOB,
          classNumber: classData.classNumber
        } : null;
      }).filter(Boolean) as Array<{_id: string; name: string; DOB: string; classNumber: string}>;

      const updatedClassData: UpdateClassRequest = {
        _id: classData._id,
        classNumber: classData.classNumber,
        teachers: classData.teachers,
        students: [...classData.students.map(s => s._id), ...selectedStudents]
      };

      await updateClass(classData._id, updatedClassData);
      
      setClassData({
        ...classData,
        students: [...classData.students, ...newStudents]
      });
      
      setSelectedStudents([]);
      setStudentDialogOpen(false);
      toast.success(`Added ${selectedStudents.length} student(s) to class`);
    } catch (err) {
      console.error('Error adding students:', err);
      toast.error('Failed to add students to class');
    }
  };

  const handleAddTeachers = async () => {
    if (!classData || selectedTeachers.length === 0) return;

    try {
      // Update the class with new teachers
      const updatedClassData: UpdateClassRequest = {
        _id: classData._id,
        classNumber: classData.classNumber,
        teachers: [...classData.teachers, ...selectedTeachers],
        students: classData.students.map(s => s._id)
      };

      await updateClass(classData._id, updatedClassData);
      
      // Update each teacher's class assignments
      for (const teacherId of selectedTeachers) {
        try {
          const teacher = allTeachers.find(t => t.id?.toString() === teacherId);
          if (teacher) {
            const existingClasses = teacher.classes || [];
            
            // Check if class is already assigned to avoid duplicates
            const classAlreadyAssigned = existingClasses.some(c => c._id === classData._id);
            
            if (!classAlreadyAssigned) {
              const updatedTeacher = {
                ...teacher,
                classes: [
                  ...existingClasses,
                  {
                    _id: classData._id,
                    classNumber: classData.classNumber
                  }
                ]
              };
              
              await updateItem<UserModel>('api/users', teacherId, updatedTeacher);
              console.log(`Updated teacher ${teacher.name} with class ${classData.classNumber}`);
            }
          }
        } catch (teacherUpdateError) {
          console.error(`Failed to update teacher ${teacherId}:`, teacherUpdateError);
          // Continue with other teachers even if one fails
        }
      }
      
      setClassData({
        ...classData,
        teachers: [...classData.teachers, ...selectedTeachers]
      });
      
      setSelectedTeachers([]);
      setTeacherDialogOpen(false);
      toast.success(`Added ${selectedTeachers.length} teacher(s) to class and updated their assignments`);
    } catch (err) {
      console.error('Error adding teachers:', err);
      toast.error('Failed to add teachers to class');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!classData) return;

    try {
      const updatedStudents = classData.students.filter(student => student._id !== studentId);
      
      const updatedClassData: UpdateClassRequest = {
        _id: classData._id,
        classNumber: classData.classNumber,
        teachers: classData.teachers,
        students: updatedStudents.map(s => s._id)
      };

      await updateClass(classData._id, updatedClassData);
      
      setClassData({
        ...classData,
        students: updatedStudents
      });
      
      toast.success('Student removed from class');
    } catch (err) {
      console.error('Error removing student:', err);
      toast.error('Failed to remove student from class');
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    if (!classData) return;

    try {
      const updatedTeachers = classData.teachers.filter(teacher => teacher !== teacherId);
      
      const updatedClassData: UpdateClassRequest = {
        _id: classData._id,
        classNumber: classData.classNumber,
        teachers: updatedTeachers,
        students: classData.students.map(s => s._id)
      };

      await updateClass(classData._id, updatedClassData);
      
      // Remove the class from the teacher's assignments
      try {
        const teacher = allTeachers.find(t => t.id?.toString() === teacherId);
        if (teacher) {
          const updatedClasses = (teacher.classes || []).filter(c => c._id !== classData._id);
          
          const updatedTeacher = {
            ...teacher,
            classes: updatedClasses
          };
          
          await updateItem<UserModel>('api/users', teacherId, updatedTeacher);
          console.log(`Removed class ${classData.classNumber} from teacher ${teacher.name}`);
        }
      } catch (teacherUpdateError) {
        console.error(`Failed to update teacher ${teacherId}:`, teacherUpdateError);
        // Continue even if teacher update fails
      }
      
      setClassData({
        ...classData,
        teachers: updatedTeachers
      });
      
      toast.success('Teacher removed from class and their assignments updated');
    } catch (err) {
      console.error('Error removing teacher:', err);
      toast.error('Failed to remove teacher from class');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)'
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
            onClick={fetchData}
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
            Retry
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
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/layout/classes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: '500',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <ArrowLeft size={20} />
            Back to Classes
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen size={32} color="#2563eb" />
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0
            }}>
              Class {classData?.classNumber}
            </h1>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Students Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users size={24} color="#2563eb" />
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Students ({classData?.students.length || 0})
              </h2>
            </div>
            <button
              onClick={() => setStudentDialogOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
            >
              <Plus size={16} />
              Add Students
            </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {classData?.students.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#6b7280'
              }}>
                <Users size={48} color="#d1d5db" />
                <p style={{ margin: '16px 0 0 0', fontSize: '16px' }}>
                  No students in this class yet
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {classData?.students.map((student) => (
                  <div
                    key={student._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <GraduationCap size={20} color="#2563eb" />
                      </div>
                      <div>
                        <p style={{
                          fontWeight: '500',
                          color: '#1f2937',
                          margin: 0,
                          fontSize: '14px'
                        }}>
                          {student.name}
                        </p>
                        <p style={{
                          color: '#6b7280',
                          margin: 0,
                          fontSize: '12px'
                        }}>
                          DOB: {new Date(student.DOB).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(student._id)}
                      style={{
                        padding: '6px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Remove student"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Teachers Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <GraduationCap size={24} color="#059669" />
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Teachers ({classData?.teachers.length || 0})
              </h2>
            </div>
            <button
              onClick={() => setTeacherDialogOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
            >
              <Plus size={16} />
              Add Teachers
            </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {classData?.teachers.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#6b7280'
              }}>
                <GraduationCap size={48} color="#d1d5db" />
                <p style={{ margin: '16px 0 0 0', fontSize: '16px' }}>
                  No teachers assigned to this class yet
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {classData?.teachers.map((teacherId) => (
                  <div
                    key={teacherId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <GraduationCap size={20} color="#059669" />
                      </div>
                      <p style={{
                        fontWeight: '500',
                        color: '#1f2937',
                        margin: 0,
                        fontSize: '14px'
                      }}>
                        {getTeacherName(teacherId)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveTeacher(teacherId)}
                      style={{
                        padding: '6px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Remove teacher"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Students Dialog */}
      {studentDialogOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Add Students to Class
              </h3>
              <button
                onClick={() => {
                  setStudentDialogOpen(false);
                  setSelectedStudents([]);
                  setStudentSearch('');
                }}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280'
                }}
              />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Student List */}
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              marginBottom: '20px'
            }}>
              {availableStudents.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#6b7280'
                }}>
                  <Users size={48} color="#d1d5db" />
                  <p style={{ margin: '16px 0 0 0' }}>
                    No available students found
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableStudents.map((student) => (
                    <label
                      key={student._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: selectedStudents.includes(student._id) ? '#eff6ff' : '#f9fafb',
                        borderRadius: '8px',
                        border: `1px solid ${selectedStudents.includes(student._id) ? '#3b82f6' : '#e5e7eb'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, student._id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student._id));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <GraduationCap size={16} color="#2563eb" />
                      </div>
                      <div>
                        <p style={{
                          fontWeight: '500',
                          color: '#1f2937',
                          margin: 0,
                          fontSize: '14px'
                        }}>
                          {student.name}
                        </p>
                        <p style={{
                          color: '#6b7280',
                          margin: 0,
                          fontSize: '12px'
                        }}>
                          DOB: {new Date(student.DOB).toLocaleDateString()}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Dialog Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setStudentDialogOpen(false);
                  setSelectedStudents([]);
                  setStudentSearch('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudents}
                disabled={selectedStudents.length === 0}
                style={{
                  padding: '10px 20px',
                  backgroundColor: selectedStudents.length === 0 ? '#d1d5db' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: selectedStudents.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Add {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Teachers Dialog */}
      {teacherDialogOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Add Teachers to Class
              </h3>
              <button
                onClick={() => {
                  setTeacherDialogOpen(false);
                  setSelectedTeachers([]);
                  setTeacherSearch('');
                }}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280'
                }}
              />
              <input
                type="text"
                placeholder="Search teachers..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Teacher List */}
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              marginBottom: '20px'
            }}>
              {availableTeachers.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#6b7280'
                }}>
                  <GraduationCap size={48} color="#d1d5db" />
                  <p style={{ margin: '16px 0 0 0' }}>
                    No available teachers found
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableTeachers.map((teacher) => (
                    <label
                      key={teacher.id || teacher.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: selectedTeachers.includes(teacher.id?.toString() || '') ? '#f0fdf4' : '#f9fafb',
                        borderRadius: '8px',
                        border: `1px solid ${selectedTeachers.includes(teacher.id?.toString() || '') ? '#059669' : '#e5e7eb'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeachers.includes(teacher.id?.toString() || '')}
                        onChange={(e) => {
                          const teacherId = teacher.id?.toString() || '';
                          if (e.target.checked) {
                            setSelectedTeachers([...selectedTeachers, teacherId]);
                          } else {
                            setSelectedTeachers(selectedTeachers.filter(id => id !== teacherId));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <GraduationCap size={16} color="#059669" />
                      </div>
                      <div>
                        <p style={{
                          fontWeight: '500',
                          color: '#1f2937',
                          margin: 0,
                          fontSize: '14px'
                        }}>
                          {teacher.name}
                        </p>
                        <p style={{
                          color: '#6b7280',
                          margin: 0,
                          fontSize: '12px'
                        }}>
                          {teacher.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Dialog Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setTeacherDialogOpen(false);
                  setSelectedTeachers([]);
                  setTeacherSearch('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTeachers}
                disabled={selectedTeachers.length === 0}
                style={{
                  padding: '10px 20px',
                  backgroundColor: selectedTeachers.length === 0 ? '#d1d5db' : '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: selectedTeachers.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Add {selectedTeachers.length} Teacher{selectedTeachers.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernClassManagement;
