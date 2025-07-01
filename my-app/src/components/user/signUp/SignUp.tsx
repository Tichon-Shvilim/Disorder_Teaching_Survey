import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  TextField,
  Button,
  Paper,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Link,
} from "@mui/material";
import {
  addItem,
  getItemById,
  updateItem,
} from "../Api-Requests/genericRequests";
import type UserModel from "../UserModel";

const SignUp: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch user details if editing
  useEffect(() => {
    if (id) {
      setLoading(true);
      getItemById<UserModel>("api/users", id)
        .then((response) => {
          const user = response.data;
          setName(user.name);
          setEmail(user.email);
          setRole(user.role);
          setPassword(user.password); // Keep current password for edit
        })
        .catch((error) => {
          console.error("Error fetching user:", error);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const user: UserModel = {
      name,
      email,
      password,
      role,
    };

    try {
      if (id) {
        await updateItem<UserModel>("api/users", id.toString(), user);
        alert("User updated successfully!");
      } else {
        await addItem<UserModel>("api/users/register", user);
        alert("User signed up successfully!");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: 3,
        width: { xs: "90%", sm: "400px" },
        margin: "auto",
      }}
    >
      <Typography variant="h5">{id ? "Edit User" : "Sign Up"}</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          required={!id}
          slotProps={{
            input: {
              endAdornment: (
                <Button
                  onClick={() => setShowPassword((show) => !show)}
                  tabIndex={-1}
                  size="small"
                >
                  {showPassword ? "Hide" : "Show"}
                </Button>
              ),
            },
          }}
        />
        <FormControl fullWidth margin="normal" required>
          <InputLabel>Role</InputLabel>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Teacher">Teacher</MenuItem>
            <MenuItem value="Therapist">Therapist</MenuItem>
          </Select>
        </FormControl>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ marginTop: 2 }}
          fullWidth
          disabled={loading}
        >
          {id ? "Edit" : "Sign Up"}
        </Button>
      </form>
      {!id && (
        <Typography variant="body2" sx={{ marginTop: 2 }}>
          Already have an account?{" "}
          <Link href="/signin" variant="body2">
            Sign In
          </Link>
        </Typography>
      )}
    </Paper>
  );
};

export default SignUp;
