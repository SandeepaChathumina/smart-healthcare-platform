import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getUsersByRole } from '../../services/authService';

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const loadPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await getUsersByRole('Patient');
      setPatients(response?.users || []);
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Failed to load patients.';
      toast.error(apiMessage);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  return (
    <DashboardLayout title="Patients">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Patients Overview</h2>
            <p className="mt-1 text-sm text-slate-600">
              View all patient accounts in the system.
            </p>
          </div>

          <button
            onClick={loadPatients}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {loadingPatients ? (
          <div className="rounded-2xl bg-slate-100 p-6 text-sm text-slate-600">
            Loading patients...
          </div>
        ) : patients.length === 0 ? (
          <div className="rounded-2xl bg-slate-100 p-6 text-sm text-slate-600">
            No patients found.
          </div>
        ) : (
          <div className="space-y-4">
            {patients.map((patient) => (
              <div
                key={patient._id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-3">
                  <p><strong>Name:</strong> {patient.fullName}</p>
                  <p><strong>Email:</strong> {patient.email}</p>
                  <p><strong>Phone:</strong> {patient.phone}</p>
                  <p><strong>Role:</strong> {patient.role}</p>
                  <p><strong>Verified:</strong> {String(patient.isVerified)}</p>
                  <p><strong>Status:</strong> {patient.accountStatus}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientsPage;