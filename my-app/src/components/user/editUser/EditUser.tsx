import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  TextField,
  Button,
  Paper,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Box,
  IconButton,
  CardContent,
  Container,
  Divider,
  Chip,
  Avatar,
  Alert
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Save,
  Cancel,
  AdminPanelSettings,
  School,
  Psychology,
  Edit
} from "@mui/icons-material";
import {
  getItemById,
  updateItem,
} from "../Api-Requests/genericRequests";
import type UserModel from "../UserModel";
import { toast } from 'react-toastify';

interface FormData {
  name: string;
  email: string;
  password: string;
  role: string;
  status: 'active' | 'inactive';
}

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

const EditUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [originalUser, setOriginalUser] = useState<UserModel | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    role: "",
    status: "active"
  });

  const roleOptions = [
    { value: 'Admin', label: t('users.administrator'), icon: AdminPanelSettings, color: '#f44336' },
    { value: 'Teacher', label: t('users.teacher'), icon: School, color: '#2196f3' },
    { value: 'Therapist', label: t('users.therapist'), icon: Psychology, color: '#4caf50' }
  ];

  useEffect(() => {
    if (id) {
      setFetchLoading(true);
      getItemById<UserModel>("api/users", id)
        .then((response) => {
          const user = response.data;
          setOriginalUser(user);
          setFormData({
            name: user.name,
            email: user.email,
            password: "", // Don't prefill password for security
            role: user.role,
            status: user.status || "active"
          });
        })
        .catch((error) => {
          console.error("Error fetching user:", error);
          toast.error(t("users.failedToLoadUserData"));
          navigate('/layout/user-management');
        })
        .finally(() => setFetchLoading(false));
    }
  }, [id, navigate]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('users.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('users.nameTooShort');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('users.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('users.validEmailRequired');
    }
    
    if (formData.password && formData.password.length < 6) {
      newErrors.password = t('users.passwordMinLength');
    }
    
    if (!formData.role) {
      newErrors.role = t('users.roleRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (field !== 'status' && errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm() || !id) return;
    
    setLoading(true);
    
    // Create update object - only include password if it's been changed
    const updateData: Partial<UserModel> = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      status: formData.status
    };
    
    // Only include password if user entered one
    if (formData.password.trim()) {
      updateData.password = formData.password;
    }

    try {
      await updateItem("api/users", id, updateData);
      toast.success(t("users.userUpdatedSuccessfully"));
      navigate('/layout/user-management');
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(t("users.failedToUpdateUser"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/layout/user-management');
  };

  const getRoleIcon = (role: string) => {
    const roleOption = roleOptions.find(option => option.value === role);
    if (!roleOption) return Person;
    return roleOption.icon;
  };

  const getRoleColor = (role: string) => {
    const roleOption = roleOptions.find(option => option.value === role);
    return roleOption?.color || '#757575';
  };

  if (fetchLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography>{t('users.loadingUserData')}</Typography>
        </Paper>
      </Container>
    );
  }

  if (!originalUser) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error">{t('users.userNotFound')}</Typography>
          <Button onClick={handleCancel} sx={{ mt: 2 }}>
            {t('users.backToUserManagement')}
          </Button>
        </Paper>
      </Container>
    );
  }

  const RoleIcon = getRoleIcon(originalUser.role);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 4,
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: '2rem'
              }}
            >
              <RoleIcon sx={{ fontSize: '2.5rem' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                {t('users.editUser')}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                {originalUser.name}
              </Typography>
              <Chip
                label={originalUser.role}
                sx={{ 
                  mt: 1,
                  bgcolor: getRoleColor(originalUser.role),
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Form */}
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Edit color="primary" />
              {t('users.userInformation')}
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 3 }}>
              <TextField
                label={t('users.fullName')}
                value={formData.name}
                onChange={handleInputChange('name')}
                fullWidth
                error={!!errors.name}
                helperText={errors.name}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              
              <TextField
                label={t('users.emailAddress')}
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                fullWidth
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />

              <FormControl fullWidth error={!!errors.role}>
                <InputLabel>{t('users.role')}</InputLabel>
                <Select 
                  value={formData.role} 
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  label={t('users.role')}
                >
                  {roleOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconComponent sx={{ color: option.color }} />
                          {option.label}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
                {errors.role && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.role}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>{t('users.status')}</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    status: e.target.value as 'active' | 'inactive' 
                  }))}
                  label={t('users.status')}
                >
                  <MenuItem value="active">
                    <Chip label={t('users.active')} color="success" size="small" sx={{ mr: 1 }} />
                    {t('users.active')}
                  </MenuItem>
                  <MenuItem value="inactive">
                    <Chip label={t('users.inactive')} color="error" size="small" sx={{ mr: 1 }} />
                    {t('users.inactive')}
                  </MenuItem>
                </Select>
              </FormControl>
              
              <Divider sx={{ my: 2 }} />
              
              <Alert severity="info" sx={{ mb: 2 }}>
                {t('users.passwordLeaveBlankHint')}
              </Alert>
              
              <TextField
                label={t('users.newPasswordOptional')}
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange('password')}
                fullWidth
                error={!!errors.password}
                helperText={errors.password || t('users.passwordHint')}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
              <Button
                onClick={handleCancel}
                variant="outlined"
                startIcon={<Cancel />}
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={loading}
                size="large"
              >
                {loading ? t('users.updating') : t('users.updateUser')}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Paper>
    </Container>
  );
};

export default EditUser;
