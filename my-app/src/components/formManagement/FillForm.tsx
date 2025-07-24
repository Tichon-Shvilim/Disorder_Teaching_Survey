import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle, FileText } from 'lucide-react';
import { FormAPIService } from './Api-Requests/FormAPIService';
import type { QuestionnaireTemplate, FormAnswer } from './Api-Requests/FormAPIService';
import { toast } from 'react-toastify';

// Type definitions
interface QuestionOption {
  id: string;
  value: number;
  label: string;
  subQuestions?: Question[];
}

interface Question {
  _id?: string;
  text: string;
  domainId: string;
  type: 'single-choice' | 'multiple-choice' | 'text' | 'number' | 'scale';
  options: QuestionOption[];
  required: boolean;
  helpText?: string;
  order: number;
}

const FillForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questionnaireId } = useParams<{ questionnaireId?: string }>();
  
  // Get student info from navigation state
  const studentId = location.state?.studentId || '';
  const studentName = location.state?.studentName || 'Unknown Student';

  const [questionnaires, setQuestionnaires] = useState<QuestionnaireTemplate[]>([]);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string>(questionnaireId || '');
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, FormAnswer>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showQuestionnaireList, setShowQuestionnaireList] = useState(!questionnaireId);

  // Load available questionnaires
  useEffect(() => {
    const loadQuestionnaires = async () => {
      try {
        setLoading(true);
        const data = await FormAPIService.getQuestionnaireTemplates();
        
        if (Array.isArray(data) && data.length > 0) {
          setQuestionnaires(data);
        } else {
          console.error('No questionnaires found');
          toast.error('No questionnaires available');
        }
      } catch (error) {
        console.error('Error loading questionnaires:', error);
        toast.error('Failed to load questionnaires');
      } finally {
        setLoading(false);
      }
    };

    loadQuestionnaires();
  }, []);

  // Load specific questionnaire when selected
  useEffect(() => {
    if (!selectedQuestionnaireId) return;
    
    const fetchQuestionnaire = async () => {
      try {
        setLoading(true);
        const data = await FormAPIService.getQuestionnaireTemplate(selectedQuestionnaireId);
        
        setQuestionnaire(data);
        setShowQuestionnaireList(false);
        
        // Initialize answers object - check if questions exist
        const initialAnswers: Record<string, FormAnswer> = {};
        if (data.questions && Array.isArray(data.questions)) {
          data.questions.forEach((question: Question) => {
            initialAnswers[question._id || `q-${question.order}`] = {
              questionId: question._id || `q-${question.order}`,
              questionText: question.text,
              questionType: question.type,
              answer: question.type === 'multiple-choice' ? [] : '',
              selectedOptions: []
            };
          });
        } else {
          console.warn('No questions found in questionnaire data:', data);
        }
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
  }, [selectedQuestionnaireId]);

  const handleQuestionnaireSelect = (id: string) => {
    setSelectedQuestionnaireId(id);
  };

  const handleAnswerChange = (
    questionId: string, 
    answer: string | number | (string | number)[], 
    selectedOptions?: { id: string; label: string; value: number }[], 
    questionText?: string, 
    questionType?: 'single-choice' | 'multiple-choice' | 'text' | 'number' | 'scale'
  ) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        questionText: questionText || prev[questionId]?.questionText || '',
        questionType: questionType || prev[questionId]?.questionType || 'text',
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

  // Function to render sub-questions
  const renderSubQuestions = (subQuestions: Question[], parentQuestionId: string, parentOptionId: string) => {
    if (!subQuestions || subQuestions.length === 0) {
      return null;
    }

    return (
      <div style={{ marginLeft: '24px', marginTop: '16px', paddingLeft: '16px', borderLeft: '2px solid #e5e7eb' }}>
        {subQuestions.map((subQuestion, index) => {
          const subQuestionId = `${parentQuestionId}_${parentOptionId}_sub_${index}`;
          const currentSubAnswer = answers[subQuestionId];

          return (
            <div key={subQuestionId} style={{ marginBottom: '24px' }}>
              {/* Sub-question text */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151',
                  display: 'block'
                }}>
                  {subQuestion.text}
                  {subQuestion.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                </label>
                {subQuestion.helpText && (
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                    {subQuestion.helpText}
                  </p>
                )}
              </div>

              {/* Sub-question inputs */}
              {subQuestion.type === 'text' && (
                <input
                  type="text"
                  value={currentSubAnswer?.answer as string || ''}
                  onChange={(e) => handleAnswerChange(subQuestionId, e.target.value, [], subQuestion.text, subQuestion.type)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              )}

              {subQuestion.type === 'single-choice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {subQuestion.options.map((option) => (
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
                        backgroundColor: 'white',
                        fontSize: '14px'
                      }}
                    >
                      <input
                        type="radio"
                        name={subQuestionId}
                        value={option.value}
                        checked={currentSubAnswer?.answer === option.value}
                        onChange={() => handleAnswerChange(subQuestionId, option.value, [option], subQuestion.text, subQuestion.type)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {subQuestion.type === 'multiple-choice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {subQuestion.options.map((option) => {
                    const currentSubAnswerArray = Array.isArray(currentSubAnswer?.answer) ? currentSubAnswer.answer : [];
                    const isChecked = currentSubAnswerArray.includes(option.value);
                    
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
                          backgroundColor: 'white',
                          fontSize: '14px'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const currentSelectedOptions = currentSubAnswer?.selectedOptions || [];
                            let newAnswer: (string | number)[];
                            let newSelectedOptions: QuestionOption[];
                            
                            if (isChecked) {
                              // Remove option
                              newAnswer = currentSubAnswerArray.filter(val => val !== option.value);
                              newSelectedOptions = currentSelectedOptions.filter(opt => opt.id !== option.id);
                            } else {
                              // Add option
                              newAnswer = [...currentSubAnswerArray, option.value];
                              newSelectedOptions = [...currentSelectedOptions, option];
                            }
                            
                            handleAnswerChange(subQuestionId, newAnswer, newSelectedOptions, subQuestion.text, subQuestion.type);
                          }}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {subQuestion.type === 'number' && (
                <input
                  type="number"
                  value={currentSubAnswer?.answer as number || ''}
                  onChange={(e) => handleAnswerChange(subQuestionId, parseFloat(e.target.value) || 0, [], subQuestion.text, subQuestion.type)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              )}

              {subQuestion.type === 'scale' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>1</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={currentSubAnswer?.answer as number || 1}
                    onChange={(e) => handleAnswerChange(subQuestionId, parseInt(e.target.value), [], subQuestion.text, subQuestion.type)}
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
                    {currentSubAnswer?.answer || 1}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const validateForm = (): boolean => {
    if (!questionnaire) return false;

    const newErrors: Record<string, string> = {};
    
    questionnaire.questions.forEach((question: Question) => {
      const questionId = question._id || `q-${question.order}`;
      const answer = answers[questionId];
      
      if (question.required && (!answer || !answer.answer || 
          (Array.isArray(answer.answer) && answer.answer.length === 0))) {
        newErrors[questionId] = 'This question is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !questionnaire) return;

    setSubmitting(true);
    try {
      // Clean the answers by removing nested subQuestions from selectedOptions
      const cleanedAnswers = Object.values(answers).map(answer => ({
        ...answer,
        selectedOptions: answer.selectedOptions?.map(option => ({
          id: option.id,
          value: option.value,
          label: option.label
          // Remove subQuestions property
        })) || []
      }));

      const submission = {
        studentId,
        studentName,
        questionnaireId: selectedQuestionnaireId,
        questionnaireTitle: questionnaire.title,
        answers: cleanedAnswers,
        completedBy: 'Student',
        notes: ''
      };

      await FormAPIService.submitForm(submission);
      toast.success('Form submitted successfully!');
      navigate(-1);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
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
          borderTop: '4px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show questionnaire selection
  if (showQuestionnaireList) {
    return (
      <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)', minHeight: '100vh' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
            <button
              onClick={handleBack}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText style={{ height: '32px', width: '32px', color: '#2563eb' }} />
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                Select Questionnaire for {studentName}
              </h1>
            </div>
          </div>

          {/* Questionnaire List */}
          <div style={{ display: 'grid', gap: '16px' }}>
            {questionnaires.length === 0 ? (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '48px', 
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <AlertCircle style={{ height: '48px', width: '48px', color: '#ef4444', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', color: '#111827', marginBottom: '8px' }}>No Questionnaires Available</h3>
                <p style={{ color: '#6b7280' }}>Please contact an administrator to create questionnaires.</p>
              </div>
            ) : (
              questionnaires.map((q) => (
                <div
                  key={q._id}
                  onClick={() => handleQuestionnaireSelect(q._id)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s',
                    border: '1px solid #e5e7eb'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
                    e.currentTarget.style.borderColor = '#2563eb';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                    {q.title}
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                    {q.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#4b5563' }}>
                    <span>{q.questions.length} questions</span>
                    <span>•</span>
                    <span>{q.domains.length} domains</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show error if no questionnaire
  if (!questionnaire) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle style={{ height: '48px', width: '48px', color: '#ef4444', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', color: '#111827' }}>Questionnaire not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <button
            onClick={handleBack}
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
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              {questionnaire.title}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '16px', marginTop: '4px' }}>
              Student: {studentName}
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '32px' }}>
          <div style={{ marginBottom: '32px' }}>
            <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.5' }}>
              {questionnaire.description}
            </p>
          </div>

          {/* Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {questionnaire.questions && Array.isArray(questionnaire.questions) ? (
              questionnaire.questions
                .sort((a, b) => a.order - b.order)
                .map((question: Question) => {
                const questionId = question._id || `q-${question.order}`;
                const currentAnswer = answers[questionId];

                return (
                  <div key={questionId} style={{ padding: '24px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
                        {question.text}
                        {question.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                      </h3>
                      {question.helpText && (
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>
                          {question.helpText}
                        </p>
                      )}
                    </div>

                    {/* Text Input */}
                    {question.type === 'text' && (
                      <textarea
                        value={currentAnswer?.answer as string || ''}
                        onChange={(e) => handleAnswerChange(questionId, e.target.value, [], question.text, question.type)}
                        placeholder="Enter your answer..."
                        style={{
                          width: '100%',
                          minHeight: '100px',
                          padding: '12px',
                          border: `1px solid ${errors[questionId] ? '#ef4444' : '#d1d5db'}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          resize: 'vertical',
                          backgroundColor: 'white'
                        }}
                      />
                    )}

                    {/* Number Input */}
                    {question.type === 'number' && (
                      <input
                        type="number"
                        value={currentAnswer?.answer as number || ''}
                        onChange={(e) => handleAnswerChange(questionId, parseFloat(e.target.value) || 0, [], question.text, question.type)}
                        placeholder="Enter a number..."
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: `1px solid ${errors[questionId] ? '#ef4444' : '#d1d5db'}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: 'white'
                        }}
                      />
                    )}

                    {/* Single Choice */}
                    {question.type === 'single-choice' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {question.options.map((option) => {
                          const isSelected = currentAnswer?.answer === option.value;
                          
                          return (
                            <div key={option.id}>
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '12px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  backgroundColor: 'white',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <input
                                  type="radio"
                                  name={questionId}
                                  value={option.value}
                                  checked={isSelected}
                                  onChange={() => handleAnswerChange(questionId, option.value, [option], question.text, question.type)}
                                />
                                <span style={{ fontSize: '14px', color: '#374151' }}>
                                  {option.label}
                                </span>
                              </label>
                              
                              {/* Render sub-questions if this option is selected */}
                              {isSelected && option.subQuestions && option.subQuestions.length > 0 && (
                                renderSubQuestions(option.subQuestions, questionId, option.id)
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Multiple Choice */}
                    {question.type === 'multiple-choice' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {question.options.map((option) => {
                          const currentAnswerArray = Array.isArray(currentAnswer?.answer) ? currentAnswer.answer : [];
                          const isChecked = currentAnswerArray.includes(option.value);
                          
                          return (
                            <div key={option.id}>
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '12px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  backgroundColor: 'white',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const currentSelectedOptions = currentAnswer?.selectedOptions || [];
                                    let newAnswer: (string | number)[];
                                    let newSelectedOptions: QuestionOption[];
                                    
                                    if (isChecked) {
                                      // Remove option
                                      newAnswer = currentAnswerArray.filter(val => val !== option.value);
                                      newSelectedOptions = currentSelectedOptions.filter(opt => opt.id !== option.id);
                                    } else {
                                      // Add option
                                      newAnswer = [...currentAnswerArray, option.value];
                                      newSelectedOptions = [...currentSelectedOptions, option];
                                    }
                                    
                                    handleAnswerChange(questionId, newAnswer, newSelectedOptions, question.text, question.type);
                                  }}
                                />
                                <span style={{ fontSize: '14px', color: '#374151' }}>
                                  {option.label}
                                </span>
                              </label>
                              
                              {/* Render sub-questions if this option is selected */}
                              {isChecked && option.subQuestions && option.subQuestions.length > 0 && (
                                renderSubQuestions(option.subQuestions, questionId, option.id)
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Scale Input */}
                    {question.type === 'scale' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>1</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={currentAnswer?.answer as number || 1}
                          onChange={(e) => handleAnswerChange(questionId, parseInt(e.target.value), [], question.text, question.type)}
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>5</span>
                        <div style={{
                          minWidth: '32px',
                          textAlign: 'center',
                          padding: '4px 8px',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          {currentAnswer?.answer || 1}
                        </div>
                      </div>
                    )}

                    {errors[questionId] && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                        <AlertCircle style={{ height: '16px', width: '16px' }} />
                        <span style={{ fontSize: '14px' }}>{errors[questionId]}</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <AlertCircle style={{ height: '32px', width: '32px', color: '#ef4444', margin: '0 auto 16px' }} />
                <p style={{ color: '#6b7280' }}>No questions found in this questionnaire.</p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSubmit}
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
      </div>
    </div>
  );
};

export default FillForm;
