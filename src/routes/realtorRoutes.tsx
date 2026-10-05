import { RouteObject } from 'react-router-dom';
import RealtorProfilePage from '../pages/RealtorProfile';
import RealtorMyPage from '../pages/RealtorMyPage';
import RealtorMyBidsPage from '../pages/RealtorMyBids';

export const realtorRoutes: RouteObject[] = [
  { path: '/realtors/:realtorId', element: <RealtorProfilePage /> },
  { path: '/realtor/mypage', element: <RealtorMyPage /> },
  { path: '/realtor/mypage/bids', element: <RealtorMyBidsPage /> },
];
