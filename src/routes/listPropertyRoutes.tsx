import { Outlet, RouteObject } from 'react-router-dom';
import { ListPropertyProvider } from '../context/ListPropertyContext';
import ListPropertyStartPage from '../pages/ListProperty/Start';
import ListPropertyAddressPage from '../pages/ListProperty/Address';
import ListPropertyOptionsPage from '../pages/ListProperty/Options';
import ListPropertyPhotoPage from '../pages/ListProperty/Photo';
import ListPropertyPricePage from '../pages/ListProperty/Price';
import ListPropertyFeePage from '../pages/ListProperty/Fee';

function ListPropertyLayout() {
  return (
    <ListPropertyProvider>
      <Outlet />
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
    ],
  },
];
