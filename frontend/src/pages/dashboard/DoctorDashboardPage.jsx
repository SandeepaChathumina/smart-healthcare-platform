import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle,
  Activity,
  Video,
  FileText,
  Pill,
  DollarSign,
  Bell,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import { APP_ROUTES } from '../../constants/routes';
import { getAppointmentsByDoctor } from '../../services/appointmentService';

const formatLkr = (value) => `LKR ${Number(value || 0).toLocaleString('en-LK')}`;

const formatDateTime = (value) => {
  if (!value) return "Not scheduled yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-GB", {
    timeZone: "Asia/Colombo",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const StatCard = ({ title, value, icon: Icon, color, trend, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
          {trend !== undefined && (
            <p className={`mt-2 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className={`rounded-xl ${color} p-3 transition-all duration-200 group-hover:scale-110`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

const QuickActionCard = ({ title, description, icon: Icon, link, color }) => {
  return (
    <Link
      to={link}
      className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className={`inline-flex rounded-xl ${color} p-3 transition-all duration-200 group-hover:scale-110`}>
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="mt-4 font-bold text-slate-900">{title}</h4>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </Link>
  );
};

const AppointmentCard = ({ appointment }) => {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-blue-100 text-blue-700',
    awaiting_payment: 'bg-purple-100 text-purple-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    rejected: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[appointment.status] || 'bg-gray-100 text-gray-700'}`}>
              {appointment.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-xs text-slate-500">
              {appointment.appointmentType === 'telemedicine' ? '🖥️ Telemedicine' : '🏥 In Person'}
            </span>
          </div>

          <p className="mt-2 font-medium text-slate-900">Patient: {appointment.patientName || 'Patient'}</p>
          <p className="text-sm text-slate-600">{appointment.reason}</p>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateTime(appointment.scheduledDateTime || appointment.preferredDateTime)}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatLkr(appointment.consultationFee)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/doctor/appointments/${appointment._id}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

const UpcomingAppointmentsWidget = ({ appointments }) => {
  const upcoming = appointments
    .filter((a) =>
      ["pending", "accepted", "awaiting_payment", "confirmed"].includes(a.status)
    )
    .slice(0, 3);

  if (upcoming.length === 0) {
    return (
      <div className="rounded-xl bg-slate-50 p-6 text-center">
        <Calendar className="mx-auto h-8 w-8 text-slate-400" />
        <p className="mt-2 text-sm text-slate-500">No upcoming appointments</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {upcoming.map((appointment) => {
        const patientDisplayName =
          appointment.patientName?.trim() ||
          appointment.patient?.fullName?.trim() ||
          appointment.patient?.name?.trim() ||
          "Patient";

        return (
          <div
            key={appointment._id}
            className="flex items-center justify-between rounded-lg bg-slate-50 p-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                Patient: {patientDisplayName}
              </p>
              <p className="text-xs text-slate-500">
                {formatDateTime(
                  appointment.scheduledDateTime || appointment.preferredDateTime
                )}
              </p>
            </div>

            <Link
              to={`/doctor/appointments/${appointment._id}`}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
            >
              View
            </Link>
          </div>
        );
      })}
    </div>
  );
};

const DoctorDashboardPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalEarnings: 0,
  });

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await getAppointmentsByDoctor(user?.id);
      const apps = data?.appointments || [];
      setAppointments(apps);

      const pending = apps.filter((a) => a.status === 'pending' || a.status === 'rescheduled' || a.status === 'awaiting_payment').length;
      const confirmed = apps.filter((a) => a.status === 'confirmed').length;
      const completed = apps.filter((a) => a.status === 'completed').length;
      const cancelled = apps.filter((a) => a.status === 'cancelled').length;

      const earnings = apps
        .filter((a) => a.paymentStatus === 'paid')
        .reduce((sum, a) => sum + Number(a.consultationFee || 0), 0);

      setStats({
        totalAppointments: apps.length,
        pendingAppointments: pending,
        confirmedAppointments: confirmed,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        totalEarnings: earnings,
      });
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadAppointments();
    }
  }, [user?.id]);

  const quickActions = [
    {
      title: "Today's Schedule",
      description: 'View and manage your appointments for today',
      icon: Calendar,
      link: APP_ROUTES.DOCTOR_APPOINTMENTS,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Consultation Notes',
      description: 'Create and manage patient consultation records',
      icon: FileText,
      link: APP_ROUTES.DOCTOR_CONSULTATION_NOTES,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Write Prescription',
      description: 'View all written prescriptions and issue new ones',
      icon: Pill,
      link: APP_ROUTES.DOCTOR_PRESCRIPTIONS,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Manage Availability',
      description: 'Update available days and consultation hours',
      icon: Clock,
      link: APP_ROUTES.DOCTOR_AVAILABILITY,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Telemedicine Sessions',
      description: 'Join and manage video consultations',
      icon: Video,
      link: APP_ROUTES.DOCTOR_APPOINTMENTS,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Consultation Notes',
      description: 'Add notes and prescriptions after appointments',
      icon: FileText,
      link: APP_ROUTES.DOCTOR_CONSULTATION_NOTES,
      color: 'bg-emerald-100 text-emerald-600',
    },
  ];

  const todaysStats = useMemo(() => {
    const today = new Date();
    return appointments.reduce(
      (acc, appointment) => {
        const date = new Date(appointment.scheduledDateTime || appointment.preferredDateTime);
        if (
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate()
        ) {
          acc.total += 1;
          if (appointment.status === 'completed') acc.completed += 1;
          if (appointment.status === 'pending' || appointment.status === 'awaiting_payment') acc.pending += 1;
        }
        return acc;
      },
      { total: 0, completed: 0, pending: 0 }
    );
  }, [appointments]);

  return (
    <DashboardLayout title="Doctor Dashboard">
      <div className="space-y-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold">Welcome back, Dr. {user?.fullName?.split(' ').slice(-1)[0] || 'Doctor'}!</h1>
              <p className="mt-3 text-lg text-blue-100">
                Manage your appointments, write prescriptions, and provide care to your patients.
              </p>
            </div>
            <div className="rounded-2xl bg-white/20 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6" />
                <div>
                  <p className="font-semibold">{stats.pendingAppointments} pending requests</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Total Appointments" value={stats.totalAppointments} icon={Calendar} color="bg-blue-100 text-blue-600" trend={5} onClick={() => {}} />
          <StatCard title="Pending Requests" value={stats.pendingAppointments} icon={Clock} color="bg-amber-100 text-amber-600" onClick={() => {}} />
          <StatCard title="Confirmed" value={stats.confirmedAppointments} icon={CheckCircle} color="bg-green-100 text-green-600" onClick={() => {}} />
          <StatCard title="Completed" value={stats.completedAppointments} icon={Activity} color="bg-emerald-100 text-emerald-600" onClick={() => {}} />
          <StatCard title="Total Earnings" value={formatLkr(stats.totalEarnings)} icon={DollarSign} color="bg-purple-100 text-purple-600" trend={12} onClick={() => {}} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Recent Appointments</h2>
              <Link to={APP_ROUTES.DOCTOR_APPOINTMENTS} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                View all appointments →
              </Link>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm ring-1 ring-slate-200">No appointments yet.</div>
            ) : (
              <div className="space-y-4">
                {appointments.slice(0, 5).map((appointment) => (
                  <AppointmentCard key={appointment._id} appointment={appointment} />
                ))}
              </div>
            )}

            <div className="mt-8 rounded-3xl bg-blue-50 p-8 ring-1 ring-blue-100">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-blue-100 p-4">
                  <Pill className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Pro Tips for Better Practice</h3>
                  <ul className="mt-4 space-y-2 text-slate-600">
                    <li>• Keep your availability updated to help patients book appointments easily</li>
                    <li>• Write detailed consultation notes for better patient records</li>
                    <li>• Use telemedicine for follow-up consultations when appropriate</li>
                    <li>• Respond to appointment requests promptly to improve patient satisfaction</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {quickActions.map((action) => (
                  <QuickActionCard key={action.title} {...action} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">Upcoming</h3>
                <Link to={APP_ROUTES.DOCTOR_APPOINTMENTS} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                  View all
                </Link>
              </div>
              <UpcomingAppointmentsWidget appointments={appointments} />
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-2xl font-bold text-slate-900">Today's Schedule</h3>
              <div className="mt-6 space-y-4 text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Total appointments</span>
                  <span className="text-xl font-bold text-slate-900">{todaysStats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Completed</span>
                  <span className="text-xl font-bold text-green-600">{todaysStats.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pending</span>
                  <span className="text-xl font-bold text-amber-600">{todaysStats.pending}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboardPage;
