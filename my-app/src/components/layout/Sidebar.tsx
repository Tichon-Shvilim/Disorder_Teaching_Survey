// src/components/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
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
  /*SpaceDashboardOutlined,
  BarChartOutlined,
  DescriptionOutlined,*/
  PeopleOutlineRounded,
  AssignmentOutlined,
  SchoolOutlined,
  ClassOutlined,
} from "@mui/icons-material";

const drawerWidth = 280;

const Sidebar: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslation();

  const mainNavItems = [
    /*{
      name: t('navigation.dashboard'),
      path: "/layout/dashboard",
      icon: <SpaceDashboardOutlined />,
    },
    {
      name: t('navigation.assessments'),
      path: "/layout/assessments",
      icon: <DescriptionOutlined />,
    },
    { 
      name: t('navigation.reports'), 
      path: "/layout/reports", 
      icon: <BarChartOutlined /> 
    },*/
    {
      name: t('navigation.studentManagement'),
      path: "/layout/students",
      icon: <SchoolOutlined />,
    },
    ...(user?.role === "Admin"
      ? [
          {
            name: t('navigation.classManagement'),
            path: "/layout/classes",
            icon: <ClassOutlined />,
          },
          {
            name: t('navigation.assessmentForms'),
            path: "/layout/questionnaires",
            icon: <AssignmentOutlined />,
          },
          {
            name: t('navigation.userManagement'),
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
            borderLeft: isActive ? "3px solid #64b5f6" : "none",
            color: "#667A93",
            paddingY: isSubItem ? 1 : 2,
            paddingX: isSubItem ? 5 : 3,
            paddingLeft: isSubItem ? 6 : 3,
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
          <ListItemText
            primary={item.name}
            sx={{ 
              fontWeight: isActive ? "bold" : "normal",
              textAlign: 'inherit',
              '& .MuiTypography-root': {
                textAlign: 'inherit'
              }
            }}
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
            {t('common.appShortName', 'SNPT')}
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
