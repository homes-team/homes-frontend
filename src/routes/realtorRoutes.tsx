import { RouteObject } from 'react-router-dom';
import RealtorProfilePage from '../pages/RealtorProfile';
import RealtorMyPage from '../pages/RealtorMyPage';

export const realtorRoutes: RouteObject[] = [
  { path: '/realtors/:realtorId', element: <RealtorProfilePage /> },
  { path: '/realtor/mypage', element: <RealtorMyPage /> },
];
