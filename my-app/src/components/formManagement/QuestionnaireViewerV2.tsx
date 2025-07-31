import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Card,
  Paper,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Quiz as QuizIcon,
  Visibility as PreviewIcon,
  AccountTree as StructureIcon,
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  RadioButtonChecked as RadioIcon,
  CheckBox as CheckboxIcon,
  TextFields as TextIcon,
  Numbers as NumberIcon,
  LinearScale as ScaleIcon,
  Schedule as DateIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

import type { QuestionnaireTemplateV2WithMetadata, FormNodeV2 } from './models/FormModelsV2';
import { questionnaireApiServiceV2 } from './Api-Requests/questionnaireApiV2';
import FormPreview from './FormPreview';

const QuestionnaireViewerV2: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireTemplateV2WithMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Load questionnaire data
  const loadQuestionnaire = useCallback(async () => {
    if (!id) {
      setError('No questionnaire ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await questionnaireApiServiceV2.getQuestionnaire(id);
      
      if (response.success && response.data) {
        setQuestionnaire(response.data);
        setError(null);
      } else {
        setError(response.message || 'Failed to load questionnaire');
        toast.error('Failed to load questionnaire', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Error loading questionnaire:', error);
      setError('An error occurred while loading the questionnaire');
      toast.error('Error loading questionnaire', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadQuestionnaire();
  }, [loadQuestionnaire]);

  const handleEdit = () => {
    if (questionnaire) {
      navigate(`/layout/create-questionnaire-v2/${questionnaire._id}`);
    }
  };

  const handleBack = () => {
    navigate('/layout/questionnaires-v2');
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInputTypeIcon = (inputType?: string) => {
    switch (inputType) {
      case 'single-choice': return <RadioIcon color="primary" fontSize="small" />;
      case 'multiple-choice': return <CheckboxIcon color="primary" fontSize="small" />;
      case 'text': return <TextIcon color="primary" fontSize="small" />;
      case 'number': return <NumberIcon color="primary" fontSize="small" />;
      case 'scale': return <ScaleIcon color="primary" fontSize="small" />;
      default: return <QuizIcon color="primary" fontSize="small" />;
    }
  };

  const getQuestionCount = (nodes: FormNodeV2[]): number => {
    return nodes.reduce((count, node) => {
      if (node.type === 'question') {
        return count + 1;
      }
      return count + getQuestionCount(node.children);
    }, 0);
  };

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const renderStructureNode = (node: FormNodeV2, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);

    return (
      <Card 
        key={node.id} 
        elevation={level === 0 ? 2 : 1}
        sx={{ 
          mb: 2, 
          ml: level * 2,
          borderRadius: 2,
          border: node.type === 'group' ? '2px solid #e3f2fd' : '1px solid #f0f0f0'
        }}
      >
        <Accordion 
          expanded={isExpanded}
          onChange={() => toggleNodeExpansion(node.id)}
          sx={{ boxShadow: 'none' }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: node.type === 'group' 
                ? (node.graphable ? 'linear-gradient(135deg, #e3f2fd 0%, #e8f5e8 100%)' : '#f3e5f5')
                : '#f8f9fa',
              borderRadius: isExpanded ? '8px 8px 0 0' : '8px',
              minHeight: 64,
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
                gap: 2
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              {getInputTypeIcon(node.inputType)}
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {node.title}
                </Typography>
                
                {node.description && (
                  <Typography variant="body2" color="text.secondary">
                    {node.description}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={node.type === 'group' ? 'Group' : 'Question'}
                    size="small"
                    color={node.type === 'group' ? 'secondary' : 'primary'}
                    variant="outlined"
                  />
                  
                  {node.inputType && (
                    <Chip
                      label={node.inputType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      size="small"
                      variant="filled"
                      color="info"
                    />
                  )}
                  
                  {node.type === 'group' && node.graphable && (
                    <Chip
                      label="Analytics Enabled"
                      size="small"
                      color="primary"
                      variant="filled"
                    />
                  )}
                  
                  {node.options && node.options.length > 0 && (
                    <Chip
                      label={`${node.options.length} options`}
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  )}
                  
                  {node.condition && (
                    <Chip
                      label="Conditional"
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails sx={{ backgroundColor: '#fafafa' }}>
            {/* Show options for choice questions */}
            {node.options && node.options.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Answer Options:
                </Typography>
                <Stack spacing={1}>
                  {node.options.map((option, index) => (
                    <Paper key={option.id} variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2">
                        <strong>{index + 1}.</strong> {option.label} 
                        <Chip label={`Value: ${option.value}`} size="small" sx={{ ml: 1 }} />
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
            
            {/* Render children */}
            {node.children && node.children.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Contains {node.children.length} item(s):
                </Typography>
                {node.children.map(child => renderStructureNode(child, level + 1))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !questionnaire) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Questionnaire not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={handleBack}
        >
          Back to Questionnaires
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 4, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <BackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" color="primary" fontWeight="bold" gutterBottom>
                {questionnaire.title}
              </Typography>
              {questionnaire.description && (
                <Typography variant="subtitle1" color="text.secondary">
                  {questionnaire.description}
                </Typography>
              )}
            </Box>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => setShowPreview(true)}
              size="large"
            >
              Preview Form
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              size="large"
              sx={{ borderRadius: 2 }}
            >
              Edit Questionnaire
            </Button>
          </Stack>
        </Box>

        {/* Metadata */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DateIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Created: {formatDate(questionnaire.createdAt)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Created by: {
                typeof questionnaire.createdBy === 'object' && questionnaire.createdBy?.name
                  ? questionnaire.createdBy.name 
                  : typeof questionnaire.createdBy === 'string' 
                    ? questionnaire.createdBy 
                    : 'Unknown'
              }
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuizIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Questions: {questionnaire.metadata?.totalQuestions || getQuestionCount(questionnaire.structure)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnalyticsIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Graphable: {questionnaire.metadata?.graphableQuestions || 0}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Statistics Overview */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          📊 Structure Overview
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
          <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {questionnaire.structure.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Root Groups
            </Typography>
          </Card>
          
          <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {getQuestionCount(questionnaire.structure)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Questions
            </Typography>
          </Card>
          
          <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {questionnaire.metadata?.totalNodes || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Nodes
            </Typography>
          </Card>
          
          <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {questionnaire.metadata?.graphableQuestions || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Analytics Ready
            </Typography>
          </Card>
        </Box>
      </Paper>

      {/* Structure Display */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StructureIcon color="primary" />
            Questionnaire Structure
          </Typography>
          
          <Button
            variant="text"
            onClick={() => {
              const allNodeIds = new Set<string>();
              const collectIds = (nodes: FormNodeV2[]) => {
                nodes.forEach(node => {
                  allNodeIds.add(node.id);
                  collectIds(node.children);
                });
              };
              collectIds(questionnaire.structure);
              
              if (expandedNodes.size === allNodeIds.size) {
                setExpandedNodes(new Set());
              } else {
                setExpandedNodes(allNodeIds);
              }
            }}
          >
            {expandedNodes.size === 0 ? 'Expand All' : 'Collapse All'}
          </Button>
        </Box>
        
        {questionnaire.structure.length === 0 ? (
          <Alert severity="info">
            This questionnaire has no structure defined.
          </Alert>
        ) : (
          <Box>
            {questionnaire.structure.map(node => renderStructureNode(node))}
          </Box>
        )}
      </Paper>

      {/* Form Preview Modal */}
      {showPreview && (
        <FormPreview
          title={questionnaire.title}
          description={questionnaire.description}
          structure={questionnaire.structure}
          onClose={() => setShowPreview(false)}
        />
      )}
    </Box>
  );
};

export default QuestionnaireViewerV2;
