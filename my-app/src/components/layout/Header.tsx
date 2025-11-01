// src/components/layout/Header.tsx
import React from "react";
import { AppBar, Toolbar, Typography, Box, Button, useTheme } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from 'react-i18next';
import type { RootState } from "../../store";
import { logout } from "../../store/authSlice";
import { LogOut, User } from "lucide-react";
import { LanguageSwitcher } from "../common";

const Header: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  
  // Debug logging
  console.log('Theme direction:', theme.direction);
  console.log('Text align should be:', theme.direction === 'rtl' ? 'right' : 'left');

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
        <Box sx={{ 
          direction: theme.direction === 'rtl' ? 'rtl' : 'ltr',
          textAlign: theme.direction === 'rtl' ? 'right !important' : 'left !important',
          border: '1px solid red', // Temporary debug border
          backgroundColor: theme.direction === 'rtl' ? 'lightblue' : 'lightgreen' // Visual debug
        }}>
          <Typography 
            variant="h5" 
            fontWeight="bold"
            className={theme.direction === 'rtl' ? 'rtl-text' : 'ltr-text'}
            sx={{ 
              textAlign: theme.direction === 'rtl' ? 'right !important' : 'left !important',
              direction: theme.direction === 'rtl' ? 'rtl' : 'ltr'
            }}
            style={{
              textAlign: theme.direction === 'rtl' ? 'right' : 'left',
              direction: theme.direction === 'rtl' ? 'rtl' : 'ltr'
            }}
          >
            {t('common.appTitle', 'Special Needs Progress Tracker')}
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            className={theme.direction === 'rtl' ? 'rtl-text' : 'ltr-text'}
            sx={{ 
              textAlign: theme.direction === 'rtl' ? 'right !important' : 'left !important',
              direction: theme.direction === 'rtl' ? 'rtl' : 'ltr'
            }}
            style={{
              textAlign: theme.direction === 'rtl' ? 'right' : 'left',
              direction: theme.direction === 'rtl' ? 'rtl' : 'ltr'
            }}
          >
            {t('common.welcomeBack', 'Welcome back')}, {user?.name}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2} sx={{ px: 2 }}>
          <LanguageSwitcher />
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
          >
            {t('navigation.logout', 'Logout')}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
