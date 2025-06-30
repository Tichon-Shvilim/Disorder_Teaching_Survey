import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, FormControl, Select, MenuItem, InputLabel, Link } from '@mui/material';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  const handleSignUp = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle sign-up logic here
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: 3,
        width: { xs: '90%', sm: '400px' },
        margin: 'auto',
      }}
    >
      <Typography variant="h5">Sign Up</Typography>
      <form onSubmit={handleSignUp}>
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
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <FormControl fullWidth margin="normal" required>
          <InputLabel>Role</InputLabel>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
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
        >
          Sign Up
        </Button>
      </form>
      <Typography variant="body2" sx={{ marginTop: 2 }}>
        Already have an account?{' '}
        <Link href="/signin" variant="body2">
          Sign In
        </Link>
      </Typography>
    </Paper>
  );
};

export default SignUp;
