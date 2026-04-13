import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  approveDoctor,
  getPendingDoctors,
  rejectDoctor,
} from '../../services/authService';

const PendingDoctorsPage = () => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');

  const loadPendingDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const response = await getPendingDoctors();
      setPendingDoctors(response?.doctors || []);
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Failed to load pending doctors.';
      toast.error(apiMessage);
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    loadPendingDoctors();
  }, []);

  const handleApproveDoctor = async (doctorId) => {
    try {
      setActionLoadingId(doctorId);
      await approveDoctor(doctorId);
      toast.success('Doctor approved successfully');
      await loadPendingDoctors();
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Failed to approve doctor.';
      toast.error(apiMessage);
    } finally {
      setActionLoadingId('');
    }
  };

  const handleRejectDoctor = async (doctorId) => {
    try {
      setActionLoadingId(doctorId);
      await rejectDoctor(doctorId, {
        reason: 'Doctor verification rejected by admin',
      });
      toast.success('Doctor rejected successfully');
      await loadPendingDoctors();
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Failed to reject doctor.';
      toast.error(apiMessage);
    } finally {
      setActionLoadingId('');
    }
  };

  return (
    <DashboardLayout title="Pending Doctor Approvals">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Pending Doctors</h2>
            <p className="mt-1 text-sm text-slate-600">
              Review and manage doctors waiting for admin approval.
            </p>
          </div>

          <button
            onClick={loadPendingDoctors}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {loadingDoctors ? (
          <div className="rounded-2xl bg-slate-100 p-6 text-sm text-slate-600">
            Loading pending doctors...
          </div>
        ) : pendingDoctors.length === 0 ? (
          <div className="rounded-2xl bg-slate-100 p-6 text-sm text-slate-600">
            No pending doctors found.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingDoctors.map((doctor) => (
              <div
                key={doctor._id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                  <p><strong>Name:</strong> {doctor.fullName}</p>
                  <p><strong>Email:</strong> {doctor.email}</p>
                  <p><strong>Phone:</strong> {doctor.phone}</p>
                  <p><strong>Role:</strong> {doctor.role}</p>
                  <p><strong>Status:</strong> {doctor.accountStatus}</p>
                  <p><strong>Verified:</strong> {String(doctor.isVerified)}</p>
                  <p><strong>License Number:</strong> {doctor.licenseNumber || '-'}</p>
                  <p><strong>Specialization:</strong> {doctor.specialization || '-'}</p>
                  <p><strong>Qualifications:</strong> {doctor.qualifications || '-'}</p>
                  <p><strong>Clinic:</strong> {doctor.hospitalOrClinic || '-'}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleApproveDoctor(doctor._id)}
                    disabled={actionLoadingId === doctor._id}
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                  >
                    {actionLoadingId === doctor._id ? 'Processing...' : 'Approve'}
                  </button>

                  <button
                    onClick={() => handleRejectDoctor(doctor._id)}
                    disabled={actionLoadingId === doctor._id}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                  >
                    {actionLoadingId === doctor._id ? 'Processing...' : 'Reject'}
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

export default PendingDoctorsPage;