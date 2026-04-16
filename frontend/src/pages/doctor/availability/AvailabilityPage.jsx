// frontend/src/pages/doctor/availability/AvailabilityPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Plus, 
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Video,
  Users,
  Coffee,
  Trash2,
  Eye,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { getMyAvailability, deleteAvailability } from '../../../services/doctorService';

const weekDays = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const consultationTypeIcons = {
  telemedicine: { icon: Video, label: 'Telemedicine', color: 'text-purple-600', bg: 'bg-purple-100' },
  in_person: { icon: Users, label: 'In Person', color: 'text-green-600', bg: 'bg-green-100' },
  both: { icon: Calendar, label: 'Both', color: 'text-blue-600', bg: 'bg-blue-100' },
};

const AvailabilityPage = () => {
  const navigate = useNavigate();
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly');
  const [deletingId, setDeletingId] = useState(null);

  const loadAvailabilities = async () => {
    try {
      setLoading(true);
      const response = await getMyAvailability();
      setAvailabilities(response?.availability || []);
    } catch (error) {
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailabilities();
  }, []);

  const handleDelete = async (availability) => {
    if (availability.bookedCount > 0) {
      Swal.fire({
        title: 'Cannot Delete',
        html: `
          <div class="text-left">
            <p>This availability has <strong>${availability.bookedCount} booked appointment(s)</strong>.</p>
            <p class="mt-2">Please contact patients to reschedule before deleting this availability.</p>
          </div>
        `,
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return;
    }
    
    const result = await Swal.fire({
      title: 'Delete Availability?',
      html: `
        <div class="text-left">
          <p>Are you sure you want to delete this availability?</p>
          <div class="mt-3 p-3 bg-slate-50 rounded-lg">
            <p class="font-semibold">${availability.specificDate ? new Date(availability.specificDate).toLocaleDateString() : weekDays.find(d => d.value === availability.dayOfWeek)?.label}</p>
            <p class="text-sm">${availability.startTime} - ${availability.endTime}</p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        setDeletingId(availability._id);
        await deleteAvailability(availability._id);
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Availability has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        loadAvailabilities();
      } catch (error) {
        Swal.fire({
          title: 'Error!',
          text: error?.response?.data?.message || 'Failed to delete',
          icon: 'error',
          confirmButtonColor: '#3085d6'
        });
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleView = (availability) => {
    navigate(`/doctor/availability/${availability._id}`);
  };

  const formatTime = (time) => {
    if (!time) return '-';
    return time;
  };

  const weeklyList = availabilities.filter(a => a.dayOfWeek !== null && !a.specificDate);
  const specificList = availabilities.filter(a => a.specificDate);

  const AvailabilityCard = ({ availability, isSpecific = false }) => {
    const day = !isSpecific ? weekDays.find(d => d.value === availability.dayOfWeek) : null;
    const TypeIcon = consultationTypeIcons[availability.consultationType]?.icon || Calendar;
    const typeInfo = consultationTypeIcons[availability.consultationType] || consultationTypeIcons.both;
    const metrics = availability.metrics || {};
    
    const isFullyBooked = metrics.isFullyBooked || availability.bookedCount >= availability.maxAppointments;
    const bookedPercentage = metrics.bookedPercentage || 0;
    
    return (
      <div className={`group rounded-xl border p-5 transition-all hover:shadow-lg ${
        isFullyBooked ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-blue-200'
      }`}>
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl ${typeInfo.bg} p-2.5`}>
                <TypeIcon className={`h-5 w-5 ${typeInfo.color}`} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">
                  {isSpecific 
                    ? new Date(availability.specificDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : day?.label
                  }
                </h4>
                {isSpecific && (
                  <p className="text-xs text-slate-500">Specific Date</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleView(availability)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(availability)}
                disabled={deletingId === availability._id || availability.bookedCount > 0}
                className={`rounded-lg p-2 transition ${
                  availability.bookedCount > 0 
                    ? 'text-slate-300 cursor-not-allowed' 
                    : 'text-red-500 hover:bg-red-50'
                }`}
                title={availability.bookedCount > 0 ? `Has ${availability.bookedCount} booked appointments` : 'Delete'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-700">
                {formatTime(availability.startTime)} - {formatTime(availability.endTime)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.bg} ${typeInfo.color}`}>
                {typeInfo.label}
              </div>
            </div>
          </div>

          {/* Appointment Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Total Time</p>
              <p className="text-sm font-semibold text-slate-900">{metrics.totalHours || '-'}h</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Working Time</p>
              <p className="text-sm font-semibold text-green-600">{metrics.workingHours || '-'}h</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Max Apps</p>
              <p className="text-sm font-bold text-blue-600">{availability.maxAppointments} (6/h)</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Booked</p>
              <p className={`text-sm font-semibold ${isFullyBooked ? 'text-red-600' : 'text-amber-600'}`}>
                {availability.bookedCount || 0} / {availability.maxAppointments}
              </p>
            </div>
          </div>

          {/* Progress Bar for Booked Appointments */}
          {availability.maxAppointments > 0 && (
            <div className="mt-1">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Appointment Capacity</span>
                <span>{bookedPercentage}% filled</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    isFullyBooked ? 'bg-red-500' : bookedPercentage > 80 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, bookedPercentage)}%` }}
                />
              </div>
              {metrics.remainingAppointments > 0 && metrics.remainingAppointments <= 3 && (
                <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Only {metrics.remainingAppointments} slot(s) remaining!
                </p>
              )}
              {isFullyBooked && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Fully booked! No appointments available.
                </p>
              )}
            </div>
          )}

          {/* Break Times */}
          {availability.breakTime && availability.breakTime.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
              <Coffee className="h-3.5 w-3.5" />
              <span>Breaks: {availability.breakTime.map(bt => `${bt.start}-${bt.end}`).join(', ')}</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex justify-end">
            <div className={`text-xs px-2 py-1 rounded-full ${
              availability.isAvailable && !isFullyBooked 
                ? 'bg-green-100 text-green-700' 
                : !availability.isAvailable 
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
            }`}>
              {!availability.isAvailable 
                ? 'Inactive' 
                : isFullyBooked 
                  ? 'Fully Booked' 
                  : 'Active'
              }
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Manage Availability">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Working Hours & Availability</h2>
            <p className="mt-1 text-sm text-slate-600">
              Set your working hours. Maximum 6 appointments per hour of working time.
            </p>
          </div>
          <button
            onClick={() => navigate('/doctor/availability/new')}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Add Availability
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('weekly')}
              className={`pb-3 text-sm font-medium transition flex items-center gap-2 ${
                activeTab === 'weekly'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Weekly Schedule
              {weeklyList.length > 0 && (
                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                  {weeklyList.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('specific')}
              className={`pb-3 text-sm font-medium transition flex items-center gap-2 ${
                activeTab === 'specific'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Specific Dates
              {specificList.length > 0 && (
                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                  {specificList.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="rounded-2xl bg-slate-100 p-12 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-3 text-slate-600">Loading availability...</p>
          </div>
        ) : activeTab === 'weekly' ? (
          <>
            {weeklyList.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-12 text-center border border-slate-200">
                <Calendar className="mx-auto h-14 w-14 text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No weekly schedule set</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add your weekly recurring availability for regular working hours
                </p>
                <button
                  onClick={() => navigate('/doctor/availability/new')}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Weekly Availability
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {weeklyList.map((availability) => (
                  <AvailabilityCard key={availability._id} availability={availability} isSpecific={false} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {specificList.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-12 text-center border border-slate-200">
                <Calendar className="mx-auto h-14 w-14 text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No specific dates set</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add one-time availability for holidays or special days
                </p>
                <button
                  onClick={() => navigate('/doctor/availability/new')}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Specific Date
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {specificList.map((availability) => (
                  <AvailabilityCard key={availability._id} availability={availability} isSpecific={true} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Summary Stats */}
        {!loading && availabilities.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 p-5 border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="h-5 w-5 text-slate-600" />
              <h4 className="font-semibold text-slate-900">Summary</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{availabilities.length}</p>
                <p className="text-xs text-slate-500">Total Availability</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {availabilities.reduce((sum, a) => sum + (a.maxAppointments - (a.bookedCount || 0)), 0)}
                </p>
                <p className="text-xs text-slate-500">Available Appointments</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {availabilities.reduce((sum, a) => sum + (a.bookedCount || 0), 0)}
                </p>
                <p className="text-xs text-slate-500">Total Booked</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {availabilities.reduce((sum, a) => sum + a.maxAppointments, 0)}
                </p>
                <p className="text-xs text-slate-500">Total Capacity</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 p-5 border border-blue-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">About Availability</h4>
              <p className="mt-1 text-sm text-blue-700">
                • <strong>Maximum 6 appointments per hour</strong> of actual working time<br />
                • Working time = Total time - Break time<br />
                • <strong>Break required every 4 hours</strong> of total availability (min 10 min, max 1 hour)<br />
                • 8 hours = minimum 2 breaks required<br />
                • Specific dates override weekly schedule for that day<br />
                • <strong>Cannot delete availability with booked appointments</strong> - reschedule patients first
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AvailabilityPage;