import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Card,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Fab,
  CircularProgress,
  Backdrop,
  TextField,
  Button,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Quiz as QuizIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Description as DescriptionIcon,
  AccountTree as StructureIcon,
  Analytics as AnalyticsIcon,
  Visibility as PreviewIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

import type { FormNode, CreateQuestionnaireRequest, GraphSettings } from './models/FormModels';
import { questionnaireApiService } from './Api-Requests/questionnaireApi';
import StructureBuilder from './StructureBuilder';
import FormPreview from './FormPreview';
import AnalyticsSettings from './AnalyticsSettings';
import ErrorBoundary from '../common/ErrorBoundary';

interface QuestionnaireBuilderProps {
  editingQuestionnaire?: string; // ID if editing existing questionnaire
  onSave?: (questionnaire: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface BuilderStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const QuestionnaireBuilder: React.FC<QuestionnaireBuilderProps> = ({
  editingQuestionnaire: editingQuestionnaireProp,
  onSave
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Use URL parameter if available, otherwise use prop
  const editingQuestionnaire = id || editingQuestionnaireProp;
  
  // Form State
  const [activeStep, setActiveStep] = useState(0);
  const { t } = useTranslation();
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0])); // Track which steps have been visited
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [structure, setStructure] = useState<FormNode[]>([]);
  const [graphSettings, setGraphSettings] = useState<GraphSettings>({ colorRanges: [] });
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Helper function to check if a node or its children contain questions
  const hasQuestions = useCallback((node: FormNode): boolean => {
    const checkNode = (n: FormNode): boolean => {
      if (n.type === 'question') return true;
      if (!n.children || n.children.length === 0) return false;
      return n.children.some(checkNode);
    };
    return checkNode(node);
  }, []);

  // Steps configuration - calculate dynamically
  const steps = useMemo((): BuilderStep[] => [
    {
      id: 0,
      title: t('questionnaireBuilder.basics', 'Basics'),
      description: t('questionnaireBuilder.basicsDesc', 'Set title and description'),
      completed: Boolean(title.trim())
    },
    {
      id: 1,
      title: t('questionnaireBuilder.structure', 'Structure'),
      description: t('questionnaireBuilder.structureDesc', 'Build groups and questions'),
      completed: structure.length > 0 && structure.some(node => 
        node.type === 'question' || hasQuestions(node)
      )
    },
    {
      id: 2,
      title: t('questionnaireBuilder.analytics', 'Analytics'),
      description: t('questionnaireBuilder.analyticsDesc', 'Configure graph settings'),
      completed: visitedSteps.has(2)
    },
    {
      id: 3,
      title: t('questionnaireBuilder.review', 'Review'),
      description: t('questionnaireBuilder.reviewDesc', 'Preview and save'),
      completed: visitedSteps.has(3)
    }
  ], [title, structure, hasQuestions, visitedSteps, t]);

