import { Outlet, RouteObject, useLocation } from 'react-router-dom';
import { ListPropertyProvider } from '../context/ListPropertyContext';
import ListPropertyStartPage from '../pages/ListProperty/Start';
import ListPropertyAddressPage from '../pages/ListProperty/Address';
import ListPropertyOptionsPage from '../pages/ListProperty/Options';
import ListPropertyPhotoPage from '../pages/ListProperty/Photo';
import ListPropertyPricePage from '../pages/ListProperty/Price';
import ListPropertyFeePage from '../pages/ListProperty/Fee';
import ListPropertyEditLoader from '../pages/ListProperty/Edit';
import IdentityGate from '../pages/ListProperty/components/IdentityGate';

function ListPropertyLayout() {
  const { pathname } = useLocation();
  // 새 매물 등록(/list-property/*)만 실명 인증을 요구하고, 이미 등록한 매물의 수정은 막지 않는다
  const needsIdentity = pathname.startsWith('/list-property/');

  return (
    <ListPropertyProvider>
      {needsIdentity ? (
        <IdentityGate>
          <Outlet />
        </IdentityGate>
      ) : (
        <Outlet />
      )}
    </ListPropertyProvider>
  );
}

export const listPropertyRoutes: RouteObject[] = [
  {
    element: <ListPropertyLayout />,
    children: [
      { path: '/list-property/start', element: <ListPropertyStartPage /> },
      { path: '/list-property/address', element: <ListPropertyAddressPage /> },
      { path: '/list-property/options', element: <ListPropertyOptionsPage /> },
      { path: '/list-property/photo', element: <ListPropertyPhotoPage /> },
      { path: '/list-property/price', element: <ListPropertyPricePage /> },
      { path: '/list-property/fee', element: <ListPropertyFeePage /> },
      { path: '/properties/:propertyId/edit', element: <ListPropertyEditLoader /> },
    ],
  },
];
