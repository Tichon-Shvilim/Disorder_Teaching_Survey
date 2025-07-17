import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Paper,
  Stack,
  Badge,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Collapse,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  QuestionAnswer as QuestionIcon,
  Settings as SettingsIcon,
  Category as CategoryIcon,
  Quiz as QuizIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import type {
  DomainModel,
  QuestionFormData,
  CreateQuestionnaireRequest,
} from "./models/FormModels";
import { useNavigate } from "react-router-dom";

interface QuestionnaireBuilderProps {
  onSave: (data: CreateQuestionnaireRequest) => Promise<void>;
}

const QuestionnaireBuilder: React.FC<QuestionnaireBuilderProps> = ({
  onSave,
}) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domains, setDomains] = useState<DomainModel[]>([]);
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionFormData>({
    text: "",
    domainId: "",
    type: "single-choice",
    options: [{ id: "opt-0", label: "", value: 1, subQuestions: [] }],
    required: false,
    helpText: "",
    order: 0,
  });
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [newDomainDescription, setNewDomainDescription] = useState("");
  const [expandedOptions, setExpandedOptions] = useState<{
    [key: string]: boolean;
  }>({});

  const questionTypes = [
    { value: "single-choice", label: "Single Choice" },
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "text", label: "Text Input" },
    { value: "number", label: "Number Input" },
    { value: "scale", label: "Scale (1-5)" },
  ];

  // Navigate back to questionnaire list
  const handleBack = () => {
    navigate("/layout/questionnaires");
  };

  // Add new domain
  const handleAddDomain = () => {
    if (newDomainName.trim()) {
      const newDomain: DomainModel = {
        _id: `temp-${Date.now()}`,
        name: newDomainName.trim(),
        description: newDomainDescription.trim() || undefined,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      };
      setDomains([...domains, newDomain]);
      setCurrentQuestion({ ...currentQuestion, domainId: newDomain._id });
      setNewDomainName("");
      setNewDomainDescription("");
      setShowAddDomain(false);
    }
  };

  // Add option to current question
  const addOption = () => {
    const newOption = {
      id: `opt-${currentQuestion.options.length}`,
      label: "",
      value: currentQuestion.options.length + 1,
      subQuestions: [],
    };
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, newOption],
    });
  };

  // Update option
  const updateOption = (index: number, value: string) => {
    const updatedOptions = currentQuestion.options.map((option, i) =>
      i === index ? { ...option, label: value } : option
    );
    setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
  };

  // Remove option
  const removeOption = (index: number) => {
    if (currentQuestion.options.length > 1) {
      const updatedOptions = currentQuestion.options.filter(
        (_, i) => i !== index
      );
      setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
    }
  };

  // Add sub-question to option
  const addSubQuestion = (optionIndex: number) => {
    const updatedOptions = [...currentQuestion.options];
    if (!updatedOptions[optionIndex].subQuestions) {
      updatedOptions[optionIndex].subQuestions = [];
    }
    const newSubQuestion = {
      _id: `temp-sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: "",
      domainId: currentQuestion.domainId,
      type: "single-choice" as const,
      options: [{ id: "subopt-0", label: "", value: 1, subQuestions: [] }],
      required: false,
      helpText: "",
      order: updatedOptions[optionIndex].subQuestions!.length,
    };
    updatedOptions[optionIndex].subQuestions!.push(newSubQuestion);
    setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
  };

  // Update sub-question
  const updateSubQuestion = (
    optionIndex: number,
    subQuestionIndex: number,
    field: string,
    value: string | boolean
  ) => {
    const updatedOptions = [...currentQuestion.options];
    if (updatedOptions[optionIndex].subQuestions) {
      updatedOptions[optionIndex].subQuestions![subQuestionIndex] = {
        ...updatedOptions[optionIndex].subQuestions![subQuestionIndex],
        [field]: value,
      };
      setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
    }
  };

  // Remove sub-question
  const removeSubQuestion = (optionIndex: number, subQuestionIndex: number) => {
    const updatedOptions = [...currentQuestion.options];
    if (updatedOptions[optionIndex].subQuestions) {
      updatedOptions[optionIndex].subQuestions!.splice(subQuestionIndex, 1);
      setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
    }
  };

  // Add option to sub-question
  const addSubQuestionOption = (
    optionIndex: number,
    subQuestionIndex: number
  ) => {
    const updatedOptions = [...currentQuestion.options];
    if (updatedOptions[optionIndex].subQuestions) {
      const subQuestion =
        updatedOptions[optionIndex].subQuestions![subQuestionIndex];
      const newOption = {
        id: `subopt-${subQuestion.options.length}`,
        label: "",
        value: subQuestion.options.length + 1,
        subQuestions: [],
      };
      subQuestion.options.push(newOption);
      setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
    }
  };

  // Update sub-question option
  const updateSubQuestionOption = (
    optionIndex: number,
    subQuestionIndex: number,
    subOptionIndex: number,
    value: string
  ) => {
    const updatedOptions = [...currentQuestion.options];
    if (updatedOptions[optionIndex].subQuestions) {
      updatedOptions[optionIndex].subQuestions![subQuestionIndex].options[
        subOptionIndex
      ].label = value;
      setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
    }
  };

  // Remove sub-question option
  const removeSubQuestionOption = (
    optionIndex: number,
    subQuestionIndex: number,
    subOptionIndex: number
  ) => {
    const updatedOptions = [...currentQuestion.options];
    if (updatedOptions[optionIndex].subQuestions) {
      const subQuestion =
        updatedOptions[optionIndex].subQuestions![subQuestionIndex];
      if (subQuestion.options.length > 1) {
        subQuestion.options.splice(subOptionIndex, 1);
        setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
      }
    }
  };

  // Toggle option expansion
  const toggleOptionExpansion = (optionIndex: number) => {
    const key = `option-${optionIndex}`;
    setExpandedOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Add question to questionnaire
  const addQuestionToQuestionnaire = () => {
    if (currentQuestion.text.trim() && currentQuestion.domainId) {
      const questionWithOrder = {
        ...currentQuestion,
        order: questions.length,
        options: currentQuestion.options.filter(
          (opt) => opt.label.trim() !== ""
        ),
      };
      setQuestions([...questions, questionWithOrder]);

      // Reset current question
      setCurrentQuestion({
        text: "",
        domainId: "",
        type: "single-choice",
        options: [{ id: "opt-0", label: "", value: 1, subQuestions: [] }],
        required: false,
        helpText: "",
        order: 0,
      });
    }
  };

  // Remove question from questionnaire
  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Save questionnaire
  const handleSave = async () => {
    const questionnaireData: CreateQuestionnaireRequest = {
      title,
      description,
      domains: domains.map((domain) => ({
        id: domain._id,
        name: domain.name,
        description: domain.description,
        color: domain.color,
      })),
      questions: questions.map((question) => ({
        text: question.text,
        domainId: question.domainId,
        type: question.type,
        required: question.required,
        helpText: question.helpText,
        order: question.order,
        parentQuestionId: question.parentQuestionId,
        parentOptionId: question.parentOptionId,
        options: question.options.map((opt, optionIndex) => ({
          id: opt.id || `opt-${optionIndex}`,
          value: opt.value,
          label: opt.label,
          subQuestions: opt.subQuestions || [],
        })),
      })),
    };

    await onSave(questionnaireData);
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>
      {/* Back Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="outlined"
          color="primary"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          Back to Questionnaires
        </Button>
      </Box>

      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <QuizIcon sx={{ fontSize: 40, color: "primary.main" }} />
          <Typography variant="h4" color="primary" fontWeight="bold">
            Questionnaire Builder
          </Typography>
        </Box>

        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Create comprehensive questionnaires with questions, options, and
          sub-questions
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Questionnaire Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            variant="outlined"
            placeholder="Enter a descriptive title for your questionnaire"
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Provide a brief description of what this questionnaire measures"
          />
        </Stack>
      </Paper>

      {/* Progress Stepper */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stepper
          activeStep={questions.length > 0 ? 2 : domains.length > 0 ? 1 : 0}
        >
          <Step>
            <StepLabel>
              <Typography variant="caption">Setup Domains</Typography>
            </StepLabel>
          </Step>
          <Step>
            <StepLabel>
              <Typography variant="caption">Add Questions</Typography>
            </StepLabel>
          </Step>
          <Step>
            <StepLabel>
              <Typography variant="caption">Save Questionnaire</Typography>
            </StepLabel>
          </Step>
        </Stepper>
      </Paper>

      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexDirection: { xs: "column", xl: "row" },
        }}
      >
        {/* Left Panel - Question Builder */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
            {/* Domain Management Section */}
            <Box
              sx={{
                p: 3,
                bgcolor: "grey.50",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <CategoryIcon color="primary" />
                <Typography variant="h6" color="primary">
                  Step 1: Manage Domains
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Domains help categorize your questions. Create at least one
                domain before adding questions.
              </Typography>

              {domains.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Created Domains:
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}
                  >
                    {domains.map((domain) => (
                      <Chip
                        key={domain._id}
                        label={domain.name}
                        size="small"
                        sx={{ bgcolor: domain.color, color: "white" }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Button
                startIcon={<AddIcon />}
                onClick={() => setShowAddDomain(true)}
                variant="outlined"
                size="small"
                sx={{ mb: showAddDomain ? 2 : 0 }}
              >
                Add New Domain
              </Button>

              <Collapse in={showAddDomain}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "white",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack spacing={2}>
                    <TextField
                      label="Domain Name"
                      value={newDomainName}
                      onChange={(e) => setNewDomainName(e.target.value)}
                      fullWidth
                      size="small"
                      required
                      placeholder="e.g., Academic Performance, Social Skills"
                    />
                    <TextField
                      label="Domain Description (Optional)"
                      value={newDomainDescription}
                      onChange={(e) => setNewDomainDescription(e.target.value)}
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      placeholder="Describe what this domain measures..."
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleAddDomain}
                        disabled={!newDomainName.trim()}
                      >
                        Add Domain
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setShowAddDomain(false)}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </Collapse>
            </Box>

            {/* Question Builder Section */}
            <Box sx={{ p: 3 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <QuestionIcon color="primary" />
                <Typography variant="h6" color="primary">
                  Step 2: Build Question
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create questions with multiple choice options and optional
                sub-questions.
              </Typography>

              {domains.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Please create at least one domain before adding questions.
                </Alert>
              )}

              <Stack spacing={3}>
                {/* Domain Selection */}
                <FormControl fullWidth disabled={domains.length === 0}>
                  <InputLabel>Select Domain</InputLabel>
                  <Select
                    value={currentQuestion.domainId}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        domainId: e.target.value,
                      })
                    }
                  >
                    {domains.map((domain) => (
                      <MenuItem key={domain._id} value={domain._id}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              bgcolor: domain.color,
                            }}
                          />
                          {domain.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Question Text */}
                <TextField
                  label="Question Text"
                  value={currentQuestion.text}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      text: e.target.value,
                    })
                  }
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Enter your question here..."
                  disabled={domains.length === 0}
                />

                {/* Question Type */}
                <FormControl fullWidth disabled={domains.length === 0}>
                  <InputLabel>Question Type</InputLabel>
                  <Select
                    value={currentQuestion.type}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        type: e.target.value as QuestionFormData["type"],
                      })
                    }
                  >
                    {questionTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Options Section */}
                {(currentQuestion.type === "single-choice" ||
                  currentQuestion.type === "multiple-choice") && (
                  <Box>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      sx={{ fontWeight: 500 }}
                    >
                      Answer Options
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Add options for your question. Click "Sub-Q" to add
                      follow-up questions for specific options.
                    </Typography>

                    <Stack spacing={2}>
                      {currentQuestion.options.map((option, optionIndex) => (
                        <Card
                          key={optionIndex}
                          variant="outlined"
                          sx={{ borderRadius: 2 }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            {/* Main Option */}
                            <Stack spacing={2}>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  alignItems: "center",
                                }}
                              >
                                <TextField
                                  label={`Option ${optionIndex + 1}`}
                                  value={option.label}
                                  onChange={(e) =>
                                    updateOption(optionIndex, e.target.value)
                                  }
                                  size="small"
                                  sx={{ flexGrow: 1 }}
                                  placeholder="Enter option text..."
                                />
                                <Button
                                  size="small"
                                  onClick={() =>
                                    toggleOptionExpansion(optionIndex)
                                  }
                                  variant="outlined"
                                  color="secondary"
                                  sx={{ minWidth: 100 }}
                                  endIcon={
                                    expandedOptions[`option-${optionIndex}`] ? (
                                      <ArrowUpIcon />
                                    ) : (
                                      <ArrowDownIcon />
                                    )
                                  }
                                >
                                  Sub-Q
                                </Button>
                                <IconButton
                                  color="error"
                                  onClick={() => removeOption(optionIndex)}
                                  size="small"
                                  disabled={currentQuestion.options.length <= 1}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>

                              {/* Sub-Questions Section */}
                              <Collapse
                                in={expandedOptions[`option-${optionIndex}`]}
                              >
                                <Box
                                  sx={{
                                    p: 2,
                                    bgcolor: "grey.50",
                                    borderRadius: 1,
                                    border: "1px dashed",
                                    borderColor: "divider",
                                  }}
                                >
                                  <Typography
                                    variant="subtitle2"
                                    gutterBottom
                                    color="primary"
                                  >
                                    Sub-Questions for "
                                    {option.label ||
                                      `Option ${optionIndex + 1}`}
                                    "
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mb: 2, display: "block" }}
                                  >
                                    These questions will appear when this option
                                    is selected.
                                  </Typography>

                                  <Stack spacing={2}>
                                    {option.subQuestions?.map(
                                      (subQuestion, subQuestionIndex) => (
                                        <Card
                                          key={subQuestionIndex}
                                          variant="outlined"
                                          sx={{ bgcolor: "white" }}
                                        >
                                          <CardContent sx={{ p: 2 }}>
                                            <Stack spacing={2}>
                                              <Box
                                                sx={{
                                                  display: "flex",
                                                  gap: 1,
                                                  alignItems: "center",
                                                }}
                                              >
                                                <TextField
                                                  label={`Sub-Question ${
                                                    subQuestionIndex + 1
                                                  }`}
                                                  value={subQuestion.text}
                                                  onChange={(e) =>
                                                    updateSubQuestion(
                                                      optionIndex,
                                                      subQuestionIndex,
                                                      "text",
                                                      e.target.value
                                                    )
                                                  }
                                                  size="small"
                                                  sx={{ flexGrow: 1 }}
                                                  placeholder="Enter sub-question..."
                                                />
                                                <FormControl
                                                  size="small"
                                                  sx={{ minWidth: 140 }}
                                                >
                                                  <InputLabel>Type</InputLabel>
                                                  <Select
                                                    value={subQuestion.type}
                                                    onChange={(e) =>
                                                      updateSubQuestion(
                                                        optionIndex,
                                                        subQuestionIndex,
                                                        "type",
                                                        e.target.value
                                                      )
                                                    }
                                                  >
                                                    {questionTypes.map(
                                                      (type) => (
                                                        <MenuItem
                                                          key={type.value}
                                                          value={type.value}
                                                        >
                                                          {type.label}
                                                        </MenuItem>
                                                      )
                                                    )}
                                                  </Select>
                                                </FormControl>
                                                <IconButton
                                                  color="error"
                                                  onClick={() =>
                                                    removeSubQuestion(
                                                      optionIndex,
                                                      subQuestionIndex
                                                    )
                                                  }
                                                  size="small"
                                                >
                                                  <DeleteIcon />
                                                </IconButton>
                                              </Box>

                                              {/* Sub-Question Options */}
                                              {(subQuestion.type ===
                                                "single-choice" ||
                                                subQuestion.type ===
                                                  "multiple-choice") && (
                                                <Box
                                                  sx={{
                                                    ml: 2,
                                                    pl: 2,
                                                    borderLeft: "2px solid",
                                                    borderColor: "divider",
                                                  }}
                                                >
                                                  <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    gutterBottom
                                                  >
                                                    Sub-Question Options:
                                                  </Typography>
                                                  <Stack
                                                    spacing={1}
                                                    sx={{ mt: 1 }}
                                                  >
                                                    {subQuestion.options.map(
                                                      (
                                                        subOption,
                                                        subOptionIndex
                                                      ) => (
                                                        <Box
                                                          key={subOptionIndex}
                                                          sx={{
                                                            display: "flex",
                                                            gap: 1,
                                                            alignItems:
                                                              "center",
                                                          }}
                                                        >
                                                          <TextField
                                                            label={`Sub-Option ${
                                                              subOptionIndex + 1
                                                            }`}
                                                            value={
                                                              subOption.label
                                                            }
                                                            onChange={(e) =>
                                                              updateSubQuestionOption(
                                                                optionIndex,
                                                                subQuestionIndex,
                                                                subOptionIndex,
                                                                e.target.value
                                                              )
                                                            }
                                                            size="small"
                                                            sx={{ flexGrow: 1 }}
                                                            placeholder="Enter sub-option..."
                                                          />
                                                          <IconButton
                                                            color="error"
                                                            onClick={() =>
                                                              removeSubQuestionOption(
                                                                optionIndex,
                                                                subQuestionIndex,
                                                                subOptionIndex
                                                              )
                                                            }
                                                            size="small"
                                                            disabled={
                                                              subQuestion
                                                                .options
                                                                .length <= 1
                                                            }
                                                          >
                                                            <DeleteIcon />
                                                          </IconButton>
                                                        </Box>
                                                      )
                                                    )}
                                                    <Button
                                                      startIcon={<AddIcon />}
                                                      onClick={() =>
                                                        addSubQuestionOption(
                                                          optionIndex,
                                                          subQuestionIndex
                                                        )
                                                      }
                                                      size="small"
                                                      variant="text"
                                                      sx={{
                                                        alignSelf: "flex-start",
                                                      }}
                                                    >
                                                      Add Sub-Option
                                                    </Button>
                                                  </Stack>
                                                </Box>
                                              )}
                                            </Stack>
                                          </CardContent>
                                        </Card>
                                      )
                                    )}

                                    <Button
                                      startIcon={<AddIcon />}
                                      onClick={() =>
                                        addSubQuestion(optionIndex)
                                      }
                                      size="small"
                                      variant="outlined"
                                      sx={{ alignSelf: "flex-start" }}
                                    >
                                      Add Sub-Question
                                    </Button>
                                  </Stack>
                                </Box>
                              </Collapse>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}

                      <Button
                        startIcon={<AddIcon />}
                        onClick={addOption}
                        size="small"
                        variant="outlined"
                        sx={{ alignSelf: "flex-start" }}
                      >
                        Add Option
                      </Button>
                    </Stack>
                  </Box>
                )}

                {/* Additional Settings */}
                <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <SettingsIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" color="primary">
                      Additional Settings
                    </Typography>
                  </Box>

                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={currentQuestion.required}
                          onChange={(e) =>
                            setCurrentQuestion({
                              ...currentQuestion,
                              required: e.target.checked,
                            })
                          }
                          disabled={domains.length === 0}
                        />
                      }
                      label="Mark as required question"
                    />

                    <TextField
                      label="Help Text (Optional)"
                      value={currentQuestion.helpText}
                      onChange={(e) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          helpText: e.target.value,
                        })
                      }
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      placeholder="Add helpful instructions for this question..."
                      disabled={domains.length === 0}
                    />
                  </Stack>
                </Box>

                {/* Add Question Button */}
                <Button
                  variant="contained"
                  onClick={addQuestionToQuestionnaire}
                  disabled={
                    !currentQuestion.text.trim() || !currentQuestion.domainId
                  }
                  fullWidth
                  size="large"
                  sx={{ py: 1.5 }}
                >
                  Add Question to Questionnaire
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Box>

        {/* Right Panel - Questions List */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper elevation={2} sx={{ borderRadius: 2, height: "fit-content" }}>
            <Box
              sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="h6" color="primary">
                    Step 3: Review & Save
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {questions.length} question
                    {questions.length !== 1 ? "s" : ""} added
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={!title.trim() || questions.length === 0}
                  color="success"
                  size="large"
                >
                  Save Questionnaire
                </Button>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              {questions.length === 0 ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: "center",
                    color: "text.secondary",
                    border: "2px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <QuestionIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No questions added yet
                  </Typography>
                  <Typography variant="body2">
                    Use the form on the left to create your first question
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {questions.map((question, index) => (
                    <Card
                      key={index}
                      variant="outlined"
                      sx={{ borderRadius: 2 }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 2,
                          }}
                        >
                          <Box sx={{ flexGrow: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Question {index + 1}
                              </Typography>
                              <Chip
                                label={
                                  domains.find(
                                    (d) => d._id === question.domainId
                                  )?.name || "Unknown Domain"
                                }
                                size="small"
                                sx={{
                                  bgcolor:
                                    domains.find(
                                      (d) => d._id === question.domainId
                                    )?.color || "#gray",
                                  color: "white",
                                  height: 20,
                                  fontSize: "0.7rem",
                                }}
                              />
                              {question.required && (
                                <Chip
                                  label="Required"
                                  size="small"
                                  color="error"
                                  sx={{ height: 20, fontSize: "0.7rem" }}
                                />
                              )}
                            </Box>

                            <Typography
                              variant="body1"
                              gutterBottom
                              sx={{ fontWeight: 500 }}
                            >
                              {question.text}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Type:{" "}
                              {
                                questionTypes.find(
                                  (t) => t.value === question.type
                                )?.label
                              }
                              {question.options.length > 0 &&
                                ` • ${question.options.length} options`}
                              {question.options.some(
                                (opt) =>
                                  opt.subQuestions &&
                                  opt.subQuestions.length > 0
                              ) && ` • Has sub-questions`}
                            </Typography>

                            {question.options.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                {question.options.map((opt, i) => (
                                  <Badge
                                    key={i}
                                    badgeContent={opt.subQuestions?.length || 0}
                                    color="secondary"
                                    sx={{ mr: 1, mb: 0.5 }}
                                    invisible={
                                      !opt.subQuestions ||
                                      opt.subQuestions.length === 0
                                    }
                                  >
                                    <Chip
                                      label={opt.label}
                                      size="small"
                                      variant="outlined"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                  </Badge>
                                ))}
                              </Box>
                            )}
                          </Box>

                          <IconButton
                            color="error"
                            onClick={() => removeQuestion(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default QuestionnaireBuilder;
