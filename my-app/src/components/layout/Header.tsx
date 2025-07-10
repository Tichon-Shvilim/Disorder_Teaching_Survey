// src/components/layout/Header.tsx
import React from "react";
import { AppBar, Toolbar, Typography, Box, Button, IconButton } from "@mui/material";
import { Logout, Person } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store";
import {logout} from "../../store/authSlice"; 

const Header: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        bgcolor: '#ffffff',
        color: '#1f2937',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #e5e7eb'
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", minHeight: '64px !important' }}>
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600,
              color: '#1f2937',
              fontSize: '1.5rem'
            }}
          >
            Special Needs Progress Tracker
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6b7280',
              fontSize: '0.875rem',
              marginTop: '2px'
            }}
          >
            Welcome back, {user?.name || 'Dr. Sarah Wilson'}
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={3}>
          {/* User Info */}
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              sx={{
                bgcolor: '#f3f4f6',
                width: 40,
                height: 40,
                '&:hover': {
                  bgcolor: '#e5e7eb'
                }
              }}
            >
              <Person sx={{ color: '#6b7280', fontSize: 20 }} />
            </IconButton>
            <Typography 
              sx={{ 
                color: '#374151',
                fontWeight: 500,
                fontSize: '0.875rem'
              }}
            >
              {user?.role || 'admin'}
            </Typography>
          </Box>

          {/* Logout Button */}
          <Button
            variant="outlined"
            onClick={handleLogout}
            startIcon={<Logout />}
            sx={{
              color: '#dc2626',
              borderColor: '#dc2626',
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'none',
              px: 2,
              py: 1,
              '&:hover': {
                bgcolor: '#fef2f2',
                borderColor: '#dc2626',
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
