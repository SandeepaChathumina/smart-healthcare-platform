import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import { APP_ROUTES } from '../../constants/routes';

const ProfilePage = () => {
  const { user, token } = useAuth();

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

  return (
    <DashboardLayout title="My Profile">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Profile Information</h2>
              <p className="mt-1 text-sm text-slate-600">
                Current logged-in user details.
              </p>
            </div>

            <Link
              to={getEditPath()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Edit Profile
            </Link>
          </div>

          <div className="space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-100 p-4">
              <span className="font-semibold text-slate-900">Full Name:</span> {user?.fullName}
            </div>

            <div className="rounded-2xl bg-slate-100 p-4">
              <span className="font-semibold text-slate-900">Email:</span> {user?.email}
            </div>

            <div className="rounded-2xl bg-slate-100 p-4">
              <span className="font-semibold text-slate-900">Phone:</span> {user?.phone}
            </div>

            <div className="rounded-2xl bg-slate-100 p-4">
              <span className="font-semibold text-slate-900">Address:</span>{' '}
              {user?.location?.address || '-'}
            </div>

            <div className="rounded-2xl bg-slate-100 p-4">
              <span className="font-semibold text-slate-900">City:</span>{' '}
              {user?.location?.city || '-'}
            </div>

            <div className="rounded-2xl bg-slate-100 p-4">
              <span className="font-semibold text-slate-900">Role:</span> {user?.role}
            </div>

            <div className="rounded-2xl bg-slate-100 p-4">
              <span className="font-semibold text-slate-900">Verified:</span>{' '}
              {String(user?.isVerified)}
            </div>

            <div className="rounded-2xl bg-slate-100 p-4">
              <span className="font-semibold text-slate-900">Account Status:</span>{' '}
              {user?.accountStatus}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Developer View</h2>
          <p className="mt-1 text-sm text-slate-600">
            Temporary section for testing current auth data.
          </p>

          <div className="mt-6 space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-100 p-4">
              <span className="font-semibold text-slate-900">User ID:</span> {user?.id}
            </div>

            <div className="rounded-2xl bg-slate-100 p-4 break-all">
              <span className="font-semibold text-slate-900">Token:</span> {token}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;