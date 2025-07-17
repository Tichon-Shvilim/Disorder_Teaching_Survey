import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  Stack,
  Tooltip,
  Badge,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Quiz as QuizIcon,
  QuestionAnswer as QuestionIcon,
  Category as CategoryIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { questionnaireApiService } from './Api-Requests/questionnaireApi';
import type { QuestionnaireModel } from './models/FormModels';

const QuestionnaireList: React.FC = () => {
  const navigate = useNavigate();
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<QuestionnaireModel | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const fetchQuestionnaires = useCallback(async () => {
    try {
      setLoading(true);
      const response = await questionnaireApiService.getQuestionnaires();
      if (response.success && response.data) {
        setQuestionnaires(response.data);
      } else {
        showSnackbar(response.error || 'Failed to fetch questionnaires', 'error');
      }
    } catch (error) {
      console.error('Error loading questionnaires:', error);
      showSnackbar('Error loading questionnaires', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestionnaires();
  }, [fetchQuestionnaires]);

  const handleDelete = async () => {
    if (!selectedQuestionnaire) return;

    try {
      const response = await questionnaireApiService.deleteQuestionnaire(selectedQuestionnaire._id);
      if (response.success) {
        setQuestionnaires(questionnaires.filter(q => q._id !== selectedQuestionnaire._id));
        showSnackbar('Questionnaire deleted successfully', 'success');
      } else {
        showSnackbar(response.error || 'Failed to delete questionnaire', 'error');
      }
    } catch (error) {
      console.error('Error deleting questionnaire:', error);
      showSnackbar('Error deleting questionnaire', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedQuestionnaire(null);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleEdit = (questionnaire: QuestionnaireModel) => {
    // Navigate to edit mode with questionnaire data
    navigate(`/layout/create-questionnaire`, { state: { questionnaire } });
  };

  const handleView = (questionnaire: QuestionnaireModel) => {
    // Navigate to view mode with questionnaire data
    navigate(`/layout/create-questionnaire`, { state: { questionnaire, viewOnly: true } });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalSubQuestions = (questionnaire: QuestionnaireModel) => {
    return questionnaire.questions.reduce((total: number, question: QuestionnaireModel['questions'][0]) => {
      const subQuestions = question.options.reduce((subTotal: number, option: QuestionnaireModel['questions'][0]['options'][0]) => {
        return subTotal + (option.subQuestions?.length || 0);
      }, 0);
      return total + subQuestions;
    }, 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <QuizIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4" color="primary" fontWeight="bold">
                Assessment Forms
              </Typography>
            </Box>
            <Typography variant="subtitle1" color="text.secondary">
              Manage your questionnaire templates and assessment forms
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/layout/create-questionnaire')}
            size="large"
            sx={{ borderRadius: 2, px: 3, py: 1.5 }}
          >
            Create New Questionnaire
          </Button>
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 250 }}>
          <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QuizIcon />
                <Typography variant="h6">Total Forms</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {questionnaires.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1, minWidth: 250 }}>
          <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QuestionIcon />
                <Typography variant="h6">Total Questions</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {questionnaires.reduce((total, q) => total + q.questions.length, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1, minWidth: 250 }}>
          <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon />
                <Typography variant="h6">Active Forms</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {questionnaires.filter(q => q.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1, minWidth: 250 }}>
          <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon />
                <Typography variant="h6">Sub-Questions</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {questionnaires.reduce((total, q) => total + getTotalSubQuestions(q), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Questionnaires Grid */}
      {questionnaires.length === 0 ? (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 8, 
            textAlign: 'center', 
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'divider',
            bgcolor: 'grey.50'
          }}
        >
          <QuizIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No questionnaires found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Create your first questionnaire to get started with assessments
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/layout/create-questionnaire')}
            size="large"
          >
            Create Your First Questionnaire
          </Button>
        </Paper>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: 3
        }}>
          {questionnaires.map((questionnaire) => (
            <Card 
              key={questionnaire._id}
              sx={{ 
                borderRadius: 2, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                }
              }}
            >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 1 }}>
                        {questionnaire.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Chip
                          label={questionnaire.isActive ? 'Active' : 'Inactive'}
                          color={questionnaire.isActive ? 'success' : 'default'}
                          size="small"
                        />
                        <Chip
                          label={`v${questionnaire.version}`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    </Box>
                    <IconButton size="small" color="primary">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  {questionnaire.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {questionnaire.description.length > 100 
                        ? `${questionnaire.description.substring(0, 100)}...` 
                        : questionnaire.description}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Statistics */}
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <QuestionIcon color="primary" fontSize="small" />
                        <Typography variant="body2">Questions</Typography>
                      </Box>
                      <Badge badgeContent={getTotalSubQuestions(questionnaire)} color="secondary">
                        <Typography variant="body2" fontWeight="bold">
                          {questionnaire.questions.length}
                        </Typography>
                      </Badge>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CategoryIcon color="primary" fontSize="small" />
                        <Typography variant="body2">Domains</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {questionnaire.domains.length}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon color="primary" fontSize="small" />
                        <Typography variant="body2">Created</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {formatDate(questionnaire.createdAt)}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Domain Chips */}
                  {questionnaire.domains.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Domains:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {questionnaire.domains.slice(0, 3).map((domain: QuestionnaireModel['domains'][0]) => (
                          <Chip
                            key={domain._id}
                            label={domain.name}
                            size="small"
                            sx={{ 
                              bgcolor: domain.color || 'primary.main', 
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                        ))}
                        {questionnaire.domains.length > 3 && (
                          <Chip
                            label={`+${questionnaire.domains.length - 3} more`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                    <Tooltip title="View Details">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleView(questionnaire)}
                        sx={{ flex: 1 }}
                      >
                        View
                      </Button>
                    </Tooltip>
                    <Tooltip title="Edit Questionnaire">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(questionnaire)}
                        sx={{ flex: 1 }}
                      >
                        Edit
                      </Button>
                    </Tooltip>
                    <Tooltip title="Delete Questionnaire">
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          setSelectedQuestionnaire(questionnaire);
                          setDeleteDialogOpen(true);
                        }}
                        sx={{ flex: 1 }}
                      >
                        Delete
                      </Button>
                    </Tooltip>
                  </Stack>
                </CardActions>
              </Card>
            ))}
          </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Questionnaire</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedQuestionnaire?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuestionnaireList;
