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
import QuestionnaireList from "./components/formManagement/QuestionnaireList";
import CreateQuestionnaire from "./components/formManagement/CreateQuestionnaire";
import StudentList from "./components/studentManagement/StudentList";
import StudentDetails from "./components/studentManagement/StudentDetails";
import EditStudent from "./components/studentManagement/EditStudent";
import ClassList from "./components/classManagement/ClassList";
import AddStudent from "./components/studentManagement/AddStudent";
import AddClass from "./components/classManagement/AddClass";
import EditClass from "./components/classManagement/EditClass";
import ModernClassManagement from "./components/classManagement/ModernClassManagement";
import UserList from "./components/user/userManagement/UserList";
import EditUser from "./components/user/editUser/EditUser";
import SignUp from "./components/user/signUp/SignUp";
import FillForm from "./components/formManagement/FillForm";
import ViewSubmissions from "./components/formManagement/ViewSubmissions";

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
          <Route path="students/:id" element={<StudentDetails />} />
          <Route path="students/:id/edit" element={<EditStudent />} />
          <Route path="forms/fill" element={<FillForm />} />
          <Route path="forms/fill/:questionnaireId" element={<FillForm />} />
          <Route path="forms/submissions" element={<ViewSubmissions />} />
          <Route path="classes" element={<ClassList/>} />
          <Route path="classes/:id" element={<ModernClassManagement />} />
          <Route path="classes/:id/edit" element={<EditClass />} />
          <Route path="addStudent" element={<AddStudent />} />
          <Route path="addClass" element={<AddClass />} />
          <Route path="signup" element={<SignUp/>} />

          {/* Role-specific routes */}
          <Route
            path="questionnaires"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <QuestionnaireList />
              </RoleRoute>
            }
          />
          <Route
            path="create-questionnaire"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <CreateQuestionnaire/>
              </RoleRoute>
            }
          />
          <Route
            path="user-management"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <UserList/>
              </RoleRoute>
            }
          />
          <Route
            path="user-management/:id/edit"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <EditUser/>
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
