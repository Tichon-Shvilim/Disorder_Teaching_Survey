import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  IconButton,
  TextField,
  Chip,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Paper,
  Divider,
  Zoom,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Folder as GroupIcon,
  Quiz as QuestionIcon,
  Visibility as PreviewIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  ArrowUpward as MoveUpIcon,
  ArrowDownward as MoveDownIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  DonutSmall as PieChartIcon,
  Speed as GaugeIcon,
  Radar as RadarIcon,
  CallSplit as ConditionalIcon,
} from '@mui/icons-material';
import type { FormNode, Option } from './models/FormModels';
import AddNodeDialog from './AddNodeDialog';

interface StructureBuilderProps {
  structure: FormNode[];
  onChange: (structure: FormNode[]) => void;
  onPreview: (structure: FormNode[]) => void;
}

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

const StructureBuilder: React.FC<StructureBuilderProps> = ({
  structure,
  onChange,
  onPreview
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<FormNode | null>(null);
  const [newNodeForm, setNewNodeForm] = useState<NodeFormData>({
    title: '',
    description: '',
    type: 'group',
    weight: 1,
    graphable: true,
    preferredChartType: 'bar',
    options: []
  });
  
  // State for conditional question creation
  const [conditionalContext, setConditionalContext] = useState<{
    parentQuestion: FormNode;
    triggerOption: Option;
  } | null>(null);

  const inputTypes: { value: 'single-choice' | 'multiple-choice' | 'scale' | 'number' | 'text'; label: string }[] = [
    { value: 'single-choice', label: 'Single Choice' },
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'text', label: 'Text Input' },
    { value: 'number', label: 'Number Input' },
    { value: 'scale', label: 'Rating Scale' },
  ];

  const chartTypes: { value: 'bar' | 'line' | 'radar' | 'gauge' | 'pie'; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'bar', label: 'Bar Chart', icon: <BarChartIcon />, description: 'Compare values across categories' },
    { value: 'line', label: 'Line Chart', icon: <LineChartIcon />, description: 'Show trends over time' },
    { value: 'pie', label: 'Pie Chart', icon: <PieChartIcon />, description: 'Show proportions of a whole' },
    { value: 'gauge', label: 'Gauge', icon: <GaugeIcon />, description: 'Display single value with target range' },
    { value: 'radar', label: 'Radar Chart', icon: <RadarIcon />, description: 'Multi-dimensional comparison' },
  ];

  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Expansion management
  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Option management for questions
  const handleAddOption = useCallback((questionNode: FormNode) => {
    const newOption: Option = {
      id: generateId(),
      label: `Option ${(questionNode.options?.length || 0) + 1}`,
      value: (questionNode.options?.length || 0) + 1
    };

    const updateStructure = (nodes: FormNode[]): FormNode[] => {
      return nodes.map(node => {
        if (node.id === questionNode.id) {
          return { 
            ...node, 
            options: [...(node.options || []), newOption]
          };
        }
        if (node.children.length > 0) {
          return { ...node, children: updateStructure(node.children) };
        }
        return node;
      });
    };

    onChange(updateStructure(structure));
  }, [structure, onChange]);

  const handleEditOption = useCallback((questionNode: FormNode, optionIndex: number, updates: Partial<Option>) => {
    const updateStructure = (nodes: FormNode[]): FormNode[] => {
      return nodes.map(node => {
        if (node.id === questionNode.id) {
          return { 
            ...node, 
            options: node.options?.map((opt, i) => 
              i === optionIndex ? { ...opt, ...updates } : opt
            ) || []
          };
        }
        if (node.children.length > 0) {
          return { ...node, children: updateStructure(node.children) };
        }
        return node;
      });
    };

    onChange(updateStructure(structure));
  }, [structure, onChange]);

  const handleDeleteOption = useCallback((questionNode: FormNode, optionIndex: number) => {
    const updateStructure = (nodes: FormNode[]): FormNode[] => {
      return nodes.map(node => {
        if (node.id === questionNode.id) {
          return { 
            ...node, 
            options: node.options?.filter((_, i) => i !== optionIndex) || []
          };
        }
        if (node.children.length > 0) {
          return { ...node, children: updateStructure(node.children) };
        }
        return node;
      });
    };

    onChange(updateStructure(structure));
  }, [structure, onChange]);

  // Add new node
  const handleAddNode = useCallback((parentId: string | null = null) => {
    setAddingToParentId(parentId);
    setNewNodeForm({
      title: '',
      description: '',
      type: 'group',
      weight: 1,
      graphable: true, // Default true for groups, will be managed in UI
      preferredChartType: 'bar',
      options: []
    });
    setIsAddingNode(true);
  }, []);

  // Create node from form data
  const createNodeFromForm = useCallback((formData: NodeFormData): FormNode => {
    const node: FormNode = {
      id: generateId(),
      title: formData.title,
      description: formData.description,
      type: formData.type,
      weight: formData.weight,
      // Only groups can be graphable - enforce this rule
      graphable: formData.type === 'group' ? formData.graphable : false,
      preferredChartType: formData.preferredChartType,
      children: [],
      ...(formData.type === 'question' && {
        inputType: formData.inputType,
        ...(formData.options && formData.options.length > 0 && { options: formData.options }),
      }),
    };

    return node;
  }, []);

  // Delete node
  const handleDeleteNode = useCallback((nodeId: string) => {
    const deleteFromStructure = (nodes: FormNode[]): FormNode[] => {
      return nodes
        .filter(node => node.id !== nodeId)
        .map(node => ({
          ...node,
          children: deleteFromStructure(node.children)
        }));
    };
    onChange(deleteFromStructure(structure));
  }, [structure, onChange]);

  // Duplicate node
  const handleDuplicateNode = useCallback((node: FormNode) => {
    const duplicateNode = (original: FormNode): FormNode => ({
      ...original,
      id: generateId(),
      title: `${original.title} (Copy)`,
      children: original.children.map(duplicateNode)
    });

    const newNode = duplicateNode(node);
    onChange([...structure, newNode]);
  }, [structure, onChange]);

  // Move node up/down
  const handleMoveNode = useCallback((nodeId: string, direction: 'up' | 'down') => {
    const moveInArray = (nodes: FormNode[]): FormNode[] => {
      const index = nodes.findIndex(n => n.id === nodeId);
      if (index === -1) {
        return nodes.map(node => ({
          ...node,
          children: moveInArray(node.children)
        }));
      }

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= nodes.length) return nodes;

      const newNodes = [...nodes];
      [newNodes[index], newNodes[newIndex]] = [newNodes[newIndex], newNodes[index]];
      return newNodes;
    };

    onChange(moveInArray(structure));
  }, [structure, onChange]);

  // Edit node
  const handleEditNode = useCallback((node: FormNode) => {
    setEditingNode(node);
    setNewNodeForm({
      title: node.title || '',
      description: node.description || '',
      type: node.type,
      inputType: node.inputType,
      options: node.options || [],
      weight: node.weight,
      graphable: node.graphable,
      preferredChartType: node.preferredChartType
    });
    setIsAddingNode(true);
  }, []);

  // Add conditional question to a specific option
  const handleAddConditionalQuestion = useCallback((parentNode: FormNode, triggerOption: Option) => {
    setConditionalContext({
      parentQuestion: parentNode,
      triggerOption: triggerOption
    });
    // Reset form for conditional question
    setNewNodeForm({
      title: '',
      description: '',
      type: 'question',
      weight: 1,
      graphable: false,
      preferredChartType: 'bar',
      options: []
    });
    setIsAddingNode(true);
  }, []);

  // Save node from dialog
  const handleSaveFromDialog = useCallback((formData: NodeFormData) => {
    console.log('Saving node from dialog:', formData);
    
    try {
      const newNode = createNodeFromForm(formData);
      
      // Add conditional metadata if we're creating a conditional question
      if (conditionalContext) {
        newNode.condition = {
          parentQuestionId: conditionalContext.parentQuestion.id,
          parentOptionId: conditionalContext.triggerOption.id
        };
      }
      
      console.log('Created node:', newNode);
      
      if (editingNode) {
        // Update existing node
        const updatedNode = { ...editingNode, ...newNode, id: editingNode.id };
        
        const updateInStructure = (nodes: FormNode[]): FormNode[] => {
          return nodes.map(node => {
            if (node.id === editingNode.id) {
              return { ...updatedNode, children: node.children };
            }
            if (node.children.length > 0) {
              return { ...node, children: updateInStructure(node.children) };
            }
            return node;
          });
        };

        onChange(updateInStructure(structure));
      } else if (conditionalContext) {
        // Add conditional question under the parent question
        const updateStructure = (nodes: FormNode[]): FormNode[] => {
          return nodes.map(node => {
            if (node.id === conditionalContext.parentQuestion.id) {
              return { ...node, children: [...node.children, newNode] };
            }
            if (node.children.length > 0) {
              return { ...node, children: updateStructure(node.children) };
            }
            return node;
          });
        };
        onChange(updateStructure(structure));
      } else if (addingToParentId) {
        // Add to specific parent
        const updateStructure = (nodes: FormNode[]): FormNode[] => {
          return nodes.map(node => {
            if (node.id === addingToParentId) {
              return { ...node, children: [...node.children, newNode] };
            }
            if (node.children.length > 0) {
              return { ...node, children: updateStructure(node.children) };
            }
            return node;
          });
        };
        onChange(updateStructure(structure));
      } else {
        // Add to root
        onChange([...structure, newNode]);
      }

      // Reset state
      setIsAddingNode(false);
      setAddingToParentId(null);
      setEditingNode(null);
      setConditionalContext(null);
    } catch (error) {
      console.error('Error saving node:', error);
    }
  }, [addingToParentId, editingNode, conditionalContext, structure, onChange, createNodeFromForm]);

  // Close dialog
  const handleCloseDialog = useCallback(() => {
    setIsAddingNode(false);
    setEditingNode(null);
    setAddingToParentId(null);
    setConditionalContext(null);
  }, []);

  // Render node tree
  const renderNode = (node: FormNode, level: number = 0, parentPath: string = '') => {
    const nodePath = parentPath ? `${parentPath} > ${node.title}` : node.title;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <Zoom in={true} key={node.id} style={{ transitionDelay: `${level * 50}ms` }}>
        <Card
          elevation={isExpanded ? 8 : 2}
          sx={{
            mb: 2,
            ml: level * 3,
            border: isExpanded ? '2px solid #1976d2' : '1px solid #e0e0e0',
            borderRadius: 2,
            overflow: 'visible',
            transition: 'all 0.3s ease',
            '&:hover': {
              elevation: 6,
              transform: 'translateY(-2px)',
            }
          }}
        >
          <Accordion
            expanded={isExpanded}
            onChange={(event) => {
              event.stopPropagation();
              toggleNodeExpansion(node.id);
            }}
            sx={{ boxShadow: 'none' }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: node.type === 'group' 
                  ? (node.graphable 
                      ? 'linear-gradient(135deg, #f3e5f5 0%, #e8f5e8 100%)' 
                      : '#f3e5f5')
                  : '#e8f5e8',
                '&:hover': { 
                  backgroundColor: node.type === 'group' 
                    ? (node.graphable 
                        ? 'linear-gradient(135deg, #e1bee7 0%, #c8e6c9 100%)' 
                        : '#e1bee7')
                    : '#c8e6c9' 
                },
                borderRadius: isExpanded ? '8px 8px 0 0' : '8px',
                transition: 'all 0.2s ease',
                position: 'relative',
                '&::before': node.type === 'group' && node.graphable ? {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  background: 'linear-gradient(180deg, #2196F3 0%, #21CBF3 100%)',
                  borderRadius: '4px 0 0 4px'
                } : {}
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <DragIcon sx={{ color: 'text.secondary', cursor: 'grab' }} />
                {node.type === 'group' ? (
                  <GroupIcon sx={{ color: '#9c27b0' }} />
                ) : (
                  <QuestionIcon sx={{ color: '#4caf50' }} />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {node.condition && (
                      <ConditionalIcon fontSize="small" color="secondary" />
                    )}
                    {node.title}
                    {node.condition && (
                      <Chip 
                        label="Conditional" 
                        size="small" 
                        color="secondary" 
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: '20px' }}
                      />
                    )}
                  </Typography>
                  {node.condition && (
                    <Typography variant="caption" color="secondary" sx={{ fontStyle: 'italic' }}>
                      🎯 Shows when specific option is selected
                    </Typography>
                  )}
                  {node.description && (
                    <Typography variant="body2" color="text.secondary">
                      {node.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={node.type === 'group' ? 'Group' : 'Question'}
                      size="small"
                      color={node.type === 'group' ? 'secondary' : 'success'}
                    />
                    {node.inputType && (
                      <Chip
                        label={inputTypes.find(t => t.value === node.inputType)?.label}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {node.type === 'group' && node.graphable && (
                      <Chip 
                        icon={chartTypes.find(t => t.value === node.preferredChartType)?.icon as React.ReactElement}
                        label={`📊 ${chartTypes.find(t => t.value === node.preferredChartType)?.label}`}
                        size="small" 
                        color="primary" 
                        variant="filled"
                        sx={{
                          fontWeight: 'bold',
                          '& .MuiChip-icon': { fontSize: '16px' }
                        }}
                      />
                    )}
                    {node.type === 'question' && node.weight !== 1 && (
                      <Chip 
                        label={`Weight: ${node.weight}`}
                        size="small" 
                        color="warning" 
                        variant="outlined" 
                      />
                    )}
                    {node.options && node.options.length > 0 && (
                      <Chip label={`${node.options.length} options`} size="small" color="info" variant="outlined" />
                    )}
                    {node.children.some(child => child.condition) && (
                      <Chip 
                        icon={<ConditionalIcon />}
                        label={`${node.children.filter(child => child.condition).length} conditional`}
                        size="small" 
                        color="secondary" 
                        variant="filled"
                        sx={{ fontWeight: 'bold' }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </AccordionSummary>
            
            <AccordionDetails sx={{ backgroundColor: '#fafafa' }}>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Tooltip title="Edit">
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditNode(node);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Duplicate">
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateNode(node);
                    }}
                  >
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Move Up">
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveNode(node.id, 'up');
                    }}
                  >
                    <MoveUpIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Move Down">
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveNode(node.id, 'down');
                    }}
                  >
                    <MoveDownIcon />
                  </IconButton>
                </Tooltip>
                {node.type === 'group' && (
                  <Tooltip title="Add Child">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddNode(node.id);
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {node.type === 'question' && (node.inputType === 'single-choice' || node.inputType === 'multiple-choice') && (
                  <Tooltip title="Add Answer Option">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddOption(node);
                      }}
                      color="primary"
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              {node.options && node.options.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Answer Options ({node.options.length}):
                  </Typography>
                  <Stack spacing={2}>
                    {node.options.map((option, index) => {
                      const hasConditionalChildren = node.children.some(child => 
                        child.condition?.parentOptionId === option.id
                      );
                      return (
                        <Paper key={option.id} variant="outlined" sx={{ p: 2, bgcolor: 'white' }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 30 }}>
                              {index + 1}.
                            </Typography>
                            <TextField
                              value={option.label}
                              onChange={(e) => handleEditOption(node, index, { label: e.target.value })}
                              size="small"
                              sx={{ flex: 1 }}
                              placeholder="Option label..."
                              variant="outlined"
                            />
                            <TextField
                              value={option.value}
                              onChange={(e) => handleEditOption(node, index, { value: parseInt(e.target.value) || 0 })}
                              size="small"
                              type="number"
                              sx={{ width: 80 }}
                              variant="outlined"
                            />
                            {hasConditionalChildren && (
                              <Chip
                                icon={<ConditionalIcon />}
                                label="Has conditions"
                                size="small"
                                color="secondary"
                                variant="filled"
                              />
                            )}
                            <Tooltip title="Add Conditional Question for this option">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handleAddConditionalQuestion(node, option)}
                              >
                                <ConditionalIcon />
                              </IconButton>
                            </Tooltip>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteOption(node, index)}
                              disabled={node.options!.length <= 1}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                          
                          {/* Show conditional questions nested under this option */}
                          {hasConditionalChildren && (
                            <Box sx={{ mt: 2, ml: 2, pl: 2, borderLeft: '3px solid #e0e0e0' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
                                🎯 Conditional Questions for "{option.label}":
                              </Typography>
                              {node.children
                                .filter(child => child.condition?.parentOptionId === option.id)
                                .map(conditionalChild => (
                                  <Box key={conditionalChild.id} sx={{ mb: 1 }}>
                                    {renderNode(conditionalChild, level + 2, `${nodePath} > ${option.label}`)}
                                  </Box>
                                ))}
                            </Box>
                          )}
                        </Paper>
                      );
                    })}
                  </Stack>
                </Box>
              )}

              {/* Add option button for choice questions without options */}
              {node.type === 'question' && 
               (node.inputType === 'single-choice' || node.inputType === 'multiple-choice') && 
               (!node.options || node.options.length === 0) && (
                <Box sx={{ mb: 2 }}>
                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderStyle: 'dashed' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      This question needs answer options
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => handleAddOption(node)}
                      variant="contained"
                      size="small"
                    >
                      Add First Option
                    </Button>
                  </Paper>
                </Box>
              )}

              {/* Render children that are NOT conditional questions (those are shown under options) */}
              {node.children && node.children.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 2 }} />
                  {/* Only show non-conditional children here */}
                  {node.children.filter(child => !child.condition).length > 0 && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Children ({node.children.filter(child => !child.condition).length}):
                      </Typography>
                      {node.children
                        .filter(child => !child.condition)
                        .map(child => renderNode(child, level + 1, nodePath))}
                    </>
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Card>
      </Zoom>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Debug Info */}
      <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="caption">
          Debug: Structure length: {structure.length}, Adding: {isAddingNode.toString()},
          Graphable groups: {structure.filter(node => node.type === 'group' && node.graphable).length}
        </Typography>
      </Box>

      {/* Header Actions */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" gutterBottom>
              🏗️ Structure Builder
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Design your form hierarchy. Add groups and questions, then organize them visually.
            </Typography>
            <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
              💡 Tip: Groups with analytics enabled (graphable) will appear in charts and reports with a blue accent.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => onPreview(structure)}
              disabled={structure.length === 0}
            >
              Preview Form
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleAddNode()}
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
                }
              }}
            >
              Add Root Item
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Structure Tree */}
      {structure.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <GroupIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No structure yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start building your form by adding groups and questions. Think of it like creating folders and files!
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => handleAddNode()}
          >
            Create Your First Group
          </Button>
        </Card>
      ) : (
        <Box>
          <Fade in={true}>
            <Box>
              {structure.map(node => renderNode(node))}
            </Box>
          </Fade>
        </Box>
      )}

      {/* New unified dialog */}
      <AddNodeDialog
        open={isAddingNode}
        onClose={handleCloseDialog}
        onSave={handleSaveFromDialog}
        editingNode={editingNode}
        formData={newNodeForm}
        setFormData={setNewNodeForm}
        conditionalContext={conditionalContext || undefined}
        addingToParentId={addingToParentId}
      />
    </Box>
  );
};

export default StructureBuilder;
