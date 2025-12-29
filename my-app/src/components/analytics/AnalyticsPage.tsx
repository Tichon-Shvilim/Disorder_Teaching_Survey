import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AnalyticsWrapper from './AnalyticsWrapper';
import DateRangePicker from './DateRangePicker';
import QuestionnaireSelector from './QuestionnaireSelector';
import studentHttpService from '../studentManagement/Api-Requests/httpService';

interface Student {
  _id: string;
  name: string;
  studentId: string;
}

interface Class {
  _id: string;
  name: string;
  classNumber?: string;
}

interface Class {
  _id: string;
  name: string;
  classNumber?: string;
}

const AnalyticsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get current selections from URL params
  const selectedType = searchParams.get('type') || 'student';
  const selectedStudentId = searchParams.get('studentId') || '';
  const selectedClassId = searchParams.get('classId') || '';
  const selectedQuestionnaireId = searchParams.get('questionnaireId') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch students and classes
        const [studentsResponse, classesResponse] = await Promise.all([
          studentHttpService.get('/api/students'),
          studentHttpService.get('/api/classes')
        ]);

        if (studentsResponse.data) {
          setStudents(Array.isArray(studentsResponse.data) ? studentsResponse.data : []);
        }
        
        if (classesResponse.data) {
          setClasses(Array.isArray(classesResponse.data) ? classesResponse.data : []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateSearchParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleTypeChange = (type: 'student' | 'class') => {
    updateSearchParam('type', type);
    // Clear the opposite selection
    if (type === 'student') {
      updateSearchParam('classId', '');
    } else {
      updateSearchParam('studentId', '');
    }
  };

  const canShowAnalytics = () => {
    const hasSelection = selectedType === 'student' ? selectedStudentId !== '' : selectedClassId !== '';
    const hasQuestionnaire = selectedQuestionnaireId !== '';
    return hasSelection && hasQuestionnaire;
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading">Loading analytics options...</div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-controls">
        <h1>Analytics Dashboard</h1>
        
        <div className="controls-section">
          <div className="control-group">
            <label>View Type:</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="student"
                  checked={selectedType === 'student'}
                  onChange={(e) => handleTypeChange(e.target.value as 'student')}
                />
                Student Analytics
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="class"
                  checked={selectedType === 'class'}
                  onChange={(e) => handleTypeChange(e.target.value as 'class')}
                />
                Class Analytics
              </label>
            </div>
          </div>

          {selectedType === 'student' && (
            <div className="control-group">
              <label htmlFor="student-select">Select Student:</label>
              <select
                id="student-select"
                value={selectedStudentId}
                onChange={(e) => updateSearchParam('studentId', e.target.value)}
              >
                <option value="">-- Select a Student --</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} ({student.studentId})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedType === 'class' && (
            <div className="control-group">
              <label htmlFor="class-select">Select Class:</label>
              <select
                id="class-select"
                value={selectedClassId}
                onChange={(e) => updateSearchParam('classId', e.target.value)}
              >
                <option value="">-- Select a Class --</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name} {cls.classNumber ? `(${cls.classNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <QuestionnaireSelector
            classId={selectedType === 'class' ? selectedClassId : undefined}
            studentId={selectedType === 'student' ? selectedStudentId : undefined}
            selectedQuestionnaireId={selectedQuestionnaireId}
            onQuestionnaireChange={(questionnaireId) => updateSearchParam('questionnaireId', questionnaireId)}
            label="Select Questionnaire"
          />

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(date) => updateSearchParam('startDate', date)}
            onEndDateChange={(date) => updateSearchParam('endDate', date)}
            label="Date Range Filter"
          />
        </div>
      </div>

      <div className="analytics-content">
        {canShowAnalytics() ? (
          <AnalyticsWrapper
            studentId={selectedType === 'student' ? selectedStudentId : undefined}
            classId={selectedType === 'class' ? selectedClassId : undefined}
            questionnaireId={selectedQuestionnaireId}
            startDate={startDate || undefined}
            endDate={endDate || undefined}
          />
        ) : (
          <div className="no-selection">
            <p>
              Please select a {selectedType}, questionnaire, and date range to view analytics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
