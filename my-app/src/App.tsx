// src/App.tsx
import React from "react";
import "./App.css";
import "./index.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

// Pages
import SignIn from "./components/user/signIn/SignIn";
import CreatForm from "./components/formManagement/CreatForm";
import StudentList from "./components/studentManagement/StudentList";
import ClassList from "./components/classManagement/ClassList";
import AddStudent from "./components/studentManagement/AddStudent";
import AddClass from "./components/classManagement/AddClass";
import ModernClassManagement from "./components/classManagement/ModernClassManagement";
import UserList from "./components/user/userManagement/UserList";
import SignUp from "./components/user/signUp/SignUp";

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
          <Route path="students" element={<StudentList />} />
          <Route path="classes" element={<ClassList/>} />
          <Route path="classes/:id" element={<ModernClassManagement />} />
          <Route path="addStudent" element={<AddStudent />} />
          <Route path="addClass" element={<AddClass />} />
          <Route path="signup" element={<SignUp/>} />

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
                <UserList/>
              </RoleRoute>
            }
          />
        </Route>

        <Route 
        path="studentlist"
        element={
              <RoleRoute allowedRoles={["Admin","Techer"]}>
                <StudentList/>
              </RoleRoute>
            }
        />

        {/* Catch-all / 404 */}
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </Router>
  );
};

export default App;
