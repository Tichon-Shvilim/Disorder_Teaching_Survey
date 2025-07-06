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
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { getAllItems, deleteItem } from "../Api-Requests/genericRequests";
import type UserModel from "../UserModel";

const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = React.useState<UserModel[]>([]);

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
      "Are you sure you want to delete this user?"
    );
    if (!confirmed) return;
    try {
      await deleteItem<UserModel>("api/users", id.toString());
      fetchUsers();
      console.log(`Deleted user with ID: ${id}`);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 2,
        }}
      >
        <Typography variant="h6">Users</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate("/admin/signup")}
        >
          Add User
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => user.id !== undefined && onEdit(user.id)}
                    color="primary"
                    disabled={user.id === undefined}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => user.id !== undefined && onDelete(user.id)}
                    color="secondary"
                    disabled={user.id === undefined}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UsersList;
