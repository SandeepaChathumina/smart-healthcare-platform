import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Calendar, Heart, Activity, FilePlus, Eye, ClipboardList, Stethoscope, Pill } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import { APP_ROUTES } from '../../constants/routes';
import { getAllReports } from '../../services/patientService';
import { getAppointmentsByPatient } from '../../services/appointmentService';
import { getPrescriptionsByPatient } from '../../services/doctorService';

const StatCard = ({ title, value, icon: Icon, linkTo, color }) => {
  return (
    <Link to={linkTo}>
      <div className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        <div className={`inline-flex rounded-xl ${color} p-3`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-2xl font-bold text-slate-900">{value}</h3>
        <p className="text-sm text-slate-600">{title}</p>
      </div>
    </Link>
  );
};

const PatientDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReports: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalPrescriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [reportsResult, appointmentsResult, prescriptionsResult] = await Promise.allSettled([
          getAllReports(),
          getAppointmentsByPatient(user?.id),
          getPrescriptionsByPatient(user?.id, { limit: 100 }),
        ]);

        const reportsData =
          reportsResult.status === 'fulfilled' ? reportsResult.value : null;
        const appointmentsData =
          appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : null;
        const appointments = appointmentsData?.appointments || [];
        const prescriptionsData =
          prescriptionsResult.status === 'fulfilled' ? prescriptionsResult.value : null;
        
        setStats({
          totalReports: reportsData?.total || reportsData?.reports?.length || 0,
          totalAppointments: appointments.length,
          pendingAppointments: appointments.filter(a => a.status === 'pending').length,
          completedAppointments: appointments.filter(a => a.status === 'completed').length,
          totalPrescriptions: prescriptionsData?.prescriptions?.length || 0,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.id) {
      loadStats();
    }
  }, [user?.id]);

  const quickActions = [
    {
      title: 'Upload Report',
      description: 'Upload medical reports, prescriptions, or lab results',
      icon: Upload,
      link: APP_ROUTES.PATIENT_UPLOAD_REPORT,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'View Reports',
      description: 'Access all your uploaded medical documents',
      icon: Eye,
      link: APP_ROUTES.PATIENT_VIEW_REPORTS,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Medical History',
      description: 'Manage your health records and conditions',
      icon: Heart,
      link: APP_ROUTES.PATIENT_MEDICAL_HISTORY,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Consultation Notes',
      description: 'View notes added by your doctor',
      icon: ClipboardList,
      link: APP_ROUTES.PATIENT_APPOINTMENTS,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Book Appointment',
      description: 'Schedule a consultation with a doctor',
      icon: Calendar,
      link: APP_ROUTES.PATIENT_BOOK_APPOINTMENT,
      color: 'bg-cyan-100 text-cyan-600',
    },
    {
      title: 'My Appointments',
      description: 'View all your appointment history',
      icon: Stethoscope,
      link: APP_ROUTES.PATIENT_APPOINTMENTS,
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      title: 'Prescriptions',
      description: 'View your prescriptions with related appointment details',
      icon: Pill,
      link: APP_ROUTES.PATIENT_PRESCRIPTIONS,
      color: 'bg-rose-100 text-rose-600',
    },
  ];

  return (
    <DashboardLayout title="Patient Dashboard">
      {/* Welcome Section */}
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
        <h2 className="text-2xl font-bold">Welcome back, {user?.fullName}!</h2>
        <p className="mt-2 text-blue-100">
          Manage your health records, view appointments, and stay connected with your healthcare providers.
        </p>
      </div>

      {/* Stats Section */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Reports"
          value={loading ? '...' : stats.totalReports}
          icon={FileText}
          linkTo={APP_ROUTES.PATIENT_VIEW_REPORTS}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Total Appointments"
          value={loading ? '...' : stats.totalAppointments}
          icon={Calendar}
          linkTo={APP_ROUTES.PATIENT_APPOINTMENTS}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Pending Appointments"
          value={loading ? '...' : stats.pendingAppointments}
          icon={Activity}
          linkTo={APP_ROUTES.PATIENT_APPOINTMENTS}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="Completed"
          value={loading ? '...' : stats.completedAppointments}
          icon={FilePlus}
          linkTo={APP_ROUTES.PATIENT_APPOINTMENTS}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Prescriptions"
          value={loading ? '...' : stats.totalPrescriptions}
          icon={Pill}
          linkTo={APP_ROUTES.PATIENT_PRESCRIPTIONS}
          color="bg-rose-100 text-rose-600"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 text-xl font-bold text-slate-900">Quick Actions</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.link}
                className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`inline-flex rounded-xl ${action.color} p-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h4 className="mt-4 font-bold text-slate-900">{action.title}</h4>
                <p className="mt-1 text-sm text-slate-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboardPage;