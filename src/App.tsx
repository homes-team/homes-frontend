import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import SearchPage from './pages/Search';
import SignupPage from './pages/Signup';
import SignupWizardPage from './pages/SignupWizard';
import SignupAgentWizardPage from './pages/SignupAgentWizard';
import FindIdPage from './pages/FindId';
import FindPasswordPage from './pages/FindPassword';
import PropertyDetailPage from './pages/PropertyDetail';
import PropertyBidsPage from './pages/PropertyBids';
import ChatListPage from './pages/ChatList';
import ChatRoomPage from './pages/ChatRoom';
import NotificationsPage from './pages/Notifications';
import RealtorProfilePage from './pages/RealtorProfile';
import RealtorMyPage from './pages/RealtorMyPage';
import MyPage from './pages/MyPage';
import MyFavoritesPage from './pages/MyPage/Favorites';
import MyPropertiesPage from './pages/MyPage/Properties';
import MyReportsPage from './pages/MyPage/Reports';
import RecentViewsPage from './pages/MyPage/RecentViews';
import { ListPropertyProvider } from './context/ListPropertyContext';
import ListPropertyStartPage from './pages/ListProperty/Start';
import ListPropertyAddressPage from './pages/ListProperty/Address';
import ListPropertyOptionsPage from './pages/ListProperty/Options';
import ListPropertyPhotoPage from './pages/ListProperty/Photo';
import ListPropertyPricePage from './pages/ListProperty/Price';
import ListPropertyFeePage from './pages/ListProperty/Fee';

function ListPropertyLayout() {
  return (
    <ListPropertyProvider>
      <Outlet />
    </ListPropertyProvider>
  );
}

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/search', element: <SearchPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/signup/user', element: <SignupWizardPage /> },
  { path: '/signup/realtor', element: <SignupAgentWizardPage /> },
  { path: '/find-id', element: <FindIdPage /> },
  { path: '/find-password', element: <FindPasswordPage /> },
  { path: '/properties/:propertyId', element: <PropertyDetailPage /> },
  { path: '/properties/:propertyId/bids', element: <PropertyBidsPage /> },
  { path: '/chats', element: <ChatListPage /> },
  { path: '/chats/:chatId', element: <ChatRoomPage /> },
  { path: '/notifications', element: <NotificationsPage /> },
  { path: '/realtors/:realtorId', element: <RealtorProfilePage /> },
  { path: '/realtor/mypage', element: <RealtorMyPage /> },
  { path: '/mypage', element: <MyPage /> },
  { path: '/mypage/favorites', element: <MyFavoritesPage /> },
  { path: '/mypage/properties', element: <MyPropertiesPage /> },
  { path: '/mypage/reports', element: <MyReportsPage /> },
  { path: '/mypage/recent-views', element: <RecentViewsPage /> },
  {
    element: <ListPropertyLayout />,
    children: [
      { path: '/list-property/start', element: <ListPropertyStartPage /> },
      { path: '/list-property/address', element: <ListPropertyAddressPage /> },
      { path: '/list-property/options', element: <ListPropertyOptionsPage /> },
      { path: '/list-property/photo', element: <ListPropertyPhotoPage /> },
      { path: '/list-property/price', element: <ListPropertyPricePage /> },
      { path: '/list-property/fee', element: <ListPropertyFeePage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
