// frontend/src/pages/doctor/availability/AddAvailabilityPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Save, 
  Video,
  Users,
  AlertCircle,
  Coffee,
  Plus,
  Trash2,
  Info,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { 
  createAvailability, 
  calculateAvailabilityMetrics 
} from '../../../services/doctorService';

const weekDays = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const consultationTypes = [
  { value: 'telemedicine', label: 'Telemedicine', icon: Video, description: 'Video consultations only' },
  { value: 'in_person', label: 'In Person', icon: Users, description: 'Physical appointments only' },
  { value: 'both', label: 'Both', icon: Calendar, description: 'Both telemedicine and in-person' },
];

const AddAvailabilityPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [availabilityType, setAvailabilityType] = useState('weekly');
  const [calculating, setCalculating] = useState(false);
  const [metrics, setMetrics] = useState(null);
  
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    specificDate: '',
    startTime: '09:00',
    endTime: '17:00',
    consultationType: 'both',
    maxAppointments: 6,
    breakTimes: [],
  });

  const [breakErrors, setBreakErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const addBreakTime = () => {
    setFormData({
      ...formData,
      breakTimes: [...formData.breakTimes, { start: '13:00', end: '14:00' }]
    });
  };

  const removeBreakTime = (index) => {
    const newBreakTimes = formData.breakTimes.filter((_, i) => i !== index);
    setFormData({ ...formData, breakTimes: newBreakTimes });
    setBreakErrors({});
  };

  const updateBreakTime = (index, field, value) => {
    const newBreakTimes = [...formData.breakTimes];
    newBreakTimes[index][field] = value;
    setFormData({ ...formData, breakTimes: newBreakTimes });
    setBreakErrors({});
  };

  const calculateMetrics = async () => {
    if (!formData.startTime || !formData.endTime) return;
    
    // Parse times in 24-hour format
    const startParts = formData.startTime.split(':');
    const endParts = formData.endTime.split(':');
    const startHour = parseInt(startParts[0]);
    const startMinute = parseInt(startParts[1]);
    const endHour = parseInt(endParts[0]);
    const endMinute = parseInt(endParts[1]);
    
    // Calculate total minutes
    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    
    if (totalMinutes <= 0) {
      setMetrics(null);
      return;
    }
    
    setCalculating(true);
    try {
      const result = await calculateAvailabilityMetrics({
        startTime: formData.startTime,
        endTime: formData.endTime,
        breakTimes: formData.breakTimes
      });
      
      setMetrics(result);
      
      // Auto-set max appointments to calculated max if not set or if current is higher
      if (result.maxAppointments && (!formData.maxAppointments || formData.maxAppointments > result.maxAppointments)) {
        setFormData(prev => ({ ...prev, maxAppointments: result.maxAppointments }));
      }
      
      // Set break errors
      if (result.breakValidations) {
        const errors = {};
        result.breakValidations.forEach(validation => {
          if (!validation.isValid && validation.errors.length > 0) {
            errors[validation.index] = validation.errors;
          }
        });
        setBreakErrors(errors);
      }
    } catch (error) {
      console.error('Failed to calculate:', error);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.startTime && formData.endTime) {
        calculateMetrics();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [formData.startTime, formData.endTime, formData.breakTimes]);

  const validateForm = () => {
    if (availabilityType === 'weekly' && formData.dayOfWeek === undefined) {
      Swal.fire('Error', 'Please select a day of week', 'error');
      return false;
    }
    
    if (availabilityType === 'specific' && !formData.specificDate) {
      Swal.fire('Error', 'Please select a date', 'error');
      return false;
    }
    
    if (formData.startTime >= formData.endTime) {
      Swal.fire('Error', 'End time must be after start time', 'error');
      return false;
    }
    
    // Validate max appointments
    if (!formData.maxAppointments || formData.maxAppointments < 1) {
      Swal.fire('Error', 'Maximum appointments must be at least 1', 'error');
      return false;
    }
    
    if (metrics && formData.maxAppointments > metrics.maxAppointments) {
      Swal.fire('Error', `Maximum appointments cannot exceed ${metrics.maxAppointments} for this ${metrics.workingHours.toFixed(1)} hour working time (6 per hour)`, 'error');
      return false;
    }
    
    if (metrics && !metrics.isValid) {
      let errorMessage = 'Please fix the following issues:\n\n';
      if (metrics.breaksNeeded > 0) {
        errorMessage += `• ${metrics.breaksNeeded} more break(s) needed (1 break per 4 hours)\n`;
      }
      if (metrics.breakValidations) {
        metrics.breakValidations.forEach(v => {
          if (!v.isValid && v.errors) {
            v.errors.forEach(err => {
              errorMessage += `• ${err}\n`;
            });
          }
        });
      }
      Swal.fire('Validation Error', errorMessage, 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await Swal.fire({
      title: 'Create Availability?',
      html: `
        <div class="text-left">
          <p>Please confirm the following availability:</p>
          <div class="mt-3 p-3 bg-slate-50 rounded-lg">
            <p><strong>${availabilityType === 'weekly' ? weekDays.find(d => d.value === parseInt(formData.dayOfWeek))?.label : new Date(formData.specificDate).toLocaleDateString()}</strong></p>
            <p>Time: ${formData.startTime} - ${formData.endTime} (24h)</p>
            <p>Total Hours: ${metrics?.totalHours.toFixed(1)}h</p>
            <p>Working Time: ${metrics?.workingHours.toFixed(1)}h</p>
            <p><strong>Max Appointments: ${formData.maxAppointments} (Max allowed: ${metrics?.maxAppointments})</strong></p>
            <p>Appointments per hour: ${(formData.maxAppointments / (metrics?.workingHours || 1)).toFixed(1)} (Limit: 6 per hour)</p>
            ${formData.breakTimes.length > 0 ? `<p>Breaks: ${formData.breakTimes.map(bt => `${bt.start}-${bt.end}`).join(', ')}</p>` : '<p>No breaks</p>'}
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, create it!'
    });
    
    if (!result.isConfirmed) return;
    
    setSubmitting(true);
    
    try {
      const payload = {
        startTime: formData.startTime,
        endTime: formData.endTime,
        consultationType: formData.consultationType,
        maxAppointments: parseInt(formData.maxAppointments),
        breakTime: formData.breakTimes,
      };
      
      // Debug: Log availabilityType and form data
      console.log("=== AVAILABILITY SUBMISSION DEBUG ===");
      console.log("availabilityType:", availabilityType);
      console.log("formData.dayOfWeek:", formData.dayOfWeek, "type:", typeof formData.dayOfWeek);
      console.log("formData.specificDate:", formData.specificDate, "type:", typeof formData.specificDate);
      
      if (availabilityType === 'weekly') {
        payload.dayOfWeek = parseInt(formData.dayOfWeek);
        console.log("Added dayOfWeek to payload:", payload.dayOfWeek);
      } else if (availabilityType === 'specific') {
        payload.specificDate = formData.specificDate;
        console.log("Added specificDate to payload:", payload.specificDate);
      } else {
        console.error("Invalid availabilityType:", availabilityType);
      }
      
      console.log("Final payload:", JSON.stringify(payload, null, 2));
      console.log("=== END DEBUG ===");
      
      const response = await createAvailability(payload);
      
      await Swal.fire({
        title: 'Success!',
        html: `
          Availability created successfully!
          <div class="mt-3 p-3 bg-green-50 rounded-lg">
            <p>Working Time: ${response.metrics.workingHours} hours</p>
            <p>Max Appointments: ${response.availability.maxAppointments} (6 per hour max)</p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#3085d6'
      });
      
      navigate('/doctor/availability');
    } catch (error) {
      const errorData = error?.response?.data;
      const errorMessage = errorData?.message || 'Failed to create availability';
      const errorDetails = errorData?.received ? JSON.stringify(errorData.received, null, 2) : '';
      let fullMessage = errorMessage;
      
      if (errorDetails) {
        fullMessage += `\n\nDebug Info:\n${errorDetails}`;
      }
      
      console.error("Create availability error:", errorData);
      
      Swal.fire({
        title: 'Error!',
        html: `<pre style="text-align: left; white-space: pre-wrap;">${fullMessage}</pre>`,
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Add Availability">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create New Availability</h2>
              <p className="mt-1 text-sm text-slate-600">
                Set your working hours (24-hour format) - Maximum 6 appointments per hour of working time
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/doctor/availability')}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>

          {/* Availability Type */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <label className="mb-4 block text-sm font-semibold text-slate-700">
              Availability Type
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setAvailabilityType('weekly')}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  availabilityType === 'weekly'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-200'
                }`}
              >
                <Calendar className="mb-2 h-6 w-6 text-blue-600" />
                <h4 className="font-semibold text-slate-900">Weekly Recurring</h4>
                <p className="text-sm text-slate-500">Repeats every week on the same day</p>
              </button>
              
              <button
                type="button"
                onClick={() => setAvailabilityType('specific')}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  availabilityType === 'specific'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-200'
                }`}
              >
                <Calendar className="mb-2 h-6 w-6 text-green-600" />
                <h4 className="font-semibold text-slate-900">Specific Date</h4>
                <p className="text-sm text-slate-500">One-time availability for a specific date</p>
              </button>
            </div>
          </div>

          {/* Day/Date Selection */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {availabilityType === 'weekly' ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Day of Week
                </label>
                <select
                  name="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  {weekDays.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Date
                </label>
                <input
                  type="date"
                  name="specificDate"
                  value={formData.specificDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
            )}
          </div>

          {/* Time Range - 24-hour format */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">Working Hours (24-hour format)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Start Time (HH:MM)</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  step="60"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
                <p className="mt-1 text-xs text-slate-400">Use 24-hour format (e.g., 09:00, 14:30, 17:00)</p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">End Time (HH:MM)</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  step="60"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
                <p className="mt-1 text-xs text-slate-400">Use 24-hour format (e.g., 09:00, 14:30, 17:00)</p>
              </div>
            </div>
          </div>

          {/* Break Times with Validations */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-slate-500" />
                <label className="text-sm font-semibold text-slate-700">
                  Break Times
                </label>
              </div>
              <button
                type="button"
                onClick={addBreakTime}
                className="inline-flex items-center gap-1 rounded-lg text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Break
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.breakTimes.length === 0 ? (
                <p className="text-sm text-slate-500">No break times added. Click "Add Break" to add a break period.</p>
              ) : (
                formData.breakTimes.map((breakTime, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">Break {index + 1}</label>
                      <button
                        type="button"
                        onClick={() => removeBreakTime(index)}
                        className="rounded-lg p-1 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs text-slate-500">Start Time (HH:MM)</label>
                        <input
                          type="time"
                          value={breakTime.start}
                          onChange={(e) => updateBreakTime(index, 'start', e.target.value)}
                          step="60"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500">End Time (HH:MM)</label>
                        <input
                          type="time"
                          value={breakTime.end}
                          onChange={(e) => updateBreakTime(index, 'end', e.target.value)}
                          step="60"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    {breakErrors[index] && (
                      <div className="mt-2 space-y-1">
                        {breakErrors[index].map((error, i) => (
                          <p key={i} className="text-xs text-red-600 flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            {error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Break duration: <strong>Minimum 10 minutes, Maximum 1 hour</strong>. Required every 4 hours of total availability.
            </p>
          </div>

          {/* Consultation Type */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <label className="mb-4 block text-sm font-semibold text-slate-700">
              Consultation Type
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              {consultationTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.consultationType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, consultationType: type.value })}
                    className={`rounded-xl border-2 p-4 text-center transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-200'
                    }`}
                  >
                    <Icon className={`mx-auto mb-2 h-6 w-6 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <h4 className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                      {type.label}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Max Appointments Field */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <label className="text-sm font-semibold text-slate-700">
                Maximum Appointments
              </label>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  name="maxAppointments"
                  min="1"
                  max={metrics?.maxAppointments || 100}
                  value={formData.maxAppointments}
                  onChange={handleChange}
                  className="w-32 rounded-xl border border-slate-300 px-4 py-3 text-center text-lg font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Maximum allowed: {metrics?.maxAppointments || '?'}</span>
                  <span className="text-slate-400 mx-2">|</span>
                  <span className="text-green-600 font-medium">{metrics?.workingHours?.toFixed(1) || '0'} hours working time</span>
                </div>
              </div>
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Information:</strong> Maximum 6 appointments per hour of working time.
                  {metrics?.workingHours && metrics.workingHours > 0 && (
                    <span> For {metrics.workingHours.toFixed(1)} hours working time, you can set up to <strong className="text-blue-900">{metrics.maxAppointments}</strong> appointments.</span>
                  )}
                  {(!metrics || metrics.workingHours === 0) && (
                    <span> Set your working hours above to see the maximum allowed appointments.</span>
                  )}
                </p>
                {formData.maxAppointments && metrics?.workingHours && metrics.workingHours > 0 && (
                  <p className={`mt-1 text-xs ${(formData.maxAppointments / metrics.workingHours) <= 6 ? 'text-blue-700' : 'text-red-600'}`}>
                    Current rate: {(formData.maxAppointments / metrics.workingHours).toFixed(1)} appointments per hour
                    {(formData.maxAppointments / metrics.workingHours) > 6 && (
                      <span className="block mt-1 font-semibold">⚠️ Exceeds 6 per hour limit! Please reduce.</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Metrics Display */}
          {calculating && (
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <div className="inline-flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm text-slate-600">Calculating working hours...</span>
              </div>
            </div>
          )}

          {metrics && !calculating && (
            <div className={`rounded-2xl p-5 border ${metrics.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-3">
                {metrics.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold ${metrics.isValid ? 'text-green-800' : 'text-red-800'}`}>
                    Availability Summary
                  </h4>
                  <div className="mt-2 grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Hours:</span>
                      <span className="font-medium">{metrics.totalHours.toFixed(1)} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Break Time:</span>
                      <span className="font-medium text-amber-600">{metrics.breakHours.toFixed(1)} hours</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span className="font-semibold text-slate-700">Working Time:</span>
                      <span className="font-bold text-green-600">{metrics.workingHours.toFixed(1)} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Max Allowed Appointments:</span>
                      <span className="font-bold text-blue-600">{metrics.maxAppointments} (6 per hour)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Your Setting:</span>
                      <span className={`font-bold ${formData.maxAppointments <= metrics.maxAppointments ? 'text-green-600' : 'text-red-600'}`}>
                        {formData.maxAppointments} appointments
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Breaks Required:</span>
                      <span className={`font-medium ${metrics.currentBreaks >= metrics.requiredBreaks ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.requiredBreaks} (have {metrics.currentBreaks})
                      </span>
                    </div>
                    {metrics.breaksNeeded > 0 && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs">
                        ⚠️ {metrics.breaksNeeded} more break(s) needed (1 break per 4 hours)
                      </div>
                    )}
                    {formData.maxAppointments > metrics.maxAppointments && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs">
                        ⚠️ Exceeds maximum allowed appointments ({metrics.maxAppointments})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Rules Summary</h4>
                <p className="mt-1 text-sm text-blue-700">
                  • <strong>Maximum 6 appointments per hour</strong> of working time<br />
                  • Working time = Total time - Break time<br />
                  • <strong>Break required every 4 hours</strong> of total availability<br />
                  • Break duration: <strong>Minimum 10 min, Maximum 1 hour</strong><br />
                  • 8 hours = minimum 2 breaks required<br />
                  • <strong>Use 24-hour format</strong> (e.g., 09:00 for 9 AM, 14:00 for 2 PM, 17:30 for 5:30 PM)<br />
                  • You can set any appointment count up to the calculated maximum
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting || calculating || (metrics && !metrics.isValid) || (metrics && formData.maxAppointments > metrics.maxAppointments)}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="mr-2 inline h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 inline h-4 w-4" />
                  Create Availability
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddAvailabilityPage;