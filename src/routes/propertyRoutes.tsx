import { RouteObject } from 'react-router-dom';
import PropertyDetailPage from '../pages/PropertyDetail';
import PropertyBidsPage from '../pages/PropertyBids';

/** 매물 상세는 비로그인도 볼 수 있다 (백엔드 GET /properties/{id}가 permitAll). */
export const propertyPublicRoutes: RouteObject[] = [{ path: '/properties/:propertyId', element: <PropertyDetailPage /> }];

/** 받은 입찰 목록은 집주인만 볼 수 있어 로그인이 필요하다. */
export const propertyProtectedRoutes: RouteObject[] = [
  { path: '/properties/:propertyId/bids', element: <PropertyBidsPage /> },
];
