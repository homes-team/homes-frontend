import { RouteObject } from 'react-router-dom';
import LoginPage from '../pages/Login';
import SignupPage from '../pages/Signup';
import SignupWizardPage from '../pages/SignupWizard';
import SignupAgentWizardPage from '../pages/SignupAgentWizard';
import FindIdPage from '../pages/FindId';
import FindPasswordPage from '../pages/FindPassword';

export const authRoutes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/signup/user', element: <SignupWizardPage /> },
  { path: '/signup/realtor', element: <SignupAgentWizardPage /> },
  { path: '/find-id', element: <FindIdPage /> },
  { path: '/find-password', element: <FindPasswordPage /> },
];
