import { useEffect, useState } from 'react';
import {
  Calendar,
  FileText,
  Pill,
  Clock,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import { getPrescriptionsByPatient } from '../../services/doctorService';
import { getAppointmentById } from '../../services/appointmentService';
import { APP_ROUTES } from '../../constants/routes';

const getStatusBadge = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'active') return 'bg-green-100 text-green-700 ring-green-200';
  if (value === 'completed') return 'bg-blue-100 text-blue-700 ring-blue-200';
  if (value === 'expired') return 'bg-amber-100 text-amber-700 ring-amber-200';
  if (value === 'cancelled') return 'bg-red-100 text-red-700 ring-red-200';
  return 'bg-slate-100 text-slate-700 ring-slate-200';
};

const getApptStatusBadge = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'confirmed') return 'bg-blue-100 text-blue-700';
  if (value === 'awaiting_payment') return 'bg-sky-100 text-sky-700';
  if (value === 'pending') return 'bg-indigo-100 text-indigo-700';
  if (value === 'completed') return 'bg-green-100 text-green-700';
  if (value === 'cancelled' || value === 'rejected') return 'bg-slate-100 text-slate-500';
  return 'bg-slate-100 text-slate-700';
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return 'Not scheduled yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/* ── Inline Appointment Panel ── */
const AppointmentPanel = ({ appointmentId }) => {
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appointmentId) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAppointmentById(appointmentId);
        setAppt(data?.appointment || null);
      } catch {
        setError('Could not load appointment details.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appointmentId]);

  if (!appointmentId) {
    return (
      <p className="mt-1 text-sm text-slate-400 italic">No linked appointment</p>
    );
  }

  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        Loading appointment…
      </div>
    );
  }

  if (error || !appt) {
    return (
      <p className="mt-2 text-sm text-red-500">{error || 'Appointment not found.'}</p>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-4">
      {/* Header row */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Stethoscope className="h-4 w-4" />
          </div>
          <p className="font-semibold text-slate-800">
            {appt.reason || 'Doctor Consultation'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getApptStatusBadge(appt.status)}`}
          >
            {String(appt.status || '').replace('_', ' ')}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 capitalize">
            {appt.appointmentType === 'telemedicine' ? 'Telemedicine' : 'In Person'}
          </span>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
        <div className="flex items-start gap-2 rounded-xl bg-white/70 p-2.5">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-400">
              Scheduled Time
            </p>
            <p className="font-medium text-slate-700">
              {formatDateTime(appt.scheduledDateTime || appt.preferredDateTime)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-white/70 p-2.5">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400">
              Payment
            </p>
            <p className="font-medium capitalize text-slate-700">
              {appt.paymentStatus || 'Pending'}
            </p>
          </div>
        </div>

        {appt.consultationFee && (
          <div className="flex items-start gap-2 rounded-xl bg-white/70 p-2.5">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-400">
                Consultation Fee
              </p>
              <p className="font-medium text-slate-700">LKR {appt.consultationFee}</p>
            </div>
          </div>
        )}
      </div>

      {appt.symptomsSummary && (
        <p className="mt-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Symptoms: </span>
          {appt.symptomsSummary}
        </p>
      )}

      {/* Link to appointment */}
      <div className="mt-3">
        <Link
          to={`/patient/appointments/${appointmentId}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Full Appointment
        </Link>
      </div>
    </div>
  );
};

/* ── Main Prescriptions Page ── */
const PrescriptionsPage = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;
      const data = await getPrescriptionsByPatient(user.id, { limit: 100 });
      setPrescriptions(data.prescriptions || []);
    } catch {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, [user?.id]);

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <DashboardLayout title="My Prescriptions">
      <div className="space-y-6">
        {/* Page header */}
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Prescriptions</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                View all your prescribed medications along with the related appointment details.
              </p>
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-3xl bg-white ring-1 ring-slate-100"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && prescriptions.length === 0 && (
          <div className="rounded-2xl bg-slate-50 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-lg font-semibold text-slate-700">No prescriptions found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Your prescriptions will appear here once issued by a doctor.
            </p>
          </div>
        )}

        {/* Prescription cards */}
        {!loading && prescriptions.length > 0 && (
          <div className="grid gap-5">
            {prescriptions.map((prescription) => {
              const isExpanded = expandedId === prescription._id;
              return (
                <div
                  key={prescription._id}
                  className="rounded-3xl border border-blue-100 bg-white shadow-sm transition duration-200 hover:shadow-md"
                >
                  {/* Card header – always visible */}
                  <div className="p-6">
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

                    {/* Meta info row */}
                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
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
                          Medicines
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {prescription.medicines?.length || 0} item(s)
                        </p>
                      </div>
                    </div>

                    {/* Instructions */}
                    {prescription.instructions && (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Instructions
                        </p>
                        <p className="mt-2 text-sm text-slate-700">{prescription.instructions}</p>
                      </div>
                    )}

                    {/* Medicines list */}
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
                                {medicine.timing && (
                                  <p>Timing: {medicine.timing.replace('_', ' ')}</p>
                                )}
                                {medicine.notes && <p>Notes: {medicine.notes}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Appointment accordion section */}
                  <div className="border-t border-slate-100">
                    <button
                      onClick={() => toggleExpand(prescription._id)}
                      className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left text-sm font-semibold text-blue-700 transition hover:bg-blue-50/50"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Related Appointment Details
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6">
                        <AppointmentPanel
                          appointmentId={prescription.appointmentId}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PrescriptionsPage;