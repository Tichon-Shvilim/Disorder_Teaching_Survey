import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const steps = ['Personal Information', 'Account Security', 'Role Selection'];

  const roleOptions = [
    { value: 'Admin', label: 'Administrator', icon: AdminPanelSettings, description: 'Full system access and management' },
    { value: 'Teacher', label: 'Teacher', icon: School, description: 'Manage classes and students' },
    { value: 'Therapist', label: 'Therapist', icon: Psychology, description: 'Work with individual students' }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};
    
    switch (step) {
      case 0: // Personal Information
        if (!formData.name.trim()) {
          newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
          newErrors.name = 'Name must be at least 2 characters';
        }
        
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        break;
        
      case 1: // Account Security
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
        
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
        
      case 2: // Role Selection
        if (!formData.role) {
          newErrors.role = 'Please select a role';
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
      toast.success("User created successfully!");
      navigate('/layout/user-management');
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Fade in timeout={300}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountCircle color="primary" />
                Personal Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Let's start with your basic information
              </Typography>
              
              <TextField
                label="Full Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                fullWidth
                margin="normal"
                error={!!errors.name}
                helperText={errors.name}
                placeholder="Enter your full name"
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              
              <TextField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                fullWidth
                margin="normal"
                error={!!errors.email}
                helperText={errors.email}
                placeholder="Enter your email address"
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
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lock color="primary" />
                Account Security
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create a secure password for your account
              </Typography>
              
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange('password')}
                fullWidth
                margin="normal"
                error={!!errors.password}
                helperText={errors.password || "Minimum 6 characters"}
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
              
              <TextField
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                fullWidth
                margin="normal"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
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
            <Box>
              <Typography variant="h6" gutterBottom>
                Choose Your Role
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select the role that best describes your position
              </Typography>
              
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
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconComponent 
                          sx={{ 
                            fontSize: 40, 
                            color: formData.role === option.value ? 'primary.main' : 'text.secondary' 
                          }} 
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {option.label}
                            {formData.role === option.value && (
                              <Chip 
                                label="Selected" 
                                size="small" 
                                color="primary" 
                                icon={<Check />}
                              />
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {option.description}
                          </Typography>
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
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Create Account
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Join our teaching survey platform
          </Typography>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Step {activeStep + 1} of {steps.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(getStepProgress())}% Complete
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
            startIcon={<ArrowBack />}
            variant="outlined"
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              startIcon={loading ? undefined : <Check />}
              size="large"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              endIcon={<ArrowForward />}
              size="large"
            >
              Next
            </Button>
          )}
        </Box>

        {/* Sign In Link */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{" "}
            <Button 
              variant="text" 
              onClick={() => navigate('/signin')}
              sx={{ textTransform: 'none' }}
            >
              Sign In
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default SignUp;
