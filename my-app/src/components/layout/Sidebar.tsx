// src/components/layout/Sidebar.tsx
import React, { useState } from "react";
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
  Collapse,
} from "@mui/material";
import {
  SpaceDashboardOutlined,
  PeopleOutlineRounded,
  BarChartOutlined,
  DescriptionOutlined,
  AssignmentOutlined,
  SchoolOutlined,
  ExpandLess,
  ExpandMore,
  PersonAdd,
  ClassOutlined,
  Add,
  ViewList,
} from "@mui/icons-material";

const drawerWidth = 280;

const Sidebar: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const [classMenuOpen, setClassMenuOpen] = useState(false);

  const handleStudentMenuClick = () => {
    setStudentMenuOpen(!studentMenuOpen);
    if(classMenuOpen) {
      setClassMenuOpen(false); // Close class menu if student menu is opened
    }
  };

  const handleClassMenuClick = () => {
    setClassMenuOpen(!classMenuOpen);
    if(studentMenuOpen) {
      setStudentMenuOpen(false); // Close student menu if class menu is opened
    }
  };

  const mainNavItems = [
    { name: "Dashboard", path: "/layout/dashboard", icon: <SpaceDashboardOutlined /> },
    {
      name: "Assessments",
      path: "/layout/assessments",
      icon: <DescriptionOutlined />,
    },
    { name: "Reports", path: "/layout/reports", icon: <BarChartOutlined /> },
    ...(user?.role === "Admin"
      ? [
          {
            name: "Assessment Forms",
            path: "/layout/creatform",
            icon: <AssignmentOutlined />,
          },
          {
            name: "User Management",
            path: "/layout/user-management",
            icon: <PeopleOutlineRounded />,
          },
        ]
      : []),
  ];

  const studentSubItems = [
    { name: "All Students", path: "/layout/students", icon: <ViewList /> },
    { name: "Add Student", path: "/layout/addStudent", icon: <PersonAdd /> },
  ];

  const classSubItems = [
    { name: "All Classes", path: "/layout/classes", icon: <ViewList /> },
    { name: "Add Class", path: "/layout/addClass", icon: <Add /> },
  ];

  const renderNavItem = (item: { name: string; path: string; icon: React.ReactNode }, isSubItem = false) => (
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
            "&:hover": { bgcolor: "#e3eafc", color: "#64b5f6" },
            "&:hover .MuiListItemIcon-root .MuiSvgIcon-root": {
              color: "#64b5f6",
            },
            borderRight: isActive ? "3px solid #64b5f6" : "none",
            color: "#667A93",
            paddingY: isSubItem ? 1 : 2,
            paddingX: isSubItem ? 5 : 3,
            paddingLeft: isSubItem ? 6 : 3,
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
  );

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
              backgroundColor: "#64b5f6",
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
          {/* Main Navigation Items */}
          {mainNavItems.map((item) => renderNavItem(item))}

          {/* Student Management with Submenu */}
          <ListItemButton
            onClick={handleStudentMenuClick}
            sx={{
              "&:hover": { bgcolor: "#e3eafc", color: "#64b5f6" },
              "&:hover .MuiListItemIcon-root .MuiSvgIcon-root": {
                color: "#64b5f6",
              },
              color: "#667A93",
              paddingY: 2,
              paddingX: 3,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <SchoolOutlined />
            </ListItemIcon>
            <ListItemText primary="Student Management" />
            {studentMenuOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={studentMenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {studentSubItems.map((item) => renderNavItem(item, true))}
            </List>
          </Collapse>

          {/* Class Management with Submenu */}
          <ListItemButton
            onClick={handleClassMenuClick}
            sx={{
              "&:hover": { bgcolor: "#e3eafc", color: "#64b5f6" },
              "&:hover .MuiListItemIcon-root .MuiSvgIcon-root": {
                color: "#64b5f6",
              },
              color: "#667A93",
              paddingY: 2,
              paddingX: 3,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <ClassOutlined />
            </ListItemIcon>
            <ListItemText primary="Class Management" />
            {classMenuOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={classMenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {classSubItems.map((item) => renderNavItem(item, true))}
            </List>
          </Collapse>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
