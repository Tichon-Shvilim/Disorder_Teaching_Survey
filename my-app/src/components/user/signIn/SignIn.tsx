import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Link } from '@mui/material';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle sign-in logic here
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
      <Typography variant="h5">Sign In</Typography>
      <form onSubmit={handleSignIn}>
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
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ marginTop: 2 }}
          fullWidth
        >
          Sign In
        </Button>
      </form>
      <Typography variant="body2" sx={{ marginTop: 2 }}>
        Don't have an account?{' '}
        <Link href="/signup" variant="body2">
          Sign Up
        </Link>
      </Typography>
    </Paper>
  );
};

export default SignIn;
