import { useEffect, useState } from 'react';
import { Calendar, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import { getPrescriptionsByPatient } from '../../services/doctorService';
import { APP_ROUTES } from '../../constants/routes';

const getStatusBadge = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'active') return 'bg-green-100 text-green-700 ring-green-200';
  if (value === 'completed') return 'bg-blue-100 text-blue-700 ring-blue-200';
  if (value === 'expired') return 'bg-amber-100 text-amber-700 ring-amber-200';
  if (value === 'cancelled') return 'bg-red-100 text-red-700 ring-red-200';
  return 'bg-slate-100 text-slate-700 ring-slate-200';
};

const PrescriptionsPage = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;
      const data = await getPrescriptionsByPatient(user.id, { limit: 100 });
      setPrescriptions(data.prescriptions || []);
    } catch (error) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, [user?.id]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout title="My Prescriptions">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-600">
            View all your prescribed medications and treatment plans
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-slate-100 p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-3 text-slate-600">Loading prescriptions...</p>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="rounded-2xl bg-slate-100 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-3 text-lg font-semibold text-slate-900">No prescriptions found</h3>
            <p className="mt-1 text-sm text-slate-600">
              Your prescriptions will appear here once issued by a doctor
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {prescriptions.map((prescription) => (
              <div
                key={prescription._id}
                className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm transition duration-200 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {prescription.diagnosis || 'Prescription'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Issued by Dr. {prescription.doctorName || 'N/A'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadge(
                      prescription.status
                    )}`}
                  >
                    {prescription.status || 'active'}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-blue-50/50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                      Issued Date
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {formatDate(prescription.issuedDate)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50/50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                      Valid Until
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {formatDate(prescription.validUntil)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50/50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                      Refills
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {prescription.refillCount || 0} / {prescription.maxRefills || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50/50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                      Appointment
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {prescription.appointmentId || 'N/A'}
                    </p>
                  </div>
                </div>

                {prescription.instructions && (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Instructions
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{prescription.instructions}</p>
                  </div>
                )}

                {!!prescription.medicines?.length && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Medicines ({prescription.medicines.length})
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {prescription.medicines.map((medicine, index) => (
                        <div
                          key={`${prescription._id}-med-${index}`}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <p className="font-semibold text-slate-900">
                            {medicine.name || 'Medicine'}
                          </p>
                          <div className="mt-2 space-y-1 text-sm text-slate-600">
                            <p>Dosage: {medicine.dosage || 'N/A'}</p>
                            <p>Frequency: {medicine.frequency || 'N/A'}</p>
                            <p>Duration: {medicine.duration || 'N/A'}</p>
                            {medicine.timing && <p>Timing: {medicine.timing.replace('_', ' ')}</p>}
                            {medicine.notes && <p>Notes: {medicine.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5">
                  <Link
                    to={`/patient/appointments/${prescription.appointmentId}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                  >
                    Open Related Appointment
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PrescriptionsPage;