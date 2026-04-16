import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getPrescriptionById } from "../../services/doctorService";

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

const PatientPrescriptionDetailsPage = () => {
  const { id } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getPrescriptionById(id);
        setPrescription(data?.prescription || null);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load prescription");
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  return (
    <DashboardLayout title="Prescription Details">
      <div className="space-y-6">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-blue-700">Prescription</h1>
          <p className="mt-2 text-sm text-slate-500">
            Full details of your prescribed treatment plan.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl bg-slate-100 p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-slate-600">Loading prescription...</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && prescription && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {prescription.diagnosis || "Prescription"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Issued by Dr. {prescription.doctorName || prescription.doctorId || "N/A"}
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

            <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-blue-50/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                  Issued Date
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatDate(prescription.issuedDate)}
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                  Valid Until
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatDate(prescription.validUntil)}
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                  Refills
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {prescription.refillCount || 0} / {prescription.maxRefills || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                  Appointment
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {prescription.appointmentId || "N/A"}
                </p>
              </div>
            </div>

            {prescription.instructions && (
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Instructions
                </p>
                <p className="mt-2 text-sm text-slate-700">{prescription.instructions}</p>
              </div>
            )}

            {!!prescription.medicines?.length && (
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    Medicines ({prescription.medicines.length})
                  </p>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="h-3 w-3" />
                    Last updated {formatDate(prescription.updatedAt || prescription.issuedDate)}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
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

            {prescription.appointmentId && (
              <div>
                <Link
                  to={`/patient/appointments/${prescription.appointmentId}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  View Related Appointment
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientPrescriptionDetailsPage;
