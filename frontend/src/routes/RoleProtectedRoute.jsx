import { Navigate, Outlet } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';
import useAuth from '../hooks/useAuth';

const RoleProtectedRoute = ({ allowedRoles = [] }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={APP_ROUTES.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;