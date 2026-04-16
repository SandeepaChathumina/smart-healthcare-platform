import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getTelemedicineSessionById } from '../../services/appointmentService';

const TelemedicineSessionPage = () => {
  const { sessionId } = useParams();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

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

              <a
                href={session.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
              >
                Join Session
              </a>
            </div>
          )}
        </div>

        {session?.meetingLink && (
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <iframe
              src={session.meetingLink}
              title="Telemedicine Session"
              className="h-[700px] w-full border-0"
              allow="camera; microphone; fullscreen; display-capture"
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TelemedicineSessionPage;