import { BrowserRouter, Route, Routes } from 'react-router-dom';
import FindIdPage from './pages/FindIdPage';
import FindPasswordPage from './pages/FindPasswordPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SearchPage from './pages/SearchPage';
import SignupAgentWizardPage from './pages/SignupAgentWizardPage';
import SignupPage from './pages/SignupPage';
import SignupWizardPage from './pages/SignupWizardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/find-id" element={<FindIdPage />} />
        <Route path="/find-password" element={<FindPasswordPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/user" element={<SignupWizardPage />} />
        <Route path="/signup/realtor" element={<SignupAgentWizardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
