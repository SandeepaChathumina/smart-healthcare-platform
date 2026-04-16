import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import {
  cancelAppointment,
  getAppointmentById,
  getTelemedicineSessionByAppointment,
  updateAppointmentStatus,
} from "../../services/appointmentService";
import {
  createPrescription,
  deletePrescription,
  getPrescriptionByAppointment,
  updatePrescription,
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

const InfoCard = ({ label, value }) => (
  <div className="rounded-2xl bg-blue-50/50 p-4 transition duration-200 hover:shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wide text-blue-400">{label}</p>
    <p className="mt-2 text-sm font-medium text-slate-700">{value || "N/A"}</p>
  </div>
);

const createEmptyMedicine = () => ({
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
});

const AppointmentDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [appointmentPrescription, setAppointmentPrescription] = useState(null);
  const [editingPrescription, setEditingPrescription] = useState(false);
  const [updatingPrescription, setUpdatingPrescription] = useState(false);
  const [deletingPrescription, setDeletingPrescription] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prescribing, setPrescribing] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    consultationFee: "",
    scheduledDateTime: "",
    doctorResponseNote: "",
    rescheduleReason: "",
  });
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: "",
    instructions: "",
    medicines: [createEmptyMedicine()],
  });
  const [managePrescriptionForm, setManagePrescriptionForm] = useState({
    diagnosis: "",
    instructions: "",
    status: "active",
    validUntil: "",
    refillCount: 0,
    maxRefills: 0,
    medicines: [createEmptyMedicine()],
  });

  const isPatient = user?.role === "Patient";
  const isDoctor = user?.role === "Doctor";

  const loadAppointment = async () => {
    try {
      const data = await getAppointmentById(id);
      const appointmentData = data?.appointment || null;
      setAppointment(appointmentData);
      setAppointmentPrescription(null);
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

      setPrescriptionLoading(true);
      try {
        const prescriptionData = await getPrescriptionByAppointment(appointmentData._id);
        const existingPrescription = prescriptionData?.prescription || null;
        setAppointmentPrescription(existingPrescription);
        if (existingPrescription) {
          setManagePrescriptionForm({
            diagnosis: existingPrescription?.diagnosis || "",
            instructions: existingPrescription?.instructions || "",
            status: existingPrescription?.status || "active",
            validUntil: existingPrescription?.validUntil
              ? new Date(existingPrescription.validUntil).toISOString().split("T")[0]
              : "",
            refillCount: existingPrescription?.refillCount ?? 0,
            maxRefills: existingPrescription?.maxRefills ?? 0,
            medicines:
              existingPrescription?.medicines?.length > 0
                ? existingPrescription.medicines.map((medicine) => ({
                    name: medicine?.name || "",
                    dosage: medicine?.dosage || "",
                    frequency: medicine?.frequency || "",
                    duration: medicine?.duration || "",
                  }))
                : [createEmptyMedicine()],
          });
        }
      } catch {
        setAppointmentPrescription(null);
      } finally {
        setPrescriptionLoading(false);
      }
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

  const resetPrescriptionForm = () => {
    setPrescriptionForm({
      diagnosis: "",
      instructions: "",
      medicines: [createEmptyMedicine()],
    });
  };

  const updateMedicineField = (index, field, value) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: prev.medicines.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [field]: value } : medicine
      ),
    }));
  };

  const addMedicineRow = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, createEmptyMedicine()],
    }));
  };

  const removeMedicineRow = (index) => {
    setPrescriptionForm((prev) => {
      if (prev.medicines.length === 1) return prev;
      return {
        ...prev,
        medicines: prev.medicines.filter((_, medicineIndex) => medicineIndex !== index),
      };
    });
  };

  const updateManagedMedicineField = (index, field, value) => {
    setManagePrescriptionForm((prev) => ({
      ...prev,
      medicines: prev.medicines.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [field]: value } : medicine
      ),
    }));
  };

  const addManagedMedicineRow = () => {
    setManagePrescriptionForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, createEmptyMedicine()],
    }));
  };

  const removeManagedMedicineRow = (index) => {
    setManagePrescriptionForm((prev) => {
      if (prev.medicines.length === 1) return prev;
      return {
        ...prev,
        medicines: prev.medicines.filter((_, medicineIndex) => medicineIndex !== index),
      };
    });
  };

  const handleCreatePrescription = async (event) => {
    event.preventDefault();

    const hasIncompleteMedicine = prescriptionForm.medicines.some((medicine) =>
      [medicine.name, medicine.dosage, medicine.frequency, medicine.duration].some(
        (field) => !String(field || "").trim()
      )
    );

    if (!prescriptionForm.medicines.length || hasIncompleteMedicine) {
      setError("Please complete all required fields for each medicine");
      await Swal.fire({
        icon: "warning",
        title: "Incomplete medicine details",
        text: "Please complete all required fields for each medicine.",
      });
      return;
    }

    try {
      setPrescribing(true);
      setError("");
      setActionMessage("");

      await createPrescription({
        appointmentId: id,
        diagnosis: prescriptionForm.diagnosis || undefined,
        instructions: prescriptionForm.instructions || undefined,
        medicines: prescriptionForm.medicines.map((medicine) => ({
          name: medicine.name.trim(),
          dosage: medicine.dosage.trim(),
          frequency: medicine.frequency.trim(),
          duration: medicine.duration.trim(),
          timing: "anytime",
        })),
      });

      setActionMessage("Prescription created successfully");
      resetPrescriptionForm();
      await loadAppointment();
      await Swal.fire({
        icon: "success",
        title: "Prescription created",
        text: "Prescription was created successfully.",
      });
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to create prescription";
      setError(message);
      await Swal.fire({
        icon: "error",
        title: "Create failed",
        text: message,
      });
    } finally {
      setPrescribing(false);
    }
  };

  const handleUpdateExistingPrescription = async () => {
    if (!appointmentPrescription?._id) return;

    const hasIncompleteMedicine = managePrescriptionForm.medicines.some((medicine) =>
      [medicine.name, medicine.dosage, medicine.frequency, medicine.duration].some(
        (field) => !String(field || "").trim()
      )
    );
    if (!managePrescriptionForm.medicines.length || hasIncompleteMedicine) {
      setError("Please complete all required fields for each medicine");
      await Swal.fire({
        icon: "warning",
        title: "Incomplete medicine details",
        text: "Please complete all required fields for each medicine.",
      });
      return;
    }

    try {
      setUpdatingPrescription(true);
      setError("");
      setActionMessage("");
      await updatePrescription(appointmentPrescription._id, {
        diagnosis: managePrescriptionForm.diagnosis || undefined,
        instructions: managePrescriptionForm.instructions || undefined,
        status: managePrescriptionForm.status,
        validUntil: managePrescriptionForm.validUntil || undefined,
        refillCount: Number(managePrescriptionForm.refillCount || 0),
        maxRefills: Number(managePrescriptionForm.maxRefills || 0),
        medicines: managePrescriptionForm.medicines.map((medicine) => ({
          name: medicine.name.trim(),
          dosage: medicine.dosage.trim(),
          frequency: medicine.frequency.trim(),
          duration: medicine.duration.trim(),
          timing: "anytime",
        })),
      });
      setActionMessage("Prescription updated successfully");
      setEditingPrescription(false);
      await loadAppointment();
      await Swal.fire({
        icon: "success",
        title: "Prescription updated",
        text: "Prescription changes were saved successfully.",
      });
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to update prescription";
      setError(message);
      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text: message,
      });
    } finally {
      setUpdatingPrescription(false);
    }
  };

  const handleDeleteExistingPrescription = async () => {
    if (!appointmentPrescription?._id) return;

    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Delete prescription?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });
    if (!confirmation.isConfirmed) return;

    try {
      setDeletingPrescription(true);
      setError("");
      setActionMessage("");
      await deletePrescription(appointmentPrescription._id);
      setActionMessage("Prescription deleted successfully");
      setAppointmentPrescription(null);
      setEditingPrescription(false);
      await loadAppointment();
      await Swal.fire({
        icon: "success",
        title: "Prescription deleted",
        text: "Prescription was deleted successfully.",
      });
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to delete prescription";
      setError(message);
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: message,
      });
    } finally {
      setDeletingPrescription(false);
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

        {appointment && !loading && (
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

            {isDoctor && (
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
                <h2 className="text-lg font-bold text-blue-700">Issue Prescription</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Create a prescription for this appointment regardless of consultation type.
                </p>

                <form onSubmit={handleCreatePrescription} className="mt-5">
                  <div className="space-y-4">
                    {prescriptionForm.medicines.map((medicine, index) => (
                      <div
                        key={`medicine-${index}`}
                        className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-blue-700">
                            Medicine {index + 1}
                          </h3>
                          {prescriptionForm.medicines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMedicineRow(index)}
                              className="text-xs font-semibold text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Medicine Name *
                            </label>
                            <input
                              type="text"
                              value={medicine.name}
                              onChange={(e) => updateMedicineField(index, "name", e.target.value)}
                              className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                              placeholder="e.g. Amoxicillin 500mg"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Dosage *
                            </label>
                            <input
                              type="text"
                              value={medicine.dosage}
                              onChange={(e) => updateMedicineField(index, "dosage", e.target.value)}
                              className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                              placeholder="e.g. 1 tablet"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Frequency *
                            </label>
                            <input
                              type="text"
                              value={medicine.frequency}
                              onChange={(e) => updateMedicineField(index, "frequency", e.target.value)}
                              className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                              placeholder="e.g. Twice daily"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Duration *
                            </label>
                            <input
                              type="text"
                              value={medicine.duration}
                              onChange={(e) => updateMedicineField(index, "duration", e.target.value)}
                              className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                              placeholder="e.g. 5 days"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={addMedicineRow}
                      className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                    >
                      + Add Another Medicine
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Diagnosis
                      </label>
                      <textarea
                        rows={3}
                        value={prescriptionForm.diagnosis}
                        onChange={(e) =>
                          setPrescriptionForm((prev) => ({
                            ...prev,
                            diagnosis: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Optional diagnosis details"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Instructions
                      </label>
                      <textarea
                        rows={3}
                        value={prescriptionForm.instructions}
                        onChange={(e) =>
                          setPrescriptionForm((prev) => ({
                            ...prev,
                            instructions: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Optional instructions for patient"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="submit"
                      disabled={prescribing}
                      className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition duration-200 hover:scale-[1.02] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {prescribing ? "Issuing Prescription..." : "Issue Prescription"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
              <h2 className="text-lg font-bold text-blue-700">Prescription Details</h2>
              <p className="mt-2 text-sm text-slate-500">
                View prescription issued for this appointment.
              </p>

              {prescriptionLoading && (
                <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">
                  Loading prescription details...
                </div>
              )}

              {!prescriptionLoading && !appointmentPrescription && (
                <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">
                  No prescription has been added to this appointment yet.
                </div>
              )}

              {!prescriptionLoading && appointmentPrescription && (
                <div className="mt-4 space-y-4">
                  {isDoctor && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPrescription((prev) => !prev)}
                        className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        {editingPrescription ? "Cancel Edit" : "Edit Prescription"}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteExistingPrescription}
                        disabled={deletingPrescription}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingPrescription ? "Deleting..." : "Delete Prescription"}
                      </button>
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoCard
                      label="Status"
                      value={appointmentPrescription.status || "active"}
                    />
                    <InfoCard
                      label="Issued Date"
                      value={formatDateTime(appointmentPrescription.issuedDate)}
                    />
                    <InfoCard
                      label="Valid Until"
                      value={formatDateTime(appointmentPrescription.validUntil)}
                    />
                    <InfoCard
                      label="Refills"
                      value={`${appointmentPrescription.refillCount || 0} / ${
                        appointmentPrescription.maxRefills || 0
                      }`}
                    />
                  </div>

                  {appointmentPrescription.diagnosis && (
                    <div className="rounded-2xl bg-blue-50/50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                        Diagnosis
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {appointmentPrescription.diagnosis}
                      </p>
                    </div>
                  )}

                  {appointmentPrescription.instructions && (
                    <div className="rounded-2xl bg-blue-50/50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                        Instructions
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {appointmentPrescription.instructions}
                      </p>
                    </div>
                  )}

                  {!!appointmentPrescription.medicines?.length && (
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Medicines ({appointmentPrescription.medicines.length})
                      </p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {appointmentPrescription.medicines.map((medicine, index) => (
                          <div
                            key={`${appointmentPrescription._id}-medicine-${index}`}
                            className="rounded-2xl border border-blue-100 bg-white p-4"
                          >
                            <p className="font-semibold text-slate-900">{medicine.name || "Medicine"}</p>
                            <div className="mt-2 space-y-1 text-sm text-slate-600">
                              <p>Dosage: {medicine.dosage || "N/A"}</p>
                              <p>Frequency: {medicine.frequency || "N/A"}</p>
                              <p>Duration: {medicine.duration || "N/A"}</p>
                              {medicine.timing && (
                                <p>Timing: {String(medicine.timing).replace("_", " ")}</p>
                              )}
                              {medicine.notes && <p>Notes: {medicine.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isDoctor && editingPrescription && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                      <h3 className="text-base font-semibold text-blue-700">
                        Manage Prescription
                      </h3>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Diagnosis
                          </label>
                          <input
                            type="text"
                            value={managePrescriptionForm.diagnosis}
                            onChange={(e) =>
                              setManagePrescriptionForm((prev) => ({
                                ...prev,
                                diagnosis: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Valid Until
                          </label>
                          <input
                            type="date"
                            value={managePrescriptionForm.validUntil}
                            onChange={(e) =>
                              setManagePrescriptionForm((prev) => ({
                                ...prev,
                                validUntil: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Status
                          </label>
                          <select
                            value={managePrescriptionForm.status}
                            onChange={(e) =>
                              setManagePrescriptionForm((prev) => ({
                                ...prev,
                                status: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <option value="active">active</option>
                            <option value="completed">completed</option>
                            <option value="expired">expired</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Refill Count
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={managePrescriptionForm.refillCount}
                            onChange={(e) =>
                              setManagePrescriptionForm((prev) => ({
                                ...prev,
                                refillCount: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Max Refills
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={managePrescriptionForm.maxRefills}
                            onChange={(e) =>
                              setManagePrescriptionForm((prev) => ({
                                ...prev,
                                maxRefills: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Instructions
                        </label>
                        <textarea
                          rows={3}
                          value={managePrescriptionForm.instructions}
                          onChange={(e) =>
                            setManagePrescriptionForm((prev) => ({
                              ...prev,
                              instructions: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>

                      <div className="mt-4 space-y-3">
                        {managePrescriptionForm.medicines.map((medicine, index) => (
                          <div
                            key={`manage-medicine-${index}`}
                            className="rounded-2xl border border-blue-100 bg-white p-4"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-sm font-semibold text-blue-700">
                                Medicine {index + 1}
                              </p>
                              {managePrescriptionForm.medicines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeManagedMedicineRow(index)}
                                  className="text-xs font-semibold text-red-600"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <input
                                type="text"
                                value={medicine.name}
                                onChange={(e) =>
                                  updateManagedMedicineField(index, "name", e.target.value)
                                }
                                placeholder="Medicine name"
                                className="rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                              />
                              <input
                                type="text"
                                value={medicine.dosage}
                                onChange={(e) =>
                                  updateManagedMedicineField(index, "dosage", e.target.value)
                                }
                                placeholder="Dosage"
                                className="rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                              />
                              <input
                                type="text"
                                value={medicine.frequency}
                                onChange={(e) =>
                                  updateManagedMedicineField(index, "frequency", e.target.value)
                                }
                                placeholder="Frequency"
                                className="rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                              />
                              <input
                                type="text"
                                value={medicine.duration}
                                onChange={(e) =>
                                  updateManagedMedicineField(index, "duration", e.target.value)
                                }
                                placeholder="Duration"
                                className="rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={addManagedMedicineRow}
                        className="mt-3 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                      >
                        + Add Another Medicine
                      </button>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={handleUpdateExistingPrescription}
                          disabled={updatingPrescription}
                          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                          {updatingPrescription ? "Saving..." : "Save Prescription Changes"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
