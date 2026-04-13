import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import SidebarLink from '../components/dashboard/SidebarLink';
import { APP_ROUTES } from '../constants/routes';

const DashboardLayout = ({ title, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getLinks = () => {
    switch (user?.role) {
      case 'Admin':
        return [
          { label: 'Dashboard', path: APP_ROUTES.ADMIN_DASHBOARD },
          { label: 'My Profile', path: APP_ROUTES.ADMIN_PROFILE },
          { label: 'Pending Doctors', path: APP_ROUTES.ADMIN_PENDING_DOCTORS },
          { label: 'All Users', path: APP_ROUTES.ADMIN_ALL_USERS },
          { label: 'Doctors', path: APP_ROUTES.ADMIN_DOCTORS },
        ];

      case 'Doctor':
        return [
          { label: 'Dashboard', path: APP_ROUTES.DOCTOR_DASHBOARD },
          { label: 'My Profile', path: APP_ROUTES.DOCTOR_PROFILE },
        ];

      case 'Patient':
        return [
          { label: 'Dashboard', path: APP_ROUTES.PATIENT_DASHBOARD },
          { label: 'My Profile', path: APP_ROUTES.PATIENT_PROFILE },
        ];

      default:
        return [];
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate(APP_ROUTES.LOGIN, { replace: true });
  };

  const links = getLinks();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-6 py-8">
          <div className="mb-8">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Smart Healthcare
            </span>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              {user?.role || 'User'} Panel
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {user?.fullName || 'Authenticated User'}
            </p>
          </div>

          <nav className="space-y-2">
            {links.map((link) => (
              <SidebarLink key={link.path} to={link.path}>
                {link.label}
              </SidebarLink>
            ))}
          </nav>
        </aside>

        <main className="p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {title}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Welcome back, {user?.fullName}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Logout
            </button>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;