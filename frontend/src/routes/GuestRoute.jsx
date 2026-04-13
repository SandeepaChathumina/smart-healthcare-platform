import { Navigate, Outlet } from 'react-router-dom';
import PageLoader from '../components/common/PageLoader';
import { APP_ROUTES } from '../constants/routes';
import useAuth from '../hooks/useAuth';
import { getDefaultRouteByUser } from '../utils/authRedirect';

const GuestRoute = () => {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRouteByUser(user)} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;