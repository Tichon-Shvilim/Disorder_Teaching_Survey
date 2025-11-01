import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Eye, Plus, Edit, Trash2, X, Filter } from 'lucide-react';
import { FormAPIService } from './Api-Requests/FormAPIService';
import type { FormSubmission, QuestionnaireTemplate } from './models/FormModels';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { PDFDownloadButton } from '../common';

const ViewSubmissions: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  // Get student info from navigation state
  const studentId = location.state?.studentId || '';
  const studentName = location.state?.studentName || 'Unknown Student';

  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<FormSubmission | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterQuestionnaire, setFilterQuestionnaire] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch student submissions and available questionnaires
        const [submissionsResult, questionnairesData] = await Promise.all([
          FormAPIService.getStudentSubmissions(studentId),
          FormAPIService.getQuestionnaireTemplates()
        ]);
        
        setSubmissions(Array.isArray(submissionsResult) ? submissionsResult : []);
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
    navigate(`/layout/forms/fill/${questionnaireId}`, {
      state: { 
        studentId: studentId, 
        studentName
      }
    });
  };

  const handleViewSubmission = async (submission: FormSubmission) => {
    try {
      console.log('Fetching full submission for ID:', submission._id);
      // Fetch the complete submission with all answers
      const fullSubmission = await FormAPIService.getSubmission(submission._id);
      console.log('Full submission received:', fullSubmission);
      console.log('Full submission answers:', fullSubmission.answers);
      setSelectedSubmission(fullSubmission);
    } catch (error) {
      console.error('Error fetching submission details:', error);
      toast.error('Failed to load submission details');
      // Fallback to the partial submission from the list
      console.log('Using fallback submission:', submission);
      setSelectedSubmission(submission);
    }
  };

  const handleEditSubmission = (submission: FormSubmission) => {
    if (submission.status === 'completed') {
      toast.warning('Completed submissions cannot be edited. You can only edit draft submissions.');
      return;
    }

    navigate(`/layout/forms/fill/${submission.questionnaireId}`, {
      state: { 
        studentId: studentId, 
        studentName,
        editSubmissionId: submission._id
      }
    });
  };

  const handleDeleteSubmission = (submission: FormSubmission) => {
    setSubmissionToDelete(submission);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!submissionToDelete) return;

    setDeleting(true);
    try {
      await FormAPIService.deleteSubmission(submissionToDelete._id);
      setSubmissions(prev => prev.filter(sub => sub._id !== submissionToDelete._id));
      toast.success('Submission deleted successfully');
      setShowDeleteDialog(false);
      setSubmissionToDelete(null);
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete submission. You may not have permission.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filterStatus !== 'all' && submission.status !== filterStatus) {
      return false;
    }
    if (filterQuestionnaire !== 'all' && submission.questionnaireId !== filterQuestionnaire) {
      return false;
    }
    return true;
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'draft':
        return '#f59e0b';
      case 'reviewed':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'draft':
        return '📝';
      case 'reviewed':
        return '👁️';
      default:
        return '?';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>Loading submissions...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              marginBottom: '24px'
            }}
          >
            <ArrowLeft style={{ height: '16px', width: '16px' }} />
            Back
          </button>

          <div style={{
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#1f2937', 
              margin: '0 0 8px 0' 
            }}>
              Form Submissions
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
              Student: <strong>{studentName}</strong>
            </p>
          </div>
        </div>

        {/* Actions and Filters */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* New Form Button */}
          <div className="dropdown" style={{ position: 'relative', display: 'inline-block' }}>
            <button
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onClick={() => {
                const dropdown = document.querySelector('.dropdown-content');
                if (dropdown) {
                  (dropdown as HTMLElement).style.display = 
                    (dropdown as HTMLElement).style.display === 'block' ? 'none' : 'block';
                }
              }}
            >
              <Plus style={{ height: '16px', width: '16px' }} />
              Fill New Form
            </button>
            
            <div className="dropdown-content" style={{
              display: 'none',
              position: 'absolute',
              top: '100%',
              left: 0,
              backgroundColor: 'white',
              minWidth: '200px',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              zIndex: 1000,
              border: '1px solid #e5e7eb',
              marginTop: '4px'
            }}>
              {questionnaires.map((questionnaire) => (
                <button
                  key={questionnaire._id}
                  onClick={() => {
                    (document.querySelector('.dropdown-content') as HTMLElement).style.display = 'none';
                    handleFillNewForm(questionnaire._id);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#374151',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {questionnaire.title}
                </button>
              ))}
            </div>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '12px 16px',
              backgroundColor: showFilters ? '#f3f4f6' : 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#374151'
            }}
          >
            <Filter style={{ height: '16px', width: '16px' }} />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                Questionnaire
              </label>
              <select
                value={filterQuestionnaire}
                onChange={(e) => setFilterQuestionnaire(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  minWidth: '200px'
                }}
              >
                <option value="all">All Questionnaires</option>
                {questionnaires.map((q) => (
                  <option key={q._id} value={q._id}>{q.title}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Submissions List */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          {filteredSubmissions.length > 0 ? (
            <div>
              {filteredSubmissions.map((submission, index) => (
                <div
                  key={submission._id}
                  style={{
                    padding: '20px 24px',
                    borderBottom: index < filteredSubmissions.length - 1 ? '1px solid #f3f4f6' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#1f2937', 
                        margin: 0 
                      }}>
                        {submission.questionnaireTitle}
                      </h3>
                      <span style={{
                        backgroundColor: getStatusColor(submission.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {getStatusIcon(submission.status)}
                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar style={{ height: '14px', width: '14px' }} />
                        {submission.submittedAt ? formatDate(submission.submittedAt) : 'Draft - ' + formatDate(submission.createdAt)}
                      </span>
                      <span>
                        {submission.answers?.length || 0} answers
                      </span>
                      {submission.totalScore && (
                        <span>
                          Score: {submission.totalScore}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleViewSubmission(submission)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                      title="View Details"
                    >
                      <Eye style={{ height: '14px', width: '14px' }} />
                      View
                    </button>

                    <PDFDownloadButton 
                      submission={submission}
                      variant="secondary"
                      size="small"
                      fileName={`${studentName}_${submission.questionnaireTitle}_${submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString().replace(/\//g, '-') : 'draft'}`}
                    />

                    {(submission.status === 'draft' || currentUser?.role === 'Admin') && (
                      <button
                        onClick={() => handleEditSubmission(submission)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#dbeafe',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px',
                          color: '#1d4ed8'
                        }}
                        title="Edit Submission"
                      >
                        <Edit style={{ height: '14px', width: '14px' }} />
                        Edit
                      </button>
                    )}

                    {currentUser?.role === 'Admin' && (
                      <button
                        onClick={() => handleDeleteSubmission(submission)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#fee2e2',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px',
                          color: '#dc2626'
                        }}
                        title="Delete Submission"
                      >
                        <Trash2 style={{ height: '14px', width: '14px' }} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <FileText style={{ height: '48px', width: '48px', color: '#d1d5db', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0' }}>
                No submissions found
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0' }}>
                {submissions.length === 0 
                  ? 'This student has no form submissions yet.'
                  : 'No submissions match your current filters.'
                }
              </p>
              {questionnaires.length > 0 && (
                <button
                  onClick={() => handleFillNewForm(questionnaires[0]._id)}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Fill First Form
                </button>
              )}
            </div>
          )}
        </div>

        {/* Submission Details Modal */}
        {selectedSubmission && (
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
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e5e7eb',
                position: 'sticky',
                top: 0,
                backgroundColor: 'white',
                borderRadius: '12px 12px 0 0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    Submission Details
                  </h2>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <PDFDownloadButton 
                      submission={selectedSubmission}
                      variant="secondary"
                      size="medium"
                      fileName={`${studentName}_${selectedSubmission.questionnaireTitle}_${selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleDateString().replace(/\//g, '-') : 'draft'}`}
                    />
                    <button
                      onClick={() => setSelectedSubmission(null)}
                      style={{
                        padding: '8px',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <X style={{ height: '20px', width: '20px', color: '#6b7280' }} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0' }}>
                    {selectedSubmission.questionnaireTitle}
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
                    <span>Student: {selectedSubmission.studentName}</span>
                    <span>Status: {selectedSubmission.status}</span>
                    <span>
                      {selectedSubmission.submittedAt 
                        ? `Submitted: ${formatDate(selectedSubmission.submittedAt)}`
                        : `Created: ${formatDate(selectedSubmission.createdAt)}`
                      }
                    </span>
                  </div>
                </div>

                {selectedSubmission.notes && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0' }}>
                      Notes
                    </h4>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                      {selectedSubmission.notes}
                    </p>
                  </div>
                )}

                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 24px 0' }}>
                    Form Responses
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {(selectedSubmission.answers || []).map((answer, index) => {
                      const isSubQuestion = answer.questionTitle?.includes('→') || answer.questionTitle?.includes('Follow-up');
                      
                      return (
                        <div key={answer.questionId} style={{
                          padding: isSubQuestion ? '16px 20px 16px 32px' : '20px',
                          backgroundColor: isSubQuestion ? '#f8fafc' : 'white',
                          borderRadius: '12px',
                          border: isSubQuestion ? '1px solid #e2e8f0' : '2px solid #e5e7eb',
                          borderLeft: isSubQuestion ? '4px solid #3b82f6' : '2px solid #e5e7eb',
                          boxShadow: isSubQuestion ? '0 1px 3px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}>
                          {/* Question Header */}
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                              {isSubQuestion && (
                                <span style={{ color: '#3b82f6', fontSize: '14px', marginTop: '2px' }}>└─</span>
                              )}
                              <h5 style={{ 
                                fontSize: isSubQuestion ? '15px' : '16px', 
                                fontWeight: isSubQuestion ? '500' : '600', 
                                color: isSubQuestion ? '#475569' : '#1f2937', 
                                margin: 0,
                                lineHeight: '1.5'
                              }}>
                                {answer.questionTitle || `Question ${index + 1}`}
                              </h5>
                            </div>
                            
                            {/* Question Metadata */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {answer.weight > 1 && (
                                <span style={{
                                  backgroundColor: '#f59e0b',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '500'
                                }}>
                                  Weight: {answer.weight}
                                </span>
                              )}
                              {answer.graphable && (
                                <span style={{
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '500'
                                }}>
                                  📊 Analytics
                                </span>
                              )}
                              {isSubQuestion && (
                                <span style={{
                                  backgroundColor: '#3b82f6',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '500'
                                }}>
                                  Follow-up
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Answer Content */}
                          <div style={{ 
                            backgroundColor: isSubQuestion ? 'white' : '#f9fafb',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                          }}>
                            <div style={{ 
                              fontSize: '15px', 
                              color: '#374151',
                              lineHeight: '1.6',
                              fontWeight: '500'
                            }}>
                              {Array.isArray(answer.answer) 
                                ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {answer.answer.map((ans, i) => (
                                      <span key={i} style={{
                                        display: 'inline-block',
                                        backgroundColor: '#dbeafe',
                                        color: '#1e40af',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                      }}>
                                        {ans}
                                      </span>
                                    ))}
                                  </div>
                                )
                                : (
                                  <span style={{
                                    display: 'inline-block',
                                    backgroundColor: answer.answer.toString().length > 50 ? 'transparent' : '#e0f2fe',
                                    color: answer.answer.toString().length > 50 ? '#374151' : '#0891b2',
                                    padding: answer.answer.toString().length > 50 ? '0' : '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    whiteSpace: answer.answer.toString().length > 50 ? 'pre-wrap' : 'nowrap'
                                  }}>
                                    {answer.answer.toString()}
                                  </span>
                                )
                              }
                            </div>

                            {/* Selected Options Details */}
                            {answer.selectedOptions && answer.selectedOptions.length > 0 && (
                              <div style={{ 
                                marginTop: '12px',
                                padding: '12px',
                                backgroundColor: '#f0f9ff',
                                borderRadius: '6px',
                                border: '1px solid #bae6fd'
                              }}>
                                <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: '600', marginBottom: '6px' }}>
                                  Selected Options:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {answer.selectedOptions.map((opt, i) => (
                                    <span key={i} style={{
                                      backgroundColor: '#0ea5e9',
                                      color: 'white',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: '500'
                                    }}>
                                      {opt.label} ({opt.value})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedSubmission.domainScores && selectedSubmission.domainScores.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0' }}>
                      Domain Scores
                    </h4>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {selectedSubmission.domainScores.map((domain, index) => (
                        <div key={index} style={{
                          padding: '12px',
                          backgroundColor: '#f0f9ff',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                            {domain.title}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1d4ed8' }}>
                            {domain.score} / {domain.maxScore}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSubmission.totalScore && (
                  <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#166534' }}>
                      Total Score: {selectedSubmission.totalScore}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && submissionToDelete && (
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
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0' }}>
                Delete Submission?
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0' }}>
                Are you sure you want to delete the submission for "{submissionToDelete.questionnaireTitle}"? 
                This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setSubmissionToDelete(null);
                  }}
                  disabled={deleting}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    color: '#374151'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: deleting ? '#f87171' : '#dc2626',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {deleting ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #ffffff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ViewSubmissions;
