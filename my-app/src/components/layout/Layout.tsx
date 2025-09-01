// src/components/layout/Layout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Box from "@mui/material/Box";

const drawerWidth = 280;
const headerHeight = 120;

const Layout: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  return (
    <Box sx={{ display: "flex", height: "100vh", direction: isRTL ? 'rtl' : 'ltr' }}>
      <Sidebar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        {/* Fixed Header */}
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: isRTL ? 0 : drawerWidth,
            right: isRTL ? drawerWidth : 0,
            width: `calc(100% - ${drawerWidth}px)`,
            height: `${headerHeight}px`,
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Header />
        </Box>
        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            height: `calc(100vh - ${headerHeight}px)`,
            width: "100%",
            overflowY: "auto",
            bgcolor: "#f9fbfe",
            pt: `${headerHeight}px`,
            px: 3,
            pb: 3,
            display: "block",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
