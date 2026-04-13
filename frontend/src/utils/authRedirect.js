import { APP_ROUTES } from '../constants/routes';

export const getDefaultRouteByUser = (user) => {
  if (!user) return APP_ROUTES.LOGIN;

  if (!user.isVerified) {
    return APP_ROUTES.VERIFY_EMAIL;
  }

  if (user.accountStatus === 'suspended' || user.accountStatus === 'rejected') {
    return APP_ROUTES.ACCOUNT_BLOCKED;
  }

  if (user.role === 'Doctor' && user.accountStatus !== 'active') {
    return APP_ROUTES.PENDING_APPROVAL;
  }

  switch (user.role) {
    case 'Admin':
      return APP_ROUTES.ADMIN_DASHBOARD;
    case 'Doctor':
      return APP_ROUTES.DOCTOR_DASHBOARD;
    case 'Patient':
      return APP_ROUTES.PATIENT_DASHBOARD;
    default:
      return APP_ROUTES.HOME;
  }
};

export const getLoginBlockedMessage = (user) => {
  if (!user?.isVerified) {
    return 'Your email is not verified yet. Please verify your email to continue.';
  }

  if (user?.accountStatus === 'suspended') {
    return 'Your account has been suspended.';
  }

  if (user?.accountStatus === 'rejected') {
    return 'Your account has been rejected.';
  }

  if (user?.role === 'Doctor' && user?.accountStatus !== 'active') {
    return 'Your doctor account is pending admin approval.';
  }

  return '';
};