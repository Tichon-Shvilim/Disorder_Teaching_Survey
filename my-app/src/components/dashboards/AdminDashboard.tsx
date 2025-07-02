import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Button, Box } from "@mui/material";

const AdminDashboard: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <h2>דשבורד אדמין</h2>
    <nav>
      <Button component={Link} to="userlist" variant="contained" sx={{ m: 1 }}>
        רשימת משתמשים
      </Button>
      <Button component={Link} to="signup" variant="contained" sx={{ m: 1 }}>
        הוסף משתמש חדש
      </Button>
      {/* תוכל להוסיף כאן עוד כפתורים */}
    </nav>
    <Box sx={{ mt: 3 }}>
      <Outlet /> {/* כאן יופיעו הרכיבים של הנתיבים הפנימיים */}
    </Box>
  </Box>
);

export default AdminDashboard;