import { useEffect, useState } from "react";
import { Calendar, ChevronDown, ChevronUp, ClipboardList, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import { getAppointmentById } from "../../services/appointmentService";
import { getConsultationNotesByPatient } from "../../services/doctorService";

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "Not scheduled yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AppointmentPanel = ({ appointmentId }) => {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!appointmentId) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAppointmentById(appointmentId);
        setAppointment(data?.appointment || null);
      } catch {
        setError("Could not load appointment details.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        Loading appointment...
      </div>
    );
  }

  if (error || !appointment) {
    return <p className="mt-2 text-sm text-red-500">{error || "Appointment not found."}</p>;
  }

  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
      <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Reason</p>
          <p className="mt-1 font-medium text-slate-800">{appointment.reason || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Scheduled</p>
          <p className="mt-1 font-medium text-slate-800">
            {formatDateTime(appointment.scheduledDateTime || appointment.preferredDateTime)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Status</p>
          <p className="mt-1 font-medium capitalize text-slate-800">
            {String(appointment.status || "unknown").replace("_", " ")}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <Link
          to={`/patient/appointments/${appointmentId}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Full Appointment
        </Link>
      </div>
    </div>
  );
};

const ConsultationNotesPage = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const loadNotes = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;
      const data = await getConsultationNotesByPatient(user.id, { limit: 100 });
      setNotes(data?.consultationNotes || []);
    } catch {
      toast.error("Failed to load consultation notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [user?.id]);

  return (
    <DashboardLayout title="My Consultation Notes">
      <div className="space-y-6">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Consultation Notes</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                View consultation notes written by your doctor with linked appointment details.
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-3xl bg-white ring-1 ring-slate-100" />
            ))}
          </div>
        )}

        {!loading && notes.length === 0 && (
          <div className="rounded-2xl bg-slate-50 p-12 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-lg font-semibold text-slate-700">No consultation notes found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Consultation notes will appear here once your doctor adds them.
            </p>
          </div>
        )}

        {!loading && notes.length > 0 && (
          <div className="grid gap-5">
            {notes.map((note) => {
              const isExpanded = expandedId === note._id;
              return (
                <div
                  key={note._id}
                  className="rounded-3xl border border-blue-100 bg-white shadow-sm transition duration-200 hover:shadow-md"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900">
                      {note.diagnosis || "Consultation Note"}
                    </h3>
                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-blue-50/50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                          Date
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">{formatDate(note.createdAt)}</p>
                      </div>
                      <div className="rounded-2xl bg-blue-50/50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                          Symptoms
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">{note.symptoms || "N/A"}</p>
                      </div>
                      <div className="rounded-2xl bg-blue-50/50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                          Follow Up
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {note.followUpRequired ? "Required" : "Not required"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-blue-50/50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                          Follow Up Date
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {formatDate(note.followUpDate)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Notes
                      </p>
                      <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{note.notes}</p>
                    </div>

                    {note.treatmentPlan && (
                      <div className="mt-3 rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Treatment Plan
                        </p>
                        <p className="mt-2 text-sm text-slate-700">{note.treatmentPlan}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100">
                    <button
                      onClick={() => setExpandedId((prev) => (prev === note._id ? null : note._id))}
                      className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left text-sm font-semibold text-blue-700 transition hover:bg-blue-50/50"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Related Appointment Details
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-6 pb-6">
                        <AppointmentPanel appointmentId={note.appointmentId} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ConsultationNotesPage;
