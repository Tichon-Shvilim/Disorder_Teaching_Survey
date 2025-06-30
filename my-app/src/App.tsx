import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignIn from './components/user/signIn/SignIn';
import SignUp from './components/user/signUp/SignUp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;