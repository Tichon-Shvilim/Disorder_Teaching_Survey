import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Button, Box } from "@mui/material";

const TeacherDashboard: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <h2>דשבורד מורה/תרפיסט</h2>
    <nav>
      <Button component={Link} to="students" variant="contained" sx={{ m: 1 }}>
        התלמידים שלי
      </Button>
      {/* תוכל להוסיף כאן עוד כפתורים */}
    </nav>
    <Box sx={{ mt: 3 }}>
      <Outlet />
    </Box>
  </Box>
);

export default TeacherDashboard;

// תוכל להעתיק ולהתאים ל-TherapistDashboard