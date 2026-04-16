import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import {
  cancelAppointment,
  getAppointmentById,
  getTelemedicineSessionByAppointment,
  updateAppointmentStatus,
} from "../../services/appointmentService";
import {
  createConsultationNote,
  getConsultationNoteByAppointment,
  updateConsultationNote,
} from "../../services/doctorService";

const badgeClass = (value) => {
  const status = String(value || "").toLowerCase();

  if (status === "confirmed") return "bg-blue-100 text-blue-700 ring-blue-200";
  if (status === "awaiting_payment") return "bg-sky-100 text-sky-700 ring-sky-200";
  if (status === "pending") return "bg-indigo-100 text-indigo-700 ring-indigo-200";
  if (status === "paid") return "bg-blue-100 text-blue-700 ring-blue-200";
  if (status === "rejected" || status === "cancelled") return "bg-red-100 text-red-700 ring-red-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
};

const formatDateTime = (value) => {
  if (!value) return "Not scheduled yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const formatType = (type) => {
  if (!type) return "Appointment";
  return type === "telemedicine" ? "Telemedicine" : "In Person";
};

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const toISOStringOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
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
  const [actionMessage, setActionMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [consultationLoading, setConsultationLoading] = useState(false);
  const [consultationMessage, setConsultationMessage] = useState("");
  const [consultationError, setConsultationError] = useState("");
  const [consultationNote, setConsultationNote] = useState(null);
  const [consultationForm, setConsultationForm] = useState({
    notes: "",
    diagnosis: "",
    treatmentPlan: "",
    followUpRequired: false,
    followUpDate: "",
    followUpNotes: "",
  });
  const [doctorForm, setDoctorForm] = useState({
    consultationFee: "",
    scheduledDateTime: "",
    doctorResponseNote: "",
    rescheduleReason: "",
  });

  const isPatient = user?.role === "Patient";
  const isDoctor = user?.role === "Doctor";
  const canDoctorManageConsultationNote =
    isDoctor && ["confirmed", "completed"].includes(String(appointment?.status || "").toLowerCase());

  const populateConsultationForm = (note) => {
    setConsultationForm({
      notes: note?.notes || "",
      diagnosis: note?.diagnosis || "",
      treatmentPlan: note?.treatmentPlan || "",
      followUpRequired: Boolean(note?.followUpRequired),
      followUpDate: note?.followUpDate ? toDateTimeLocal(note.followUpDate) : "",
      followUpNotes: note?.followUpNotes || "",
    });
  };

  const loadConsultationNote = async (appointmentId) => {
    if (!appointmentId) return;
    try {
      setConsultationLoading(true);
      setConsultationError("");
      const response = await getConsultationNoteByAppointment(appointmentId);
      const note = response?.consultationNote || null;
      setConsultationNote(note);
      populateConsultationForm(note);
    } catch (err) {
      if (err?.response?.status === 404) {
        setConsultationNote(null);
        populateConsultationForm(null);
      } else {
        setConsultationError(err?.response?.data?.message || "Failed to load consultation note");
      }
    } finally {
      setConsultationLoading(false);
    }
  };

  const loadAppointment = async () => {
    try {
      const data = await getAppointmentById(id);
      const appointmentData = data?.appointment || null;
      setAppointment(appointmentData);
      setDoctorForm({
        consultationFee: appointmentData?.consultationFee || "",
        scheduledDateTime: toDateTimeLocal(
          appointmentData?.scheduledDateTime || appointmentData?.preferredDateTime
        ),
        doctorResponseNote: appointmentData?.doctorResponseNote || "",
        rescheduleReason: appointmentData?.rescheduleReason || "",
      });

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

      await loadConsultationNote(id);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load appointment details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadAppointment();
  }, [id]);

  const submitDoctorAction = async (status) => {
    try {
      setSubmitting(true);
      setError("");
      setActionMessage("");

      const payload = {
        status,
        consultationFee: Number(doctorForm.consultationFee),
        scheduledDateTime: doctorForm.scheduledDateTime,
        doctorResponseNote: doctorForm.doctorResponseNote,
        rescheduleReason: doctorForm.rescheduleReason,
      };

      const response = await updateAppointmentStatus(id, payload);
      setAppointment(response?.appointment || null);
      setActionMessage("Appointment updated successfully");
      await loadAppointment();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDoctorCancel = async () => {
    try {
      setSubmitting(true);
      setError("");
      setActionMessage("");
      await cancelAppointment(id, { cancellationReason: "Cancelled by doctor" });
      setActionMessage("Appointment cancelled successfully");
      await loadAppointment();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to cancel appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConsultationSubmit = async () => {
    if (!consultationForm.notes.trim()) {
      setConsultationError("Consultation notes are required");
      return;
    }

    try {
      setSubmitting(true);
      setConsultationError("");
      setConsultationMessage("");

      const payload = {
        appointmentId: id,
        notes: consultationForm.notes.trim(),
        diagnosis: consultationForm.diagnosis.trim(),
        treatmentPlan: consultationForm.treatmentPlan.trim(),
        followUpRequired: consultationForm.followUpRequired,
        followUpDate: consultationForm.followUpRequired
          ? toISOStringOrNull(consultationForm.followUpDate)
          : null,
        followUpNotes: consultationForm.followUpRequired ? consultationForm.followUpNotes.trim() : "",
      };

      let response;
      if (consultationNote?._id) {
        response = await updateConsultationNote(consultationNote._id, payload);
        setConsultationMessage("Consultation note updated successfully");
      } else {
        try {
          response = await createConsultationNote(payload);
          setConsultationMessage("Consultation note saved successfully");
        } catch (createError) {
          const message = createError?.response?.data?.message || "";
          if (message.toLowerCase().includes("already exists")) {
            const existing = await getConsultationNoteByAppointment(id);
            const existingId = existing?.consultationNote?._id;
            if (existingId) {
              response = await updateConsultationNote(existingId, payload);
              setConsultationMessage("Existing consultation note updated successfully");
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }

      const note = response?.consultationNote || null;
      setConsultationNote(note);
      populateConsultationForm(note);
    } catch (err) {
      setConsultationError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save consultation note"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Appointment Details">
      <div className="space-y-6">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              {formatType(appointment?.appointmentType)}
            </span>

            {appointment?.status && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass(appointment.status)}`}>
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
              <div key={item} className="h-28 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-blue-100" />
            ))}
          </div>
        )}

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
        {actionMessage && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">{actionMessage}</div>
        )}
        {consultationMessage && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">{consultationMessage}</div>
        )}
        {consultationError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{consultationError}</div>
        )}

        {appointment && !loading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoCard label="Appointment Type" value={formatType(appointment.appointmentType)} />
              <InfoCard label="Preferred Date & Time" value={formatDateTime(appointment.preferredDateTime)} />
              <InfoCard label="Scheduled Date & Time" value={formatDateTime(appointment.scheduledDateTime)} />
              <InfoCard label="Consultation Fee" value={`LKR ${appointment.consultationFee || 0}`} />
              <InfoCard label="Duration" value={`${appointment.durationMinutes || 30} minutes`} />
              <InfoCard label="Symptoms Summary" value={appointment.symptomsSummary || "No summary provided"} />
              <InfoCard label="Doctor Response" value={appointment.doctorResponseNote || "No response yet"} />
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
              <h2 className="text-lg font-bold text-blue-700">Notes</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-blue-50/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-400">Patient Notes</p>
                  <p className="mt-2 text-sm text-slate-700">{appointment.patientNotes || "No patient notes"}</p>
                </div>

                <div className="rounded-2xl bg-blue-50/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-400">Status Summary</p>
                  <p className="mt-2 text-sm text-slate-700">
                    This appointment is currently <span className="font-semibold capitalize">{appointment.status?.replace("_", " ")}</span>{" "}
                    with payment marked as <span className="font-semibold capitalize">{appointment.paymentStatus || "pending"}</span>.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {isPatient && appointment.status === "awaiting_payment" && appointment.paymentStatus !== "paid" && (
                  <Link
                    to={`/patient/appointments/${appointment._id}/pay`}
                    className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition duration-200 hover:scale-[1.02] hover:bg-blue-700"
                  >
                    Pay Now
                  </Link>
                )}

                {appointment.appointmentType === "telemedicine" && appointment.paymentStatus === "paid" && session?._id && isPatient && (
                  <Link
                    to={`/patient/telemedicine/${session._id}`}
                    className="rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-700 transition duration-200 hover:scale-[1.02] hover:bg-blue-50"
                  >
                    Open Session
                  </Link>
                )}

                {appointment.appointmentType === "telemedicine" && appointment.paymentStatus === "paid" && session?._id && isDoctor && (
                  <Link
                    to={`/doctor/telemedicine/${session._id}`}
                    className="rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-700 transition duration-200 hover:scale-[1.02] hover:bg-blue-50"
                  >
                    Open Session
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
              <h2 className="text-lg font-bold text-blue-700">Consultant Notes</h2>
              <p className="mt-2 text-sm text-slate-500">
                {isDoctor
                  ? "Document diagnosis and treatment details for this patient appointment."
                  : "Review the consultant notes shared by your doctor for this appointment."}
              </p>

              {consultationLoading && (
                <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">Loading consultation note...</div>
              )}

              {!consultationLoading && isDoctor && canDoctorManageConsultationNote && (
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Consultation notes</label>
                    <textarea
                      rows={4}
                      value={consultationForm.notes}
                      onChange={(e) => setConsultationForm((prev) => ({ ...prev, notes: e.target.value }))}
                      className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Write key findings and recommendations"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Diagnosis</label>
                      <input
                        type="text"
                        value={consultationForm.diagnosis}
                        onChange={(e) => setConsultationForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
                        className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Primary diagnosis"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Treatment plan</label>
                      <input
                        type="text"
                        value={consultationForm.treatmentPlan}
                        onChange={(e) => setConsultationForm((prev) => ({ ...prev, treatmentPlan: e.target.value }))}
                        className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Medication, procedures, advice"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-blue-50/50 p-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={consultationForm.followUpRequired}
                        onChange={(e) =>
                          setConsultationForm((prev) => ({
                            ...prev,
                            followUpRequired: e.target.checked,
                            followUpDate: e.target.checked ? prev.followUpDate : "",
                            followUpNotes: e.target.checked ? prev.followUpNotes : "",
                          }))
                        }
                      />
                      Follow-up required
                    </label>

                    {consultationForm.followUpRequired && (
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <input
                          type="datetime-local"
                          value={consultationForm.followUpDate}
                          onChange={(e) => setConsultationForm((prev) => ({ ...prev, followUpDate: e.target.value }))}
                          className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <input
                          type="text"
                          value={consultationForm.followUpNotes}
                          onChange={(e) => setConsultationForm((prev) => ({ ...prev, followUpNotes: e.target.value }))}
                          className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="Follow-up instructions"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleConsultationSubmit}
                    className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submitting
                      ? "Saving..."
                      : consultationNote?._id
                        ? "Update Consultant Note"
                        : "Save Consultant Note"}
                  </button>
                </div>
              )}

              {!consultationLoading && isDoctor && !canDoctorManageConsultationNote && !consultationNote && (
                <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
                  Consultation notes can be added after the appointment is confirmed or completed.
                </div>
              )}

              {!consultationLoading && isPatient && !consultationNote && (
                <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">
                  Your doctor has not added consultation notes for this appointment yet.
                </div>
              )}

              {!consultationLoading && isPatient && consultationNote && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <InfoCard label="Consultation Notes" value={consultationNote.notes} />
                  <InfoCard label="Diagnosis" value={consultationNote.diagnosis || "Not specified"} />
                  <InfoCard label="Treatment Plan" value={consultationNote.treatmentPlan || "Not specified"} />
                  <InfoCard
                    label="Follow-up"
                    value={
                      consultationNote.followUpRequired
                        ? `${formatDate(consultationNote.followUpDate)}${consultationNote.followUpNotes ? ` - ${consultationNote.followUpNotes}` : ""}`
                        : "No follow-up required"
                    }
                  />
                </div>
              )}
            </div>

            {isDoctor && ["pending", "rescheduled", "awaiting_payment"].includes(appointment.status) && appointment.paymentStatus !== "paid" && (
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
                <h2 className="text-lg font-bold text-blue-700">Doctor Action Panel</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Accept the booking by setting the consultation fee and confirming the final date and time.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Consultation fee (LKR)</label>
                    <input
                      type="number"
                      min="0"
                      value={doctorForm.consultationFee}
                      onChange={(e) => setDoctorForm((prev) => ({ ...prev, consultationFee: e.target.value }))}
                      className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Final appointment date & time</label>
                    <input
                      type="datetime-local"
                      value={doctorForm.scheduledDateTime}
                      onChange={(e) => setDoctorForm((prev) => ({ ...prev, scheduledDateTime: e.target.value }))}
                      className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Doctor note</label>
                    <textarea
                      rows={3}
                      value={doctorForm.doctorResponseNote}
                      onChange={(e) => setDoctorForm((prev) => ({ ...prev, doctorResponseNote: e.target.value }))}
                      className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Optional note for patient"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Reschedule reason</label>
                    <textarea
                      rows={3}
                      value={doctorForm.rescheduleReason}
                      onChange={(e) => setDoctorForm((prev) => ({ ...prev, rescheduleReason: e.target.value }))}
                      className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Use only when changing the requested time"
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => submitDoctorAction("accepted")}
                    className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    Accept & Request Payment
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => submitDoctorAction("rescheduled")}
                    className="rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => submitDoctorAction("rejected")}
                    className="rounded-xl border border-red-200 bg-white px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleDoctorCancel}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {appointment.appointmentType === "telemedicine" && (
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
                <h2 className="text-lg font-bold text-blue-700">Telemedicine Session</h2>

                {sessionLoading && <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">Loading session details...</div>}

                {!sessionLoading && session && (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <InfoCard label="Platform" value={session.platform || "Jitsi"} />
                    <InfoCard label="Session Status" value={session.status || "scheduled"} />
                    <InfoCard label="Scheduled Start" value={formatDateTime(session.scheduledStartTime)} />
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
