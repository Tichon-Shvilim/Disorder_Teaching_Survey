import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Psychology as TherapyIcon
} from "@mui/icons-material";
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { 
  assignTherapistToStudent, 
  removeTherapistFromStudent,
  type Student
} from "./Api-Requests/StudentAPIService";
import { getAllTherapists, type User } from "./Api-Requests/userHttpService";
import { PermissionGate, usePermissions } from '../common';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface TherapistAssignmentProps {
  student: Student;
  onUpdate: (updatedStudent: Student) => void;
}

const TherapistAssignment: React.FC<TherapistAssignmentProps> = ({ 
  student, 
  onUpdate 
}) => {
  const { t } = useTranslation();
  const [therapists, setTherapists] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  // Permission system
  const { hasPermission } = usePermissions();

  // Memoize the permission check to prevent endless re-renders
  const canAssignTherapist = useMemo(() => {
    return hasPermission('student.assign_therapist');
  }, [hasPermission]);

  // Load all therapists - only if user has permission to assign therapists
  const loadTherapists = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllTherapists();
      setTherapists(response.data);
    } catch (error) {
      console.error("Error loading therapists:", error);
      toast.error(t('therapists.failedToLoadTherapists'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedTherapistId("");
  }, []);

  useEffect(() => {
    if (canAssignTherapist) {
      loadTherapists();
    }
  }, [canAssignTherapist, loadTherapists]);

  const handleAssignTherapist = async () => {
    if (!selectedTherapistId || selectedTherapistId === "") {
      toast.error(t('therapists.pleaseSelectTherapist'));
      return;
    }

    const therapist = therapists.find(t => t.id === selectedTherapistId);
    
    if (!therapist) {
      toast.error(t('therapists.therapistNotFound'));
      return;
    }

    try {
      setAssigning(true);
      
      const response = await assignTherapistToStudent(student._id, {
        therapistId: therapist.id,
        therapistName: therapist.name
      });
      
      onUpdate(response.data.student);
      setDialogOpen(false);
      setSelectedTherapistId("");
      toast.success(t('therapists.assignTherapistSuccess'));
    } catch (error: unknown) {
      console.error("Error assigning therapist:", error);
      const errorMessage = (error as ApiError).response?.data?.message || t('therapists.failedToAssignTherapist');
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveTherapist = async (therapistId: string, therapistName: string) => {
    if (!confirm(t('therapists.confirmRemoveTherapist', { therapistName, studentName: student.name }))) {
      return;
    }

    try {
      const response = await removeTherapistFromStudent(student._id, {
        therapistId
      });
      
      onUpdate(response.data.student);
      toast.success(t('therapists.removeTherapistSuccess'));
    } catch (error: unknown) {
      console.error("Error removing therapist:", error);
      const errorMessage = (error as ApiError).response?.data?.message || t('therapists.failedToAssignTherapist');
      toast.error(errorMessage);
    }
  };

  const assignedTherapistIds = student.therapists?.map(t => t._id) || [];
  const availableTherapists = therapists.filter(t => !assignedTherapistIds.includes(t.id));

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TherapyIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h3">
            {t('therapists.assignedTherapists')}
          </Typography>
          <PermissionGate permission="student.assign_therapist">
            <Button
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{ ml: 'auto' }}
              variant="outlined"
              size="small"
              disabled={availableTherapists.length === 0}
            >
              {t('therapists.assignTherapist')}
            </Button>
          </PermissionGate>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={20} />
          </Box>
        ) : (
          <>
            {!student.therapists || student.therapists.length === 0 ? (
              <Alert severity="info">
                {t('therapists.noTherapistsAssigned')}
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {student.therapists.map((therapist) => (
                  <PermissionGate 
                    key={therapist._id} 
                    permission="student.assign_therapist"
                    fallback={
                      <Chip
                        label={therapist.name}
                        color="primary"
                        variant="outlined"
                      />
                    }
                  >
                    <Chip
                      label={therapist.name}
                      color="primary"
                      variant="outlined"
                      deleteIcon={<DeleteIcon />}
                      onDelete={() => handleRemoveTherapist(therapist._id, therapist.name)}
                    />
                  </PermissionGate>
                ))}
              </Box>
            )}
          </>
        )}

        {/* Assign Therapist Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{t('therapists.assignTherapist')} - {student.name}</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>{t('therapists.selectTherapist')}</InputLabel>
              <Select
                value={selectedTherapistId || ""}
                onChange={(e) => {
                  setSelectedTherapistId(e.target.value as string);
                }}
                label={t('therapists.selectTherapist')}
              >
                {availableTherapists.map((therapist) => (
                    <MenuItem key={therapist.id} value={therapist.id}>
                      {therapist.name} ({therapist.email})
                    </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {availableTherapists.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {t('therapists.allTherapistsAssigned')}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAssignTherapist}
              variant="contained"
              disabled={!selectedTherapistId || selectedTherapistId === "" || assigning}
              startIcon={assigning ? <CircularProgress size={16} /> : <AddIcon />}
            >
              {assigning ? t('common.loading') : t('therapists.assignTherapist')}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TherapistAssignment;
