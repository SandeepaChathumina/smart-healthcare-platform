import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import {
  getAllUsers,
  getPendingDoctors,
  getUsersByRole,
} from '../../services/authService';

const StatCard = ({ title, value, subtitle }) => {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-3 text-3xl font-bold text-slate-900">{value}</h3>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
};

const AdminDashboardPage = () => {
  const { user, token } = useAuth();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    pendingDoctors: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = async () => {
    try {
      setLoadingStats(true);

      const [usersRes, doctorsRes, patientsRes, pendingRes] = await Promise.all([
        getAllUsers(),
        getUsersByRole('Doctor'),
        getUsersByRole('Patient'),
        getPendingDoctors(),
      ]);

      setStats({
        totalUsers: usersRes?.count || usersRes?.users?.length || 0,
        totalDoctors: doctorsRes?.count || doctorsRes?.users?.length || 0,
        totalPatients: patientsRes?.count || patientsRes?.users?.length || 0,
        pendingDoctors: pendingRes?.count || pendingRes?.doctors?.length || 0,
      });
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Failed to load admin dashboard stats.';
      toast.error(apiMessage);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        {loadingStats ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">Loading dashboard statistics...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              subtitle="All registered system users"
            />
            <StatCard
              title="Doctors"
              value={stats.totalDoctors}
              subtitle="All doctor accounts"
            />
            <StatCard
              title="Patients"
              value={stats.totalPatients}
              subtitle="All patient accounts"
            />
            <StatCard
              title="Pending Doctors"
              value={stats.pendingDoctors}
              subtitle="Waiting for admin approval"
            />
          </div>
        )}

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Admin Session Info</h2>
              <p className="mt-1 text-sm text-slate-600">
                Temporary developer section for current logged-in admin data.
              </p>
            </div>

            <button
              onClick={loadStats}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Refresh Stats
            </button>
          </div>

          <div className="space-y-3 rounded-2xl bg-slate-100 p-6 text-sm text-slate-700">
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
    </DashboardLayout>
  );
};

export default AdminDashboardPage;