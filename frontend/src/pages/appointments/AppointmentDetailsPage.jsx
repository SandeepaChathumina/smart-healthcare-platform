import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import {
  getAppointmentById,
  getTelemedicineSessionByAppointment,
} from "../../services/appointmentService";

const badgeClass = (value) => {
  const status = String(value || "").toLowerCase();

  if (status === "confirmed") return "bg-blue-100 text-blue-700 ring-blue-200";
  if (status === "awaiting_payment") return "bg-sky-100 text-sky-700 ring-sky-200";
  if (status === "pending") return "bg-indigo-100 text-indigo-700 ring-indigo-200";
  if (status === "paid") return "bg-blue-100 text-blue-700 ring-blue-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
};

const formatDateTime = (value) => {
  if (!value) return "Not scheduled yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatType = (type) => {
  if (!type) return "Appointment";
  return type === "telemedicine" ? "Telemedicine" : "In Person";
};

const InfoCard = ({ label, value }) => (
  <div className="rounded-2xl bg-blue-50/50 p-4 transition duration-200 hover:shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wide text-blue-400">{label}</p>
    <p className="mt-2 text-sm font-medium text-slate-700">{value || "N/A"}</p>
  </div>
);

const AppointmentDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const data = await getAppointmentById(id);
        const appointmentData = data?.appointment || null;
        setAppointment(appointmentData);

        if (
          appointmentData?.appointmentType === "telemedicine" &&
          (appointmentData?.telemedicineSessionId || appointmentData?.paymentStatus === "paid")
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
        setError(err?.response?.data?.message || "Failed to load appointment details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAppointment();
  }, [id]);

  const isPatient = user?.role === "Patient";
  const isDoctor = user?.role === "Doctor";

  return (
    <DashboardLayout title="Appointment Details">
      <div className="space-y-6">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              {formatType(appointment?.appointmentType)}
            </span>

            {appointment?.status && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass(
                  appointment.status
                )}`}
              >
                {appointment.status.replace("_", " ")}
              </span>
            )}

            {appointment?.paymentStatus && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass(
                  appointment.paymentStatus
                )}`}
              >
                Payment: {appointment.paymentStatus}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-bold text-blue-700">
            {appointment?.reason || "Doctor Consultation"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Review appointment information, payment progress, and session availability.
          </p>
        </div>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-blue-100"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-700">
            {error}
          </div>
        )}

        {appointment && !loading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoCard label="Appointment Type" value={formatType(appointment.appointmentType)} />
              <InfoCard
                label="Preferred Date & Time"
                value={formatDateTime(appointment.preferredDateTime)}
              />
              <InfoCard
                label="Scheduled Date & Time"
                value={formatDateTime(appointment.scheduledDateTime)}
              />
              <InfoCard label="Consultation Fee" value={`LKR ${appointment.consultationFee || 0}`} />
              <InfoCard
                label="Symptoms Summary"
                value={appointment.symptomsSummary || "No summary provided"}
              />
              <InfoCard
                label="Doctor Response"
                value={appointment.doctorResponseNote || "No response yet"}
              />
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
              <h2 className="text-lg font-bold text-blue-700">Notes</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-blue-50/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                    Patient Notes
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {appointment.patientNotes || "No patient notes"}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                    Status Summary
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    This appointment is currently{" "}
                    <span className="font-semibold capitalize">
                      {appointment.status?.replace("_", " ")}
                    </span>{" "}
                    with payment marked as{" "}
                    <span className="font-semibold capitalize">
                      {appointment.paymentStatus || "pending"}
                    </span>.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {isPatient &&
                  appointment.status === "awaiting_payment" &&
                  appointment.paymentStatus !== "paid" && (
                    <Link
                      to={`/patient/appointments/${appointment._id}/pay`}
                      className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition duration-200 hover:scale-[1.02] hover:bg-blue-700"
                    >
                      Pay Now
                    </Link>
                  )}

                {appointment.appointmentType === "telemedicine" &&
                  appointment.paymentStatus === "paid" &&
                  session?._id &&
                  isPatient && (
                    <Link
                      to={`/patient/telemedicine/${session._id}`}
                      className="rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-700 transition duration-200 hover:scale-[1.02] hover:bg-blue-50"
                    >
                      Open Session
                    </Link>
                  )}

                {appointment.appointmentType === "telemedicine" &&
                  appointment.paymentStatus === "paid" &&
                  session?._id &&
                  isDoctor && (
                    <Link
                      to={`/doctor/telemedicine/${session._id}`}
                      className="rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-700 transition duration-200 hover:scale-[1.02] hover:bg-blue-50"
                    >
                      Open Session
                    </Link>
                  )}
              </div>
            </div>

            {appointment.appointmentType === "telemedicine" && (
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
                <h2 className="text-lg font-bold text-blue-700">Telemedicine Session</h2>

                {sessionLoading && (
                  <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">
                    Loading session details...
                  </div>
                )}

                {!sessionLoading && session && (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <InfoCard label="Platform" value={session.platform || "Jitsi"} />
                    <InfoCard label="Session Status" value={session.status || "scheduled"} />
                    <InfoCard
                      label="Scheduled Start"
                      value={formatDateTime(session.scheduledStartTime)}
                    />
                  </div>
                )}

                {!sessionLoading && !session && (
                  <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">
                    Session details will appear here after payment confirmation and session setup.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AppointmentDetailsPage;