import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RootLayout from './RootLayout';
import { homeRoutes } from './homeRoutes';
import { authRoutes } from './authRoutes';
import { searchRoutes } from './searchRoutes';
import { propertyPublicRoutes, propertyProtectedRoutes } from './propertyRoutes';
import { chatRoutes } from './chatRoutes';
import { notificationRoutes } from './notificationRoutes';
import { realtorRoutes } from './realtorRoutes';
import { myPageRoutes } from './myPageRoutes';
import { listPropertyRoutes } from './listPropertyRoutes';
import { toolRoutes } from './toolRoutes';

/** 로그인 없이 접근 가능한 라우트 */
const publicRoutes = [...homeRoutes, ...authRoutes, ...searchRoutes, ...propertyPublicRoutes, ...toolRoutes];

/** 로그인해야만 접근 가능한 라우트 — 비로그인이면 ProtectedRoute가 /login으로 돌려보낸다 */
const protectedRoutes = [
  ...propertyProtectedRoutes,
  ...chatRoutes,
  ...notificationRoutes,
  ...realtorRoutes,
  ...myPageRoutes,
  ...listPropertyRoutes,
];

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [...publicRoutes, { element: <ProtectedRoute />, children: protectedRoutes }],
  },
]);
