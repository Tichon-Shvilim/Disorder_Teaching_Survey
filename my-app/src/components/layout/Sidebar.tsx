// src/components/layout/Sidebar.tsx
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
  ClassOutlined,
} from "@mui/icons-material";

const drawerWidth = 280;

const Sidebar: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const mainNavItems = [
    {
      name: "Dashboard",
      path: "/layout/dashboard",
      icon: <SpaceDashboardOutlined />,
    },
    {
      name: "Assessments",
      path: "/layout/assessments",
      icon: <DescriptionOutlined />,
    },
    { name: "Reports", path: "/layout/reports", icon: <BarChartOutlined /> },
    {
      name: "Student Management",
      path: "/layout/students",
      icon: <SchoolOutlined />,
    },
    ...(user?.role === "Admin"
      ? [
          {
            name: "Class Management",
            path: "/layout/classes",
            icon: <ClassOutlined />,
          },
          // {
          //   name: "Assessment Forms (Legacy)",
          //   path: "/layout/questionnaires",
          //   icon: <AssignmentOutlined />,
          // },
          {
            name: "Assessment Forms V2",
            path: "/layout/questionnaires-v2",
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

  const renderNavItem = (
    item: { name: string; path: string; icon: React.ReactNode },
    isSubItem = false
  ) => (
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
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