  // Load existing questionnaire if editing
  useEffect(() => {
    const loadExistingQuestionnaire = async () => {
      if (!editingQuestionnaire) return;
      
      setIsLoading(true);
      try {
        const response = await questionnaireApiService.getQuestionnaire(editingQuestionnaire);
        if (response.success && response.data) {
          setTitle(response.data.title);
          setDescription(response.data.description || '');
          setStructure((response.data.structure ?? []) as FormNode[]);
          setGraphSettings(response.data.graphSettings || { colorRanges: [] });
        }
      } catch (error) {
        console.error('Error loading questionnaire:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingQuestionnaire();
  }, [editingQuestionnaire]);

  // Auto-clear validation errors when issues might be fixed
  useEffect(() => {
    if (validationErrors.length > 0) {
      // Check if any validation errors might be resolved
      const hasBasicIssues = validationErrors.some(error => 
        error.includes(t('questionnaireBuilder.titleRequired', 'Title is required')) || 
        error.includes(t('questionnaireBuilder.groupOrQuestionRequired', 'At least one group or question is required'))
      );
      
      // Clear basic validation errors if they're now resolved
      if (hasBasicIssues) {
        const stillValidErrors: string[] = [];
        
        // Re-check title
        if (!title.trim() && validationErrors.some(error => error.includes(t('questionnaireBuilder.titleRequired', 'Title is required')))) {
          stillValidErrors.push(t('questionnaireBuilder.titleRequired', 'Title is required'));
        }
        
        // Re-check structure
        if (structure.length === 0 && validationErrors.some(error => error.includes(t('questionnaireBuilder.groupOrQuestionRequired', 'At least one group or question is required')))) {
          stillValidErrors.push(t('questionnaireBuilder.groupOrQuestionRequired', 'At least one group or question is required'));
        }
        
        // If we have fewer errors now, update the validation errors
        if (stillValidErrors.length < validationErrors.length) {
          setValidationErrors(stillValidErrors);
        }
      }
    }
  }, [title, structure, validationErrors]);

  // Mark as dirty when changes are made
  const markDirty = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const handleNext = () => {
    const nextStep = activeStep + 1;
    setActiveStep(nextStep);
    setVisitedSteps(prev => new Set([...prev, nextStep]));
    // Clear validation errors when moving to next step
    setValidationErrors([]);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    // Clear validation errors when moving back
    setValidationErrors([]);
  };

  // Validate current step
  const validateCurrentStep = useCallback(async () => {
    const errors: string[] = [];
    
    switch (activeStep) {
      case 0: // Basics
        if (!title.trim()) {
          errors.push(t('questionnaireBuilder.titleRequired', 'Title is required'));
        }
        break;
      case 1: // Structure
        if (structure.length === 0) {
          errors.push(t('questionnaireBuilder.groupOrQuestionRequired', 'At least one group or question is required'));
        } else {
          // Validate structure with API
          try {
            const response = await questionnaireApiService.validateStructure(structure);
            if (!response.success && response.errors) {
              errors.push(...response.errors);
            }
          } catch {
            errors.push(t('questionnaireBuilder.failedValidateStructure', 'Failed to validate structure'));
          }
        }
        break;
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [activeStep, title, structure]);

  // Save questionnaire
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const isValid = await validateCurrentStep();
      if (!isValid) {
        setIsSaving(false);
        return;
      }

      const questionnaireData: CreateQuestionnaireRequest = {
        title,
        description,
        domains: [], // Add real domains if available
        questions: [], // Add real questions if available
        structure,
        graphSettings
      };

      let response;
      if (editingQuestionnaire) {
        response = await questionnaireApiService.updateQuestionnaire(
          editingQuestionnaire,
          questionnaireData
        );
      } else {
        response = await questionnaireApiService.createQuestionnaire(questionnaireData);
      }

      if (response.success) {
        setHasUnsavedChanges(false);
        setValidationErrors([]); // Clear any existing validation errors
        
        // Show success message
        if (editingQuestionnaire) {
          toast.success(t('questionnaireBuilder.updatedSuccessfully', 'Questionnaire updated successfully!'), {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } else {
          toast.success('Questionnaire created successfully!', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
        
        if (onSave) {
          onSave(response.data);
        } else {
          navigate('/layout/questionnaires');
        }
      } else {
        setValidationErrors(response.errors || ['Failed to save questionnaire']);
        toast.error('Failed to save questionnaire. Please check the errors and try again.', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      const errorMessage = 'An unexpected error occurred while saving';
      setValidationErrors([errorMessage]);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              {t('questionnaireBuilder.basics')}
            </Typography>
            <TextField
              label={t('questionnaireBuilder.titleRequiredAsterisk')}
              value={title}
              onChange={(e) => { 
                setTitle(e.target.value); 
                markDirty(); 
                // Clear validation errors when title changes
                if (validationErrors.length > 0) {
                  setValidationErrors([]);
                }
              }}
              fullWidth
              required
              sx={{ mb: 3 }}
            />
            <TextField
              label={t('questionnaireBuilder.description')}
              value={description}
              onChange={(e) => { 
                setDescription(e.target.value); 
                markDirty(); 
                // Clear validation errors when description changes
                if (validationErrors.length > 0) {
                  setValidationErrors([]);
                }
              }}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        );
      case 1:
        return (
          <ErrorBoundary>
            <StructureBuilder
              structure={structure}
              onChange={(newStructure) => {
                console.log('Structure changed:', newStructure);
                setStructure(newStructure);
                markDirty();
                // Clear validation errors when structure changes significantly
                if (validationErrors.length > 0) {
                  // Check if this might fix API validation errors by comparing structure complexity
                  const oldQuestionCount = structure.filter(node => node.type === 'question' || hasQuestions(node)).length;
                  const newQuestionCount = newStructure.filter(node => node.type === 'question' || hasQuestions(node)).length;
                  
                  // Check if any questions now have options that didn't before
                  const hasNewOptions = newStructure.some(node => {
                    if (node.type === 'question' && (node.inputType === 'single-choice' || node.inputType === 'multiple-choice')) {
                      const oldNode = structure.find(oldN => oldN.id === node.id);
                      return node.options && node.options.length > 0 && (!oldNode?.options || oldNode.options.length === 0);
                    }
                    return false;
                  });
                  
                  // Clear errors if structure improved significantly or options were added
                  if (newQuestionCount > oldQuestionCount || hasNewOptions) {
                    setValidationErrors([]);
                  }
                }
              }}
              onPreview={(structureToPreview) => {
                console.log('Preview requested:', structureToPreview);
                setStructure(structureToPreview);
                setShowPreview(true);
              }}
            />
          </ErrorBoundary>
        );
      case 2:
        return (
          <ErrorBoundary>
            <AnalyticsSettings
              graphSettings={graphSettings}
              onChange={(newSettings) => {
                console.log('Graph settings changed:', newSettings);
                setGraphSettings(newSettings);
                markDirty();
              }}
            />
          </ErrorBoundary>
        );
      case 3:
        return (
          <Box sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Preview and Validate
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<QuizIcon />}
                onClick={() => setShowPreview(true)}
                disabled={structure.length === 0}
                size="large"
              >
                Preview Complete Form
              </Button>
            </Box>
            {structure.length > 0 && (
              <Card sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Form Summary:
                </Typography>
                <Typography variant="body2">
                  • {getQuestionCount(structure)} total questions
                </Typography>
                <Typography variant="body2">
                  • {structure.length} root-level groups
                </Typography>
                <Typography variant="body2">
                  • Ready for deployment
                </Typography>
              </Card>
            )}
          </Box>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  // Helper function to count questions
  const getQuestionCount = (nodes: FormNode[] | undefined): number => {
    if (!Array.isArray(nodes)) return 0;
    return nodes.reduce((count, node) => {
      if (node.type === 'question') {
        return count + 1;
      }
      return count + getQuestionCount(node.children ?? []);
    }, 0);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3, pb: 10 }}>
      {/* Loading Backdrop */}
      <Backdrop open={isSaving} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Header */}
      <Paper elevation={2} sx={{ p: 4, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <QuizIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {editingQuestionnaire ? t('questionnaireBuilder.edit') : t('questionnaireBuilder.create')}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {t('questionnaireBuilder.headerDesc')}
            </Typography>
          </Box>
        </Box>

        {hasUnsavedChanges && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('questionnaireBuilder.unsavedChanges')}
          </Alert>
        )}
      </Paper>

      {/* Enhanced Progress Stepper */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mb: 3, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {t('questionnaireBuilder.formCreationProgress')}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {t('questionnaireBuilder.stepProgressFull', {
              current: activeStep + 1,
              total: steps.length,
              percent: Math.round(((activeStep) / (steps.length - 1)) * 100)
            })}
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={(activeStep / (steps.length - 1)) * 100} 
          sx={{ 
            mb: 3, 
            height: 8, 
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.2)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#4caf50',
              borderRadius: 4
            }
          }} 
        />
        
        <Stepper 
          activeStep={activeStep} 
          sx={{ 
            '& .MuiStepLabel-root': {
              cursor: 'default' // Remove pointer cursor
            },
            '& .MuiStepIcon-root': {
              color: 'rgba(255,255,255,0.3)',
              '&.Mui-active': {
                color: '#4caf50'
              },
              '&.Mui-completed': {
                color: '#4caf50'
              }
            },
            '& .MuiStepLabel-label': {
              color: 'rgba(255,255,255,0.8)',
              '&.Mui-active': {
                color: 'white',
                fontWeight: 'bold'
              },
              '&.Mui-completed': {
                color: 'white'
              }
            },
            '& .MuiStepConnector-line': {
              borderColor: 'rgba(255,255,255,0.3)'
            }
          }}
        >
          {steps.map((step, index) => (
            <Step key={step.id} completed={step.completed}>
              <StepLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {/* Step Icon */}
                  {index === 0 && <DescriptionIcon sx={{ fontSize: 20 }} />}
                  {index === 1 && <StructureIcon sx={{ fontSize: 20 }} />}
                  {index === 2 && <AnalyticsIcon sx={{ fontSize: 20 }} />}
                  {index === 3 && <PreviewIcon sx={{ fontSize: 20 }} />}
                  
                  <Box>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: activeStep === index ? 'bold' : 'normal',
                      fontSize: '0.9rem'
                    }}>
                      {step.title}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      opacity: 0.8,
                      display: 'block',
                      fontSize: '0.75rem'
                    }}>
                      {step.description}
                    </Typography>
                  </Box>
                  
                  {/* Completion Indicator */}
                  {step.completed && (
                    <Chip
                      icon={<CheckIcon sx={{ fontSize: 16 }} />}
                      label="Done"
                      size="small"
                      sx={{
                        backgroundColor: '#4caf50',
                        color: 'white',
                        height: 20,
                        fontSize: '0.7rem',
                        '& .MuiChip-icon': {
                          color: 'white'
                        }
                      }}
                    />
                  )}
                </Box>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Please fix the following issues:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Step Content */}
      <Card elevation={2} sx={{ borderRadius: 2, minHeight: 400 }}>
        {renderStepContent()}
      </Card>

      {/* Enhanced Step Navigation */}
      <Paper elevation={2} sx={{ p: 4, mt: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
            size="large"
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            ← Back
          </Button>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            textAlign: 'center' 
          }}>
            <Typography variant="body2" color="text.secondary">
              Step {activeStep + 1} of {steps.length}
            </Typography>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {steps[activeStep].title}
            </Typography>
          </Box>
          
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!steps[activeStep].completed}
              size="large"
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
                }
              }}
            >
              Next →
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleSave}
              disabled={isSaving || validationErrors.length > 0}
              startIcon={<SaveIcon />}
              size="large"
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                }
              }}
            >
              {isSaving ? 'Saving...' : editingQuestionnaire ? 'Update Questionnaire' : 'Save Questionnaire'}
            </Button>
          )}
        </Box>
        
        {/* Step completion hint */}
        {!steps[activeStep].completed && activeStep < steps.length - 1 && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon sx={{ fontSize: 16 }} />
              {t('questionnaireBuilder.completeStepHint')}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Enhanced Navigation & Save FAB */}
      <Box sx={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignItems: 'flex-end'
      }}>
        {/* Progress indicator */}
        <Paper 
          elevation={4} 
          sx={{ 
            p: 2, 
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {t('questionnaireBuilder.progressBoxTitle')}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={(activeStep / (steps.length - 1)) * 100} 
            sx={{ 
              width: 120, 
              height: 6, 
              borderRadius: 3,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#4caf50',
                borderRadius: 3
              }
            }} 
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {t('questionnaireBuilder.progressBoxComplete', { percent: Math.round(((activeStep) / (steps.length - 1)) * 100) })}
          </Typography>
        </Paper>
        
        {activeStep === steps.length - 1 && (
          <Fab
            color="success"
            variant="extended"
            onClick={handleSave}
            disabled={isSaving || validationErrors.length > 0}
            size="large"
            sx={{
              background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
              },
              boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
              borderRadius: 3,
              px: 3
            }}
          >
            <SaveIcon sx={{ mr: 1 }} />
            {isSaving ? 'Saving...' : editingQuestionnaire ? 'Update' : 'Finish & Save'}
          </Fab>
        )}
      </Box>

      {/* Form Preview Modal */}
      {showPreview && (
        <FormPreview 
          title={title}
          description={description}
          structure={structure} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </Box>
  );
};

export default QuestionnaireBuilder;