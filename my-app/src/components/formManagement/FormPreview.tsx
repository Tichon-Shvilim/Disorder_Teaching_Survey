import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Slider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Smartphone as MobileIcon,
  Tablet as TabletIcon,
  Computer as DesktopIcon,
} from '@mui/icons-material';
import type { FormNodeV2 } from './models/FormModelsV2';

interface FormPreviewProps {
  structure: FormNodeV2[];
  onClose: () => void;
}

interface FormData {
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const FormPreview: React.FC<FormPreviewProps> = ({ structure, onClose }) => {
  const [formData, setFormData] = useState<FormData>({});
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleInputChange = (nodeId: string, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setFormData(prev => ({ ...prev, [nodeId]: value }));
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const renderQuestion = (node: FormNodeV2) => {
    const value = formData[node.id] || '';

    switch (node.inputType) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={node.title}
            placeholder="Type your answer here..."
            value={value}
            onChange={(e) => handleInputChange(node.id, e.target.value)}
            helperText={node.description}
            sx={{ mb: 2 }}
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={node.title}
            placeholder="Enter a number..."
            value={value}
            onChange={(e) => handleInputChange(node.id, e.target.value)}
            helperText={node.description}
            sx={{ mb: 2 }}
          />
        );

      case 'single-choice':
        return (
          <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
              {node.title}
            </FormLabel>
            {node.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {node.description}
              </Typography>
            )}
            <RadioGroup
              value={value}
              onChange={(e) => handleInputChange(node.id, e.target.value)}
            >
              {node.options?.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'multiple-choice':
        return (
          <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
              {node.title}
            </FormLabel>
            {node.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {node.description}
              </Typography>
            )}
            <FormGroup>
              {node.options?.map((option, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={(value || []).includes(option.value)}
                      onChange={(e) => {
                        const currentValues = value || [];
                        const newValues = e.target.checked
                          ? [...currentValues, option.value]
                          : currentValues.filter((v: any) => v !== option.value); // eslint-disable-line @typescript-eslint/no-explicit-any
                        handleInputChange(node.id, newValues);
                      }}
                    />
                  }
                  label={option.label}
                />
              ))}
            </FormGroup>
          </FormControl>
        );

      case 'scale':
        return (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {node.title}
            </Typography>
            {node.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {node.description}
              </Typography>
            )}
            <Box sx={{ px: 2 }}>
              <Slider
                value={value || 1}
                onChange={(_, newValue) => handleInputChange(node.id, newValue)}
                min={1}
                max={10}
                step={1}
                marks
                valueLabelDisplay="on"
                sx={{ mt: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption">Low</Typography>
                <Typography variant="caption">High</Typography>
              </Box>
            </Box>
          </Box>
        );

      default:
        return (
          <TextField
            fullWidth
            label={node.title}
            placeholder="Answer..."
            value={value}
            onChange={(e) => handleInputChange(node.id, e.target.value)}
            helperText={node.description}
            sx={{ mb: 2 }}
          />
        );
    }
  };

  const renderNode = (node: FormNodeV2, level: number = 0) => {
    if (node.type === 'question') {
      return (
        <Box key={node.id} sx={{ mb: 2 }}>
          {renderQuestion(node)}
        </Box>
      );
    }

    // Group rendering
    const isExpanded = expandedGroups.has(node.id);
    
    return (
      <Card 
        key={node.id} 
        elevation={2} 
        sx={{ 
          mb: 2, 
          ml: level * 2,
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Accordion 
          expanded={isExpanded} 
          onChange={() => toggleGroup(node.id)}
          sx={{ boxShadow: 'none' }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: level === 0 ? '#f5f5f5' : '#fafafa',
              borderBottom: isExpanded ? '1px solid #e0e0e0' : 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                {node.title}
              </Typography>
              <Chip 
                label={`${node.children.length} item${node.children.length !== 1 ? 's' : ''}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 3 }}>
            {node.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {node.description}
              </Typography>
            )}
            {node.children.map(child => renderNode(child, level + 1))}
          </AccordionDetails>
        </Accordion>
      </Card>
    );
  };

  const getViewportStyles = () => {
    switch (viewMode) {
      case 'mobile':
        return { maxWidth: 375, mx: 'auto' };
      case 'tablet':
        return { maxWidth: 768, mx: 'auto' };
      default:
        return { maxWidth: 1200, mx: 'auto' };
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

  const totalQuestions = getQuestionCount(structure);

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1300,
      overflow: 'auto'
    }}>
      <Box sx={{ 
        backgroundColor: 'white', 
        minHeight: '100vh',
        ...getViewportStyles()
      }}>
        {/* Header */}
        <Paper 
          elevation={4} 
          sx={{ 
            p: 3, 
            position: 'sticky', 
            top: 0, 
            zIndex: 10,
            borderRadius: 0
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                📋 Form Preview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} • Interactive preview
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={1}>
              {/* Viewport Toggle */}
              <Tooltip title="Desktop View">
                <IconButton 
                  onClick={() => setViewMode('desktop')}
                  color={viewMode === 'desktop' ? 'primary' : 'default'}
                >
                  <DesktopIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Tablet View">
                <IconButton 
                  onClick={() => setViewMode('tablet')}
                  color={viewMode === 'tablet' ? 'primary' : 'default'}
                >
                  <TabletIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Mobile View">
                <IconButton 
                  onClick={() => setViewMode('mobile')}
                  color={viewMode === 'mobile' ? 'primary' : 'default'}
                >
                  <MobileIcon />
                </IconButton>
              </Tooltip>
              
              <Divider orientation="vertical" flexItem />
              
              <IconButton onClick={onClose} color="error">
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>

        {/* Form Content */}
        <Box sx={{ p: 4 }}>
          {structure.length === 0 ? (
            <Card sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No structure to preview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add some groups and questions to see the preview
              </Typography>
            </Card>
          ) : (
            <Box>
              {/* Form Header */}
              <Card elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  Sample Form Title
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  This is how your form will appear to users. All interactions work as they would in the real form.
                </Typography>
              </Card>

              {/* Form Body */}
              {structure.map(node => renderNode(node))}

              {/* Form Footer */}
              <Card elevation={2} sx={{ p: 3, mt: 4, textAlign: 'center', borderRadius: 2 }}>
                <Button 
                  variant="contained" 
                  size="large"
                  sx={{ 
                    px: 4,
                    background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)'
                  }}
                >
                  Submit Form
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                  This is a preview - no data will be saved
                </Typography>
              </Card>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default FormPreview;
