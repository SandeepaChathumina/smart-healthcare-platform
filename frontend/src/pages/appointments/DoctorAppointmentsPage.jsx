import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import { getAppointmentsByDoctor, updateAppointmentStatus } from '../../services/appointmentService';

const DoctorAppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAppointments = async () => {
    try {
      const data = await getAppointmentsByDoctor(user?.id);
      setAppointments(data?.appointments || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) loadAppointments();
  }, [user?.id]);

  const handleAccept = async (appointmentId) => {
    try {
      await updateAppointmentStatus(appointmentId, {
        status: 'accepted',
        doctorResponseNote: 'Appointment accepted. Please complete payment.',
      });
      loadAppointments();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update appointment');
    }
  };

  return (
    <DashboardLayout title="Doctor Appointments">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        {loading && <p>Loading appointments...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !appointments.length && (
          <p className="text-slate-600">No appointments found.</p>
        )}

        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment._id} className="rounded-2xl border p-4">
              <p><strong>Patient ID:</strong> {appointment.patientId}</p>
              <p><strong>Type:</strong> {appointment.appointmentType}</p>
              <p><strong>Status:</strong> {appointment.status}</p>
              <p><strong>Reason:</strong> {appointment.reason}</p>

              <div className="mt-3 flex gap-4">
                <Link
                  to={`/doctor/appointments/${appointment._id}`}
                  className="text-sm font-medium text-blue-600"
                >
                  View Details
                </Link>

                {(appointment.status === 'pending' || appointment.status === 'rescheduled') && (
                  <button
                    onClick={() => handleAccept(appointment._id)}
                    className="text-sm font-medium text-green-600"
                  >
                    Accept
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorAppointmentsPage;