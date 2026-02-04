import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Container,
  Fade
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  ArrowBack,
  ArrowForward,
  Check,
  AccountCircle,
  Email,
  Lock,
  AdminPanelSettings,
  School,
  Psychology
} from "@mui/icons-material";
import { addItem } from "../Api-Requests/genericRequests";
import type UserModel from "../UserModel";
import { toast } from 'react-toastify';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
}

const SignUp: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: ""
  });

  const steps = [
    t('auth.personalInformation', 'Personal Information'),
    t('auth.accountSecurity', 'Account Security'),
    t('auth.roleSelection', 'Role Selection')
  ];

  const roleOptions = [
    { value: 'Admin', label: t('auth.administrator', 'Administrator'), icon: AdminPanelSettings, description: t('auth.fullSystemAccess', 'Full system access and management') },
    { value: 'Teacher', label: t('users.teacher', 'Teacher'), icon: School, description: t('auth.manageClassesAndStudents', 'Manage classes and students') },
    { value: 'Therapist', label: t('users.therapist', 'Therapist'), icon: Psychology, description: t('auth.workWithIndividualStudents', 'Work with individual students') }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};
    
    switch (step) {
      case 0: // Personal Information
        if (!formData.name.trim()) {
          newErrors.name = t('auth.nameRequired');
        } else if (formData.name.trim().length < 2) {
          newErrors.name = t('auth.nameMinLength');
        }
        
        if (!formData.email.trim()) {
          newErrors.email = t('auth.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = t('auth.invalidEmail');
        }
        break;
        
      case 1: // Account Security
        if (!formData.password) {
          newErrors.password = t('auth.passwordRequired');
        } else if (formData.password.length < 6) {
          newErrors.password = t('auth.passwordMinLength');
        }
        
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = t('auth.confirmPasswordRequired');
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = t('auth.passwordsDoNotMatch');
        }
        break;
        
      case 2: // Role Selection
        if (!formData.role) {
          newErrors.role = t('auth.roleRequired');
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setErrors({});
  };

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({ ...prev, role }));
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;
    
    setLoading(true);
    const user: UserModel = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role,
      status: 'active'
    };

    try {
      await addItem<UserModel>("api/users/register", user);
      toast.success(t('users.userCreatedSuccessfully'));
      navigate('/layout/user-management');
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(t('users.failedToCreateUser'));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Fade in timeout={300}>
            <Box sx={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <AccountCircle color="primary" />
                {t('auth.personalInformation')}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 3 }}
              >
                <bdi style={{ display: 'block', direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }}>{t('auth.letsStartBasicInfo')}</bdi>
              </Typography>
              
              <TextField
                label={t('auth.fullName')}
                value={formData.name}
                onChange={handleInputChange('name')}
                fullWidth
                margin="normal"
                error={!!errors.name}
                helperText={errors.name}
                placeholder={t('auth.enterFullName')}
                inputProps={{ dir: isRTL ? 'rtl' : 'ltr' }}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              
              <TextField
                label={t('auth.emailAddress')}
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                fullWidth
                margin="normal"
                error={!!errors.email}
                helperText={errors.email}
                placeholder={t('auth.enterEmail')}
                inputProps={{ dir: isRTL ? 'rtl' : 'ltr' }}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>
          </Fade>
        );
        
      case 1:
        return (
          <Fade in timeout={300}>
            <Box sx={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <Lock color="primary" />
                {t('auth.accountSecurity')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('auth.createSecurePassword')}
              </Typography>
              
              <TextField
                label={t('auth.password')}
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange('password')}
                fullWidth
                margin="normal"
                error={!!errors.password}
                helperText={errors.password || t('auth.minimumCharacters')}
                inputProps={{ dir: isRTL ? 'rtl' : 'ltr' }}
                InputProps={{
                  startAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="start"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
              
              <TextField
                label={t('auth.confirmPassword')}
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                fullWidth
                margin="normal"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                inputProps={{ dir: isRTL ? 'rtl' : 'ltr' }}
                InputProps={{
                  startAdornment: (
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="start"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
            </Box>
          </Fade>
        );
        
      case 2:
        return (
          <Fade in timeout={300}>
            <Box sx={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <div dir="rtl" style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '8px', textAlign: 'right' }}>
                {t('auth.chooseYourRole')}
              </div>
              <div dir="rtl" style={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)', marginBottom: '24px', textAlign: 'right' }}>
                {t('auth.selectRoleDescription')}
              </div>
              
              {errors.role && (
                <Alert severity="error" sx={{ mb: 2 }}>{errors.role}</Alert>
              )}
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {roleOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <Card
                      key={option.value}
                      sx={{
                        cursor: 'pointer',
                        border: formData.role === option.value ? 2 : 1,
                        borderColor: formData.role === option.value ? 'primary.main' : 'divider',
                        '&:hover': {
                          boxShadow: 2,
                          borderColor: 'primary.main'
                        },
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => handleRoleSelect(option.value)}
                    >
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <IconComponent 
                          sx={{ 
                            fontSize: 40, 
                            color: formData.role === option.value ? 'primary.main' : 'text.secondary' 
                          }} 
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: isRTL ? 'row-reverse' : 'row', textAlign: 'right' }}>
                            {formData.role === option.value && (
                              <Chip 
                                label={t('common.selected')} 
                                size="small" 
                                color="primary" 
                                icon={<Check />}
                                sx={{ direction: isRTL ? 'rtl' : 'ltr', flexDirection: isRTL ? 'row-reverse' : 'row', 
                                  padding: '15px'
                                }}
                              />
                            )}
                            {option.label}
                          </Typography>
                          <div dir="rtl" style={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)', textAlign: 'right' }}>
                            {option.description}
                          </div>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          </Fade>
        );
        
      default:
        return null;
    }
  };

  const getStepProgress = () => ((activeStep + 1) / steps.length) * 100;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', direction: isRTL ? 'rtl' : 'ltr' }}>
            {t('auth.createAccount')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {t('auth.joinPlatform')}
          </Typography>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('auth.stepProgress', { current: activeStep + 1, total: steps.length })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('auth.percentComplete', { percent: Math.round(getStepProgress()) })}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getStepProgress()} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ minHeight: 300 }}>
          {renderStepContent(activeStep)}
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={isRTL ? <ArrowForward /> : <ArrowBack />}
            variant="outlined"
          >
            {t('common.back')}
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              startIcon={loading ? undefined : <Check />}
              size="large"
            >
              {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              endIcon={isRTL ? <ArrowBack /> : <ArrowForward />}
              size="large"
            >
              {t('common.next')}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default SignUp;
