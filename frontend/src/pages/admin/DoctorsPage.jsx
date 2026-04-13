import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getUsersByRole } from '../../services/authService';

const statusOptions = ['All', 'pending', 'active', 'rejected', 'suspended'];

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const response = await getUsersByRole('Doctor');
      setDoctors(response?.users || []);
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Failed to load doctors.';
      toast.error(apiMessage);
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const filteredDoctors = useMemo(() => {
    if (selectedStatus === 'All') return doctors;
    return doctors.filter((doctor) => doctor.accountStatus === selectedStatus);
  }, [doctors, selectedStatus]);

  return (
    <DashboardLayout title="Doctors">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Doctors Overview</h2>
            <p className="mt-1 text-sm text-slate-600">
              View all doctors and filter them by account status.
            </p>
          </div>

          <button
            onClick={loadDoctors}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {loadingDoctors ? (
          <div className="rounded-2xl bg-slate-100 p-6 text-sm text-slate-600">
            Loading doctors...
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="rounded-2xl bg-slate-100 p-6 text-sm text-slate-600">
            No doctors found for the selected status.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor._id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-3">
                  <p><strong>Name:</strong> {doctor.fullName}</p>
                  <p><strong>Email:</strong> {doctor.email}</p>
                  <p><strong>Phone:</strong> {doctor.phone}</p>
                  <p><strong>Role:</strong> {doctor.role}</p>
                  <p><strong>Verified:</strong> {String(doctor.isVerified)}</p>
                  <p><strong>Status:</strong> {doctor.accountStatus}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorsPage;