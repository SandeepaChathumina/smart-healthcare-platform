import useAuth from '../../hooks/useAuth';

const DoctorDashboardPage = () => {
  const { user, token } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Doctor Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Logged in doctor details below.</p>

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
    </div>
  );
};

export default DoctorDashboardPage;