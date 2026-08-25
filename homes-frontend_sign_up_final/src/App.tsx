import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import FindIdPage from './pages/FindIdPage';
import FindPasswordPage from './pages/FindPasswordPage';
import SignupPage from './pages/SignupPage';
import SignupWizardPage from './pages/SignupWizardPage';
import SignupAgentWizardPage from './pages/SignupAgentWizardPage';

/**
 * TODO: react-router-dom 설치 후 정식 라우터로 교체.
 * 지금은 <a href> 전체 새로고침 기반이라 pathname만 봐도 충분하다.
 */
function App() {
  switch (window.location.pathname) {
    case '/login':
      return <LoginPage />;
    case '/find-id':
      return <FindIdPage />;
    case '/find-password':
      return <FindPasswordPage />;
    case '/signup':
      return <SignupPage />;
    case '/signup/user':
      return <SignupWizardPage />;
    case '/signup/realtor':
      return <SignupAgentWizardPage />;
    default:
      return <HomePage />;
  }
}

export default App;
