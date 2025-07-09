import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Calendar, GraduationCap } from 'lucide-react';
import { getStudentById, updateStudent } from './Api-Requests/StudentAPIService';
import type { UpdateStudentRequest } from './Api-Requests/StudentAPIService';
import { toast } from 'react-toastify';

const EditStudent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<UpdateStudentRequest>({
    _id: id || '',
    name: '',
    DOB: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoadingStudent(true);
        const response = await getStudentById(id!);
        const student = response.data;
        setFormData({
          _id: student._id,
          name: student.name,
          DOB: student.DOB.split('T')[0] // Format date for input
        });
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
      await updateStudent(id!, formData);
      toast.success('Student updated successfully!');
      navigate('../students');
    } catch (error: unknown) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('../students');
  };

  if (loadingStudent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={handleCancel}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Edit Student</h1>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Student Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter student's full name"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="DOB" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date of Birth
              </label>
              <input
                type="date"
                id="DOB"
                name="DOB"
                value={formData.DOB}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.DOB ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.DOB && (
                <p className="mt-1 text-sm text-red-600">{errors.DOB}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Update Student</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors shadow-md hover:shadow-lg"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Preview Card */}
        {(formData.name || formData.DOB) && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg text-gray-900">
                  {formData.name || 'Student Name'}
                </h4>
                {formData.DOB && (
                  <p className="text-blue-600 font-medium">
                    Age {Math.floor((new Date().getTime() - new Date(formData.DOB).getTime()) / (1000 * 60 * 60 * 24 * 365))}
                  </p>
                )}
                <p className="text-gray-500 text-sm">
                  DOB: {formData.DOB ? new Date(formData.DOB).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditStudent;
