import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import {
  deletePrescription,
  getPrescriptionsByDoctor,
  updatePrescription,
} from "../../services/doctorService";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const getStatusBadge = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "active") return "bg-green-100 text-green-700 ring-green-200";
  if (value === "completed") return "bg-blue-100 text-blue-700 ring-blue-200";
  if (value === "expired") return "bg-amber-100 text-amber-700 ring-amber-200";
  if (value === "cancelled") return "bg-red-100 text-red-700 ring-red-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
};

const createEmptyMedicine = () => ({
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
});

const DoctorPrescriptionsPage = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeEditId, setActiveEditId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editForm, setEditForm] = useState({
    diagnosis: "",
    instructions: "",
    status: "active",
    validUntil: "",
    refillCount: 0,
    maxRefills: 0,
    medicines: [createEmptyMedicine()],
  });

  const loadPrescriptions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError("");
      const data = await getPrescriptionsByDoctor(user.id, { limit: 100 });
      setPrescriptions(data?.prescriptions || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, [user?.id]);

  const startEdit = (prescription) => {
    const validUntil = prescription?.validUntil
      ? new Date(prescription.validUntil).toISOString().split("T")[0]
      : "";
    setEditForm({
      diagnosis: prescription?.diagnosis || "",
      instructions: prescription?.instructions || "",
      status: prescription?.status || "active",
      validUntil,
      refillCount: prescription?.refillCount ?? 0,
      maxRefills: prescription?.maxRefills ?? 0,
      medicines:
        prescription?.medicines?.length > 0
          ? prescription.medicines.map((medicine) => ({
              name: medicine?.name || "",
              dosage: medicine?.dosage || "",
              frequency: medicine?.frequency || "",
              duration: medicine?.duration || "",
            }))
          : [createEmptyMedicine()],
    });
    setActiveEditId(prescription._id);
  };

  const cancelEdit = () => {
    setActiveEditId("");
  };

  const updateMedicineField = (index, field, value) => {
    setEditForm((prev) => ({
      ...prev,
      medicines: prev.medicines.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [field]: value } : medicine
      ),
    }));
  };

  const addMedicineRow = () => {
    setEditForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, createEmptyMedicine()],
    }));
  };

  const removeMedicineRow = (index) => {
    setEditForm((prev) => {
      if (prev.medicines.length === 1) return prev;
      return {
        ...prev,
        medicines: prev.medicines.filter((_, medicineIndex) => medicineIndex !== index),
      };
    });
  };

  const handleSaveEdit = async (id) => {
    const hasIncompleteMedicine = editForm.medicines.some((medicine) =>
      [medicine.name, medicine.dosage, medicine.frequency, medicine.duration].some(
        (field) => !String(field || "").trim()
      )
    );

    if (!editForm.medicines.length || hasIncompleteMedicine) {
      setError("Please complete all required fields for each medicine");
      await Swal.fire({
        icon: "warning",
        title: "Incomplete medicine details",
        text: "Please complete all required fields for each medicine.",
      });
      return;
    }

    try {
      setSavingEdit(true);
      setError("");
      await updatePrescription(id, {
        diagnosis: editForm.diagnosis || undefined,
        instructions: editForm.instructions || undefined,
        status: editForm.status,
        validUntil: editForm.validUntil || undefined,
        refillCount: Number(editForm.refillCount || 0),
        maxRefills: Number(editForm.maxRefills || 0),
        medicines: editForm.medicines.map((medicine) => ({
          name: medicine.name.trim(),
          dosage: medicine.dosage.trim(),
          frequency: medicine.frequency.trim(),
          duration: medicine.duration.trim(),
          timing: "anytime",
        })),
      });
      await loadPrescriptions();
      setActiveEditId("");
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
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id) => {
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
      setDeletingId(id);
      setError("");
      await deletePrescription(id);
      await loadPrescriptions();
      if (activeEditId === id) {
        setActiveEditId("");
      }
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
      setDeletingId("");
    }
  };

  return (
    <DashboardLayout title="Written Prescriptions">
      <div className="space-y-6">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-blue-700">Written Prescriptions</h1>
          <p className="mt-2 text-sm text-slate-500">
            View all prescriptions you have issued for appointment consultations.
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
            <p className="mt-3 text-slate-600">Loading prescriptions...</p>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-blue-100">
            <h2 className="text-xl font-semibold text-blue-700">No prescriptions yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Prescriptions you issue from appointment pages will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {prescriptions.map((prescription) => (
              <div
                key={prescription._id}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {prescription.diagnosis || "Prescription"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Patient: {prescription.patientName || prescription.patientId || "N/A"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadge(
                      prescription.status
                    )}`}
                  >
                    {prescription.status || "active"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-blue-50/50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                      Appointment
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {prescription.appointmentId || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50/50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                      Issued Date
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {formatDate(prescription.issuedDate)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50/50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                      Valid Until
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {formatDate(prescription.validUntil)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50/50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                      Refills
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {prescription.refillCount || 0} / {prescription.maxRefills || 0}
                    </p>
                  </div>
                </div>

                {prescription.instructions && (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Instructions
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{prescription.instructions}</p>
                  </div>
                )}

                {!!prescription.medicines?.length && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Medicines ({prescription.medicines.length})
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {prescription.medicines.map((medicine, index) => (
                        <div
                          key={`${prescription._id}-medicine-${index}`}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <p className="font-semibold text-slate-900">{medicine.name || "Medicine"}</p>
                          <div className="mt-2 space-y-1 text-sm text-slate-600">
                            <p>Dosage: {medicine.dosage || "N/A"}</p>
                            <p>Frequency: {medicine.frequency || "N/A"}</p>
                            <p>Duration: {medicine.duration || "N/A"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to={`/doctor/appointments/${prescription.appointmentId}?tab=prescription`}
                    className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                  >
                    Open Appointment
                  </Link>
                  <button
                    type="button"
                    onClick={() => startEdit(prescription)}
                    className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(prescription._id)}
                    disabled={deletingId === prescription._id}
                    className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingId === prescription._id ? "Deleting..." : "Delete"}
                  </button>
                </div>

                {activeEditId === prescription._id && (
                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                    <h3 className="text-base font-semibold text-blue-700">Edit Prescription</h3>

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
                          Valid Until
                        </label>
                        <input
                          type="date"
                          value={editForm.validUntil}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, validUntil: e.target.value }))
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
                          value={editForm.status}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, status: e.target.value }))
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
                          value={editForm.refillCount}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, refillCount: e.target.value }))
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
                          value={editForm.maxRefills}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, maxRefills: e.target.value }))
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
                        value={editForm.instructions}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, instructions: e.target.value }))
                        }
                        className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>

                    <div className="mt-4 space-y-3">
                      {editForm.medicines.map((medicine, index) => (
                        <div
                          key={`edit-medicine-${index}`}
                          className="rounded-2xl border border-blue-100 bg-white p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold text-blue-700">
                              Medicine {index + 1}
                            </p>
                            {editForm.medicines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeMedicineRow(index)}
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
                              onChange={(e) => updateMedicineField(index, "name", e.target.value)}
                              placeholder="Medicine name"
                              className="rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                            />
                            <input
                              type="text"
                              value={medicine.dosage}
                              onChange={(e) =>
                                updateMedicineField(index, "dosage", e.target.value)
                              }
                              placeholder="Dosage"
                              className="rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                            />
                            <input
                              type="text"
                              value={medicine.frequency}
                              onChange={(e) =>
                                updateMedicineField(index, "frequency", e.target.value)
                              }
                              placeholder="Frequency"
                              className="rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                            />
                            <input
                              type="text"
                              value={medicine.duration}
                              onChange={(e) =>
                                updateMedicineField(index, "duration", e.target.value)
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
                      onClick={addMedicineRow}
                      className="mt-3 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                    >
                      + Add Another Medicine
                    </button>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(prescription._id)}
                        disabled={savingEdit}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {savingEdit ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
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

export default DoctorPrescriptionsPage;
