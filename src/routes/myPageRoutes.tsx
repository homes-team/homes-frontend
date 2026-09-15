import { RouteObject } from 'react-router-dom';
import MyPage from '../pages/MyPage';
import MyFavoritesPage from '../pages/MyPage/Favorites';
import MyPropertiesPage from '../pages/MyPage/Properties';
import MyReportsPage from '../pages/MyPage/Reports';
import RecentViewsPage from '../pages/MyPage/RecentViews';

export const myPageRoutes: RouteObject[] = [
  { path: '/mypage', element: <MyPage /> },
  { path: '/mypage/favorites', element: <MyFavoritesPage /> },
  { path: '/mypage/properties', element: <MyPropertiesPage /> },
  { path: '/mypage/reports', element: <MyReportsPage /> },
  { path: '/mypage/recent-views', element: <RecentViewsPage /> },
];
