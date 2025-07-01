import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import SignIn from './components/user/signIn/SignIn';
import SignUp from './components/user/signUp/SignUp';
import UserList from './components/user/userManagement/UserList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup/:id?" element={<SignUp />} />
        <Route path="/userlist" element={<UserList/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;