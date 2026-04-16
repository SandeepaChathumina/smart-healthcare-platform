import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import {
  getTelemedicineSessionById,
  updateTelemedicineSessionStatus,
} from "../../services/appointmentService";
import { createPrescription } from "../../services/doctorService";

const formatDateTime = (value) => {
  if (!value) return "Not scheduled yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getSessionBadge = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "active") return "bg-blue-100 text-blue-700 ring-blue-200";
  if (value === "scheduled") return "bg-sky-100 text-sky-700 ring-sky-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
};

const createEmptyMedicine = () => ({
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
});

const TelemedicineSessionPage = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [prescribing, setPrescribing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: "",
    instructions: "",
    medicines: [createEmptyMedicine()],
  });

  const isDoctor = user?.role === "Doctor";
  const isPatient = user?.role === "Patient";

  const loadSession = async () => {
    try {
      const data = await getTelemedicineSessionById(sessionId);
      setSession(data?.session || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load telemedicine session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const handleStartSession = async () => {
    try {
      setStarting(true);
      setError("");
      await updateTelemedicineSessionStatus(sessionId, { status: "active" });
      await loadSession();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to start session");
    } finally {
      setStarting(false);
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

  const handleCreatePrescription = async (event) => {
    event.preventDefault();

    if (!session?.appointmentId) {
      setError("Appointment reference is missing for this session");
      return;
    }

    const hasIncompleteMedicine = prescriptionForm.medicines.some((medicine) =>
      [medicine.name, medicine.dosage, medicine.frequency, medicine.duration].some(
        (field) => !String(field || "").trim()
      )
    );

    if (!prescriptionForm.medicines.length || hasIncompleteMedicine) {
      setError("Please complete all required fields for each medicine");
      return;
    }

    try {
      setPrescribing(true);
      setError("");
      setSuccessMessage("");

      await createPrescription({
        appointmentId: session.appointmentId,
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

      setSuccessMessage("Prescription created successfully");
      resetPrescriptionForm();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create prescription");
    } finally {
      setPrescribing(false);
    }
  };

  return (
    <DashboardLayout title="Telemedicine Session">
      <div className="space-y-6">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-blue-700">Telemedicine Session</h1>
          <p className="mt-2 text-sm text-slate-500">
            Start or join the online consultation through the secure meeting room.
          </p>
        </div>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
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

        {successMessage && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
            {successMessage}
          </div>
        )}

        {session && !loading && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-blue-100 transition duration-200 hover:shadow-md">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                  Platform
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {session.platform || "Jitsi"}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-blue-100 transition duration-200 hover:shadow-md">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                  Status
                </p>
                <div className="mt-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getSessionBadge(
                      session.status
                    )}`}
                  >
                    {session.status || "scheduled"}
                  </span>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-blue-100 transition duration-200 hover:shadow-md">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                  Scheduled Start
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {formatDateTime(session.scheduledStartTime)}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-blue-100 transition duration-200 hover:shadow-md">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                  Access
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {isDoctor ? "Doctor View" : "Patient View"}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
              <h2 className="text-lg font-bold text-blue-700">Session Actions</h2>
              <p className="mt-2 text-sm text-slate-500">
                The doctor can start the session and issue a prescription for the patient.
                Prescriptions can be created at any time.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {isDoctor && session.status !== "active" && (
                  <button
                    onClick={handleStartSession}
                    disabled={starting}
                    className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition duration-200 hover:scale-[1.02] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {starting ? "Starting Session..." : "Start Session"}
                  </button>
                )}

                {isDoctor && session.status === "active" && (
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-700 transition duration-200 hover:scale-[1.02] hover:bg-blue-50"
                  >
                    Join as Doctor
                  </a>
                )}

                {isPatient && session.status === "active" && (
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-700 transition duration-200 hover:scale-[1.02] hover:bg-blue-50"
                  >
                    Join Session
                  </a>
                )}
              </div>

              {isPatient && session.status !== "active" && (
                <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">
                  Waiting for doctor to start the session.
                </div>
              )}

              {isDoctor && (
                <form
                  onSubmit={handleCreatePrescription}
                  className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-4"
                >
                  <h3 className="text-base font-semibold text-blue-700">Write Prescription</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Add medicine details and issue it directly to this appointment's patient.
                  </p>

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
              )}
            </div>

            {session.status === "active" && (
              <div className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-blue-100">
                <div className="mb-3 rounded-2xl bg-blue-50 p-4">
                  <p className="text-sm text-slate-600">
                    When you click the join button above, the secure Jitsi room will open in a
                    new tab.
                  </p>
                </div>

                <div className="overflow-hidden rounded-3xl bg-blue-50/40">
                  <div className="flex h-[500px] items-center justify-center text-center text-slate-500">
                    <div>
                      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                        🎥
                      </div>
                      <p className="font-semibold text-blue-700">Meeting room is ready</p>
                      <p className="mt-1 text-sm">
                        Use the join button above to open the live video session.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TelemedicineSessionPage;