// frontend/src/pages/dashboard/DoctorDashboardPage.jsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  Activity,
  Video,
  FileText,
  Pill,
  DollarSign,
  Bell,
  TrendingUp
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import { APP_ROUTES } from '../../constants/routes';
import { getAppointmentsByDoctor } from '../../services/appointmentService';

const StatCard = ({ title, value, icon: Icon, color, trend, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
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

const AppointmentCard = ({ appointment, onAccept, onReject }) => {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-blue-100 text-blue-700',
    awaiting_payment: 'bg-purple-100 text-purple-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    rejected: 'bg-gray-100 text-gray-700',
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          
          <p className="mt-2 font-medium text-slate-900">Patient ID: {appointment.patientId}</p>
          <p className="text-sm text-slate-600">{appointment.reason}</p>
          
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(appointment.preferredDateTime)}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${appointment.consultationFee}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(appointment.status === 'pending' || appointment.status === 'rescheduled') && (
            <>
              <button
                onClick={() => onAccept(appointment._id)}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700"
              >
                Accept
              </button>
              <button
                onClick={() => onReject(appointment._id)}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Reject
              </button>
            </>
          )}
          
          {appointment.status === 'confirmed' && appointment.appointmentType === 'telemedicine' && (
            <button
              onClick={() => window.open(`/patient/telemedicine/${appointment.telemedicineSessionId}`, '_blank')}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Video className="mr-1 inline h-3 w-3" />
              Start Call
            </button>
          )}
          
          <Link
            to={`/doctor/appointments/${appointment._id}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            View Details
          </Link>
          <Link
            to={`/doctor/appointments/${appointment._id}`}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Consultant Notes
          </Link>
        </div>
      </div>
    </div>
  );
};

const UpcomingAppointmentsWidget = ({ appointments, onAccept, onReject }) => {
  const upcoming = appointments
    .filter(a => ['pending', 'accepted', 'confirmed'].includes(a.status))
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
      {upcoming.map((appointment) => (
        <div key={appointment._id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
          <div>
            <p className="text-sm font-medium text-slate-900">Patient: {appointment.patientId}</p>
            <p className="text-xs text-slate-500">
              {new Date(appointment.preferredDateTime).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            {appointment.status === 'pending' && (
              <button
                onClick={() => onAccept(appointment._id)}
                className="rounded-lg bg-green-600 px-2 py-1 text-xs text-white"
              >
                Accept
              </button>
            )}
            <Link
              to={`/doctor/appointments/${appointment._id}`}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
            >
              View
            </Link>
            <Link
              to={`/doctor/appointments/${appointment._id}`}
              className="rounded-lg bg-blue-600 px-2 py-1 text-xs text-white"
            >
              Notes
            </Link>
          </div>
        </div>
      ))}
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
      
      // Calculate stats
      const pending = apps.filter(a => a.status === 'pending' || a.status === 'rescheduled').length;
      const confirmed = apps.filter(a => a.status === 'confirmed').length;
      const completed = apps.filter(a => a.status === 'completed').length;
      const cancelled = apps.filter(a => a.status === 'cancelled').length;
      
      const earnings = apps
        .filter(a => a.status === 'completed' || a.status === 'confirmed')
        .reduce((sum, a) => sum + (a.consultationFee || 0), 0);
      
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

  const handleAccept = async (appointmentId) => {
    console.log('Accept appointment:', appointmentId);
    // Implement accept logic here
  };

  const handleReject = async (appointmentId) => {
    console.log('Reject appointment:', appointmentId);
    // Implement reject logic here
  };

  const quickActions = [
    {
      title: 'Today\'s Schedule',
      description: 'View and manage your appointments for today',
      icon: Calendar,
      link: APP_ROUTES.DOCTOR_APPOINTMENTS,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Consultation Notes',
      description: 'Create and manage patient consultation records',
      icon: FileText,
      link: APP_ROUTES.DOCTOR_APPOINTMENTS,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Write Prescription',
      description: 'Issue prescriptions for your patients',
      icon: Pill,
      link: '/doctor/prescriptions/create',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Manage Availability',
      description: 'Set your working hours and availability slots',
      icon: Clock,
      link: '/doctor/availability',
      color: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Patient List',
      description: 'View and manage your patient records',
      icon: Users,
      link: '/doctor/patients',
      color: 'bg-cyan-100 text-cyan-600',
    },
    {
      title: 'Telemedicine',
      description: 'Start video consultations with patients',
      icon: Video,
      link: '/doctor/telemedicine',
      color: 'bg-indigo-100 text-indigo-600',
    },
  ];

  const pendingRequests = appointments.filter(a => a.status === 'pending' || a.status === 'rescheduled');

  return (
    <DashboardLayout title="Doctor Dashboard">
      {/* Welcome Section */}
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, Dr. {user?.fullName?.split(' ').pop() || user?.fullName}!</h2>
            <p className="mt-2 text-blue-100">
              Manage your appointments, write prescriptions, and provide care to your patients.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 backdrop-blur">
            <Bell className="h-4 w-4" />
            <span className="text-sm font-medium">{pendingRequests.length} pending requests</span>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total Appointments"
          value={loading ? '...' : stats.totalAppointments}
          icon={Calendar}
          color="bg-blue-100 text-blue-600"
          trend={5}
        />
        <StatCard
          title="Pending Requests"
          value={loading ? '...' : stats.pendingAppointments}
          icon={Clock}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="Confirmed"
          value={loading ? '...' : stats.confirmedAppointments}
          icon={CheckCircle}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Completed"
          value={loading ? '...' : stats.completedAppointments}
          icon={Activity}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Total Earnings"
          value={loading ? '...' : `$${stats.totalEarnings}`}
          icon={DollarSign}
          color="bg-purple-100 text-purple-600"
          trend={12}
        />
      </div>

      {/* Main Grid Section - THIS IS THE FIXED PART */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Actions - 2/3 width on desktop */}
        <div className="lg:col-span-2">
          <h3 className="mb-4 text-xl font-bold text-slate-900">Quick Actions</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            {quickActions.map((action) => (
              <QuickActionCard key={action.title} {...action} />
            ))}
          </div>
        </div>

        {/* Upcoming Appointments Widget */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Upcoming</h3>
            <Link to={APP_ROUTES.DOCTOR_APPOINTMENTS} className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <UpcomingAppointmentsWidget 
              appointments={appointments} 
              onAccept={handleAccept}
              onReject={handleReject}
            />
          </div>

          {/* Today's Schedule Summary */}
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h4 className="mb-3 font-semibold text-slate-900">Today's Schedule</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Total appointments</span>
                <span className="font-medium text-slate-900">
                  {appointments.filter(a => {
                    const today = new Date().toDateString();
                    return new Date(a.preferredDateTime).toDateString() === today;
                  }).length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Completed</span>
                <span className="font-medium text-green-600">
                  {appointments.filter(a => {
                    const today = new Date().toDateString();
                    return new Date(a.preferredDateTime).toDateString() === today && a.status === 'completed';
                  }).length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Pending</span>
                <span className="font-medium text-amber-600">
                  {appointments.filter(a => {
                    const today = new Date().toDateString();
                    return new Date(a.preferredDateTime).toDateString() === today && a.status === 'pending';
                  }).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div> 

      {/* Recent Appointments Section */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Recent Appointments</h3>
          <Link to={APP_ROUTES.DOCTOR_APPOINTMENTS} className="text-sm text-blue-600 hover:underline">
            View all appointments →
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-slate-100 p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-3 text-slate-600">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl bg-slate-100 p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-3 text-lg font-semibold text-slate-900">No appointments yet</h3>
            <p className="mt-1 text-sm text-slate-600">
              When patients book appointments, they will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.slice(0, 5).map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-blue-100 p-3">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Pro Tips for Better Practice</h4>
            <p className="mt-1 text-sm text-slate-600">
              • Keep your availability updated to help patients book appointments easily<br />
              • Write detailed consultation notes for better patient records<br />
              • Use telemedicine for follow-up consultations when appropriate<br />
              • Respond to appointment requests promptly to improve patient satisfaction
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboardPage;