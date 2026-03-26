import { useTranslation } from 'react-i18next';
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
import type { FormNode, Option } from './models/FormModels';

interface NodeFormData {
  title: string;
  description: string;
  type: 'group' | 'question';
  inputType?: 'single-choice' | 'multiple-choice' | 'scale' | 'number' | 'text';
  options?: Option[];
  weight: number;
  graphable: boolean;
  preferredChartType: 'bar' | 'line' | 'radar' | 'gauge' | 'pie';
}

interface ConditionalContext {
  parentQuestion: FormNode;
  triggerOption: Option;
}

interface AddNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (formData: NodeFormData) => void;
  editingNode?: FormNode | null;
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
  const { t } = useTranslation();
  const inputTypes: { value: 'single-choice' | 'multiple-choice' | 'scale' | 'number' | 'text'; label: string; description: string; example: string; icon: string }[] = [
    { 
      value: 'single-choice', 
      label: t('addNodeDialog.inputType.singleChoice.label'), 
      description: t('addNodeDialog.inputType.singleChoice.description'), 
      example: t('addNodeDialog.inputType.singleChoice.example'),
      icon: '◉'
    },
    { 
      value: 'multiple-choice', 
      label: t('addNodeDialog.inputType.multipleChoice.label'), 
      description: t('addNodeDialog.inputType.multipleChoice.description'), 
      example: t('addNodeDialog.inputType.multipleChoice.example'),
      icon: '☑'
    },
    { 
      value: 'text', 
      label: t('addNodeDialog.inputType.text.label'), 
      description: t('addNodeDialog.inputType.text.description'), 
      example: t('addNodeDialog.inputType.text.example'),
      icon: '📝'
    },
    { 
      value: 'number', 
      label: t('addNodeDialog.inputType.number.label'), 
      description: t('addNodeDialog.inputType.number.description'), 
      example: t('addNodeDialog.inputType.number.example'),
      icon: '🔢'
    },
    { 
      value: 'scale', 
      label: t('addNodeDialog.inputType.scale.label'), 
      description: t('addNodeDialog.inputType.scale.description'), 
      example: t('addNodeDialog.inputType.scale.example'),
      icon: '📊'
    },
  ];

  const chartTypes: { value: 'bar' | 'line' | 'radar' | 'gauge' | 'pie'; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'bar', label: t('addNodeDialog.chartType.bar.label'), icon: <BarChartIcon />, description: t('addNodeDialog.chartType.bar.description') },
    { value: 'line', label: t('addNodeDialog.chartType.line.label'), icon: <LineChartIcon />, description: t('addNodeDialog.chartType.line.description') },
    { value: 'pie', label: t('addNodeDialog.chartType.pie.label'), icon: <PieChartIcon />, description: t('addNodeDialog.chartType.pie.description') },
    { value: 'gauge', label: t('addNodeDialog.chartType.gauge.label'), icon: <GaugeIcon />, description: t('addNodeDialog.chartType.gauge.description') },
    { value: 'radar', label: t('addNodeDialog.chartType.radar.label'), icon: <RadarIcon />, description: t('addNodeDialog.chartType.radar.description') },
  ];

  const getDialogTitle = () => {
    if (editingNode) return t('addNodeDialog.editItem');
    if (conditionalContext) return t('addNodeDialog.addConditional');
    if (addingToParentId) return t('addNodeDialog.addChild');
    return t('addNodeDialog.createNew');
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
            label={t('addNodeDialog.title')}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
            required
            placeholder={t('addNodeDialog.titlePlaceholder')}
          />

          <TextField
            label={t('addNodeDialog.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            multiline
            rows={2}
            placeholder={t('addNodeDialog.descriptionPlaceholder')}
          />

          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
                        <InputLabel>{t('addNodeDialog.type')}</InputLabel>
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
              label={t('addNodeDialog.type')}
            >
              <MenuItem value="group">📁 {t('addNodeDialog.group')}</MenuItem>
              <MenuItem value="question">❓ {t('addNodeDialog.question')}</MenuItem>
            </Select>
          </FormControl>

          {formData.type === 'question' && (
            <Box>
              <FormControl fullWidth>
                <InputLabel>Input Type *</InputLabel>
                                <InputLabel>{t('addNodeDialog.inputTypeLabel')}</InputLabel>
                <Select
                  value={formData.inputType || ''}
                  onChange={(e) => setFormData({ ...formData, inputType: e.target.value as any })} // eslint-disable-line @typescript-eslint/no-explicit-any
                  label={t('addNodeDialog.inputTypeLabel')}
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
                    ⚠️ <strong>{t('addNodeDialog.inputTypeRequiredTitle')}</strong> {t('addNodeDialog.inputTypeRequiredDesc')}
                  </Typography>
                </Paper>
              )}

              {formData.inputType && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50', borderColor: 'info.200', mt: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    👁️ {t('addNodeDialog.previewHowUserSees', { conditional: conditionalContext ? t('addNodeDialog.conditional') : '' })}
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'white', 
                    border: '1px solid #ddd', 
                    borderRadius: 1, 
                    p: 2,
                    fontFamily: 'system-ui'
                  }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                      {formData.title || t('addNodeDialog.previewDefaultTitle', { conditional: conditionalContext ? t('addNodeDialog.conditional') : '' })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mb: conditionalContext ? 1 : 2 }}>
                      {inputTypes.find(t => t.value === formData.inputType)?.example}
                    </Typography>
                    {conditionalContext && (
                      <Typography variant="caption" color="secondary" sx={{ fontWeight: 'bold', bgcolor: 'secondary.50', px: 1, py: 0.5, borderRadius: 1 }}>
                        🎯 {t('addNodeDialog.onlyAppearsWhen', { option: conditionalContext.triggerOption.label })}
                      </Typography>
                    )}
                    {(formData.inputType === 'single-choice' || formData.inputType === 'multiple-choice') && !conditionalContext && (
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                        💡 {t('addNodeDialog.expandToAddOptions')}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              )}
            </Box>
          )}

          {/* Weight Configuration */}
          <TextField
            label={t('addNodeDialog.weight')}
            type="number"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 1 })}
            fullWidth
            inputProps={{ min: 1, max: 10 }}
            helperText={t('addNodeDialog.weightHelper')}
            size="small"
          />

          {/* Analytics Configuration - Only for Groups */}
          {formData.type === 'group' && (
            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'primary.50', borderColor: 'primary.200' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📊 {t('addNodeDialog.analyticsConfig')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('addNodeDialog.analyticsConfigDesc')}
              </Typography>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {t('addNodeDialog.enableAnalytics', 'Enable Analytics')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('addNodeDialog.graphableDesc', 'Show this group in charts and reports')}
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
                      label={formData.graphable ? t('addNodeDialog.graphable', 'Graphable') : t('addNodeDialog.notGraphable', 'Not Graphable')}
                      size="small"
                      color={formData.graphable ? "success" : "default"}
                    />
                  </Box>
                </Box>

                {formData.graphable && (
                  <FormControl fullWidth>
                    <InputLabel>{t('addNodeDialog.preferredChartType')}</InputLabel>
                    <Select
                      value={formData.preferredChartType}
                      onChange={(e) => setFormData({ ...formData, preferredChartType: e.target.value as any })}
                      label={t('addNodeDialog.preferredChartType')}
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
                🎯 <strong>{t('addNodeDialog.condition')}:</strong> {t('addNodeDialog.conditionDesc', { type: t('addNodeDialog.' + formData.type), option: conditionalContext.triggerOption.label, parent: conditionalContext.parentQuestion.title })}
              </Typography>
            </Paper>
          )}

          {/* Question Type Notice for Analytics */}
          {formData.type === 'question' && !conditionalContext && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderStyle: 'dashed' }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ℹ️ <strong>{t('addNodeDialog.note')}</strong> {t('addNodeDialog.noAnalyticsForQuestions')}
              </Typography>
            </Paper>
          )}

          {formData.type === 'question' && !conditionalContext && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50', borderStyle: 'dashed' }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                💡 <strong>{t('addNodeDialog.tip')}</strong> {t('addNodeDialog.tipDesc')}
              </Typography>
            </Paper>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose}>
          {t('addNodeDialog.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => onSave(formData)}
          disabled={!isFormValid()}
          startIcon={conditionalContext ? <ConditionalIcon /> : undefined}
        >
          {editingNode ? t('addNodeDialog.update') : t('addNodeDialog.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddNodeDialog;
