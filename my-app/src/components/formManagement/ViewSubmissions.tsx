import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Eye, Plus } from 'lucide-react';
import { FormAPIService } from './Api-Requests/FormAPIService';
import type { FormSubmission, QuestionnaireTemplate } from './Api-Requests/FormAPIService';
import { toast } from 'react-toastify';

const ViewSubmissions: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get student info from navigation state
  const studentId = location.state?.studentId || '';
  const studentName = location.state?.studentName || 'Unknown Student';

  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch student submissions and available questionnaires
        const [submissionsData, questionnairesData] = await Promise.all([
          FormAPIService.getStudentSubmissions(studentId!),
          FormAPIService.getQuestionnaireTemplates()
        ]);
        
        setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
        setQuestionnaires(Array.isArray(questionnairesData) ? questionnairesData : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load submissions');
        setSubmissions([]);
        setQuestionnaires([]);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const handleFillNewForm = (questionnaireId: string) => {
    navigate(`/fill-form/${questionnaireId}`, {
      state: { studentId: studentId, studentName }
    });
  };

  const handleViewSubmission = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get questionnaires that haven't been filled yet or can be filled multiple times
  const availableQuestionnaires = Array.isArray(questionnaires) ? questionnaires.filter(() => 
    // For now, allow all questionnaires to be filled multiple times
    true
  ) : [];

  if (loading) {
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

  if (selectedSubmission) {
    return (
      <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)', minHeight: '100vh' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
            <button
              onClick={() => setSelectedSubmission(null)}
              style={{
                marginRight: '16px',
                padding: '8px',
                color: '#4b5563',
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <ArrowLeft style={{ height: '20px', width: '20px' }} />
            </button>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                {selectedSubmission.questionnaireTitle}
              </h1>
              <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>
                Submitted {formatDate(selectedSubmission.submittedAt!)}
              </p>
            </div>
          </div>

          {/* Submission Details */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', margin: '0 0 4px 0' }}>Student</h3>
                <p style={{ fontSize: '16px', color: '#111827', margin: 0 }}>{selectedSubmission.studentName}</p>
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', margin: '0 0 4px 0' }}>Status</h3>
                <span style={{ 
                  display: 'inline-block',
                  backgroundColor: selectedSubmission.status === 'completed' ? '#10b981' : '#f59e0b',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {selectedSubmission.status}
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', margin: '0 0 4px 0' }}>Completed By</h3>
                <p style={{ fontSize: '16px', color: '#111827', margin: 0 }}>{selectedSubmission.completedBy || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {/* Answers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {selectedSubmission.answers.map((answer, index) => (
              <div key={index} style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '24px', 
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' 
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 12px 0' }}>
                  {answer.questionText}
                </h3>
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  {answer.questionType === 'single-choice' || answer.questionType === 'multiple-choice' ? (
                    <div>
                      {answer.selectedOptions?.map((option, optIndex) => (
                        <span key={optIndex} style={{ 
                          display: 'inline-block',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          marginRight: '8px',
                          marginBottom: '4px'
                        }}>
                          {option.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
                      {String(answer.answer)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              marginRight: '16px',
              padding: '8px',
              color: '#4b5563',
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <ArrowLeft style={{ height: '20px', width: '20px' }} />
          </button>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Form Submissions
            </h1>
            <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>
              {studentName ? `for ${studentName}` : 'View and manage form submissions'}
            </p>
          </div>
        </div>

        {/* Available Questionnaires */}
        {availableQuestionnaires.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              Fill New Form
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {availableQuestionnaires.map((questionnaire) => (
                <div key={questionnaire._id} style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                    {questionnaire.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>
                    {questionnaire.description}
                  </p>
                  <button
                    onClick={() => handleFillNewForm(questionnaire._id)}
                    style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    <Plus style={{ height: '16px', width: '16px' }} />
                    Fill Form
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Submissions */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            Past Submissions ({submissions.length})
          </h2>
          
          {submissions.length === 0 ? (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '48px', 
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <FileText style={{ height: '48px', width: '48px', color: '#9ca3af', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                No submissions yet
              </h3>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Once forms are submitted, they will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {submissions.map((submission) => (
                <div key={submission._id} style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                        {submission.questionnaireTitle}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar style={{ height: '16px', width: '16px' }} />
                          {formatDate(submission.submittedAt!)}
                        </div>
                        <span style={{ 
                          backgroundColor: submission.status === 'completed' ? '#10b981' : '#f59e0b',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {submission.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewSubmission(submission)}
                      style={{
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      <Eye style={{ height: '16px', width: '16px' }} />
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewSubmissions;
