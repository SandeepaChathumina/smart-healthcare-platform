import { Navigate, Outlet } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';
import useAuth from '../hooks/useAuth';

const DoctorApprovalRoute = () => {
  const { user } = useAuth();

  if (user?.role === 'Doctor' && user.accountStatus !== 'active') {
    return <Navigate to={APP_ROUTES.PENDING_APPROVAL} replace />;
  }

  return <Outlet />;
};

export default DoctorApprovalRoute;