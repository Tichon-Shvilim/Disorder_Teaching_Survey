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
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { getAllItems, updateItem } from "../Api-Requests/genericRequests";
import type UserModel from "../UserModel";

const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = React.useState<UserModel[]>([]);
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  // Function to fetch all users
  const fetchUsers = async () => {
    try {
      // "users" is the route for your API, adjust if needed
      const response = await getAllItems<UserModel[]>("api/users/");
      setUsers(response.data); // If your httpService returns { data: [...] }
      //console.log('Fetched users:', response.data[1].id);
      console.log("Fetched users:", response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
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
          onClick={() => navigate("/admin/signup")}
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
    </Box>
  );
};

export default UsersList;
