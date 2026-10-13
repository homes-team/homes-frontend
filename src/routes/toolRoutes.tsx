import { RouteObject } from 'react-router-dom';
import CalculatorPage from '../pages/Calculator';

/** 로그인 없이 쓸 수 있는 도구 화면 */
export const toolRoutes: RouteObject[] = [{ path: '/calculator', element: <CalculatorPage /> }];
