import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Pill,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  X,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import axios from "../../lib/axios";
import {
  cancelAppointment,
  getAppointmentById,
  getTelemedicineSessionByAppointment,
  updateAppointmentStatus,
} from "../../services/appointmentService";
import {
  getPrescriptionByAppointment,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from "../../services/doctorService";

const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:5001";

/* ────────────────────────────────────────────
   Helpers
──────────────────────────────────────────── */
const badgeClass = (value) => {
  const status = String(value || "").toLowerCase();
  if (status === "confirmed") return "bg-blue-100 text-blue-700 ring-blue-200";
  if (status === "awaiting_payment") return "bg-sky-100 text-sky-700 ring-sky-200";
  if (status === "pending") return "bg-indigo-100 text-indigo-700 ring-indigo-200";
  if (status === "paid") return "bg-blue-100 text-blue-700 ring-blue-200";
  if (status === "rejected" || status === "cancelled") {
    return "bg-red-100 text-red-700 ring-red-200";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
};

const getRxStatusBadge = (status) => {
  const v = String(status || "").toLowerCase();
  if (v === "active") return "bg-green-100 text-green-700 ring-green-200";
  if (v === "completed") return "bg-blue-100 text-blue-700 ring-blue-200";
  if (v === "expired") return "bg-amber-100 text-amber-700 ring-amber-200";
  if (v === "cancelled") return "bg-red-100 text-red-700 ring-red-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
};

const formatDateTime = (value) => {
  if (!value) return "Not scheduled yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const toDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

const formatType = (type) => {
  if (!type) return "Appointment";
  return type === "telemedicine" ? "Telemedicine" : "In Person";
};

const createEmptyMedicine = () => ({
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
});

const getDisplayPatientName = (appointment, patient, user) => {
  return (
    patient?.fullName ||
    appointment?.patientName ||
    appointment?.patient?.fullName ||
    user?.fullName ||
    "Patient"
  );
};

const getDisplayDoctorName = (appointment, doctor) => {
  return (
    doctor?.fullName ||
    appointment?.doctorName ||
    appointment?.doctor?.fullName ||
    "Doctor"
  );
};

/* ────────────────────────────────────────────
   Shared small components
──────────────────────────────────────────── */
const InfoCard = ({ label, value }) => (
  <div className="rounded-2xl bg-blue-50/50 p-4 transition duration-200 hover:shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
      {label}
    </p>
    <p className="mt-2 text-sm font-medium text-slate-700">{value || "N/A"}</p>
  </div>
);

const MedicineRow = ({ medicine, index, total, onChange, onRemove }) => (
  <div className="rounded-2xl border border-blue-100 bg-white p-4">
    <div className="mb-3 flex items-center justify-between">
      <p className="text-sm font-semibold text-blue-700">Medicine {index + 1}</p>
      {total > 1 && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700"
        >
          <X className="h-3 w-3" /> Remove
        </button>
      )}
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      {[
        ["name", "Medicine name"],
        ["dosage", "Dosage (e.g. 500mg)"],
        ["frequency", "Frequency (e.g. twice daily)"],
        ["duration", "Duration (e.g. 7 days)"],
      ].map(([field, placeholder]) => (
        <input
          key={field}
          type="text"
          value={medicine[field]}
          onChange={(e) => onChange(index, field, e.target.value)}
          placeholder={placeholder}
          className="rounded-xl border border-blue-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
        />
      ))}
    </div>
  </div>
);

/* ────────────────────────────────────────────
   Prescription Panel
──────────────────────────────────────────── */
const PrescriptionPanel = ({ appointmentId, patientId, doctorId }) => {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("view");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(true);

  const emptyForm = {
    diagnosis: "",
    instructions: "",
    status: "active",
    validUntil: "",
    refillCount: 0,
    maxRefills: 0,
    medicines: [createEmptyMedicine()],
  };

  const [form, setForm] = useState(emptyForm);

  const loadPrescription = async () => {
    try {
      setLoading(true);
      const data = await getPrescriptionByAppointment(appointmentId);
      setPrescription(data?.prescription || null);
    } catch {
      setPrescription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId) loadPrescription();
  }, [appointmentId]);

  const startEdit = () => {
    if (!prescription) return;

    setForm({
      diagnosis: prescription.diagnosis || "",
      instructions: prescription.instructions || "",
      status: prescription.status || "active",
      validUntil: prescription.validUntil
        ? new Date(prescription.validUntil).toISOString().split("T")[0]
        : "",
      refillCount: prescription.refillCount ?? 0,
      maxRefills: prescription.maxRefills ?? 0,
      medicines:
        prescription.medicines?.length > 0
          ? prescription.medicines.map((m) => ({
              name: m.name || "",
              dosage: m.dosage || "",
              frequency: m.frequency || "",
              duration: m.duration || "",
            }))
          : [createEmptyMedicine()],
    });

    setMode("edit");
  };

  const startCreate = () => {
    setForm(emptyForm);
    setMode("create");
  };

  const validateMedicines = (medicines) =>
    medicines.every((m) =>
      [m.name, m.dosage, m.frequency, m.duration].every((f) =>
        String(f || "").trim()
      )
    );

  const handleSave = async () => {
    if (!validateMedicines(form.medicines) || !form.medicines.length) {
      await Swal.fire({
        icon: "warning",
        title: "Incomplete medicine details",
        text: "Please fill in all required fields for each medicine.",
      });
      return;
    }

    const payload = {
      appointmentId,
      patientId,
      doctorId,
      diagnosis: form.diagnosis || undefined,
      instructions: form.instructions || undefined,
      status: form.status,
      validUntil: form.validUntil || undefined,
      refillCount: Number(form.refillCount || 0),
      maxRefills: Number(form.maxRefills || 0),
      medicines: form.medicines.map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim(),
        frequency: m.frequency.trim(),
        duration: m.duration.trim(),
        timing: "anytime",
      })),
    };

    try {
      setSaving(true);

      if (mode === "create") {
        await createPrescription(payload);
      } else {
        await updatePrescription(prescription._id, payload);
      }

      await loadPrescription();
      setMode("view");

      await Swal.fire({
        icon: "success",
        title: mode === "create" ? "Prescription created" : "Prescription updated",
        text: "Changes saved successfully.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Save failed",
        text: err?.response?.data?.message || "Failed to save prescription.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete prescription?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!confirm.isConfirmed) return;

    try {
      setDeleting(true);
      await deletePrescription(prescription._id);
      setPrescription(null);
      setMode("view");

      await Swal.fire({
        icon: "success",
        title: "Prescription deleted",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: err?.response?.data?.message || "Failed to delete prescription.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const updateMed = (index, field, value) =>
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));

  const addMed = () =>
    setForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, createEmptyMedicine()],
    }));

  const removeMed = (index) =>
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }));

  return (
    <div className="rounded-3xl bg-white shadow-sm ring-1 ring-blue-100">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between gap-3 rounded-3xl px-6 py-5 text-left transition hover:bg-blue-50/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-700">Prescription</h2>
            <p className="text-xs text-slate-400">
              {loading
                ? "Loading…"
                : prescription
                ? "1 prescription for this appointment"
                : "No prescription issued yet"}
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-6 pb-6 pt-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              Loading prescription…
            </div>
          )}

          {!loading && !prescription && mode === "view" && (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-6 text-center">
              <Pill className="mx-auto h-10 w-10 text-blue-300" />
              <p className="mt-2 font-semibold text-slate-700">No prescription issued</p>
              <p className="mt-1 text-sm text-slate-400">
                Issue a prescription for this appointment.
              </p>
              <button
                type="button"
                onClick={startCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Issue Prescription
              </button>
            </div>
          )}

          {!loading && prescription && mode === "view" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-blue-50/40 p-4">
                <div>
                  <p className="font-bold text-slate-900">
                    {prescription.diagnosis || "Prescription"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Issued {formatDate(prescription.issuedDate)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getRxStatusBadge(
                    prescription.status
                  )}`}
                >
                  {prescription.status || "active"}
                </span>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Valid Until
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDate(prescription.validUntil)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Refills
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {prescription.refillCount || 0} / {prescription.maxRefills || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 sm:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Instructions
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {prescription.instructions || "—"}
                  </p>
                </div>
              </div>

              {!!prescription.medicines?.length && (
                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    Medicines ({prescription.medicines.length})
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {prescription.medicines.map((med, i) => (
                      <div
                        key={`rx-med-${i}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <p className="font-semibold text-slate-900">{med.name || "Medicine"}</p>
                        <div className="mt-2 space-y-0.5 text-sm text-slate-500">
                          <p>Dosage: {med.dosage || "N/A"}</p>
                          <p>Frequency: {med.frequency || "N/A"}</p>
                          <p>Duration: {med.duration || "N/A"}</p>
                          {med.timing && (
                            <p>Timing: {String(med.timing).replace("_", " ")}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Prescription
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          )}

          {(mode === "create" || mode === "edit") && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-blue-700">
                  {mode === "create" ? "New Prescription" : "Edit Prescription"}
                </h3>
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Diagnosis
                  </label>
                  <input
                    type="text"
                    value={form.diagnosis}
                    onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))}
                    placeholder="e.g. Hypertension"
                    className="w-full rounded-xl border border-blue-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))}
                    className="w-full rounded-xl border border-blue-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-xl border border-blue-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Refill Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.refillCount}
                    onChange={(e) => setForm((p) => ({ ...p, refillCount: e.target.value }))}
                    className="w-full rounded-xl border border-blue-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Max Refills
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.maxRefills}
                    onChange={(e) => setForm((p) => ({ ...p, maxRefills: e.target.value }))}
                    className="w-full rounded-xl border border-blue-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Instructions
                </label>
                <textarea
                  rows={3}
                  value={form.instructions}
                  onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
                  placeholder="Additional instructions for the patient…"
                  className="w-full rounded-xl border border-blue-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">
                    Medicines
                  </p>
                  <button
                    type="button"
                    onClick={addMed}
                    className="flex items-center gap-1 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Medicine
                  </button>
                </div>
                <div className="space-y-3">
                  {form.medicines.map((med, i) => (
                    <MedicineRow
                      key={`form-med-${i}`}
                      medicine={med}
                      index={i}
                      total={form.medicines.length}
                      onChange={updateMed}
                      onRemove={removeMed}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving…" : mode === "create" ? "Issue Prescription" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────
   Main page
──────────────────────────────────────────── */
const AppointmentDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [session, setSession] = useState(null);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    consultationFee: "",
    scheduledDateTime: "",
    doctorResponseNote: "",
    rescheduleReason: "",
  });

  const isPatient = user?.role === "Patient";
  const isDoctor = user?.role === "Doctor";

  const loadAppointment = async () => {
    try {
      setLoading(true);
      setError("");

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

      const extraRequests = [];

      if (appointmentData?.doctorId) {
        extraRequests.push(
          axios
            .get(`${AUTH_BASE_URL}/api/patient/doctors/${appointmentData.doctorId}`)
            .then((res) => setDoctorDetails(res?.data?.doctor || null))
            .catch(() => setDoctorDetails(null))
        );
      } else {
        setDoctorDetails(null);
      }

      if (appointmentData?.patientId) {
        extraRequests.push(
          axios
            .get(`${AUTH_BASE_URL}/api/doctor/patients/${appointmentData.patientId}`)
            .then((res) =>
              setPatientDetails(res?.data?.patient || res?.data?.user || null)
            )
            .catch(() => setPatientDetails(null))
        );
      } else {
        setPatientDetails(null);
      }

      if (
        appointmentData?.appointmentType === "telemedicine" &&
        (appointmentData?.telemedicineSessionId || appointmentData?.paymentStatus === "paid")
      ) {
        setSessionLoading(true);
        extraRequests.push(
          getTelemedicineSessionByAppointment(id)
            .then((sessionData) => setSession(sessionData?.session || null))
            .catch(() => setSession(null))
            .finally(() => setSessionLoading(false))
        );
      } else {
        setSession(null);
        setSessionLoading(false);
      }

      await Promise.allSettled(extraRequests);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load appointment details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadAppointment();
  }, [id]);

  const displayPatientName = useMemo(
    () => getDisplayPatientName(appointment, patientDetails, user),
    [appointment, patientDetails, user]
  );

  const displayDoctorName = useMemo(
    () => getDisplayDoctorName(appointment, doctorDetails),
    [appointment, doctorDetails]
  );

  const submitDoctorAction = async (status) => {
    if (status === "rejected" && !doctorForm.doctorResponseNote.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Reason required",
        text: "Please enter a rejection reason for the patient.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    if (status === "rescheduled" && !doctorForm.rescheduleReason.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Reason required",
        text: "Please enter a reschedule reason for the patient.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

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

      const successTextMap = {
        accepted: "Appointment accepted and payment requested successfully.",
        rescheduled: "Appointment rescheduled successfully.",
        rejected: "Appointment rejected successfully.",
      };

      setActionMessage(successTextMap[status] || "Appointment updated successfully");
      await loadAppointment();

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: successTextMap[status] || "Appointment updated successfully.",
        confirmButtonColor: "#2563eb",
      });
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to update appointment";
      setError(message);

      await Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: message,
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDoctorCancel = async () => {
    const confirmCancel = await Swal.fire({
      icon: "warning",
      title: "Cancel appointment?",
      text: "This appointment will be cancelled.",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "No",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (!confirmCancel.isConfirmed) return;

    try {
      setSubmitting(true);
      setError("");
      setActionMessage("");

      await cancelAppointment(id, { cancellationReason: "Cancelled by doctor" });
      await loadAppointment();

      await Swal.fire({
        icon: "success",
        title: "Cancelled",
        text: "Appointment cancelled successfully.",
        confirmButtonColor: "#2563eb",
      });
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to cancel appointment";
      setError(message);

      await Swal.fire({
        icon: "error",
        title: "Cancel Failed",
        text: message,
        confirmButtonColor: "#2563eb",
      });
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
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {actionMessage && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
            {actionMessage}
          </div>
        )}

        {appointment && !loading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoCard label="Patient" value={displayPatientName} />
              <InfoCard label="Doctor" value={displayDoctorName} />
              <InfoCard
                label="Appointment Type"
                value={formatType(appointment.appointmentType)}
              />
              <InfoCard
                label="Preferred Date & Time"
                value={formatDateTime(appointment.preferredDateTime)}
              />
              <InfoCard
                label="Scheduled Date & Time"
                value={formatDateTime(appointment.scheduledDateTime)}
              />
              <InfoCard
                label="Consultation Fee"
                value={`LKR ${appointment.consultationFee || 0}`}
              />
              <InfoCard
                label="Duration"
                value={`${appointment.durationMinutes || 30} minutes`}
              />
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
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>

            {isDoctor &&
              ["pending", "rescheduled", "awaiting_payment"].includes(appointment.status) &&
              appointment.paymentStatus !== "paid" && (
                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
                  <h2 className="text-lg font-bold text-blue-700">Doctor Action Panel</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Accept the booking by setting the consultation fee and confirming the final
                    date and time.
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Consultation fee (LKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={doctorForm.consultationFee}
                        onChange={(e) =>
                          setDoctorForm((prev) => ({
                            ...prev,
                            consultationFee: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Final appointment date & time
                      </label>
                      <input
                        type="datetime-local"
                        value={doctorForm.scheduledDateTime}
                        onChange={(e) =>
                          setDoctorForm((prev) => ({
                            ...prev,
                            scheduledDateTime: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Doctor note
                      </label>
                      <textarea
                        rows={3}
                        value={doctorForm.doctorResponseNote}
                        onChange={(e) =>
                          setDoctorForm((prev) => ({
                            ...prev,
                            doctorResponseNote: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Required when rejecting. Optional for accepted or rescheduled."
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Reschedule reason
                      </label>
                      <textarea
                        rows={3}
                        value={doctorForm.rescheduleReason}
                        onChange={(e) =>
                          setDoctorForm((prev) => ({
                            ...prev,
                            rescheduleReason: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Required when rescheduling this appointment"
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

            {isDoctor && (
              <PrescriptionPanel
                appointmentId={id}
                patientId={appointment.patientId}
                doctorId={user?.id}
              />
            )}

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
                  <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-slate-600">
                    The telemedicine session will be available after payment confirmation.
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