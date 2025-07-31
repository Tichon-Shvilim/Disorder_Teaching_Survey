import React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  DonutSmall as PieChartIcon,
  Speed as GaugeIcon,
  Radar as RadarIcon,
  CallSplit as ConditionalIcon,
} from '@mui/icons-material';
import type { FormNodeV2, OptionV2 } from './models/FormModelsV2';

interface NodeFormData {
  title: string;
  description: string;
  type: 'group' | 'question';
  inputType?: 'single-choice' | 'multiple-choice' | 'scale' | 'number' | 'text';
  options?: OptionV2[];
  weight: number;
  graphable: boolean;
  preferredChartType: 'bar' | 'line' | 'radar' | 'gauge' | 'pie';
}

interface ConditionalContext {
  parentQuestion: FormNodeV2;
  triggerOption: OptionV2;
}

interface AddNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (formData: NodeFormData) => void;
  editingNode?: FormNodeV2 | null;
  formData: NodeFormData;
  setFormData: (data: NodeFormData) => void;
  conditionalContext?: ConditionalContext;
  addingToParentId?: string | null;
}

const AddNodeDialog: React.FC<AddNodeDialogProps> = ({
  open,
  onClose,
  onSave,
  editingNode,
  formData,
  setFormData,
  conditionalContext,
  addingToParentId
}) => {
  const inputTypes: { value: 'single-choice' | 'multiple-choice' | 'scale' | 'number' | 'text'; label: string; description: string; example: string; icon: string }[] = [
    { 
      value: 'single-choice', 
      label: 'Single Choice', 
      description: 'User picks ONE option from a list', 
      example: '○ Option A  ○ Option B  ○ Option C',
      icon: '◉'
    },
    { 
      value: 'multiple-choice', 
      label: 'Multiple Choice', 
      description: 'User can select MULTIPLE options from a list', 
      example: '☑ Option A  ☑ Option B  ☐ Option C',
      icon: '☑'
    },
    { 
      value: 'text', 
      label: 'Text Input', 
      description: 'User types a short text response', 
      example: '[Text box for user to type their answer...]',
      icon: '📝'
    },
    { 
      value: 'number', 
      label: 'Number Input', 
      description: 'User enters a numeric value', 
      example: '[___] (numbers only)',
      icon: '🔢'
    },
    { 
      value: 'scale', 
      label: 'Rating Scale', 
      description: 'User rates on a scale from 1-10', 
      example: '1 ——————————— 10 (slider or buttons)',
      icon: '📊'
    },
  ];

  const chartTypes: { value: 'bar' | 'line' | 'radar' | 'gauge' | 'pie'; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'bar', label: 'Bar Chart', icon: <BarChartIcon />, description: 'Compare values across categories' },
    { value: 'line', label: 'Line Chart', icon: <LineChartIcon />, description: 'Show trends over time' },
    { value: 'pie', label: 'Pie Chart', icon: <PieChartIcon />, description: 'Show proportions of a whole' },
    { value: 'gauge', label: 'Gauge', icon: <GaugeIcon />, description: 'Display single value with target range' },
    { value: 'radar', label: 'Radar Chart', icon: <RadarIcon />, description: 'Multi-dimensional comparison' },
  ];

  const getDialogTitle = () => {
    if (editingNode) return 'Edit Item';
    if (conditionalContext) return 'Add Conditional Question';
    if (addingToParentId) return 'Add Child Item';
    return 'Create New Item';
  };

  const getDialogIcon = () => {
    if (conditionalContext) return <ConditionalIcon sx={{ mr: 1 }} />;
    return null;
  };

  const isFormValid = () => {
    return formData.title.trim() && 
           (formData.type === 'group' || formData.inputType);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        {getDialogIcon()}
        {getDialogTitle()}
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Conditional Context Display */}
          {conditionalContext && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                📋 Parent Question: {conditionalContext.parentQuestion.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                This conditional question will only appear when a specific option is selected.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Typography variant="body2" fontWeight="bold">Trigger Option:</Typography>
                <Chip
                  label={conditionalContext.triggerOption.label}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary">
                  (Value: {conditionalContext.triggerOption.value})
                </Typography>
              </Box>
            </Paper>
          )}

          <TextField
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
            required
            placeholder="Enter a clear, descriptive title..."
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            multiline
            rows={2}
            placeholder="Optional: Provide additional context..."
          />

          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value as 'group' | 'question';
                setFormData({ 
                  ...formData, 
                  type: newType,
                  // Reset graphable to false for questions, true for groups
                  graphable: newType === 'group'
                });
              }}
              label="Type"
            >
              <MenuItem value="group">📁 Group (Container)</MenuItem>
              <MenuItem value="question">❓ Question</MenuItem>
            </Select>
          </FormControl>

          {formData.type === 'question' && (
            <Box>
              <FormControl fullWidth>
                <InputLabel>Input Type *</InputLabel>
                <Select
                  value={formData.inputType || ''}
                  onChange={(e) => setFormData({ ...formData, inputType: e.target.value as any })} // eslint-disable-line @typescript-eslint/no-explicit-any
                  label="Input Type *"
                  required
                >
                  {inputTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                            {type.icon} {type.label}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {type.description}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          fontFamily: 'monospace', 
                          bgcolor: 'grey.100', 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          display: 'block'
                        }}>
                          Preview: {type.example}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {!formData.inputType && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'warning.50', borderColor: 'warning.200', mt: 1 }}>
                  <Typography variant="body2" color="warning.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    ⚠️ <strong>Input Type Required:</strong> Please select how users will answer this question. 
                    This determines what interface they'll see when filling out the form.
                  </Typography>
                </Paper>
              )}

              {formData.inputType && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50', borderColor: 'info.200', mt: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    👁️ How users will see this {conditionalContext ? 'conditional ' : ''}question:
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'white', 
                    border: '1px solid #ddd', 
                    borderRadius: 1, 
                    p: 2,
                    fontFamily: 'system-ui'
                  }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                      {formData.title || `Your ${conditionalContext ? 'Conditional ' : ''}Question Title`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mb: conditionalContext ? 1 : 2 }}>
                      {inputTypes.find(t => t.value === formData.inputType)?.example}
                    </Typography>
                    {conditionalContext && (
                      <Typography variant="caption" color="secondary" sx={{ fontWeight: 'bold', bgcolor: 'secondary.50', px: 1, py: 0.5, borderRadius: 1 }}>
                        🎯 Only appears when "{conditionalContext.triggerOption.label}" is selected
                      </Typography>
                    )}
                    {(formData.inputType === 'single-choice' || formData.inputType === 'multiple-choice') && !conditionalContext && (
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                        💡 After creating this question, expand it to add answer options
                      </Typography>
                    )}
                  </Box>
                </Paper>
              )}
            </Box>
          )}

          {/* Weight Configuration */}
          <TextField
            label="Weight"
            type="number"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 1 })}
            fullWidth
            inputProps={{ min: 1, max: 10 }}
            helperText="Importance of this item in scoring (1-10)"
            size="small"
          />

          {/* Analytics Configuration - Only for Groups */}
          {formData.type === 'group' && (
            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'primary.50', borderColor: 'primary.200' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📊 Analytics Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure how this group's data will be visualized in reports and analytics.
              </Typography>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Enable Analytics
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Show this group in charts and reports
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={formData.graphable}
                      onChange={(e) => setFormData({ ...formData, graphable: e.target.checked })}
                      style={{ marginRight: 8, transform: 'scale(1.2)' }}
                    />
                    <Chip 
                      label={formData.graphable ? "Graphable" : "Not Graphable"}
                      size="small"
                      color={formData.graphable ? "success" : "default"}
                    />
                  </Box>
                </Box>

                {formData.graphable && (
                  <FormControl fullWidth>
                    <InputLabel>Preferred Chart Type</InputLabel>
                    <Select
                      value={formData.preferredChartType}
                      onChange={(e) => setFormData({ ...formData, preferredChartType: e.target.value as any })} // eslint-disable-line @typescript-eslint/no-explicit-any
                      label="Preferred Chart Type"
                    >
                      {chartTypes.map(chart => (
                        <MenuItem key={chart.value} value={chart.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {chart.icon}
                            <Box>
                              <Typography variant="body1">{chart.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {chart.description}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Stack>
            </Paper>
          )}

          {/* Conditional Context Summary */}
          {conditionalContext && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50', borderColor: 'success.200' }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🎯 <strong>Condition:</strong> This {formData.type} will appear only when "{conditionalContext.triggerOption.label}" is selected
                in "{conditionalContext.parentQuestion.title}".
              </Typography>
            </Paper>
          )}

          {/* Question Type Notice for Analytics */}
          {formData.type === 'question' && !conditionalContext && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderStyle: 'dashed' }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ℹ️ <strong>Note:</strong> Individual questions don't have analytics settings. 
                Analytics are generated for parent groups that aggregate question scores.
              </Typography>
            </Paper>
          )}

          {formData.type === 'question' && !conditionalContext && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50', borderStyle: 'dashed' }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                💡 <strong>Tip:</strong> After creating this question, expand it in the tree to add answer options.
                You can then add conditional questions to specific options.
              </Typography>
            </Paper>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onSave(formData)}
          disabled={!isFormValid()}
          startIcon={conditionalContext ? <ConditionalIcon /> : undefined}
        >
          {editingNode ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddNodeDialog;
