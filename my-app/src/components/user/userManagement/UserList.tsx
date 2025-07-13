import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Button,
  Box,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { getAllItems, updateItem } from "../Api-Requests/genericRequests";
import type UserModel from "../UserModel";

const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = React.useState<UserModel[]>([]);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = React.useState<UserModel | null>(null);

  // Function to fetch all users
  const fetchUsers = async () => {
    try {
      // "users" is the route for your API, adjust if needed
      const response = await getAllItems<UserModel[]>("api/users/");
      setUsers(response.data); // If your httpService returns { data: [...] }
      console.log("Fetched users:", response.data);
    } catch (error: unknown) {
      console.error("Failed to fetch users:", error);
      
      // Check if it's an authentication error
      const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        console.error("Authentication error - user may need to log in");
        // You could redirect to login page here
        // navigate('/login');
      } else if (axiosError.response?.status === 500) {
        console.error("Server error:", axiosError.response?.data?.message || axiosError.message);
      } else {
        console.error("Network or other error:", axiosError.message);
      }
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const onEdit = (id: number) => {
    navigate(`/signup/${id}`);
  };

  const onDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this user?"
    );
    if (!confirmed) return;
    try {
      // Instead of deleting, update the user status to inactive
      const userToUpdate = users.find(u => u.id === id);
      if (userToUpdate) {
        const updatedUser = { ...userToUpdate, status: 'inactive' as const };
        await updateItem<UserModel>("api/users", id.toString(), updatedUser);
        fetchUsers();
        console.log(`Deactivated user with ID: ${id}`);
      }
    } catch (error) {
      console.error("Failed to deactivate user:", error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return '#e53e3e';
      case 'teacher':
        return '#3182ce';
      case 'therapist':
        return '#38a169';
      default:
        return '#718096';
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle dropdown menu
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, user: UserModel) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleClassClick = (classId: string) => {
    handleMenuClose();
    navigate(`/admin/class-management/classes/${classId}`);
  };

  const handleStudentClick = (studentId: string) => {
    handleMenuClose();
    navigate(`/admin/student-management/students/${studentId}`);
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a202c' }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("../signup")}
          sx={{
            backgroundColor: '#3182ce',
            '&:hover': {
              backgroundColor: '#2c5aa0',
            },
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '16px',
            padding: '10px 20px'
          }}
        >
          Add User
        </Button>
      </Box>

      {/* Search Bar */}
      <Box sx={{ marginBottom: 3 }}>
        <TextField
          placeholder="Search users..."
          variant="outlined"
          size="medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#718096' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: '400px',
            backgroundColor: 'white',
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': {
                borderColor: '#e2e8f0',
              },
              '&:hover fieldset': {
                borderColor: '#cbd5e0',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#3182ce',
              },
            },
          }}
        />
      </Box>

      {/* Users Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 3,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          overflow: 'hidden'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f7fafc' }}>
              <TableCell sx={{ fontWeight: 600, color: '#4a5568', fontSize: '14px', padding: '16px 24px' }}>
                User
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#4a5568', fontSize: '14px', padding: '16px 24px' }}>
                Role
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#4a5568', fontSize: '14px', padding: '16px 24px' }}>
                Status
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#4a5568', fontSize: '14px', padding: '16px 24px' }}>
                Assignments
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#4a5568', fontSize: '14px', padding: '16px 24px' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow 
                key={user.id}
                sx={{
                  '&:hover': {
                    backgroundColor: '#f7fafc',
                  },
                  borderBottom: '1px solid #e2e8f0'
                }}
              >
                <TableCell sx={{ padding: '16px 24px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        backgroundColor: '#3182ce',
                        color: 'white',
                        width: 40,
                        height: 40,
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      {getUserInitials(user.name)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 500, color: '#1a202c', fontSize: '14px' }}>
                        {user.name}
                      </Typography>
                      <Typography sx={{ color: '#718096', fontSize: '12px' }}>
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ padding: '16px 24px' }}>
                  <Chip
                    label={user.role}
                    size="small"
                    sx={{
                      backgroundColor: getRoleColor(user.role),
                      color: 'white',
                      fontWeight: 500,
                      fontSize: '12px',
                      textTransform: 'capitalize'
                    }}
                  />
                </TableCell>
                <TableCell sx={{ padding: '16px 24px' }}>
                  <Chip
                    label={user.status === 'inactive' ? 'Inactive' : 'Active'}
                    size="small"
                    sx={{
                      backgroundColor: user.status === 'inactive' ? '#fed7d7' : '#c6f6d5',
                      color: user.status === 'inactive' ? '#c53030' : '#22543d',
                      fontWeight: 500,
                      fontSize: '12px',
                      border: `1px solid ${user.status === 'inactive' ? '#feb2b2' : '#9ae6b4'}`
                    }}
                  />
                </TableCell>
                <TableCell sx={{ padding: '16px 24px' }}>
                  {(user.role.toLowerCase() === 'teacher' && user.classes && user.classes.length > 0) ||
                   (user.role.toLowerCase() === 'therapist' && user.students && user.students.length > 0) ? (
                    <Button
                      variant="outlined"
                      size="small"
                      endIcon={<ExpandMoreIcon />}
                      onClick={(e) => handleMenuClick(e, user)}
                      sx={{
                        textTransform: 'none',
                        borderColor: '#e2e8f0',
                        color: '#4a5568',
                        '&:hover': {
                          borderColor: '#cbd5e0',
                          backgroundColor: '#f7fafc',
                        },
                      }}
                    >
                      {user.role.toLowerCase() === 'teacher' 
                        ? `${user.classes?.length || 0} Classes`
                        : `${user.students?.length || 0} Students`
                      }
                    </Button>
                  ) : (
                    <Typography sx={{ color: '#a0aec0', fontSize: '12px', fontStyle: 'italic' }}>
                      No assignments
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right" sx={{ padding: '16px 24px' }}>
                  <IconButton
                    onClick={() => user.id !== undefined && onEdit(user.id)}
                    disabled={user.id === undefined}
                    sx={{
                      color: '#3182ce',
                      '&:hover': {
                        backgroundColor: '#ebf8ff',
                      },
                      marginRight: 1
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => user.id !== undefined && onDelete(user.id)}
                    disabled={user.id === undefined || user.status === 'inactive'}
                    sx={{
                      color: user.status === 'inactive' ? '#a0aec0' : '#e53e3e',
                      '&:hover': {
                        backgroundColor: user.status === 'inactive' ? 'transparent' : '#fed7d7',
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
            backgroundColor: 'white',
            borderRadius: 3,
            marginTop: 2
          }}
        >
          <Typography sx={{ color: '#718096', fontSize: '16px' }}>
            {searchTerm ? 'No users found matching your search.' : 'No users available.'}
          </Typography>
        </Box>
      )}

      {/* Assignments Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            maxHeight: 300,
            minWidth: 200,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: 2,
          },
        }}
      >
        {selectedUser?.role.toLowerCase() === 'teacher' && selectedUser.classes?.map((classItem) => (
          <MenuItem
            key={classItem._id}
            onClick={() => handleClassClick(classItem._id)}
            sx={{
              padding: '12px 16px',
              '&:hover': {
                backgroundColor: '#f7fafc',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <SchoolIcon sx={{ fontSize: 18, color: '#3182ce' }} />
            </ListItemIcon>
            <ListItemText
              primary={`Class ${classItem.classNumber}`}
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 500,
              }}
            />
          </MenuItem>
        ))}
        
        {selectedUser?.role.toLowerCase() === 'therapist' && selectedUser.students?.map((student) => (
          <MenuItem
            key={student._id}
            onClick={() => handleStudentClick(student._id)}
            sx={{
              padding: '12px 16px',
              '&:hover': {
                backgroundColor: '#f7fafc',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <PersonIcon sx={{ fontSize: 18, color: '#38a169' }} />
            </ListItemIcon>
            <ListItemText
              primary={student.name}
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 500,
              }}
            />
          </MenuItem>
        ))}

        {(!selectedUser?.classes || selectedUser.classes.length === 0) &&
         (!selectedUser?.students || selectedUser.students.length === 0) && (
          <MenuItem disabled sx={{ padding: '12px 16px' }}>
            <Typography sx={{ color: '#a0aec0', fontSize: '14px', fontStyle: 'italic' }}>
              No assignments
            </Typography>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default UsersList;
