// src/components/layout/Layout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Box from "@mui/material/Box";

const drawerWidth = 280;
const headerHeight = 80;

const Layout: React.FC = () => {
  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
        {/* Fixed Header */}
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            height: `${headerHeight}px`,
            zIndex: 1200,
            bgcolor: "background.paper",
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
            overflowY: "auto",
            bgcolor: "#fff",
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
