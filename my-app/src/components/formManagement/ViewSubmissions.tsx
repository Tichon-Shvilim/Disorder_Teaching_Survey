import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Eye, Plus, Edit, Trash2, Save, X } from 'lucide-react';
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
  const [editingSubmission, setEditingSubmission] = useState<FormSubmission | null>(null);
  const [editingAnswers, setEditingAnswers] = useState<FormSubmission['answers']>([]);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<QuestionnaireTemplate | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<FormSubmission | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

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

  const handleFillNewForm = (questionnaireId: string | { _id: string }) => {
    const id = typeof questionnaireId === 'object' ? questionnaireId._id : questionnaireId;
    navigate(`/fill-form/${id}`, {
      state: { studentId: studentId, studentName }
    });
  };

  const handleViewSubmission = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
  };

  const handleEditSubmission = async (submission: FormSubmission) => {
    try {
      setLoadingEdit(true);
      console.log('Editing submission:', submission);
      console.log('QuestionnaireId:', submission.questionnaireId, 'Type:', typeof submission.questionnaireId);
      
      // Extract the actual ObjectId from the populated questionnaireId
      const questionnaireId = typeof submission.questionnaireId === 'object' && submission.questionnaireId?._id 
        ? submission.questionnaireId._id 
        : submission.questionnaireId as string;
      
      console.log('Extracted questionnaireId:', questionnaireId, 'Type:', typeof questionnaireId);
      
      // Fetch the questionnaire template to get the original questions and options
      const questionnaireTemplate = await FormAPIService.getQuestionnaireTemplate(questionnaireId);
      
      setEditingSubmission(submission);
      setEditingAnswers([...submission.answers]);
      setEditingQuestionnaire(questionnaireTemplate);
      setSelectedSubmission(submission);
    } catch (error) {
      console.error('Error loading questionnaire template:', error);
      toast.error('Failed to load questionnaire for editing');
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDeleteSubmission = (submission: FormSubmission) => {
    setSubmissionToDelete(submission);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!submissionToDelete) return;

    try {
      await FormAPIService.deleteSubmission(submissionToDelete._id!);
      setSubmissions(prev => prev.filter(s => s._id !== submissionToDelete._id));
      toast.success('Form submission deleted successfully');
      setShowDeleteDialog(false);
      setSubmissionToDelete(null);
      // If currently viewing the deleted submission, go back to list
      if (selectedSubmission?._id === submissionToDelete._id) {
        setSelectedSubmission(null);
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete submission');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSubmission) return;

    try {
      setSaving(true);
      await FormAPIService.updateSubmission(editingSubmission._id!, {
        answers: editingAnswers,
        updatedAt: new Date()
      });
      
      // Update the submissions list
      setSubmissions(prev => prev.map(s => s._id === editingSubmission._id ? { ...s, answers: editingAnswers } : s));
      
      // Update the selected submission if viewing
      if (selectedSubmission?._id === editingSubmission._id) {
        setSelectedSubmission({ ...selectedSubmission, answers: editingAnswers } as FormSubmission);
      }
      
      setEditingSubmission(null);
      setEditingAnswers([]);
      setEditingQuestionnaire(null);
      toast.success('Form submission updated successfully');
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update submission');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSubmission(null);
    setEditingAnswers([]);
    setEditingQuestionnaire(null);
  };

  const handleAnswerChange = (answerIndex: number, newAnswer: string | number | (string | number)[], selectedOptions?: { id: string; label: string; value: number }[]) => {
    setEditingAnswers(prev => prev.map((answer, index) => 
      index === answerIndex ? { 
        ...answer, 
        answer: newAnswer,
        ...(selectedOptions && { selectedOptions })
      } : answer
    ));
  };

  // Helper function to find the corresponding question from the questionnaire template
  const findQuestionByText = (questionText: string) => {
    if (!editingQuestionnaire) return null;
    return editingQuestionnaire.questions.find(q => q.text === questionText);
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
    const isEditing = editingSubmission?._id === selectedSubmission._id;
    const currentAnswers = isEditing ? editingAnswers : selectedSubmission.answers;

    return (
      <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)', minHeight: '100vh' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => {
                  if (isEditing) {
                    handleCancelEdit();
                  } else {
                    setSelectedSubmission(null);
                  }
                }}
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
                {isEditing ? <X style={{ height: '20px', width: '20px' }} /> : <ArrowLeft style={{ height: '20px', width: '20px' }} />}
              </button>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {selectedSubmission.questionnaireTitle}
                  {isEditing && <span style={{ fontSize: '18px', fontWeight: 'normal', color: '#6b7280', marginLeft: '12px' }}>(Editing)</span>}
                </h1>
                <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>
                  Submitted {formatDate(selectedSubmission.submittedAt!)}
                </p>
              </div>
            </div>
            
            {/* Edit/Save/Cancel buttons */}
            {!isEditing ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEditSubmission(selectedSubmission)}
                  disabled={loadingEdit}
                  style={{
                    backgroundColor: loadingEdit ? '#e5e7eb' : '#dbeafe',
                    color: loadingEdit ? '#9ca3af' : '#1d4ed8',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: loadingEdit ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {loadingEdit ? (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #9ca3af',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  ) : (
                    <Edit style={{ height: '16px', width: '16px' }} />
                  )}
                  {loadingEdit ? 'Loading...' : 'Edit'}
                </button>
                <button
                  onClick={() => handleDeleteSubmission(selectedSubmission)}
                  style={{
                    backgroundColor: '#fecaca',
                    color: '#dc2626',
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
                  <Trash2 style={{ height: '16px', width: '16px' }} />
                  Delete
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCancelEdit}
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
                  <X style={{ height: '16px', width: '16px' }} />
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  style={{
                    backgroundColor: saving ? '#9ca3af' : '#10b981',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {saving ? (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  ) : (
                    <Save style={{ height: '16px', width: '16px' }} />
                  )}
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
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
            {currentAnswers.map((answer, index) => (
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
                  backgroundColor: isEditing ? '#ffffff' : '#f8fafc', 
                  borderRadius: '8px',
                  border: isEditing ? '2px solid #e5e7eb' : '1px solid #e2e8f0'
                }}>
                  {isEditing ? (
                    // Edit mode
                    answer.questionType === 'text' ? (
                      <textarea
                        value={String(answer.answer)}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '100px',
                          padding: '8px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          fontSize: '14px',
                          resize: 'vertical',
                          outline: 'none'
                        }}
                      />
                    ) : answer.questionType === 'number' ? (
                      <input
                        type="number"
                        value={Number(answer.answer)}
                        onChange={(e) => handleAnswerChange(index, parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    ) : answer.questionType === 'scale' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>1</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={Number(answer.answer)}
                          onChange={(e) => handleAnswerChange(index, parseInt(e.target.value))}
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>5</span>
                        <div style={{
                          minWidth: '24px',
                          textAlign: 'center',
                          padding: '2px 6px',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {answer.answer}
                        </div>
                      </div>
                    ) : (
                      // For choice questions, render them as editable if we have the questionnaire template
                      answer.questionType === 'single-choice' || answer.questionType === 'multiple-choice' ? (
                        (() => {
                          const question = findQuestionByText(answer.questionText);
                          if (!question) {
                            return (
                              <div style={{ padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px 0', fontStyle: 'italic' }}>
                                  Question template not found. Please delete and create a new submission if needed.
                                </p>
                                <div>
                                  {answer.selectedOptions?.map((option, optIndex) => (
                                    <span key={optIndex} style={{ 
                                      display: 'inline-block',
                                      backgroundColor: '#d1d5db',
                                      color: '#374151',
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
                              </div>
                            );
                          }

                          if (answer.questionType === 'single-choice') {
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {question.options.map((option) => {
                                  const isSelected = Array.isArray(answer.answer) 
                                    ? answer.answer.includes(option.value)
                                    : answer.answer === option.value;
                                  
                                  return (
                                    <label
                                      key={option.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        backgroundColor: isSelected ? '#dbeafe' : 'white',
                                        fontSize: '14px'
                                      }}
                                    >
                                      <input
                                        type="radio"
                                        name={`question-${index}`}
                                        value={option.value}
                                        checked={isSelected}
                                        onChange={() => handleAnswerChange(index, option.value, [option])}
                                      />
                                      <span>{option.label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            );
                          } else {
                            // Multiple choice
                            const currentAnswerArray = Array.isArray(answer.answer) ? answer.answer : [];
                            const currentSelectedOptions = answer.selectedOptions || [];
                            
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {question.options.map((option) => {
                                  const isChecked = currentAnswerArray.includes(option.value);
                                  
                                  return (
                                    <label
                                      key={option.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        backgroundColor: isChecked ? '#dbeafe' : 'white',
                                        fontSize: '14px'
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          let newAnswer: (string | number)[];
                                          let newSelectedOptions: { id: string; label: string; value: number }[];
                                          
                                          if (isChecked) {
                                            // Remove option
                                            newAnswer = currentAnswerArray.filter(val => val !== option.value);
                                            newSelectedOptions = currentSelectedOptions.filter(opt => opt.id !== option.id);
                                          } else {
                                            // Add option
                                            newAnswer = [...currentAnswerArray, option.value];
                                            newSelectedOptions = [...currentSelectedOptions, { id: option.id, label: option.label, value: option.value }];
                                          }
                                          
                                          handleAnswerChange(index, newAnswer, newSelectedOptions);
                                        }}
                                      />
                                      <span>{option.label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            );
                          }
                        })()
                      ) : (
                        <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
                          {String(answer.answer)}
                        </p>
                      )
                    )
                  ) : (
                    // View mode
                    answer.questionType === 'single-choice' || answer.questionType === 'multiple-choice' ? (
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
                    )
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleViewSubmission(submission)}
                        style={{
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                        title="View submission"
                      >
                        <Eye style={{ height: '14px', width: '14px' }} />
                        View
                      </button>
                      <button
                        onClick={() => handleEditSubmission(submission)}
                        disabled={loadingEdit}
                        style={{
                          backgroundColor: loadingEdit ? '#e5e7eb' : '#dbeafe',
                          color: loadingEdit ? '#9ca3af' : '#1d4ed8',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: loadingEdit ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                        title="Edit submission"
                      >
                        {loadingEdit ? (
                          <div style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid #9ca3af',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                        ) : (
                          <Edit style={{ height: '14px', width: '14px' }} />
                        )}
                        {loadingEdit ? 'Loading...' : 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDeleteSubmission(submission)}
                        style={{
                          backgroundColor: '#fecaca',
                          color: '#dc2626',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                        title="Delete submission"
                      >
                        <Trash2 style={{ height: '14px', width: '14px' }} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
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
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
              Delete Submission
            </h3>
            <p style={{ color: '#6b7280', margin: '0 0 24px 0' }}>
              Are you sure you want to delete this form submission? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteDialog(false)}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewSubmissions;
