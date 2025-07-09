// src/App.tsx
import React from "react";
import "./App.css";
import "./index.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

// Pages
// import DashboardPage from "./pages/DashboardPage";
// import StudentsPage from "./pages/StudentsPage";
// import AssessmentsPage from "./pages/AssessmentsPage";
// import ReportsPage from "./pages/ReportsPage";
// import AssessmentFormsPage from "./pages/AssessmentFormsPage";
// import UserListPage from "./pages/UserListPage";
import SignIn from "./components/user/signIn/SignIn";
import CreatForm from "./components/formManagement/CreatForm";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/" element={<SignIn />} />

        {/* Protected Routes (require login) */}
        <Route
          path="/layout/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Accessible by all logged-in users */}
          {/* <Route index element={<DashboardPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="assessments" element={<AssessmentsPage />} />
          <Route path="reports" element={<ReportsPage />} /> */}

          {/* Role-specific routes */}
          <Route
            path="creatform"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                {/* <AssessmentFormsPage /> */}
                <CreatForm/>
              </RoleRoute>
            }
          />
          <Route
            path="userlist"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                {/* <UserListPage /> */}
                <div>userManagement</div>
              </RoleRoute>
            }
          />
        </Route>

        {/* Catch-all / 404 */}
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </Router>
  );
};

export default App;
