import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Save,
  Edit,
  Trash2,
  Video,
  Users,
  Coffee,
  Plus,
  Info,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '../../../layouts/DashboardLayout';
import {
  getMyAvailability,
  updateAvailability,
  deleteAvailability,
  checkTimeAvailability,
  calculateAvailabilityMetrics,
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

function breaksFingerprint(breaks) {
  const list = [...(breaks || [])].sort(
    (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end)
  );
  return JSON.stringify(list);
}

/** Start/end/breaks match saved slot — overlap with other slots cannot change */
function isWorkingWindowUnchanged(slot, formData) {
  if (!slot) return false;
  return (
    formData.startTime === slot.startTime &&
    formData.endTime === slot.endTime &&
    breaksFingerprint(formData.breakTimes) === breaksFingerprint(slot.breakTime)
  );
}

const ViewAvailabilityPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [breakErrors, setBreakErrors] = useState({});

  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    consultationType: 'both',
    maxAppointments: 1,
    isAvailable: true,
    breakTimes: [],
  });

  const loadSlot = async () => {
    try {
      setLoading(true);
      const response = await getMyAvailability();
      const foundSlot = response?.availability?.find((s) => String(s._id) === String(id));

      if (!foundSlot) {
        Swal.fire('Error', 'Availability slot not found', 'error').then(() => {
          navigate('/doctor/availability');
        });
        return;
      }

      setSlot(foundSlot);
      setFormData({
        startTime: foundSlot.startTime,
        endTime: foundSlot.endTime,
        consultationType: foundSlot.consultationType,
        maxAppointments: foundSlot.maxAppointments,
        isAvailable: foundSlot.isAvailable,
        breakTimes: foundSlot.breakTime || [],
      });
    } catch {
      Swal.fire('Error', 'Failed to load availability slot', 'error').then(() => {
        navigate('/doctor/availability');
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadSlot();
  }, [id]);

  const calculateMetrics = async () => {
    if (!formData.startTime || !formData.endTime) return;

    const startParts = formData.startTime.split(':');
    const endParts = formData.endTime.split(':');
    const startHour = parseInt(startParts[0], 10);
    const startMinute = parseInt(startParts[1], 10);
    const endHour = parseInt(endParts[0], 10);
    const endMinute = parseInt(endParts[1], 10);
    const totalMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

    if (totalMinutes <= 0) {
      setMetrics(null);
      return;
    }

    setCalculating(true);
    try {
      const result = await calculateAvailabilityMetrics({
        startTime: formData.startTime,
        endTime: formData.endTime,
        breakTimes: formData.breakTimes,
      });

      setMetrics(result);

      if (
        result.maxAppointments &&
        (!formData.maxAppointments || formData.maxAppointments > result.maxAppointments)
      ) {
        setFormData((prev) => ({ ...prev, maxAppointments: result.maxAppointments }));
      }

      if (result.breakValidations) {
        const errors = {};
        result.breakValidations.forEach((validation) => {
          if (!validation.isValid && validation.errors.length > 0) {
            errors[validation.index] = validation.errors;
          }
        });
        setBreakErrors(errors);
      } else {
        setBreakErrors({});
      }
    } catch (e) {
      console.error('Failed to calculate:', e);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (!isEditing || !slot) return;
    const timer = setTimeout(() => {
      if (formData.startTime && formData.endTime) {
        calculateMetrics();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.startTime, formData.endTime, formData.breakTimes, isEditing, slot?._id]);

  useEffect(() => {
    if (!slot || isEditing) return;
    const loadViewMetrics = async () => {
      setCalculating(true);
      try {
        const result = await calculateAvailabilityMetrics({
          startTime: slot.startTime,
          endTime: slot.endTime,
          breakTimes: slot.breakTime || [],
        });
        setMetrics(result);
      } catch (e) {
        console.error('Failed to load metrics:', e);
      } finally {
        setCalculating(false);
      }
    };
    loadViewMetrics();
  }, [slot, isEditing]);

  const checkTimeConflict = async () => {
    // Weekly: dayOfWeek 0–6 (Sunday = 0). Must not treat 0 as falsy; use explicit weekly vs one-off.
    const isWeeklySlot =
      slot.dayOfWeek !== null &&
      slot.dayOfWeek !== undefined &&
      (slot.specificDate === null || slot.specificDate === undefined || slot.specificDate === '');

    const payload = {
      startTime: formData.startTime,
      endTime: formData.endTime,
      excludeId: id ? String(id).trim() : undefined,
    };

    if (isWeeklySlot) {
      payload.dayOfWeek = Number(slot.dayOfWeek);
    } else {
      payload.specificDate = slot.specificDate;
    }

    setValidating(true);
    try {
      const result = await checkTimeAvailability(payload);
      if (!result.available) {
        const failed = {
          available: false,
          message:
            result.message ||
            'This time overlaps another availability slot. Choose different hours.',
          conflict: result.conflict,
        };
        setValidationResult(failed);
        return { ok: false, ...failed };
      }
      const okResult = {
        available: true,
        message: result.message || 'Time slot is available',
      };
      setValidationResult(okResult);
      return { ok: true, ...okResult };
    } catch (error) {
      console.error('Conflict check failed:', error);
      return { ok: true };
    } finally {
      setValidating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setValidationResult(null);
  };

  const addBreakTime = () => {
    setFormData({
      ...formData,
      breakTimes: [...formData.breakTimes, { start: '13:00', end: '14:00' }],
    });
    setValidationResult(null);
  };

  const removeBreakTime = (index) => {
    const newBreakTimes = formData.breakTimes.filter((_, i) => i !== index);
    setFormData({ ...formData, breakTimes: newBreakTimes });
    setBreakErrors({});
    setValidationResult(null);
  };

  const updateBreakTime = (index, field, value) => {
    const newBreakTimes = [...formData.breakTimes];
    newBreakTimes[index][field] = value;
    setFormData({ ...formData, breakTimes: newBreakTimes });
    setBreakErrors({});
    setValidationResult(null);
  };

  const validateBeforeUpdate = () => {
    if (formData.startTime >= formData.endTime) {
      Swal.fire('Error', 'End time must be after start time', 'error');
      return false;
    }
    if (!formData.maxAppointments || formData.maxAppointments < 1) {
      Swal.fire('Error', 'Maximum appointments must be at least 1', 'error');
      return false;
    }
    if (metrics && formData.maxAppointments > metrics.maxAppointments) {
      Swal.fire(
        'Error',
        `Maximum appointments cannot exceed ${metrics.maxAppointments} for this ${metrics.workingHours.toFixed(1)} hour working time (6 per hour)`,
        'error'
      );
      return false;
    }
    if (metrics && !metrics.isValid) {
      let errorMessage = 'Please fix the following issues:\n\n';
      if (metrics.breaksNeeded > 0) {
        errorMessage += `• ${metrics.breaksNeeded} more break(s) needed (1 break per 4 hours)\n`;
      }
      if (metrics.breakValidations) {
        metrics.breakValidations.forEach((v) => {
          if (!v.isValid && v.errors) {
            v.errors.forEach((err) => {
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateBeforeUpdate()) return;

    for (let i = 0; i < formData.breakTimes.length; i++) {
      const bt = formData.breakTimes[i];
      if (bt.start >= bt.end) {
        Swal.fire('Validation Error', `Break ${i + 1}: End time must be after start time`, 'error');
        return;
      }
      if (bt.start < formData.startTime || bt.end > formData.endTime) {
        Swal.fire('Validation Error', `Break ${i + 1}: Break time must be within working hours`, 'error');
        return;
      }
    }

    // Only consult other slots when the time window changed (e.g. consultation type only)
    let conflictCheck;
    if (isWorkingWindowUnchanged(slot, formData)) {
      conflictCheck = { ok: true };
    } else {
      conflictCheck = await checkTimeConflict();
    }
    if (!conflictCheck.ok) {
      const msg = conflictCheck.message;
      const cf = conflictCheck.conflict;
      Swal.fire({
        title: 'Time Conflict',
        html: `
          <p>${msg}</p>
          ${
            cf
              ? `
            <div class="mt-3 p-3 bg-red-50 rounded-lg text-left">
              <p class="font-semibold">Conflicting slot</p>
              <p>Time: ${cf.startTime ?? '—'} – ${cf.endTime ?? '—'}</p>
              ${cf.day ? `<p class="text-sm text-slate-600 mt-1">${cf.day}</p>` : ''}
            </div>
          `
              : ''
          }
        `,
        icon: 'error',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    const dayLabel = slot.dayOfWeek !== null && !slot.specificDate
      ? weekDays.find((d) => d.value === slot.dayOfWeek)?.label
      : new Date(slot.specificDate).toLocaleDateString();

    const result = await Swal.fire({
      title: 'Update Availability?',
      html: `
        <div class="text-left">
          <p>Please confirm the following changes:</p>
          <div class="mt-3 p-3 bg-slate-50 rounded-lg">
            <p><strong>${dayLabel}</strong></p>
            <p>Time: ${formData.startTime} - ${formData.endTime} (24h)</p>
            <p>Max Appointments: ${formData.maxAppointments}${metrics ? ` (max allowed: ${metrics.maxAppointments})` : ''}</p>
            <p>Status: ${formData.isAvailable ? 'Active' : 'Inactive'}</p>
            ${formData.breakTimes.length > 0 ? `<p>Breaks: ${formData.breakTimes.map((bt) => `${bt.start}-${bt.end}`).join(', ')}</p>` : '<p>No breaks</p>'}
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update it!',
    });

    if (!result.isConfirmed) return;

    setSubmitting(true);
    try {
      const payload = {
        startTime: formData.startTime,
        endTime: formData.endTime,
        consultationType: formData.consultationType,
        maxAppointments: parseInt(formData.maxAppointments, 10),
        isAvailable: formData.isAvailable,
        breakTime: formData.breakTimes,
      };

      await updateAvailability(id, payload);

      await Swal.fire({
        title: 'Updated!',
        text: 'Availability has been updated successfully.',
        icon: 'success',
        confirmButtonColor: '#3085d6',
        timer: 2000,
        showConfirmButton: false,
      });

      setIsEditing(false);
      loadSlot();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to update availability';
      Swal.fire({
        title: 'Error!',
        html: `
          <p>${errorMessage}</p>
          ${
            error?.response?.data?.conflict
              ? `
            <div class="mt-3 p-3 bg-red-50 rounded-lg">
              <p class="font-semibold">Conflicts with:</p>
              <p>Time: ${error.response.data.conflict.startTime} - ${error.response.data.conflict.endTime}</p>
            </div>
          `
              : ''
          }
        `,
        icon: 'error',
        confirmButtonColor: '#3085d6',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Delete Availability Slot?',
      html: `
        <div class="text-left">
          <p>Are you sure you want to delete this availability slot?</p>
          <div class="mt-3 p-3 bg-red-50 rounded-lg">
            <p class="font-semibold">${
              slot?.specificDate
                ? new Date(slot.specificDate).toLocaleDateString()
                : weekDays.find((d) => d.value === slot?.dayOfWeek)?.label
            }</p>
            <p class="text-sm">${slot?.startTime} - ${slot?.endTime}</p>
            <p class="text-sm mt-1">Booked Appointments: ${slot?.bookedCount || 0}</p>
          </div>
          ${
            slot?.bookedCount > 0
              ? '<p class="mt-2 text-amber-600 text-sm">Warning: This slot has booked appointments. Deleting may affect patients.</p>'
              : ''
          }
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await deleteAvailability(id);
        await Swal.fire({
          title: 'Deleted!',
          text: 'Availability slot has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
        navigate('/doctor/availability');
      } catch (error) {
        Swal.fire({
          title: 'Error!',
          text: error?.response?.data?.message || 'Failed to delete availability',
          icon: 'error',
          confirmButtonColor: '#3085d6',
        });
      }
    }
  };

  const isWeekly = slot && slot.dayOfWeek !== null && !slot.specificDate;
  const availabilityType = isWeekly ? 'weekly' : 'specific';

  if (loading) {
    return (
      <DashboardLayout title="Availability">
        <div className="max-w-3xl mx-auto rounded-2xl bg-slate-100 p-12 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-slate-600">Loading availability…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!slot) return null;

  const dayTitle = isWeekly
    ? weekDays.find((d) => d.value === slot.dayOfWeek)?.label
    : new Date(slot.specificDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const renderAvailabilitySummary = () => {
    if (calculating || !metrics) return null;
    return (
      <div
        className={`rounded-2xl p-5 border ${
          metrics.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-start gap-3">
          {metrics.isValid ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold ${metrics.isValid ? 'text-green-800' : 'text-red-800'}`}>
              Availability Summary
            </h4>
            <div className="mt-2 grid gap-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">Total Hours:</span>
                <span className="font-medium">{metrics.totalHours.toFixed(1)} hours</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">Break Time:</span>
                <span className="font-medium text-amber-600">{metrics.breakHours.toFixed(1)} hours</span>
              </div>
              <div className="flex justify-between gap-2 pt-1 border-t">
                <span className="font-semibold text-slate-700">Working Time:</span>
                <span className="font-bold text-green-600">{metrics.workingHours.toFixed(1)} hours</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">Max Allowed Appointments:</span>
                <span className="font-bold text-blue-600">{metrics.maxAppointments} (6 per hour)</span>
              </div>
              {!isEditing && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-600">Booked / capacity:</span>
                  <span className="font-medium">
                    {slot.bookedCount || 0} / {slot.maxAppointments}
                  </span>
                </div>
              )}
              {isEditing && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-600">Your setting:</span>
                  <span
                    className={`font-bold ${
                      formData.maxAppointments <= metrics.maxAppointments ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formData.maxAppointments} appointments
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">Breaks required:</span>
                <span
                  className={`font-medium ${
                    metrics.currentBreaks >= metrics.requiredBreaks ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {metrics.requiredBreaks} (have {metrics.currentBreaks})
                </span>
              </div>
              {metrics.breaksNeeded > 0 && (
                <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs">
                  {metrics.breaksNeeded} more break(s) needed (1 break per 4 hours)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title={isEditing ? 'Edit Availability' : 'View Availability'}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header — matches Add */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEditing ? 'Edit availability' : dayTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {isEditing
                ? 'Update working hours (24-hour format) — maximum 6 appointments per hour of working time'
                : 'Review this slot. Use Edit to change times, breaks, or capacity.'}
            </p>
            {!isEditing && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    slot.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {slot.isAvailable ? 'Active' : 'Inactive'}
                </span>
                {(slot.bookedCount || 0) > 0 && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    {slot.bookedCount} / {slot.maxAppointments} booked
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                  loadSlot();
                } else {
                  navigate('/doctor/availability');
                }
              }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {isEditing ? 'Cancel' : 'Back'}
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            if (!isEditing) {
              e.preventDefault();
              return;
            }
            handleUpdate(e);
          }}
          className="space-y-6"
        >
          {/* Availability type — read-only, same cards as Add */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <label className="mb-4 block text-sm font-semibold text-slate-700">Availability Type</label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className={`rounded-xl border-2 p-4 text-left ${
                  availabilityType === 'weekly' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 opacity-60'
                }`}
              >
                <Calendar className="mb-2 h-6 w-6 text-blue-600" />
                <h4 className="font-semibold text-slate-900">Weekly Recurring</h4>
                <p className="text-sm text-slate-500">Repeats every week on the same day</p>
              </div>
              <div
                className={`rounded-xl border-2 p-4 text-left ${
                  availabilityType === 'specific' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 opacity-60'
                }`}
              >
                <Calendar className="mb-2 h-6 w-6 text-green-600" />
                <h4 className="font-semibold text-slate-900">Specific Date</h4>
                <p className="text-sm text-slate-500">One-time availability for a specific date</p>
              </div>
            </div>
          </div>

          {/* Day / date */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {isWeekly ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Day of week</label>
                <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                  {weekDays.find((d) => d.value === slot.dayOfWeek)?.label}
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Date</label>
                <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                  {new Date(slot.specificDate).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {/* Working hours */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">Working Hours (24-hour format)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Start Time (HH:MM)</label>
                {isEditing ? (
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    step="60"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                ) : (
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-lg text-slate-900">
                    {slot.startTime}
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-400">24-hour format (e.g., 09:00, 14:30)</p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">End Time (HH:MM)</label>
                {isEditing ? (
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    step="60"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                ) : (
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-lg text-slate-900">
                    {slot.endTime}
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-400">24-hour format (e.g., 09:00, 14:30)</p>
              </div>
            </div>
          </div>

          {/* Breaks — match Add */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-slate-500" />
                <label className="text-sm font-semibold text-slate-700">Break Times</label>
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={addBreakTime}
                  className="inline-flex items-center gap-1 rounded-lg text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Break
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                {formData.breakTimes.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No break times added. Click &quot;Add Break&quot; to add a break period.
                  </p>
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
                          {breakErrors[index].map((err, i) => (
                            <p key={i} className="text-xs text-red-600 flex items-center gap-1">
                              <XCircle className="h-3 w-3 shrink-0" />
                              {err}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {!slot.breakTime || slot.breakTime.length === 0 ? (
                  <p className="text-sm text-slate-500">No break times scheduled.</p>
                ) : (
                  slot.breakTime.map((bt, index) => (
                    <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                      Break {index + 1}: {bt.start} – {bt.end}
                    </div>
                  ))
                )}
              </div>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Break duration: <strong>Minimum 10 minutes, Maximum 1 hour</strong>. Required every 4 hours of total
              availability.
            </p>
          </div>

          {/* Consultation type — match Add */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <label className="mb-4 block text-sm font-semibold text-slate-700">Consultation Type</label>
            <div className="grid gap-4 sm:grid-cols-3">
              {consultationTypes.map((type) => {
                const Icon = type.icon;
                const current = isEditing ? formData.consultationType : slot.consultationType;
                const isSelected = current === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    disabled={!isEditing}
                    onClick={() => isEditing && setFormData({ ...formData, consultationType: type.value })}
                    className={`rounded-xl border-2 p-4 text-center transition ${
                      isSelected ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
                    } ${!isEditing ? 'cursor-default' : 'hover:border-blue-200'}`}
                  >
                    <Icon className={`mx-auto mb-2 h-6 w-6 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <h4 className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{type.label}</h4>
                    <p className="mt-1 text-xs text-slate-500">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Max appointments — match Add */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <label className="text-sm font-semibold text-slate-700">Maximum Appointments</label>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-4">
                {isEditing ? (
                  <input
                    type="number"
                    name="maxAppointments"
                    min="1"
                    max={metrics?.maxAppointments || 100}
                    value={formData.maxAppointments}
                    onChange={handleChange}
                    className="w-32 rounded-xl border border-slate-300 px-4 py-3 text-center text-lg font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                ) : (
                  <div className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-lg font-semibold text-slate-900">
                    {slot.maxAppointments}
                  </div>
                )}
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Maximum allowed: {metrics?.maxAppointments ?? '—'}</span>
                  <span className="text-slate-400 mx-2">|</span>
                  <span className="text-green-600 font-medium">
                    {metrics?.workingHours != null ? `${metrics.workingHours.toFixed(1)} hours working time` : '—'}
                  </span>
                </div>
              </div>
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Information:</strong> Maximum 6 appointments per hour of working time.
                  {metrics?.workingHours != null && metrics.workingHours > 0 && (
                    <span>
                      {' '}
                      For {metrics.workingHours.toFixed(1)} hours working time, you can set up to{' '}
                      <strong className="text-blue-900">{metrics.maxAppointments}</strong> appointments.
                    </span>
                  )}
                </p>
                {isEditing && formData.maxAppointments && metrics?.workingHours > 0 && (
                  <p
                    className={`mt-1 text-xs ${
                      formData.maxAppointments / metrics.workingHours <= 6 ? 'text-blue-700' : 'text-red-600'
                    }`}
                  >
                    Current rate: {(formData.maxAppointments / metrics.workingHours).toFixed(1)} appointments per hour
                    {formData.maxAppointments / metrics.workingHours > 6 && (
                      <span className="block mt-1 font-semibold">Exceeds 6 per hour limit — reduce max appointments.</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status — edit only (not on Add, but belongs here) */}
          {isEditing && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <label className="flex items-center justify-between cursor-pointer gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Slot status</h3>
                  <p className="text-xs text-slate-500">Enable or disable this availability slot</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="relative h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-green-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
                </div>
              </label>
            </div>
          )}

          {calculating && (
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <div className="inline-flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span className="text-sm text-slate-600">Calculating working hours…</span>
              </div>
            </div>
          )}

          {!calculating && renderAvailabilitySummary()}

          {isEditing && validating && (
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <div className="inline-flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span className="text-sm text-slate-600">Checking schedule…</span>
              </div>
            </div>
          )}

          {isEditing && validationResult && !validating && (
            <div
              className={`rounded-2xl p-4 border ${
                validationResult.available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {validationResult.available ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      validationResult.available ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {validationResult.message}
                  </p>
                  {validationResult.conflict && (
                    <p className="mt-1 text-xs text-red-600">
                      Conflicting slot: {validationResult.conflict.startTime} – {validationResult.conflict.endTime}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900">Rules Summary</h4>
                <p className="mt-1 text-sm text-blue-700">
                  • <strong>Maximum 6 appointments per hour</strong> of working time
                  <br />
                  • Working time = Total time − Break time
                  <br />• <strong>Break required every 4 hours</strong> of total availability
                  <br />
                  • Break duration: <strong>Minimum 10 min, Maximum 1 hour</strong>
                  <br />
                  • <strong>Use 24-hour format</strong> (e.g., 09:00, 14:00, 17:30)
                  <br />• {isWeekly ? 'This schedule repeats weekly on the chosen day.' : 'This is a one-off date slot.'}
                </p>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={
                  submitting ||
                  validating ||
                  calculating ||
                  (metrics && !metrics.isValid) ||
                  (metrics && formData.maxAppointments > metrics.maxAppointments)
                }
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent align-middle" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 inline h-4 w-4 align-middle" />
                    Save changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ViewAvailabilityPage;
