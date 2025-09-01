import React, { useState, useEffect } from 'react';
import httpService from './Api-Requests/httpService';

interface Questionnaire {
  _id: string;
  title: string;
  description?: string;
  createdAt: string;
  version?: number;
}

interface QuestionnaireSelectorProps {
  classId?: string;
  studentId?: string;
  selectedQuestionnaireId: string;
  onQuestionnaireChange: (questionnaireId: string) => void;
  label?: string;
  className?: string;
}

const QuestionnaireSelector: React.FC<QuestionnaireSelectorProps> = ({
  classId,
  studentId,
  selectedQuestionnaireId,
  onQuestionnaireChange,
  label = "Select Questionnaire",
  className = ""
}) => {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestionnaires = async () => {
      if (classId) {
        try {
          setLoading(true);
          setError(null);
          
          const response = await httpService.get(`/analytics/questionnaires/class/${classId}`);
          
          if (response.data.success) {
            setQuestionnaires(response.data.data);
          } else {
            setError(response.data.message || 'Failed to fetch questionnaires');
          }
        } catch (err: unknown) {
          console.error('Error fetching class questionnaires:', err);
          const errorMessage = err instanceof Error ? err.message : 'An error occurred';
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      } else if (studentId) {
        try {
          setLoading(true);
          setError(null);
          
          // For students, we'll need to get questionnaires they've submitted
          // This would require a different endpoint or approach
          // For now, we'll use the same class approach if we have access to student's class
          console.log('Student questionnaire fetching not implemented yet');
          setQuestionnaires([]);
        } catch (err: unknown) {
          console.error('Error fetching student questionnaires:', err);
          const errorMessage = err instanceof Error ? err.message : 'An error occurred';
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchQuestionnaires();
  }, [classId, studentId]);

  if (loading) {
    return (
      <div className={`questionnaire-selector ${className}`}>
        <label className="filter-label">{label}:</label>
        <div className="loading-selector">Loading questionnaires...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`questionnaire-selector ${className}`}>
        <label className="filter-label">{label}:</label>
        <div className="error-selector">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={`questionnaire-selector ${className}`}>
      <label className="filter-label">{label}:</label>
      <select
        value={selectedQuestionnaireId}
        onChange={(e) => onQuestionnaireChange(e.target.value)}
        className="questionnaire-select"
      >
        <option value="">-- Select a Questionnaire --</option>
        {questionnaires.map((questionnaire) => (
          <option key={questionnaire._id} value={questionnaire._id}>
            {questionnaire.title}
            {questionnaire.version && ` (v${questionnaire.version})`}
            {questionnaire.createdAt && 
              ` - ${new Date(questionnaire.createdAt).toLocaleDateString()}`
            }
          </option>
        ))}
      </select>
      
      {questionnaires.length === 0 && (
        <div className="no-questionnaires">
          No questionnaires found for this {classId ? 'class' : 'student'}.
        </div>
      )}
    </div>
  );
};

export default QuestionnaireSelector;
