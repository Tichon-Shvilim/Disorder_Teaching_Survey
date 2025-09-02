import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Send, AlertCircle, FileText, Save } from 'lucide-react';
import { FormAPIService } from './Api-Requests/FormAPIService';
import type { QuestionnaireTemplate, FormAnswer, FormNode, Option, VisibilityCondition } from './models/FormModels';
import { toast } from 'react-toastify';
import type { RootState } from '../../store';

const FillForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questionnaireId } = useParams<{ questionnaireId?: string }>();
  
  // Get current user from Redux store
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  // Get student info from navigation state or URL params
  const studentId = location.state?.studentId || '';
  const studentName = location.state?.studentName || 'Unknown Student';
  const editSubmissionId = location.state?.editSubmissionId || null;

  const [questionnaires, setQuestionnaires] = useState<QuestionnaireTemplate[]>([]);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string>(questionnaireId || '');
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, FormAnswer>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showQuestionnaireList, setShowQuestionnaireList] = useState(!questionnaireId);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(editSubmissionId);

  // Load available questionnaires or existing submission for editing
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (editSubmissionId) {
          // Load existing submission for editing
          const submission = await FormAPIService.getSubmission(editSubmissionId);
          const questionnaireData = await FormAPIService.getQuestionnaireTemplate(submission.questionnaireId);
          
          setQuestionnaire(questionnaireData);
          setSelectedQuestionnaireId(submission.questionnaireId);
          setCurrentSubmissionId(submission._id);
          
          // Convert submission answers to form state
          const formAnswers: Record<string, FormAnswer> = {};
          submission.answers.forEach((answer: FormAnswer) => {
            formAnswers[answer.questionId] = answer;
          });
          setAnswers(formAnswers);
          setShowQuestionnaireList(false);
        } else {
          // Load available questionnaires for new submission
          const data = await FormAPIService.getQuestionnaireTemplates();
          if (Array.isArray(data) && data.length > 0) {
            setQuestionnaires(data);
          } else {
            console.error('No questionnaires found');
            toast.error('No questionnaires available');
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [editSubmissionId]);

  // Load specific questionnaire when selected (for new submissions)
  useEffect(() => {
    if (!selectedQuestionnaireId || editSubmissionId) return;
    
    const fetchQuestionnaire = async () => {
      try {
        setLoading(true);
        const data = await FormAPIService.getQuestionnaireTemplate(selectedQuestionnaireId);
        
        setQuestionnaire(data);
        setShowQuestionnaireList(false);
        
        // Initialize answers for all questions in the structure
        const initialAnswers: Record<string, FormAnswer> = {};
        
        const extractQuestions = (nodes: FormNode[], path: string[] = []) => {
          nodes.forEach(node => {
            if (node.type === 'question') {
              const nodePath = [...path, node.id];
              initialAnswers[node.id] = {
                questionId: node.id,
                nodePath,
                inputType: node.inputType!,
                answer: node.inputType === 'multiple-choice' ? [] : '',
                selectedOptions: [],
                questionTitle: node.title,
                weight: node.weight || 1,
                graphable: node.graphable || false
              };
            }
            
            if (node.children && node.children.length > 0) {
              extractQuestions(node.children, [...path, node.id]);
            }
          });
        };
        
        extractQuestions(data.structure);
        setAnswers(initialAnswers);
      } catch (error) {
        console.error('Error fetching questionnaire:', error);
        toast.error('Failed to load questionnaire');
        setShowQuestionnaireList(true);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaire();
  }, [selectedQuestionnaireId, editSubmissionId]);

  const handleQuestionnaireSelect = (id: string) => {
    setSelectedQuestionnaireId(id);
  };

  const handleAnswerChange = (
    questionId: string,
    answer: string | number | (string | number)[],
    selectedOptions?: Option[]
  ) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer,
        selectedOptions: selectedOptions || []
      }
    }));

    // Clear error for this question
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  const renderQuestion = (node: FormNode): React.ReactNode => {
    if (node.type !== 'question') return null;

    const currentAnswer = answers[node.id];
    const isVisible = evaluateVisibility(node, answers);
    
    if (!isVisible) return null;

    return (
      <div key={node.id} style={{ 
        marginBottom: '32px', 
        padding: '24px', 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        border: errors[node.id] ? '2px solid #ef4444' : '1px solid #e5e7eb'
      }}>
        {/* Question Title */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            {node.title}
            {node.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
          </h3>
          {node.description && (
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              {node.description}
            </p>
          )}
          {/* Show weight and graphable info */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {node.weight && node.weight !== 1 && (
              <span style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Weight: {node.weight}
              </span>
            )}
            {node.graphable && (
              <span style={{
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Analytics
              </span>
            )}
          </div>
        </div>

        {/* Question Input */}
        {node.inputType === 'text' && (
          <textarea
            value={currentAnswer?.answer as string || ''}
            onChange={(e) => handleAnswerChange(node.id, e.target.value)}
            placeholder="Enter your response..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        )}

        {node.inputType === 'number' && (
          <input
            type="number"
            value={currentAnswer?.answer as number || ''}
            onChange={(e) => handleAnswerChange(node.id, parseFloat(e.target.value) || 0)}
            style={{
              width: '200px',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        )}

        {node.inputType === 'single-choice' && node.options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {node.options.map((option) => (
              <label
                key={option.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: currentAnswer?.answer === option.value ? '#f0f9ff' : 'white',
                  borderColor: currentAnswer?.answer === option.value ? '#0ea5e9' : '#e5e7eb',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="radio"
                  name={node.id}
                  value={option.value}
                  checked={currentAnswer?.answer === option.value}
                  onChange={() => handleAnswerChange(node.id, option.value, [option])}
                  style={{ transform: 'scale(1.2)' }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '16px', fontWeight: '500' }}>{option.label}</span>
                  {option.value !== undefined && (
                    <span style={{
                      backgroundColor: '#e5e7eb',
                      color: '#374151',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      marginLeft: '8px'
                    }}>
                      Value: {option.value}
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        {node.inputType === 'multiple-choice' && node.options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {node.options.map((option) => {
              const currentAnswerArray = Array.isArray(currentAnswer?.answer) ? currentAnswer.answer : [];
              const isChecked = currentAnswerArray.includes(option.value);

              return (
                <label
                  key={option.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: isChecked ? '#f0fdf4' : 'white',
                    borderColor: isChecked ? '#22c55e' : '#e5e7eb',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const currentSelectedOptions = currentAnswer?.selectedOptions || [];
                      let newAnswer: (string | number)[];
                      let newSelectedOptions: Option[];

                      if (isChecked) {
                        // Remove option
                        newAnswer = currentAnswerArray.filter(val => val !== option.value);
                        newSelectedOptions = currentSelectedOptions.filter(opt => opt.id !== option.id);
                      } else {
                        // Add option
                        newAnswer = [...currentAnswerArray, option.value];
                        newSelectedOptions = [...currentSelectedOptions, option];
                      }

                      handleAnswerChange(node.id, newAnswer, newSelectedOptions);
                    }}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>{option.label}</span>
                    {option.value !== undefined && (
                      <span style={{
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        marginLeft: '8px'
                      }}>
                        Value: {option.value}
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {node.inputType === 'scale' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {node.scaleMin || 1}
            </span>
            <input
              type="range"
              min={node.scaleMin || 1}
              max={node.scaleMax || 5}
              value={currentAnswer?.answer as number || (node.scaleMin || 1)}
              onChange={(e) => handleAnswerChange(node.id, parseInt(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {node.scaleMax || 5}
            </span>
            <div style={{
              minWidth: '40px',
              textAlign: 'center',
              padding: '8px 12px',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              {currentAnswer?.answer || (node.scaleMin || 1)}
            </div>
          </div>
        )}

        {errors[node.id] && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
            <AlertCircle style={{ height: '16px', width: '16px' }} />
            <span style={{ fontSize: '14px' }}>{errors[node.id]}</span>
          </div>
        )}
      </div>
    );
  };

  const renderNodes = (nodes: FormNode[], path: string[] = []): React.ReactNode => {
    return nodes.map(node => {
      if (node.type === 'question') {
        return renderQuestion(node);
      } else if (node.type === 'group') {
        const isVisible = evaluateVisibility(node, answers);
        if (!isVisible) return null;

        return (
          <div key={node.id} style={{ marginBottom: '32px' }}>
            <div style={{
              padding: '16px 24px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '16px',
              borderLeft: '4px solid #3b82f6'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#1f2937',
                margin: 0
              }}>
                {node.title}
              </h2>
              {node.description && (
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '8px 0 0 0' }}>
                  {node.description}
                </p>
              )}
            </div>
            {node.children && renderNodes(node.children, [...path, node.id])}
          </div>
        );
      }
      return null;
    });
  };

  // Evaluate visibility conditions
  const evaluateVisibility = (node: FormNode, answers: Record<string, FormAnswer>): boolean => {
    if (!node.visibilityConditions || node.visibilityConditions.length === 0) {
      return true;
    }

    return node.visibilityConditions.every((condition: VisibilityCondition) => {
      const dependentAnswer = answers[condition.questionId];
      if (!dependentAnswer) return false;

      switch (condition.operator) {
        case 'equals':
          return dependentAnswer.answer === condition.value;
        case 'not_equals':
          return dependentAnswer.answer !== condition.value;
        case 'greater_than':
          return Number(dependentAnswer.answer) > Number(condition.value);
        case 'less_than':
          return Number(dependentAnswer.answer) < Number(condition.value);
        case 'contains':
          if (Array.isArray(dependentAnswer.answer)) {
            return dependentAnswer.answer.includes(condition.value);
          }
          return String(dependentAnswer.answer).includes(String(condition.value));
        default:
          return true;
      }
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const validateNodes = (nodes: FormNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'question' && node.required) {
          const isVisible = evaluateVisibility(node, answers);
          if (isVisible) {
            const answer = answers[node.id];
            if (!answer || !answer.answer || 
                (Array.isArray(answer.answer) && answer.answer.length === 0)) {
              newErrors[node.id] = 'This question is required';
            }
          }
        }

        if (node.children) {
          validateNodes(node.children);
        }
      });
    };

    if (questionnaire) {
      validateNodes(questionnaire.structure);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!questionnaire || !currentUser) {
      toast.error('Missing required information');
      return;
    }

    setSavingDraft(true);
    try {
      const answersArray = Object.values(answers).filter(answer => 
        answer.answer !== '' && 
        !(Array.isArray(answer.answer) && answer.answer.length === 0)
      );

      if (currentSubmissionId) {
        // Update existing submission
        await FormAPIService.updateSubmission(currentSubmissionId, {
          answers: answersArray,
          status: 'draft'
        });
        toast.success('Draft updated successfully!');
      } else {
        // Create new draft submission
        const submission = {
          studentId,
          questionnaireId: selectedQuestionnaireId,
          answers: answersArray,
          status: 'draft' as const
        };

        const result = await FormAPIService.submitForm(submission);
        setCurrentSubmissionId(result.submissionId);
        toast.success('Draft saved successfully!');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!isDraft && !validateForm()) return;
    if (!questionnaire || !currentUser) {
      toast.error('Missing required information');
      return;
    }

    setSubmitting(true);
    try {
      const answersArray = Object.values(answers).filter(answer => 
        answer.answer !== '' && 
        !(Array.isArray(answer.answer) && answer.answer.length === 0)
      );

      if (currentSubmissionId && !isDraft) {
        // Update existing submission to completed
        await FormAPIService.updateSubmission(currentSubmissionId, {
          answers: answersArray,
          status: 'completed'
        });
        toast.success('Form submitted successfully!');
      } else if (!currentSubmissionId) {
        // Create new submission
        const submission = {
          studentId,
          questionnaireId: selectedQuestionnaireId,
          answers: answersArray,
          status: isDraft ? 'draft' as const : 'completed' as const
        };

        await FormAPIService.submitForm(submission);
        toast.success(`Form ${isDraft ? 'saved as draft' : 'submitted'} successfully!`);
      }

      navigate(-1);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (showQuestionnaireList) {
      navigate(-1);
    } else {
      setShowQuestionnaireList(true);
      setQuestionnaire(null);
      setSelectedQuestionnaireId('');
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
        <p style={{ fontSize: '16px', color: '#6b7280' }}>Loading form...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={handleBack}
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
              {editSubmissionId ? 'Edit Form Submission' : 'Fill Form'}
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
              Student: <strong>{studentName}</strong>
            </p>
            {questionnaire && (
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '8px 0 0 0' }}>
                Form: <strong>{questionnaire.title}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Questionnaire Selection */}
        {showQuestionnaireList && questionnaires.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: '#1f2937' }}>
              Select a Questionnaire
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {questionnaires.map((q) => (
                <div
                  key={q._id}
                  onClick={() => handleQuestionnaireSelect(q._id)}
                  style={{
                    padding: '20px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.backgroundColor = '#f0f9ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText style={{ height: '24px', width: '24px', color: '#3b82f6' }} />
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0', color: '#1f2937' }}>
                        {q.title}
                      </h3>
                      {q.description && (
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                          {q.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Content */}
        {questionnaire && !showQuestionnaireList && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0' }}>
                {questionnaire.title}
              </h2>
              {questionnaire.description && (
                <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
                  {questionnaire.description}
                </p>
              )}
            </div>

            {/* Form Questions */}
            <div style={{ marginBottom: '48px' }}>
              {questionnaire.structure && questionnaire.structure.length > 0 ? (
                renderNodes(questionnaire.structure)
              ) : (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <AlertCircle style={{ height: '48px', width: '48px', color: '#ef4444', margin: '0 auto 16px' }} />
                  <p style={{ color: '#6b7280', fontSize: '16px' }}>No questions found in this questionnaire.</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSaveDraft}
                disabled={savingDraft}
                style={{
                  background: savingDraft ? '#9ca3af' : 'white',
                  color: savingDraft ? 'white' : '#374151',
                  padding: '16px 24px',
                  borderRadius: '8px',
                  border: '2px solid #d1d5db',
                  cursor: savingDraft ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                {savingDraft ? (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                ) : (
                  <>
                    <Save style={{ height: '20px', width: '20px' }} />
                    <span>Save Draft</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                style={{
                  background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '16px 32px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s'
                }}
              >
                {submitting ? (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                ) : (
                  <>
                    <Send style={{ height: '20px', width: '20px' }} />
                    <span>Submit Form</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS animation for spinners */}
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

export default FillForm;
