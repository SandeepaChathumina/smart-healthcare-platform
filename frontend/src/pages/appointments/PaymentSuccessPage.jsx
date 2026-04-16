import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { confirmStripePayment } from '../../services/appointmentService';

const PaymentSuccessPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    const verifyPayment = async () => {
      try {
        setLoading(true);
        setError('');

        if (!sessionId) {
          setError('Stripe session ID is missing in the success URL');
          setLoading(false);
          return;
        }

        const data = await confirmStripePayment({
          sessionId,
          appointmentId: id,
        });

        setPayment(data?.payment || null);
        setAppointment(data?.appointment || null);
        setSession(data?.session || null);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Failed to confirm Stripe payment'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      verifyPayment();
    }
  }, [id, searchParams]);

  return (
    <DashboardLayout title="Payment Success">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        {loading && <p>Confirming your payment...</p>}

        {!loading && error && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-red-50 p-5 text-red-700">
              <h2 className="text-2xl font-bold">Payment Verification Failed</h2>
              <p className="mt-2">{error}</p>
            </div>

            <Link
              to={`/patient/appointments/${id}`}
              className="inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              Back to Appointment
            </Link>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-green-50 p-5 text-green-700">
              <h2 className="text-2xl font-bold">Payment Successful</h2>
              <p className="mt-2">
                Your appointment is confirmed successfully.
              </p>
            </div>

            {payment && (
              <div className="rounded-2xl border border-slate-200 p-5">
                <p><strong>Payment ID:</strong> {payment._id}</p>
                <p><strong>Transaction ID:</strong> {payment.transactionId}</p>
                <p><strong>Amount:</strong> LKR {payment.amount}</p>
                <p><strong>Status:</strong> {payment.status}</p>
              </div>
            )}

            {appointment && (
              <div className="rounded-2xl border border-slate-200 p-5">
                <p><strong>Appointment Status:</strong> {appointment.status}</p>
                <p><strong>Payment Status:</strong> {appointment.paymentStatus}</p>
                <p><strong>Appointment Type:</strong> {appointment.appointmentType}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Link
                to={`/patient/appointments/${id}`}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
              >
                View Appointment
              </Link>

              {session?._id && (
                <Link
                  to={`/patient/telemedicine/${session._id}`}
                  className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white"
                >
                  Open Telemedicine Session
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentSuccessPage;