import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type { SelectChangeEvent } from "@mui/material/Select";
import { getAllItems, addItem } from "./Api-Requests/genericRequests";
import type { DomainModel } from "./models/DomainModel";
const CreatForm: React.FC = () => {
  const [domains, setDomains] = useState<DomainModel[]>([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState([{ value: 1, label: "" }]);
  const [success, setSuccess] = useState("");
  const [dirty, setDirty] = useState(false);

  // Load domains on mount
  useEffect(() => {
    getAllItems<DomainModel>("/api/domains")
      .then((res) => setDomains(Array.isArray(res.data) ? res.data : [res.data]))
      .catch(() => setDomains([]));
  }, []);

  // Add new domain
  const handleAddDomain = async () => {
    const res = await addItem<DomainModel>("/api/domains", { name: newDomainName });
    const newDomain = res.data;
    setDomains([...domains, newDomain]);
    setSelectedDomain(newDomain._id ?? "");
    setNewDomainName("");
    setShowAddDomain(false);
    setDirty(true);
  };

  // Add new option
  const addOption = () => {
    setOptions([...options, { value: options.length + 1, label: "" }]);
    setDirty(true);
  };

  // Update option label
  const updateOption = (idx: number, label: string) => {
    setOptions(options.map((opt, i) => (i === idx ? { ...opt, label } : opt)));
    setDirty(true);
  };

  // Update question text
  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestionText(e.target.value);
    setDirty(true);
  };

  // Update selected domain
  const handleDomainChange = (e: SelectChangeEvent) => {
    if (e.target.value === "add-new") {
      setShowAddDomain(true);
      setSelectedDomain("");
    } else {
      setSelectedDomain(e.target.value as string);
      setShowAddDomain(false);
      setDirty(true);
    }
  };

  // Save question
  const handleSave = async () => {
    await addItem("api/questions", {
      text: questionText,
      domainId: selectedDomain,
      options: options.filter((opt) => opt.label.trim() !== ""),
    });
    setQuestionText("");
    setOptions([{ value: 1, label: "" }]);
    setSuccess("Question added!");
    setDirty(false);
    setTimeout(() => setSuccess(""), 2000);
  };

  return (
    <Box
      sx={{
        maxWidth: 500,
        mx: "auto",
        mt: 4,
        p: 3,
        border: "1px solid #eee",
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Add New Question
      </Typography>
      <Select
        value={selectedDomain}
        onChange={handleDomainChange}
        displayEmpty
        fullWidth
        sx={{ mb: 2 }}
      >
        <MenuItem value="" disabled>
          Choose Domain
        </MenuItem>
        {domains.map((domain) => (
          <MenuItem key={domain._id} value={domain._id}>
            {domain.name}
          </MenuItem>
        ))}
        <MenuItem value="add-new">+ Add New Domain</MenuItem>
      </Select>
      {showAddDomain && (
        <Box sx={{ mb: 2, display: "flex" }}>
          <TextField
            label="New Domain Name"
            value={newDomainName}
            onChange={(e) => setNewDomainName(e.target.value)}
            sx={{ mr: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleAddDomain}
            disabled={!newDomainName}
          >
            Save
          </Button>
        </Box>
      )}
      <TextField
        label="Question Text"
        value={questionText}
        onChange={handleQuestionTextChange}
        fullWidth
        sx={{ mb: 2 }}
      />
      {options.map((opt, idx) => (
        <Box key={idx} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <TextField
            label={`Option ${idx + 1}`}
            value={opt.label}
            onChange={(e) => updateOption(idx, e.target.value)}
            sx={{ mr: 1 }}
          />
          {idx === options.length - 1 && (
            <IconButton onClick={addOption} color="primary">
              <AddIcon />
            </IconButton>
          )}
        </Box>
      ))}
      <Button
        variant="contained"
        sx={{
          mt: 2,
          backgroundColor: dirty ? "orange" : undefined,
        }}
        onClick={handleSave}
        disabled={
          !questionText || !selectedDomain || options.some((opt) => !opt.label)
        }
      >
        Save Question
      </Button>
      {dirty && (
        <Typography color="warning.main" sx={{ mt: 1 }}>
          You have unsaved changes!
        </Typography>
      )}
      {success && (
        <Typography color="success.main" sx={{ mt: 2 }}>
          {success}
        </Typography>
      )}
    </Box>
  );
};

export default CreatForm;