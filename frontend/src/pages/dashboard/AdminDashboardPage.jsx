import DashboardLayout from '../../layouts/DashboardLayout';
import useAuth from '../../hooks/useAuth';

const AdminDashboardPage = () => {
  const { user, token } = useAuth();

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Admin Session Info</h2>
        <p className="mt-1 text-sm text-slate-600">
          Temporary admin dashboard overview.
        </p>

        <div className="mt-6 space-y-3 rounded-2xl bg-slate-100 p-6 text-sm text-slate-700">
          <p><strong>ID:</strong> {user?.id}</p>
          <p><strong>Full Name:</strong> {user?.fullName}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Phone:</strong> {user?.phone}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          <p><strong>Verified:</strong> {String(user?.isVerified)}</p>
          <p><strong>Account Status:</strong> {user?.accountStatus}</p>
          <p className="break-all"><strong>Token:</strong> {token}</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;