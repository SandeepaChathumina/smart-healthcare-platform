import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import { getAppointmentById, getTelemedicineSessionByAppointment } from '../../services/appointmentService';

const AppointmentDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const data = await getAppointmentById(id);
        const appointmentData = data?.appointment || null;
        setAppointment(appointmentData);

        if (
          appointmentData?.appointmentType === 'telemedicine' &&
          appointmentData?.telemedicineSessionId
        ) {
          setSessionLoading(true);
          try {
            const sessionData = await getTelemedicineSessionByAppointment(id);
            setSession(sessionData?.session || null);
          } catch {
            setSession(null);
          } finally {
            setSessionLoading(false);
          }
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAppointment();
  }, [id]);

  const isPatient = user?.role === 'Patient';

  return (
    <DashboardLayout title="Appointment Details">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        {loading && <p>Loading appointment...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {appointment && (
          <div className="space-y-5 text-sm text-slate-700">
            <p><strong>ID:</strong> {appointment._id}</p>
            <p><strong>Patient ID:</strong> {appointment.patientId}</p>
            <p><strong>Doctor ID:</strong> {appointment.doctorId}</p>
            <p><strong>Type:</strong> {appointment.appointmentType}</p>
            <p><strong>Reason:</strong> {appointment.reason}</p>
            <p><strong>Symptoms:</strong> {appointment.symptomsSummary || 'N/A'}</p>
            <p><strong>Preferred Date:</strong> {appointment.preferredDateTime}</p>
            <p><strong>Scheduled Date:</strong> {appointment.scheduledDateTime || 'Not scheduled yet'}</p>
            <p><strong>Status:</strong> {appointment.status}</p>
            <p><strong>Payment Status:</strong> {appointment.paymentStatus}</p>
            <p><strong>Consultation Fee:</strong> LKR {appointment.consultationFee}</p>
            <p><strong>Doctor Response:</strong> {appointment.doctorResponseNote || 'N/A'}</p>
            <p><strong>Patient Notes:</strong> {appointment.patientNotes || 'N/A'}</p>

            <div className="flex flex-wrap gap-3 pt-3">
              {isPatient &&
                appointment.status === 'awaiting_payment' &&
                appointment.paymentStatus !== 'paid' && (
                  <Link
                    to={`/patient/appointments/${appointment._id}/pay`}
                    className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
                  >
                    Pay Now
                  </Link>
                )}

              {appointment.appointmentType === 'telemedicine' &&
                appointment.paymentStatus === 'paid' &&
                session?._id && (
                  <Link
                    to={`/patient/telemedicine/${session._id}`}
                    className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white"
                  >
                    Join Session
                  </Link>
                )}
            </div>

            {sessionLoading && <p>Loading telemedicine session...</p>}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AppointmentDetailsPage;