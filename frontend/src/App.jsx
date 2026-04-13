import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import UnauthorizedPage from './pages/status/UnauthorizedPage';
import PendingApprovalPage from './pages/status/PendingApprovalPage';
import AccountBlockedPage from './pages/status/AccountBlockedPage';
import AdminDashboardPage from './pages/dashboard/AdminDashboardPage';
import DoctorDashboardPage from './pages/dashboard/DoctorDashboardPage';
import PatientDashboardPage from './pages/dashboard/PatientDashboardPage';
import GuestRoute from './routes/GuestRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import VerifiedRoute from './routes/VerifiedRoute';
import DoctorApprovalRoute from './routes/DoctorApprovalRoute';
import RoleProtectedRoute from './routes/RoleProtectedRoute';
import { APP_ROUTES } from './constants/routes';

function App() {
  return (
    <Routes>
      <Route path={APP_ROUTES.HOME} element={<HomePage />} />

      <Route element={<GuestRoute />}>
        <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={APP_ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={APP_ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
        <Route path={APP_ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={APP_ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path={APP_ROUTES.PENDING_APPROVAL} element={<PendingApprovalPage />} />
        <Route path={APP_ROUTES.ACCOUNT_BLOCKED} element={<AccountBlockedPage />} />

        <Route element={<VerifiedRoute />}>
          <Route element={<DoctorApprovalRoute />}>
            <Route
              path={APP_ROUTES.ADMIN_DASHBOARD}
              element={<RoleProtectedRoute allowedRoles={['Admin']} />}
            >
              <Route index element={<AdminDashboardPage />} />
            </Route>

            <Route
              path={APP_ROUTES.DOCTOR_DASHBOARD}
              element={<RoleProtectedRoute allowedRoles={['Doctor']} />}
            >
              <Route index element={<DoctorDashboardPage />} />
            </Route>

            <Route
              path={APP_ROUTES.PATIENT_DASHBOARD}
              element={<RoleProtectedRoute allowedRoles={['Patient']} />}
            >
              <Route index element={<PatientDashboardPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path={APP_ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to={APP_ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default App;