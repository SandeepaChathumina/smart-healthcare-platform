import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import { APP_ROUTES } from '../../constants/routes';

const ProfilePage = () => {
  const { user } = useAuth();

  const getEditPath = () => {
    switch (user?.role) {
      case 'Admin':
        return APP_ROUTES.ADMIN_PROFILE_EDIT;
      case 'Doctor':
        return APP_ROUTES.DOCTOR_PROFILE_EDIT;
      case 'Patient':
        return APP_ROUTES.PATIENT_PROFILE_EDIT;
      default:
        return '#';
    }
  };

  const fullName = user?.fullName || 'User';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const detailRows = [
    { label: 'Full Name', value: user?.fullName || '-' },
    { label: 'Email', value: user?.email || '-' },
    { label: 'Phone', value: user?.phone || '-' },
    { label: 'Address', value: user?.location?.address || '-' },
    { label: 'City', value: user?.location?.city || '-' },
  ];

  return (
    <DashboardLayout title="My Profile">
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                {initials || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{fullName}</h2>
                <p className="mt-1 text-sm text-slate-600">{user?.email || '-'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {user?.role || 'Unknown role'}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  user?.isVerified
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {user?.isVerified ? 'Verified' : 'Not Verified'}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  user?.accountStatus === 'active'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {user?.accountStatus || 'Unknown status'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Profile Information</h2>
              <p className="mt-1 text-sm text-slate-600">
                Keep your personal details up to date for better communication.
              </p>
            </div>

            <Link
              to={getEditPath()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Edit Profile
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {detailRows.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;