import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import { getAppointmentsByPatient } from '../../services/appointmentService';

const PatientAppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await getAppointmentsByPatient(user?.id);
        setAppointments(data?.appointments || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchAppointments();
  }, [user?.id]);

  return (
    <DashboardLayout title="My Appointments">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        {loading && <p>Loading appointments...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !appointments.length && (
          <p className="text-slate-600">No appointments found.</p>
        )}

        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment._id} className="rounded-2xl border p-4">
              <p><strong>Doctor ID:</strong> {appointment.doctorId}</p>
              <p><strong>Type:</strong> {appointment.appointmentType}</p>
              <p><strong>Status:</strong> {appointment.status}</p>
              <p><strong>Payment Status:</strong> {appointment.paymentStatus}</p>
              <p><strong>Preferred Time:</strong> {appointment.preferredDateTime}</p>

              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  to={`/patient/appointments/${appointment._id}`}
                  className="inline-block text-sm font-medium text-blue-600"
                >
                  View Details
                </Link>

                {appointment.status === 'awaiting_payment' &&
                  appointment.paymentStatus !== 'paid' && (
                    <Link
                      to={`/patient/appointments/${appointment._id}/pay`}
                      className="inline-block text-sm font-medium text-green-600"
                    >
                      Pay Now
                    </Link>
                  )}

                {appointment.appointmentType === 'telemedicine' &&
                  appointment.paymentStatus === 'paid' &&
                  appointment.telemedicineSessionId && (
                    <Link
                      to={`/patient/telemedicine/${appointment.telemedicineSessionId}`}
                      className="inline-block text-sm font-medium text-purple-600"
                    >
                      Join Session
                    </Link>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientAppointmentsPage;