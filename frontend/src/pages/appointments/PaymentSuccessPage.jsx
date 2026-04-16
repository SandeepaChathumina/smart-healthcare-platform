import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { confirmStripePayment } from "../../services/appointmentService";

const PaymentSuccessPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const hasVerifiedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    const verifyPayment = async () => {
      try {
        setLoading(true);
        setError("");

        if (!sessionId) {
          setError("Stripe session ID is missing in the success URL");
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
            "Failed to confirm Stripe payment"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id && !hasVerifiedRef.current) {
      hasVerifiedRef.current = true;
      verifyPayment();
    }
  }, [id, searchParams]);

  return (
    <DashboardLayout title="Payment Success">
      <div className="space-y-6">
        {loading && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-blue-100">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <h2 className="mt-5 text-xl font-bold text-blue-700">Confirming your payment...</h2>
            <p className="mt-2 text-sm text-slate-500">
              Please wait while we verify your Stripe checkout result.
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-blue-100">
            <div className="rounded-2xl bg-blue-50 p-5 text-blue-700">
              <h2 className="text-2xl font-bold">Payment Verification Failed</h2>
              <p className="mt-2">{error}</p>
            </div>

            <Link
              to={`/patient/appointments/${id}`}
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Back to Appointment
            </Link>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-700">
                ✓
              </div>
              <h1 className="mt-4 text-3xl font-bold text-blue-700">Payment Successful</h1>
              <p className="mt-2 text-sm text-slate-500">
                Your appointment has been confirmed successfully.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-400">Amount Paid</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">LKR {payment?.amount || 0}</h3>
                <p className="mt-2 text-sm text-slate-500">Payment recorded successfully.</p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-400">Appointment Status</p>
                <h3 className="mt-2 text-2xl font-bold capitalize text-slate-900">
                  {appointment?.status?.replace("_", " ") || "Confirmed"}
                </h3>
                <p className="mt-2 text-sm text-slate-500">Your appointment is now active in the system.</p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-400">Session Type</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {appointment?.appointmentType === "telemedicine" ? "Telemedicine" : "In Person"}
                </h3>
                <p className="mt-2 text-sm text-slate-500">Session access will be available below when applicable.</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
              <h2 className="text-lg font-bold text-blue-700">Next Step</h2>
              <p className="mt-2 text-sm text-slate-500">
                You can now review your confirmed appointment details. For telemedicine appointments,
                open the session page to wait for the doctor to start.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/patient/appointments/${id}`}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition duration-200 hover:scale-[1.02] hover:bg-blue-700"
                >
                  View Appointment
                </Link>

                {session?._id && (
                  <Link
                    to={`/patient/telemedicine/${session._id}`}
                    className="rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-700 transition duration-200 hover:scale-[1.02] hover:bg-blue-50"
                  >
                    Open Session
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentSuccessPage;
