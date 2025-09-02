import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Paper,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  Card,
  CardContent,
  Container,
  Divider
} from "@mui/material";
import {
  ArrowBack,
  Person,
  School,
  Email,
  Phone,
  CalendarToday
} from "@mui/icons-material";
import { getItemById } from "./Api-Requests/genericRequests";
import { toast } from 'react-toastify';
import TherapistAssignment from './TherapistAssignment';
import { type Student as StudentType } from './Api-Requests/StudentAPIService';
import { PermissionGate, usePermissions } from '../common';

interface Student {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  therapists?: Array<{
    _id: string;
    name: string;
  }>;
  class?: {
    _id: string;
    classNumber: string;
  };
  dateOfBirth?: string;
  // Add other student fields as needed
}

const StudentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // Permission system  
  usePermissions();

  useEffect(() => {
    if (id) {
      setLoading(true);
      getItemById<Student>("api/students", id)
        .then((response) => {
          setStudent(response.data);
        })
        .catch((error) => {
          console.error("Error fetching student:", error);
          toast.error("Failed to load student details");
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleBack = () => {
    navigate('/layout/students');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Loading student details...</Typography>
        </Paper>
      </Container>
    );
  }

  if (!student) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error">Student not found</Typography>
          <Button onClick={handleBack} sx={{ mt: 2 }}>
            Back to Students
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
          color: 'white',
          p: 4,
          position: 'relative'
        }}>
          <Button
            onClick={handleBack}
            startIcon={<ArrowBack />}
            sx={{ 
              color: 'white', 
              mb: 2,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Back to Students
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: '2rem'
              }}
            >
              <Person sx={{ fontSize: '2.5rem' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                {student.name}
              </Typography>
              <Chip
                label="Student"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Person color="primary" />
            Student Information
          </Typography>
          
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Full Name
                </Typography>
                <Typography variant="h6">
                  {student.name}
                </Typography>
              </CardContent>
            </Card>

            {student.email && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email fontSize="small" />
                    Email Address
                  </Typography>
                  <Typography variant="body1">
                    {student.email}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {student.phone && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone fontSize="small" />
                    Phone Number
                  </Typography>
                  <Typography variant="body1">
                    {student.phone}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {student.class && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School fontSize="small" />
                    Class
                  </Typography>
                  <Chip
                    label={student.class.classNumber}
                    color="primary"
                    onClick={() => navigate(`/layout/classes/${student.class?._id}`)}
                    sx={{ cursor: 'pointer' }}
                  />
                </CardContent>
              </Card>
            )}

            {student.dateOfBirth && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday fontSize="small" />
                    Date of Birth
                  </Typography>
                  <Typography variant="body1">
                    {new Date(student.dateOfBirth).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Therapist Assignment Section */}
          {student._id && (
            <TherapistAssignment 
              student={student as StudentType} 
              onUpdate={(updatedStudent) => setStudent(updatedStudent as Student)} 
            />
          )}

          <Divider sx={{ my: 4 }} />

          {/* Form Actions */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', fontSize: '1rem' }}>
              Form Assessment
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(`../forms/fill`, { state: { studentId: id, studentName: student?.name } })}
                sx={{ 
                  borderColor: '#2563eb', 
                  color: '#2563eb',
                  '&:hover': { 
                    borderColor: '#1d4ed8', 
                    backgroundColor: '#f0f9ff' 
                  }
                }}
              >
                Fill Form (V1)
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(`../forms/submissions`, { state: { studentId: id, studentName: student?.name } })}
                sx={{ 
                  borderColor: '#16a34a', 
                  color: '#16a34a',
                  '&:hover': { 
                    borderColor: '#15803d', 
                    backgroundColor: '#f0fdf4' 
                  }
                }}
              >
                View Submissions (V1)
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(`../forms/fill`, { state: { studentId: id, studentName: student?.name } })}
                sx={{ 
                  borderColor: '#6366f1', 
                  color: '#6366f1',
                  '&:hover': { 
                    borderColor: '#4f46e5', 
                    backgroundColor: '#f0f3ff' 
                  }
                }}
              >
                Fill Form
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(`../forms/submissions`, { state: { studentId: id, studentName: student?.name } })}
                sx={{ 
                  borderColor: '#14b8a6', 
                  color: '#14b8a6',
                  '&:hover': { 
                    borderColor: '#0f766e', 
                    backgroundColor: '#f0fdfa' 
                  }
                }}
              >
                View Submissions
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <PermissionGate permission="student.edit">
              <Button
                variant="outlined"
                onClick={() => navigate(`/layout/students/${id}/edit`)}
              >
                Edit Student
              </Button>
            </PermissionGate>
            <Button
              variant="contained"
              onClick={handleBack}
            >
              Back to Students
            </Button>
          </Box>
        </CardContent>
      </Paper>
    </Container>
  );
};

export default StudentDetails;
