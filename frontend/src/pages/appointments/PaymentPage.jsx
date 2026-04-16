import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAppointmentById, createStripeCheckoutSession } from '../../services/appointmentService';

const PaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAppointment = async () => {
      try {
        const data = await getAppointmentById(id);
        setAppointment(data?.appointment || null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load appointment');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadAppointment();
    }
  }, [id]);

  const handleStripeCheckout = async () => {
    try {
      setPaying(true);
      setError('');
      const data = await createStripeCheckoutSession(id);

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setError('Stripe checkout URL was not received');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to start Stripe payment');
      setPaying(false);
    }
  };

  return (
    <DashboardLayout title="Appointment Payment">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        {loading && <p>Loading payment details...</p>}
        {error && <p className="mb-4 text-red-600">{error}</p>}

        {appointment && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Pay for Appointment</h2>

            <div className="rounded-2xl border border-slate-200 p-5">
              <p><strong>Appointment Type:</strong> {appointment.appointmentType}</p>
              <p><strong>Status:</strong> {appointment.status}</p>
              <p><strong>Payment Status:</strong> {appointment.paymentStatus}</p>
              <p><strong>Reason:</strong> {appointment.reason}</p>
              <p><strong>Scheduled Time:</strong> {appointment.scheduledDateTime || appointment.preferredDateTime}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                Consultation Fee: LKR {appointment.consultationFee}
              </p>
            </div>

            {appointment.status === 'awaiting_payment' && appointment.paymentStatus !== 'paid' ? (
              <button
                onClick={handleStripeCheckout}
                disabled={paying}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {paying ? 'Redirecting to Stripe...' : 'Pay with Stripe'}
              </button>
            ) : (
              <div className="rounded-xl bg-green-50 p-4 text-green-700">
                This appointment is not waiting for payment now.
              </div>
            )}

            <button
              onClick={() => navigate(`/patient/appointments/${id}`)}
              className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700"
            >
              Back to Appointment
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentPage;