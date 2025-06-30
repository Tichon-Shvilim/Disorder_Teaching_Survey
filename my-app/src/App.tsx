import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignIn from './components/signIn/SignIn';
import SignUp from './components/signUp/SignUp';
import StudentList from './components/studentManagement/StudentList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp/>} />
        <Route
          path="/studentlist"
          element={
            <StudentList
              users={[]} // Replace with your users data
              onEdit={() => {}} // Replace with your edit handler
              onDelete={() => {}} // Replace with your delete handler
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;