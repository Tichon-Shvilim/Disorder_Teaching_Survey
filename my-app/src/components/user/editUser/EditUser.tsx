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
    { value: 'Admin', label: 'Administrator', icon: AdminPanelSettings, color: '#f44336' },
    { value: 'Teacher', label: 'Teacher', icon: School, color: '#2196f3' },
    { value: 'Therapist', label: 'Therapist', icon: Psychology, color: '#4caf50' }
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
          toast.error("Failed to load user data");
          navigate('/layout/user-management');
        })
        .finally(() => setFetchLoading(false));
    }
  }, [id, navigate]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
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
    
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.role) {
      newErrors.role = 'Please select a role';
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
      toast.success("User updated successfully!");
      navigate('/layout/user-management');
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
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
          <Typography>Loading user data...</Typography>
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
                Edit User
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
              User Information
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 3 }}>
              <TextField
                label="Full Name"
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
                label="Email Address"
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
                <InputLabel>Role</InputLabel>
                <Select 
                  value={formData.role} 
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  label="Role"
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    status: e.target.value as 'active' | 'inactive' 
                  }))}
                  label="Status"
                >
                  <MenuItem value="active">
                    <Chip label="Active" color="success" size="small" sx={{ mr: 1 }} />
                    Active
                  </MenuItem>
                  <MenuItem value="inactive">
                    <Chip label="Inactive" color="error" size="small" sx={{ mr: 1 }} />
                    Inactive
                  </MenuItem>
                </Select>
              </FormControl>
              
              <Divider sx={{ my: 2 }} />
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Leave password blank to keep current password, or enter a new one to change it.
              </Alert>
              
              <TextField
                label="New Password (Optional)"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange('password')}
                fullWidth
                error={!!errors.password}
                helperText={errors.password || "Minimum 6 characters if changing"}
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
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={loading}
                size="large"
              >
                {loading ? 'Updating...' : 'Update User'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Paper>
    </Container>
  );
};

export default EditUser;
