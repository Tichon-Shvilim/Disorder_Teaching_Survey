import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Alert, Snackbar, CircularProgress, Backdrop } from "@mui/material";
import QuestionnaireBuilder from "./QuestionnaireBuilder";
import { questionnaireApiService } from "./Api-Requests/questionnaireApi";
import type { CreateQuestionnaireRequest } from "./models/FormModels";

const CreateQuestionnaire: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSave = async (data: CreateQuestionnaireRequest) => {
    try {
      setIsLoading(true);
      
      // Call the API service to create the questionnaire
      const response = await questionnaireApiService.createQuestionnaire(data);

      if (!response.success) {
        throw new Error(response.error || "Failed to save questionnaire");
      }

      setNotification({
        open: true,
        message: "Questionnaire created successfully!",
        severity: "success",
      });

      // Navigate to questionnaire list after a short delay
      setTimeout(() => {
        navigate("/admin/questionnaires");
      }, 2000);
    } catch (error) {
      console.error("Error saving questionnaire:", error);
      setNotification({
        open: true,
        message: error instanceof Error ? error.message : "Failed to save questionnaire. Please try again.",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Questionnaire Builder */}
      <QuestionnaireBuilder onSave={handleSave} />

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateQuestionnaire;
