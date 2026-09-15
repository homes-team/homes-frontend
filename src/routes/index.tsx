import { createBrowserRouter } from 'react-router-dom';
import { homeRoutes } from './homeRoutes';
import { authRoutes } from './authRoutes';
import { searchRoutes } from './searchRoutes';
import { propertyRoutes } from './propertyRoutes';
import { chatRoutes } from './chatRoutes';
import { notificationRoutes } from './notificationRoutes';
import { realtorRoutes } from './realtorRoutes';
import { myPageRoutes } from './myPageRoutes';
import { listPropertyRoutes } from './listPropertyRoutes';

export const router = createBrowserRouter([
  ...homeRoutes,
  ...authRoutes,
  ...searchRoutes,
  ...propertyRoutes,
  ...chatRoutes,
  ...notificationRoutes,
  ...realtorRoutes,
  ...myPageRoutes,
  ...listPropertyRoutes,
]);
