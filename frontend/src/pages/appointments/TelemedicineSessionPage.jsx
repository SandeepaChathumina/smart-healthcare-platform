import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import {
  getTelemedicineSessionById,
  updateTelemedicineSessionStatus,
} from '../../services/appointmentService';

const TelemedicineSessionPage = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const isDoctor = user?.role === 'Doctor';
  const isPatient = user?.role === 'Patient';

  const loadSession = async () => {
    try {
      const data = await getTelemedicineSessionById(sessionId);
      setSession(data?.session || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load telemedicine session');
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
      setError('');

      await updateTelemedicineSessionStatus(sessionId, {
        status: 'active',
      });

      await loadSession();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to start session');
    } finally {
      setStarting(false);
    }
  };

  return (
    <DashboardLayout title="Telemedicine Session">
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          {loading && <p>Loading session...</p>}
          {error && <p className="text-red-600">{error}</p>}

          {session && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Online Consultation Session</h2>

              <div className="rounded-2xl border border-slate-200 p-5">
                <p><strong>Platform:</strong> {session.platform}</p>
                <p><strong>Room Name:</strong> {session.roomName}</p>
                <p><strong>Status:</strong> {session.status}</p>
                <p><strong>Scheduled Start:</strong> {session.scheduledStartTime}</p>
              </div>

              {isDoctor && session.status !== 'active' && (
                <button
                  onClick={handleStartSession}
                  disabled={starting}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
                >
                  {starting ? 'Starting Session...' : 'Start Session'}
                </button>
              )}

              {isDoctor && session.status === 'active' && (
                <a
                  href={session.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-xl bg-green-600 px-5 py-3 font-semibold text-white"
                >
                  Join as Doctor
                </a>
              )}

              {isPatient && session.status === 'active' && (
                <a
                  href={session.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
                >
                  Join Session
                </a>
              )}

              {isPatient && session.status !== 'active' && (
                <div className="rounded-xl bg-yellow-50 p-4 text-yellow-700">
                  Waiting for doctor to start the session.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TelemedicineSessionPage;