import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import SidebarLink from '../components/dashboard/SidebarLink';
import { APP_ROUTES } from '../constants/routes';
import { adminLinks } from '../data/dashboard/adminLinks';
import { doctorLinks } from '../data/dashboard/doctorLinks';
import { patientLinks } from '../data/dashboard/patientLinks';

const DashboardLayout = ({ title, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getLinks = () => {
    switch (user?.role) {
      case 'Admin':
        return adminLinks;
      case 'Doctor':
        return doctorLinks;
      case 'Patient':
        return patientLinks;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200/50 bg-white/95 backdrop-blur px-6 py-8 shadow-sm sticky top-0 h-screen overflow-y-auto">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-1.5 text-xs font-bold text-blue-700 border border-blue-100/50">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              Smart Healthcare
            </span>

            <h2 className="mt-6 text-xl font-bold text-slate-900">
              {user?.role || 'User'} Panel
            </h2>

            <p className="mt-2 text-sm text-slate-600 truncate">
              {user?.fullName || 'Authenticated User'}
            </p>
          </div>

          <nav className="space-y-2">
            {links.map((link) => (
              <SidebarLink key={link.path} to={link.path} end={link.end}>
                {link.label}
              </SidebarLink>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-8 w-full rounded-lg border border-red-200/50 px-4 py-2 text-sm font-semibold text-red-600 transition duration-200 hover:bg-red-50 hover:border-red-300"
          >
            Logout
          </button>
        </aside>

        <main className="p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-white/60 backdrop-blur p-8 shadow-md border border-slate-200/50 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {title}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Welcome back, <span className="font-semibold text-slate-900">{user?.fullName}</span>
              </p>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;