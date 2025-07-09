// src/components/layout/Header.tsx
import React from "react";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
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
    <AppBar position="static" color="inherit" elevation={1}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Special Needs Progress Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {user?.name}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography>{user?.role}</Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
