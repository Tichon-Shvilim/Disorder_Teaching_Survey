
import React from 'react';
import { TextField, Button, Paper, Typography } from '@mui/material';
// Removed makeStyles import and usage; using sx prop instead

const SignIn: React.FC = () => {
  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle login logic here
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: 24,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 3,
          width: '100%',
          maxWidth: 400,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5">Login</Typography>
        <form onSubmit={handleLogin}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            fullWidth
          >
            Login
          </Button>
        </form>
      </Paper>
    </div>
  );
};

export default SignIn;
