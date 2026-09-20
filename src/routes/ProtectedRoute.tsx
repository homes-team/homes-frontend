import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../api/client';

/** 로그인 안 되어 있으면 /login으로 돌려보내고, 원래 가려던 경로는 로그인 후 되돌아올 수 있게 넘겨준다. */
function ProtectedRoute() {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
