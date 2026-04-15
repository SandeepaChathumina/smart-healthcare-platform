import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAppointmentById } from '../../services/appointmentService';

const AppointmentDetailsPage = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const data = await getAppointmentById(id);
        setAppointment(data?.appointment || null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAppointment();
  }, [id]);

  return (
    <DashboardLayout title="Appointment Details">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        {loading && <p>Loading appointment...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {appointment && (
          <div className="space-y-3 text-sm text-slate-700">
            <p><strong>ID:</strong> {appointment._id}</p>
            <p><strong>Patient ID:</strong> {appointment.patientId}</p>
            <p><strong>Doctor ID:</strong> {appointment.doctorId}</p>
            <p><strong>Type:</strong> {appointment.appointmentType}</p>
            <p><strong>Reason:</strong> {appointment.reason}</p>
            <p><strong>Symptoms:</strong> {appointment.symptomsSummary}</p>
            <p><strong>Preferred Date:</strong> {appointment.preferredDateTime}</p>
            <p><strong>Scheduled Date:</strong> {appointment.scheduledDateTime || 'Not scheduled yet'}</p>
            <p><strong>Status:</strong> {appointment.status}</p>
            <p><strong>Payment Status:</strong> {appointment.paymentStatus}</p>
            <p><strong>Consultation Fee:</strong> {appointment.consultationFee}</p>
            <p><strong>Doctor Response:</strong> {appointment.doctorResponseNote || 'N/A'}</p>
            <p><strong>Patient Notes:</strong> {appointment.patientNotes || 'N/A'}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AppointmentDetailsPage;