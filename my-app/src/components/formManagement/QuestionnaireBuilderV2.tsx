import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Button
} from '@mui/material';
import {
  Quiz as QuizIcon,
  Save as SaveIcon
} from '@mui/icons-material';

import type { FormNodeV2, CreateQuestionnaireV2Request, GraphSettings } from './models/FormModelsV2';
import { questionnaireApiServiceV2 } from './Api-Requests/questionnaireApiV2';
import StructureBuilder from './StructureBuilderV2';
import FormPreview from './FormPreview';
import AnalyticsSettings from './AnalyticsSettings';
import ErrorBoundary from '../common/ErrorBoundary';

interface QuestionnaireBuilderV2Props {
  editingQuestionnaire?: string; // ID if editing existing questionnaire
  onSave?: (questionnaire: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface BuilderStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const QuestionnaireBuilderV2: React.FC<QuestionnaireBuilderV2Props> = ({
  editingQuestionnaire,
  onSave
}) => {
  const navigate = useNavigate();
  
  // Form State
  const [activeStep, setActiveStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [structure, setStructure] = useState<FormNodeV2[]>([]);
  const [graphSettings, setGraphSettings] = useState<GraphSettings>({ colorRanges: [] });
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Helper function to check if a node or its children contain questions
  const hasQuestions = useCallback((node: FormNodeV2): boolean => {
    const checkNode = (n: FormNodeV2): boolean => {
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
      title: 'Basics',
      description: 'Set title and description',
      completed: Boolean(title.trim())
    },
    {
      id: 1,
      title: 'Structure',
      description: 'Build groups and questions',
      completed: structure.length > 0 && structure.some(node => 
        node.type === 'question' || hasQuestions(node)
      )
    },
    {
      id: 2,
      title: 'Analytics',
      description: 'Configure graph settings',
      completed: true // Optional step
    },
    {
      id: 3,
      title: 'Review',
      description: 'Preview and save',
      completed: false
    }
  ], [title, structure, hasQuestions]);

  // Load existing questionnaire if editing
  useEffect(() => {
    const loadExistingQuestionnaire = async () => {
      if (!editingQuestionnaire) return;
      
      setIsLoading(true);
      try {
        const response = await questionnaireApiServiceV2.getQuestionnaire(editingQuestionnaire);
        if (response.success && response.data) {
          setTitle(response.data.title);
          setDescription(response.data.description || '');
          setStructure(response.data.structure);
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

  // Mark as dirty when changes are made
  const markDirty = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Validate current step
  const validateCurrentStep = useCallback(async () => {
    const errors: string[] = [];
    
    switch (activeStep) {
      case 0: // Basics
        if (!title.trim()) {
          errors.push('Title is required');
        }
        break;
      case 1: // Structure
        if (structure.length === 0) {
          errors.push('At least one group or question is required');
        } else {
          // Validate structure with API
          try {
            const response = await questionnaireApiServiceV2.validateStructure(structure);
            if (!response.success && response.errors) {
              errors.push(...response.errors);
            }
          } catch {
            errors.push('Failed to validate structure');
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

      const questionnaireData: CreateQuestionnaireV2Request = {
        title,
        description,
        structure,
        graphSettings
      };

      let response;
      if (editingQuestionnaire) {
        response = await questionnaireApiServiceV2.updateQuestionnaire(
          editingQuestionnaire,
          questionnaireData
        );
      } else {
        response = await questionnaireApiServiceV2.createQuestionnaire(questionnaireData);
      }

      if (response.success) {
        setHasUnsavedChanges(false);
        if (onSave) {
          onSave(response.data);
        } else {
          navigate('/layout/questionnaires-v2');
        }
      } else {
        setValidationErrors(response.errors || ['Failed to save questionnaire']);
      }
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      setValidationErrors(['An unexpected error occurred while saving']);
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
              Questionnaire Basics
            </Typography>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); markDirty(); }}
              fullWidth
              required
              sx={{ mb: 3 }}
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => { setDescription(e.target.value); markDirty(); }}
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
  const getQuestionCount = (nodes: FormNodeV2[]): number => {
    return nodes.reduce((count, node) => {
      if (node.type === 'question') {
        return count + 1;
      }
      return count + getQuestionCount(node.children);
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
              {editingQuestionnaire ? 'Edit Questionnaire' : 'Create Questionnaire'}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Build intelligent forms with hierarchical structure and analytics
            </Typography>
          </Box>
        </Box>

        {hasUnsavedChanges && (
          <Alert severity="info" sx={{ mt: 2 }}>
            You have unsaved changes. Remember to save your work!
          </Alert>
        )}
      </Paper>

      {/* Progress Stepper */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 2 }}>
          {steps.map((step, index) => (
            <Step 
              key={step.id} 
              completed={step.completed}
              sx={{ cursor: 'pointer' }}
              onClick={() => handleStepClick(index)}
            >
              <StepLabel>
                <Typography variant="subtitle2">{step.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {step.description}
                </Typography>
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

      {/* Step Navigation */}
      <Paper elevation={1} sx={{ p: 3, mt: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!steps[activeStep].completed}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleSave}
              disabled={isSaving || validationErrors.length > 0}
              startIcon={<SaveIcon />}
            >
              {isSaving ? 'Saving...' : editingQuestionnaire ? 'Update' : 'Save'}
            </Button>
          )}
        </Box>
      </Paper>

      {/* Navigation & Save FAB */}
      <Box sx={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        zIndex: 1000,
        display: 'flex',
        gap: 1
      }}>
        {activeStep === steps.length - 1 && (
          <Fab
            color="success"
            variant="extended"
            onClick={handleSave}
            disabled={isSaving || validationErrors.length > 0}
            size="large"
          >
            <SaveIcon sx={{ mr: 1 }} />
            {isSaving ? 'Saving...' : editingQuestionnaire ? 'Update' : 'Save'}
          </Fab>
        )}
      </Box>

      {/* Form Preview Modal */}
      {showPreview && (
        <FormPreview 
          structure={structure} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </Box>
  );
};

export default QuestionnaireBuilderV2;
