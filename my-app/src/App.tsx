import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoleRoute from './components/RoleRoute';
import SignIn from './components/user/signIn/SignIn';
import SignUp from './components/user/signUp/SignUp';
import UserList from './components/user/userManagement/UserList';
import AdminDashboard from './components/dashboards/AdminDashboard';
import TeacherDashboard from './components/dashboards/TeacherDashboard';
import TherapistDashboard from './components/dashboards/TherapistDashboard';
import CreatForm from './components/formManagement/CreatForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes שכולם יכולים לגשת אליהם */}
        <Route path="/" element={<SignIn />} />
        <Route path="/signin" element={<SignIn />} />

        {/* דשבורד אדמין ונתיבים פנימיים */}
        <Route
          path="/admin/*"
          element={
            <RoleRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </RoleRoute>
          }
        >
          <Route path="userlist" element={<UserList />} />
          <Route path="signup/:id?" element={<SignUp />} />
          <Route path='creatform' element={<CreatForm/>}/>
          {/* תוכל להוסיף כאן עוד נתיבים פנימיים לאדמין */}
        </Route>

        {/* דשבורד מורה */}
        <Route
          path="/teacher/*"
          element={
            <RoleRoute allowedRoles={["Teacher"]}>
              <TeacherDashboard />
            </RoleRoute>
          }
        >
          {/* דוגמה לנתיב פנימי */}
          <Route path="students" element={<div>רשימת תלמידים</div>} />
        </Route>

        {/* דשבורד תרפיסט */}
        <Route
          path="/therapist/*"
          element={
            <RoleRoute allowedRoles={["Therapist"]}>
              <TherapistDashboard />
            </RoleRoute>
          }
        >
          {/* דוגמה לנתיב פנימי */}
          <Route path="students" element={<div>רשימת מטופלים</div>} />
        </Route>

        {/* ברירת מחדל */}
        <Route path="*" element={<SignIn />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;