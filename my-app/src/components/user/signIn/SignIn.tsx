import React, { useEffect, useState } from 'react';
import { TextField, Button, Paper, Typography, Link } from '@mui/material';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../../store/authSlice'; // adjust path as needed
import { signIn } from '../Api-Requests/genericRequests';
import type UserModel from '../UserModel'; // adjust path as needed 
<<<<<<< HEAD
import { useNavigate } from 'react-router-dom'; 

=======
import type { RootState } from "../../../store"; 
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
>>>>>>> main

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
<<<<<<< HEAD
  const navigate = useNavigate(); 
=======
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
>>>>>>> main

 const handleSignIn = async (event: React.FormEvent) => {
  event.preventDefault();
  setError('');
  try {
    // 'users' is the route, { email, password } is the credentials object
    const response = await signIn('api/users', { email, password });
<<<<<<< HEAD
    type SignInResponse = { token: string; user: UserModel }; 
=======
    type SignInResponse = { token: string; user: UserModel };
>>>>>>> main
    const data = response.data as SignInResponse;
    dispatch(loginSuccess({ token: data.token, user: data.user }));
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Redirect or update UI as needed
<<<<<<< HEAD
    if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'teacher') navigate('/teacher');
      else if (data.user.role === 'therapist') navigate('/therapist');
      else navigate('/'); // fallback
=======
    console.log('Sign in successful:', data.user);
>>>>>>> main
  } catch {
    setError('Invalid email or password');
  }
};

useEffect(() => {
  if (user) {
    const route = `/${user.role.toLowerCase()}/`;
    console.log('Navigating to:', route);
    navigate(route);
  }
}, [user, navigate]);

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
      {error && (
        <Typography color="error" sx={{ marginTop: 2 }}>
          {error}
        </Typography>
      )}
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
