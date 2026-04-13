import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  deleteUserById,
  getAllUsers,
  getUsersByRole,
} from '../../services/authService';

const roleOptions = ['All', 'Admin', 'Doctor', 'Patient'];

const AllUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('All');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');

  const loadUsers = async (role = 'All') => {
    try {
      setLoadingUsers(true);

      const response =
        role === 'All' ? await getAllUsers() : await getUsersByRole(role);

      setUsers(response?.users || []);
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Failed to load users.';
      toast.error(apiMessage);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers(selectedRole);
  }, [selectedRole]);

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?');

    if (!confirmed) return;

    try {
      setActionLoadingId(userId);
      await deleteUserById(userId);
      toast.success('User deleted successfully');
      await loadUsers(selectedRole);
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Failed to delete user.';
      toast.error(apiMessage);
    } finally {
      setActionLoadingId('');
    }
  };

  return (
    <DashboardLayout title="All Users">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">System Users</h2>
            <p className="mt-1 text-sm text-slate-600">
              View and manage all registered users in the system.
            </p>
          </div>

          <button
            onClick={() => loadUsers(selectedRole)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {roleOptions.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                selectedRole === role
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {loadingUsers ? (
          <div className="rounded-2xl bg-slate-100 p-6 text-sm text-slate-600">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl bg-slate-100 p-6 text-sm text-slate-600">
            No users found for the selected filter.
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((item) => (
              <div
                key={item._id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-3">
                  <p><strong>Name:</strong> {item.fullName}</p>
                  <p><strong>Email:</strong> {item.email}</p>
                  <p><strong>Phone:</strong> {item.phone}</p>
                  <p><strong>Role:</strong> {item.role}</p>
                  <p><strong>Verified:</strong> {String(item.isVerified)}</p>
                  <p><strong>Status:</strong> {item.accountStatus}</p>
                </div>

                <div className="mt-5">
                  <button
                    onClick={() => handleDeleteUser(item._id)}
                    disabled={actionLoadingId === item._id}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                  >
                    {actionLoadingId === item._id ? 'Deleting...' : 'Delete User'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AllUsersPage;