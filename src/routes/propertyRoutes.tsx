import { RouteObject } from 'react-router-dom';
import PropertyDetailPage from '../pages/PropertyDetail';
import PropertyBidsPage from '../pages/PropertyBids';

export const propertyRoutes: RouteObject[] = [
  { path: '/properties/:propertyId', element: <PropertyDetailPage /> },
  { path: '/properties/:propertyId/bids', element: <PropertyBidsPage /> },
];
