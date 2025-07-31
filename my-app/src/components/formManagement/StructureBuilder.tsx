import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
} from '@mui/icons-material';
import type { FormNodeV2, OptionV2 } from './models/FormModelsV2';
import type { FormNodeV2, QuestionType } from './models/FormModelsV2';

interface StructureBuilderProps {
  structure: FormNodeV2[];
  onChange: (structure: FormNodeV2[]) => void;
  onPreview: (structure: FormNodeV2[]) => void;
}

interface NodeFormData {
  title: string;
  description: string;
  type: 'group' | 'question';
  questionType?: QuestionType;
  options?: string[];
  isRequired?: boolean;
  domainName?: string;
}

const StructureBuilder: React.FC<StructureBuilderProps> = ({
  structure,
  onChange,
  onPreview
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<FormNodeV2 | null>(null);
  const [newNodeForm, setNewNodeForm] = useState<NodeFormData>({
    title: '',
    description: '',
    type: 'group',
    options: [],
    isRequired: false,
    domainName: ''
  });

  const questionTypes: { value: QuestionType; label: string; description: string }[] = [
    { value: 'multipleChoice', label: 'Multiple Choice', description: 'Single selection from options' },
    { value: 'checkbox', label: 'Checkboxes', description: 'Multiple selections allowed' },
    { value: 'text', label: 'Text Input', description: 'Short text response' },
    { value: 'textarea', label: 'Long Text', description: 'Extended text response' },
    { value: 'number', label: 'Number', description: 'Numeric input' },
    { value: 'scale', label: 'Rating Scale', description: 'Scale from 1-5 or 1-10' },
    { value: 'yesNo', label: 'Yes/No', description: 'Simple boolean choice' },
  ];

  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add new node
  const handleAddNode = useCallback((parentId: string | null = null) => {
    setAddingToParentId(parentId);
    setNewNodeForm({
      title: '',
      description: '',
      type: 'group',
      options: [],
      isRequired: false,
      domainName: ''
    });
    setIsAddingNode(true);
  }, []);

  // Create node from form data
  const createNodeFromForm = useCallback((formData: NodeFormData): FormNodeV2 => {
    const node: FormNodeV2 = {
      id: generateId(),
      title: formData.title,
      description: formData.description,
      type: formData.type,
      children: [],
      ...(formData.type === 'question' && {
        questionType: formData.questionType,
        isRequired: formData.isRequired,
        ...(formData.options && formData.options.length > 0 && { options: formData.options }),
      }),
      ...(formData.type === 'group' && formData.domainName && { domainName: formData.domainName }),
    };
    return node;
  }, []);

  // Save new node
  const handleSaveNewNode = useCallback(() => {
    if (!newNodeForm.title.trim()) return;

    const newNode = createNodeFromForm(newNodeForm);
    
    if (addingToParentId) {
      // Add to specific parent
      const updateStructure = (nodes: FormNodeV2[]): FormNodeV2[] => {
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

    setIsAddingNode(false);
    setAddingToParentId(null);
  }, [newNodeForm, addingToParentId, structure, onChange, createNodeFromForm]);

  // Delete node
  const handleDeleteNode = useCallback((nodeId: string) => {
    const deleteFromStructure = (nodes: FormNodeV2[]): FormNodeV2[] => {
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
  const handleDuplicateNode = useCallback((node: FormNodeV2) => {
    const duplicateNode = (original: FormNodeV2): FormNodeV2 => ({
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
    const moveInArray = (nodes: FormNodeV2[]): FormNodeV2[] => {
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
  const handleEditNode = useCallback((node: FormNodeV2) => {
    setEditingNode(node);
    setNewNodeForm({
      title: node.title,
      description: node.description || '',
      type: node.type,
      questionType: node.questionType,
      options: node.options || [],
      isRequired: node.isRequired || false,
      domainName: node.domainName || ''
    });
    setIsAddingNode(true);
  }, []);

  // Update existing node
  const handleUpdateNode = useCallback(() => {
    if (!editingNode || !newNodeForm.title.trim()) return;

    const updatedNode = { ...editingNode, ...createNodeFromForm(newNodeForm), id: editingNode.id };
    
    const updateInStructure = (nodes: FormNodeV2[]): FormNodeV2[] => {
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
    setIsAddingNode(false);
    setEditingNode(null);
  }, [editingNode, newNodeForm, structure, onChange, createNodeFromForm]);

  // Render node tree
  const renderNode = (node: FormNodeV2, level: number = 0, parentPath: string = '') => {
    const nodePath = parentPath ? `${parentPath} > ${node.title}` : node.title;
    const isSelected = selectedNodeId === node.id;

    return (
      <Zoom in={true} key={node.id} style={{ transitionDelay: `${level * 50}ms` }}>
        <Card
          elevation={isSelected ? 8 : 2}
          sx={{
            mb: 2,
            ml: level * 3,
            border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
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
            expanded={isSelected}
            onChange={() => setSelectedNodeId(isSelected ? null : node.id)}
            sx={{ boxShadow: 'none' }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: node.type === 'group' ? '#f3e5f5' : '#e8f5e8',
                '&:hover': { backgroundColor: node.type === 'group' ? '#e1bee7' : '#c8e6c9' },
                borderRadius: isSelected ? '8px 8px 0 0' : '8px',
                transition: 'all 0.2s ease'
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
                  <Typography variant="subtitle1" fontWeight="bold">
                    {node.title}
                  </Typography>
                  {node.description && (
                    <Typography variant="body2" color="text.secondary">
                      {node.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={node.type === 'group' ? 'Group' : 'Question'}
                      size="small"
                      color={node.type === 'group' ? 'secondary' : 'success'}
                    />
                    {node.questionType && (
                      <Chip
                        label={questionTypes.find(t => t.value === node.questionType)?.label}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {node.isRequired && (
                      <Chip label="Required" size="small" color="error" variant="outlined" />
                    )}
                  </Box>
                </Box>
              </Box>
            </AccordionSummary>
            
            <AccordionDetails sx={{ backgroundColor: '#fafafa' }}>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleEditNode(node)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Duplicate">
                  <IconButton size="small" onClick={() => handleDuplicateNode(node)}>
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Move Up">
                  <IconButton size="small" onClick={() => handleMoveNode(node.id, 'up')}>
                    <MoveUpIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Move Down">
                  <IconButton size="small" onClick={() => handleMoveNode(node.id, 'down')}>
                    <MoveDownIcon />
                  </IconButton>
                </Tooltip>
                {node.type === 'group' && (
                  <Tooltip title="Add Child">
                    <IconButton size="small" onClick={() => handleAddNode(node.id)}>
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => handleDeleteNode(node.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              {node.options && node.options.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Options:</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {node.options.map((option, index) => (
                      <Chip key={index} label={option} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Render children */}
              {node.children && node.children.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Children ({node.children.length}):
                  </Typography>
                  {node.children.map(child => renderNode(child, level + 1, nodePath))}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Card>
      </Zoom>
    );
  };

  return (
    <Box>
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

      {/* Add/Edit Node Dialog */}
      <Dialog
        open={isAddingNode}
        onClose={() => {
          setIsAddingNode(false);
          setEditingNode(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', color: 'white' }}>
          {editingNode ? '✏️ Edit Item' : '🎨 Create New Item'}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={newNodeForm.type}
                onChange={(e) => setNewNodeForm({ ...newNodeForm, type: e.target.value as 'group' | 'question' })}
                label="Type"
              >
                <MenuItem value="group">📁 Group (Container)</MenuItem>
                <MenuItem value="question">❓ Question</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Title"
              value={newNodeForm.title}
              onChange={(e) => setNewNodeForm({ ...newNodeForm, title: e.target.value })}
              fullWidth
              required
              placeholder="Enter a clear, descriptive title..."
            />

            <TextField
              label="Description"
              value={newNodeForm.description}
              onChange={(e) => setNewNodeForm({ ...newNodeForm, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="Optional: Provide additional context or instructions..."
            />

            {newNodeForm.type === 'group' && (
              <TextField
                label="Domain Name (Optional)"
                value={newNodeForm.domainName}
                onChange={(e) => setNewNodeForm({ ...newNodeForm, domainName: e.target.value })}
                fullWidth
                placeholder="For analytics grouping..."
              />
            )}

            {newNodeForm.type === 'question' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Question Type</InputLabel>
                  <Select
                    value={newNodeForm.questionType || ''}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, questionType: e.target.value as QuestionType })}
                    label="Question Type"
                  >
                    {questionTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box>
                          <Typography variant="body1">{type.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {(newNodeForm.questionType === 'multipleChoice' || newNodeForm.questionType === 'checkbox') && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Options (one per line):
                    </Typography>
                    <TextField
                      multiline
                      rows={4}
                      fullWidth
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      value={(newNodeForm.options || []).join('\n')}
                      onChange={(e) => setNewNodeForm({
                        ...newNodeForm,
                        options: e.target.value.split('\n').filter(opt => opt.trim())
                      })}
                    />
                  </Box>
                )}
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => {
              setIsAddingNode(false);
              setEditingNode(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={editingNode ? handleUpdateNode : handleSaveNewNode}
            disabled={!newNodeForm.title.trim()}
          >
            {editingNode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StructureBuilder;
