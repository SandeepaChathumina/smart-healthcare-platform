import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import {
  getTelemedicineSessionById,
  updateTelemedicineSessionStatus,
} from "../../services/appointmentService";

const formatDateTime = (value) => {
  if (!value) return "Not scheduled yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getSessionBadge = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "active") return "bg-green-100 text-green-700 ring-green-200";
  if (value === "scheduled") return "bg-blue-100 text-blue-700 ring-blue-200";
  if (value === "completed") return "bg-slate-100 text-slate-700 ring-slate-200";
  if (value === "cancelled" || value === "expired") {
    return "bg-red-100 text-red-700 ring-red-200";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
};

const TelemedicineSessionPage = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

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

      await updateTelemedicineSessionStatus(sessionId, {
        status: "active",
      });

      await loadSession();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to start session");
    } finally {
      setStarting(false);
    }
  };

  return (
    <DashboardLayout title="Telemedicine Session">
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold">Telemedicine Session</h1>
          <p className="mt-2 text-sm text-emerald-50">
            Start or join the online consultation through the secure meeting room.
          </p>
        </div>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {session && !loading && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:shadow-md">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Platform
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {session.platform || "Jitsi"}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:shadow-md">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
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

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:shadow-md">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Scheduled Start
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {formatDateTime(session.scheduledStartTime)}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:shadow-md">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Access
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {isDoctor ? "Doctor View" : "Patient View"}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Session Actions</h2>
              <p className="mt-2 text-sm text-slate-500">
                The doctor should start the session first. Patients can join once the
                session becomes active.
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
                    className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition duration-200 hover:scale-[1.02] hover:bg-emerald-700"
                  >
                    Join as Doctor
                  </a>
                )}

                {isPatient && session.status === "active" && (
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition duration-200 hover:scale-[1.02] hover:bg-emerald-700"
                  >
                    Join Session
                  </a>
                )}
              </div>

              {isPatient && session.status !== "active" && (
                <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
                  Waiting for doctor to start the session.
                </div>
              )}
            </div>

            {session.status === "active" && (
              <div className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <div className="mb-3 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-600">
                    When you click the join button above, the secure Jitsi room will open in a
                    new tab.
                  </p>
                </div>

                <div className="overflow-hidden rounded-3xl bg-slate-100">
                  <div className="flex h-[500px] items-center justify-center text-center text-slate-500">
                    <div>
                      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                        🎥
                      </div>
                      <p className="font-semibold">Meeting room is ready</p>
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