import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Edit, Search, Plus, Trash2, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllStudents, 
  deleteStudent, 
} from './Api-Requests/StudentAPIService';
import type { Student } from './Api-Requests/StudentAPIService';
import { toast } from 'react-toastify';

const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch students from API
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllStudents();
      const studentsData = response.data.map((student: Student) => ({
        ...student,
        age: calculateAge(student.DOB)
      }));
      setStudents(studentsData);
    } catch (err: unknown) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteStudent(studentId);
        setStudents(students.filter(student => student._id !== studentId));
        toast.success('Student deleted successfully');
      } catch (err: unknown) {
        console.error('Error deleting student:', err);
        toast.error('Failed to delete student');
      }
    }
  };

  const filteredStudents = students.filter(student => {
    return student.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleViewDetails = (studentId: string) => {
    navigate(`${studentId}`);
  };

  const handleAddStudent = () => {
    navigate('add');
  };

  const handleEditStudent = (studentId: string) => {
    navigate(`${studentId}/edit`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-md mx-auto mt-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
          <p className="font-medium">{error}</p>
          <button 
            onClick={fetchStudents}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Students</h1>
          </div>
          <button
            onClick={handleAddStudent}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Add Student</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student._id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1"
            >
              {/* Student Header */}
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{student.name}</h3>
                  <p className="text-blue-600 font-medium">Age {student.age}</p>
                  <p className="text-gray-500 text-sm">
                    DOB: {new Date(student.DOB).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewDetails(student._id)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => handleEditStudent(student._id)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md"
                  title="Edit Student"
                >
                  <Edit className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteStudent(student._id)}
                  className="px-3 py-2 border border-red-300 rounded-lg hover:bg-red-50 transition-colors shadow-sm hover:shadow-md"
                  title="Delete Student"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <div className="text-center py-16">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 text-xl mb-2">No students found</div>
            <p className="text-gray-400">Try adjusting your search criteria or add a new student</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;