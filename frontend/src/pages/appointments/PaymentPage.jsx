import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  createStripeCheckoutSession,
  getAppointmentById,
} from "../../services/appointmentService";

const formatDateTime = (value) => {
  if (!value) return "Not scheduled yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const PaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAppointment = async () => {
      try {
        const data = await getAppointmentById(id);
        setAppointment(data?.appointment || null);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load appointment");
      } finally {
        setLoading(false);
      }
    };

    if (id) loadAppointment();
  }, [id]);

  const handleStripeCheckout = async () => {
    try {
      setPaying(true);
      setError("");

      const data = await createStripeCheckoutSession(id);

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setError("Stripe checkout URL was not received");
      setPaying(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to start Stripe payment");
      setPaying(false);
    }
  };

  return (
    <DashboardLayout title="Appointment Payment">
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-600 p-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold">Secure Payment</h1>
          <p className="mt-2 text-sm text-blue-100">
            Complete your consultation payment to confirm this appointment.
          </p>
        </div>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {appointment && !loading && (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                  {appointment.appointmentType === "telemedicine"
                    ? "Telemedicine"
                    : "In Person"}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                  {appointment.status?.replace("_", " ")}
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                {appointment.reason || "Doctor Consultation"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Review the appointment details before proceeding to Stripe checkout.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Scheduled Time
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {formatDateTime(
                      appointment.scheduledDateTime || appointment.preferredDateTime
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Payment Status
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700 capitalize">
                    {appointment.paymentStatus || "pending"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Symptoms / Notes
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {appointment.symptomsSummary || "No additional symptoms provided"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
                <p className="text-sm text-slate-300">Total to Pay</p>
                <h3 className="mt-2 text-3xl font-bold">
                  LKR {appointment.consultationFee || 0}
                </h3>
                <p className="mt-2 text-xs text-slate-300">
                  Payment is securely processed through Stripe sandbox.
                </p>
              </div>

              {appointment.status === "awaiting_payment" &&
              appointment.paymentStatus !== "paid" ? (
                <button
                  onClick={handleStripeCheckout}
                  disabled={paying}
                  className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paying ? "Redirecting to Stripe..." : "Pay with Stripe"}
                </button>
              ) : (
                <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
                  This appointment is not currently waiting for payment.
                </div>
              )}

              <button
                onClick={() => navigate(`/patient/appointments/${id}`)}
                className="mt-3 w-full rounded-2xl border border-slate-300 px-5 py-4 font-semibold text-slate-700 transition duration-200 hover:bg-slate-50"
              >
                Back to Appointment
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentPage;