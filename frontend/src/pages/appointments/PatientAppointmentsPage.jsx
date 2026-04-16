import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import { getAppointmentsByPatient } from "../../services/appointmentService";
import { getConsultationNoteByAppointment } from "../../services/doctorService";

const getStatusBadge = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "confirmed") return "bg-blue-100 text-blue-700 ring-blue-200";
  if (value === "awaiting_payment") return "bg-sky-100 text-sky-700 ring-sky-200";
  if (value === "pending") return "bg-indigo-100 text-indigo-700 ring-indigo-200";
  if (value === "cancelled" || value === "rejected") {
    return "bg-slate-100 text-slate-700 ring-slate-200";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
};

const getPaymentBadge = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "paid") return "bg-blue-100 text-blue-700 ring-blue-200";
  if (value === "pending") return "bg-sky-100 text-sky-700 ring-sky-200";
  if (value === "refunded") return "bg-slate-100 text-slate-700 ring-slate-200";
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

const PatientAppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [consultationNotesByAppointment, setConsultationNotesByAppointment] = useState({});

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await getAppointmentsByPatient(user?.id);
        setAppointments(data?.appointments || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchAppointments();
  }, [user?.id]);

  useEffect(() => {
    const loadConsultationNotes = async () => {
      if (!appointments.length) {
        setConsultationNotesByAppointment({});
        return;
      }

      const settled = await Promise.allSettled(
        appointments.map((appointment) => getConsultationNoteByAppointment(appointment._id))
      );

      const notesMap = {};
      settled.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value?.consultationNote) {
          notesMap[appointments[index]._id] = result.value.consultationNote;
        }
      });

      setConsultationNotesByAppointment(notesMap);
    };

    loadConsultationNotes();
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    if (filter === "all") return appointments;
    if (filter === "telemedicine") {
      return appointments.filter((item) => item.appointmentType === "telemedicine");
    }
    if (filter === "in_person") {
      return appointments.filter((item) => item.appointmentType === "in_person");
    }
    return appointments.filter((item) => item.status === filter);
  }, [appointments, filter]);

  return (
    <DashboardLayout title="My Appointments">
      <div className="space-y-6">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-blue-700">My Appointments</h1>
          <p className="mt-2 text-sm text-slate-500">
            Track your bookings, complete payments, and join online sessions.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            ["all", "All"],
            ["pending", "Pending"],
            ["awaiting_payment", "Awaiting Payment"],
            ["confirmed", "Confirmed"],
            ["telemedicine", "Telemedicine"],
            ["in_person", "In Person"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition duration-200 ${
                filter === key
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-blue-700 ring-1 ring-blue-100 hover:-translate-y-0.5 hover:shadow-sm"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-blue-100"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-700">
            {error}
          </div>
        )}

        {!loading && !error && filteredAppointments.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-blue-100">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
              📅
            </div>
            <h2 className="text-xl font-semibold text-blue-700">No appointments found</h2>
            <p className="mt-2 text-sm text-slate-500">
              Your appointments will appear here once you create a booking.
            </p>
            <Link
              to="/patient/appointments/book"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Book Appointment
            </Link>
          </div>
        )}

        <div className="grid gap-5">
          {filteredAppointments.map((appointment) => (
            <div
              key={appointment._id}
              className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {formatType(appointment.appointmentType)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadge(
                        appointment.status
                      )}`}
                    >
                      {appointment.status?.replace("_", " ")}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getPaymentBadge(
                        appointment.paymentStatus
                      )}`}
                    >
                      Payment: {appointment.paymentStatus || "pending"}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {appointment.reason || "Doctor Consultation"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {appointment.symptomsSummary || "No symptoms summary provided"}
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div className="rounded-2xl bg-blue-50/50 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                        Preferred Time
                      </p>
                      <p className="mt-1 font-medium text-slate-700">
                        {formatDateTime(appointment.preferredDateTime)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-blue-50/50 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                        Scheduled Time
                      </p>
                      <p className="mt-1 font-medium text-slate-700">
                        {formatDateTime(appointment.scheduledDateTime)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-blue-50/50 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                        Fee
                      </p>
                      <p className="mt-1 font-medium text-slate-700">
                        LKR {appointment.consultationFee || 0}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-blue-50/50 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                        Doctor Note
                      </p>
                      <p className="mt-1 font-medium text-slate-700">
                        {appointment.doctorResponseNote || "No response yet"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-blue-50/50 p-3 sm:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                        Consultant Notes
                      </p>
                      <p className="mt-1 font-medium text-slate-700">
                        {consultationNotesByAppointment[appointment._id]?.notes || "Not available yet"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 md:w-auto md:flex-col">
                  <Link
                    to={`/patient/appointments/${appointment._id}`}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition duration-200 hover:scale-[1.02] hover:bg-blue-700"
                  >
                    View Details
                  </Link>

                  {appointment.status === "awaiting_payment" &&
                    appointment.paymentStatus !== "paid" && (
                      <Link
                        to={`/patient/appointments/${appointment._id}/pay`}
                        className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-center font-semibold text-blue-700 transition duration-200 hover:scale-[1.02] hover:bg-blue-50"
                      >
                        Pay Now
                      </Link>
                    )}

                  {appointment.appointmentType === "telemedicine" &&
                    appointment.paymentStatus === "paid" &&
                    appointment.telemedicineSessionId && (
                      <Link
                        to={`/patient/telemedicine/${appointment.telemedicineSessionId}`}
                        className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-center font-semibold text-blue-700 transition duration-200 hover:scale-[1.02] hover:bg-blue-50"
                      >
                        Open Session
                      </Link>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientAppointmentsPage;