import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import FindIdPage from './pages/FindIdPage';
import FindPasswordPage from './pages/FindPasswordPage';
import SignupPage from './pages/SignupPage';
import SignupWizardPage from './pages/SignupWizardPage';
import SignupAgentWizardPage from './pages/SignupAgentWizardPage';

/** react-router-dom 정식 라우터. 전체 새로고침 없이 페이지 간 이동한다. */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/find-id" element={<FindIdPage />} />
        <Route path="/find-password" element={<FindPasswordPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/user" element={<SignupWizardPage />} />
        <Route path="/signup/realtor" element={<SignupAgentWizardPage />} />
        {/* 정의되지 않은 경로는 홈으로 */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
