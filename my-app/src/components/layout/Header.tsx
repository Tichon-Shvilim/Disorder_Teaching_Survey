// src/components/layout/Header.tsx
import React from "react";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store";
import { logout } from "../../store/authSlice";
import { LogOut, User } from "lucide-react";

const Header: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{
        height: "100%",
        justifyContent: "center",
        bgcolor: "background.paper",
        borderBottom: "0.5px solid #e0e0e0",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Special Needs Progress Tracker
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user?.name}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={4} sx={{ px: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <User size={24} color="gray" />
            <Typography fontWeight="bold" color="text.secondary">
              {user?.role}
            </Typography>
          </Box>
          <Button
            sx={{
              color: "text.secondary",
              "&:hover": { bgcolor: "#fff5f5", color: "#b71c1c" },
              borderRadius: 2,
              px: 4,
              py: 2, 
            }}
            startIcon={<LogOut />}
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
