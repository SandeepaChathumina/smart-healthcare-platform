import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  deleteConsultationNote,
  getMyConsultationNotes,
  updateConsultationNote,
} from "../../services/doctorService";

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const DoctorConsultationNotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeEditId, setActiveEditId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    notes: "",
    diagnosis: "",
    symptoms: "",
    treatmentPlan: "",
    followUpRequired: false,
    followUpDate: "",
    followUpNotes: "",
  });

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyConsultationNotes();
      setNotes(data?.consultationNotes || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load consultation notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const startEdit = (note) => {
    setEditForm({
      notes: note?.notes || "",
      diagnosis: note?.diagnosis || "",
      symptoms: note?.symptoms || "",
      treatmentPlan: note?.treatmentPlan || "",
      followUpRequired: Boolean(note?.followUpRequired),
      followUpDate: note?.followUpDate
        ? new Date(note.followUpDate).toISOString().split("T")[0]
        : "",
      followUpNotes: note?.followUpNotes || "",
    });
    setActiveEditId(note._id);
  };

  const handleSaveEdit = async (id) => {
    if (!String(editForm.notes || "").trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Consultation notes required",
        text: "Please enter the consultation notes before saving.",
      });
      return;
    }

    try {
      setSavingEdit(true);
      setError("");
      await updateConsultationNote(id, {
        notes: editForm.notes.trim(),
        diagnosis: editForm.diagnosis || null,
        symptoms: editForm.symptoms || null,
        treatmentPlan: editForm.treatmentPlan || null,
        followUpRequired: editForm.followUpRequired,
        followUpDate: editForm.followUpDate || null,
        followUpNotes: editForm.followUpNotes || null,
      });
      await loadNotes();
      setActiveEditId("");
      await Swal.fire({
        icon: "success",
        title: "Consultation note updated",
        text: "Changes were saved successfully.",
      });
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to update consultation note";
      setError(message);
      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text: message,
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Delete consultation note?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });
    if (!confirmation.isConfirmed) return;

    try {
      setDeletingId(id);
      setError("");
      await deleteConsultationNote(id);
      await loadNotes();
      if (activeEditId === id) setActiveEditId("");
      await Swal.fire({
        icon: "success",
        title: "Consultation note deleted",
        text: "Consultation note was deleted successfully.",
      });
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to delete consultation note";
      setError(message);
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: message,
      });
    } finally {
      setDeletingId("");
    }
  };

  return (
    <DashboardLayout title="Consultation Notes">
      <div className="space-y-6">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-blue-700">Consultation Notes</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage consultation notes written for your appointments.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-slate-100 p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-slate-600">Loading consultation notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-blue-100">
            <h2 className="text-xl font-semibold text-blue-700">No consultation notes yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Create consultation notes from an appointment details page.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notes.map((note) => (
              <div key={note._id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {note.diagnosis || "Consultation Note"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">Patient: {note.patientId || "N/A"}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Updated {formatDateTime(note.updatedAt)}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Consultation Notes
                  </p>
                  <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{note.notes}</p>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-blue-50/50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                      Appointment
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">{note.appointmentId || "N/A"}</p>
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
                      {formatDateTime(note.followUpDate)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to={`/doctor/appointments/${note.appointmentId}`}
                    className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                  >
                    Open Appointment
                  </Link>
                  <button
                    type="button"
                    onClick={() => startEdit(note)}
                    className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(note._id)}
                    disabled={deletingId === note._id}
                    className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingId === note._id ? "Deleting..." : "Delete"}
                  </button>
                </div>

                {activeEditId === note._id && (
                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                    <h3 className="text-base font-semibold text-blue-700">Edit Consultation Note</h3>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Diagnosis
                        </label>
                        <input
                          type="text"
                          value={editForm.diagnosis}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, diagnosis: e.target.value }))
                          }
                          className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Follow Up Date
                        </label>
                        <input
                          type="date"
                          value={editForm.followUpDate}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, followUpDate: e.target.value }))
                          }
                          className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Symptoms
                        </label>
                        <textarea
                          rows={3}
                          value={editForm.symptoms}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, symptoms: e.target.value }))
                          }
                          className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Treatment Plan
                        </label>
                        <textarea
                          rows={3}
                          value={editForm.treatmentPlan}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, treatmentPlan: e.target.value }))
                          }
                          className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Consultation Notes
                      </label>
                      <textarea
                        rows={5}
                        value={editForm.notes}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                        className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <input
                        id={`follow-up-required-${note._id}`}
                        type="checkbox"
                        checked={editForm.followUpRequired}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            followUpRequired: e.target.checked,
                          }))
                        }
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor={`follow-up-required-${note._id}`}
                        className="text-sm font-medium text-slate-700"
                      >
                        Follow up required
                      </label>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Follow Up Notes
                      </label>
                      <textarea
                        rows={3}
                        value={editForm.followUpNotes}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, followUpNotes: e.target.value }))
                        }
                        className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(note._id)}
                        disabled={savingEdit}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {savingEdit ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveEditId("")}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorConsultationNotesPage;
