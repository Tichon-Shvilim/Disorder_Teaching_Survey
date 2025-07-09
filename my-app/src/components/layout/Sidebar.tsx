// src/components/layout/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
} from "@mui/material";
import {
  SpaceDashboardOutlined,
  PeopleOutlineRounded,
  BarChartOutlined,
  DescriptionOutlined,
  AssignmentOutlined,
  SchoolOutlined,
} from "@mui/icons-material";

const drawerWidth = 280;

const Sidebar: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: <SpaceDashboardOutlined /> },
    { name: "Students", path: "/admin/students", icon: <SchoolOutlined /> },
    {
      name: "Assessments",
      path: "/admin/assessments",
      icon: <DescriptionOutlined />,
    },
    { name: "Reports", path: "/admin/reports", icon: <BarChartOutlined /> },
    ...(user?.role === "Admin"
      ? [
          {
            name: "Assessment Forms",
            path: "/layout/creatform",
            icon: <AssignmentOutlined />,
          },
          {
            name: "User Management",
            path: "/layout/userlist",
            icon: <PeopleOutlineRounded />,
          },
        ]
      : []),
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          bgcolor: "#fff",
        },
      }}
    >
      <Toolbar
        sx={{ minHeight: 64, display: "flex", bgcolor: "#fff", pt: 5, pl: 4 }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              backgroundColor: "#1976d2",
              borderRadius: 4,
              padding: 0.75,
              px: 1.25,
            }}
          >
            <SchoolOutlined sx={{ color: "white" }} />
          </Box>
          <Typography variant="h5" fontWeight="bold" color="inherit">
            SNPT
          </Typography>
        </Box>
      </Toolbar>
      <Box sx={{ overflow: "auto", pt: 4 }}>
        <List>
          {navItems.map((item) => (
            <NavLink
              to={item.path}
              key={item.name}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              {({ isActive }) => (
                <ListItemButton
                  selected={isActive}
                  sx={{
                    bgcolor: isActive ? "#e3eafc" : "transparent",
                    "&:hover": { bgcolor: "#e3eafc", color: "#1976d2" },
                    "&:hover .MuiListItemIcon-root .MuiSvgIcon-root": {
                      color: "#1976d2",
                    },
                    borderRight: isActive ? "3px solid #1976d2" : "none",
                    color: "#667A93",
                    paddingY: 2,
                    paddingX: 3,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    sx={{ fontWeight: isActive ? "bold" : "normal" }}
                  />
                </ListItemButton>
              )}
            </NavLink>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
