import { Navigate, Outlet } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';
import useAuth from '../hooks/useAuth';

const VerifiedRoute = () => {
  const { user } = useAuth();

  if (!user?.isVerified) {
    return <Navigate to={APP_ROUTES.VERIFY_EMAIL} replace />;
  }

  if (user.accountStatus === 'suspended' || user.accountStatus === 'rejected') {
    return <Navigate to={APP_ROUTES.ACCOUNT_BLOCKED} replace />;
  }

  return <Outlet />;
};

export default VerifiedRoute;