import { useEffect, useState } from 'react';
import { Eye, Calendar, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getPatientPrescriptions } from '../../services/patientService';
import { APP_ROUTES } from '../../constants/routes';

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await getPatientPrescriptions();
      setPrescriptions(data.prescriptions || []);
    } catch (error) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

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
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">📋</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{prescription.reportTitle || 'Prescription'}</h3>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Issued: {formatDate(prescription.uploadedAt)}
                          </span>
                          {prescription.appointmentId && (
                            <span>Appointment: {prescription.appointmentId}</span>
                          )}
                        </div>
                        {prescription.description && (
                          <p className="mt-2 text-sm text-slate-600">{prescription.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    to={`/patient/prescriptions/${prescription._id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
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