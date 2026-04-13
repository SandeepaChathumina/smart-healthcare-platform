import { Navigate, Outlet, useLocation } from 'react-router-dom';
import PageLoader from '../components/common/PageLoader';
import { APP_ROUTES } from '../constants/routes';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = () => {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;