import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  AlertCircle,
  Loader,
  CheckCircle,
  Video,
  MapPin,
  Users,
  ChevronRight,
  Search,
  Filter,
  X,
  Stethoscope,
  ArrowLeft,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { createAppointment } from '../../services/appointmentService';
import { getAllAvailabilitySlots, getAvailableSlotsByDoctor } from '../../services/doctorService';
import DashboardLayout from '../../layouts/DashboardLayout';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TYPE_LABEL = { telemedicine: 'Telemedicine', in_person: 'In-Person', both: 'Both' };
const TYPE_COLOR = {
  telemedicine: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
  in_person:    { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   dot: 'bg-teal-500'   },
  both:         { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
};

function slotDayLabel(slot) {
  if (slot.specificDate) {
    const d = new Date(slot.specificDate);
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (slot.dayOfWeek !== null && slot.dayOfWeek !== undefined) {
    return `Every ${WEEKDAY[slot.dayOfWeek]}`;
  }
  return '—';
}

function remainingLabel(slot) {
  const rem = slot.remainingCapacity ?? (slot.maxAppointments - slot.bookedCount);
  return rem;
}

/* ─── sub-components ──────────────────────────────────────────────────────── */

function SlotCard({ slot, selected, onSelect }) {
  const rem   = remainingLabel(slot);
  const tc    = TYPE_COLOR[slot.consultationType] || TYPE_COLOR.both;
  const isFull = rem <= 0;

  return (
    <button
      type="button"
      disabled={isFull}
      onClick={() => onSelect(slot)}
      className={`
        group relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-200
        ${isFull ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' :
          selected
            ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
            : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md hover:shadow-slate-100 cursor-pointer'}
      `}
    >
      {selected && (
        <span className="absolute top-3 right-3">
          <CheckCircle size={18} className="text-blue-500" />
        </span>
      )}

      {/* type badge */}
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border mb-3 ${tc.bg} ${tc.text} ${tc.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
        {TYPE_LABEL[slot.consultationType] ?? slot.consultationType}
      </span>

      {/* time */}
      <div className="flex items-center gap-2 text-slate-800 font-semibold text-base">
        <Clock size={14} className="text-slate-400 flex-shrink-0" />
        {slot.startTime} – {slot.endTime}
      </div>

      {/* day */}
      <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-500">
        <Calendar size={13} className="text-slate-400 flex-shrink-0" />
        {slotDayLabel(slot)}
      </div>

      {/* capacity */}
      <div className={`flex items-center gap-2 mt-3 text-xs font-medium ${isFull ? 'text-red-500' : 'text-slate-500'}`}>
        <Users size={12} className="flex-shrink-0" />
        {isFull ? 'Fully booked' : `${rem} slot${rem !== 1 ? 's' : ''} remaining`}
      </div>

      {/* capacity bar */}
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : 'bg-blue-400'}`}
          style={{ width: `${Math.min(100, ((slot.bookedCount ?? 0) / (slot.maxAppointments || 1)) * 100)}%` }}
        />
      </div>

      {/* doctor id mini-label */}
      <div className="mt-3 text-[10px] text-slate-400 truncate">
        Doctor ID: {slot.doctorId}
      </div>
    </button>
  );
}

/* ─── main page ───────────────────────────────────────────────────────────── */

const STEPS = { BROWSE: 'browse', BOOK: 'book' };

const BookAppointmentPage = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  /* ── browse state ─────────────────────────────────────────────── */
  const [allSlots,      setAllSlots]      = useState([]);
  const [browsing,      setBrowsing]      = useState(true);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError,   setBrowseError]   = useState('');

  const [filterType, setFilterType] = useState('all');   // all | telemedicine | in_person | both
  const [filterDay,  setFilterDay]  = useState('all');   // all | 0-6
  const [searchDate, setSearchDate] = useState('');

  const [step,         setStep]         = useState(STEPS.BROWSE);
  const [selectedSlot, setSelectedSlot] = useState(null);

  /* ── booking-form state ───────────────────────────────────────── */
  const [doctorSlots,  setDoctorSlots]  = useState([]);
  const [slotLoading,  setSlotLoading]  = useState(false);

  const [formData, setFormData] = useState({
    appointmentType:  'telemedicine',
    reason:           '',
    symptomsSummary:  '',
    consultationFee:  '',
    patientNotes:     '',
    availabilityDate: '',
    availabilityId:   '',
    doctorId:         '',
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  /* ── fetch ALL slots on mount ─────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      setBrowseLoading(true);
      setBrowseError('');
      try {
        const data = await getAllAvailabilitySlots();
        // Compute remainingCapacity if not present
        const withCapacity = (data.availability || []).map(s => ({
          ...s,
          remainingCapacity: s.remainingCapacity ?? (s.maxAppointments - s.bookedCount),
        }));
        setAllSlots(withCapacity);
      } catch (err) {
        setBrowseError(err?.response?.data?.message || 'Failed to load availability slots');
      } finally {
        setBrowseLoading(false);
      }
    };
    load();
  }, []);

  /* ── re-fetch doctor slots when a slot is selected ───────────── */
  useEffect(() => {
    if (!selectedSlot) return;
    const load = async () => {
      setSlotLoading(true);
      try {
        const data = await getAvailableSlotsByDoctor(selectedSlot.doctorId, {
          consultationType: formData.appointmentType,
          date: formData.availabilityDate || undefined,
        });
        setDoctorSlots(data.slots || []);
      } catch {
        setDoctorSlots([selectedSlot]); // fallback: at least show the chosen slot
      } finally {
        setSlotLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot, formData.appointmentType, formData.availabilityDate]);

  /* ── filtering logic ──────────────────────────────────────────── */
  const filteredSlots = allSlots.filter(slot => {
    if (filterType !== 'all' && slot.consultationType !== filterType && slot.consultationType !== 'both') return false;

    if (searchDate) {
      const d = new Date(searchDate);
      const dow = d.getDay();
      const matchWeekly  = slot.dayOfWeek === dow && !slot.specificDate;
      const matchSpecific = slot.specificDate && new Date(slot.specificDate).toDateString() === d.toDateString();
      if (!matchWeekly && !matchSpecific) return false;
    } else if (filterDay !== 'all') {
      const dow = parseInt(filterDay, 10);
      if (slot.dayOfWeek !== dow) return false;
    }

    return true;
  });

  /* ── handlers ─────────────────────────────────────────────────── */
  const handleSelectSlotCard = useCallback((slot) => {
    setSelectedSlot(slot);
    setFormData(prev => ({
      ...prev,
      doctorId:        String(slot.doctorId),
      appointmentType: slot.consultationType === 'in_person' ? 'physical'
                     : slot.consultationType === 'both'      ? 'telemedicine'
                     : slot.consultationType,
      availabilityId:  String(slot._id),
    }));
    setStep(STEPS.BOOK);
    setError('');
  }, []);

  const handlePickSlot = useCallback((slot) => {
    setFormData(prev => ({ ...prev, availabilityId: String(slot._id) }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'appointmentType' || name === 'availabilityDate') {
      setFormData(prev => ({ ...prev, [name]: value, availabilityId: '' }));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.availabilityId) {
      setError('Please select an available time slot above');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        doctorId:          formData.doctorId,
        appointmentType:   formData.appointmentType === 'physical' ? 'in_person' : formData.appointmentType,
        reason:            formData.reason,
        symptomsSummary:   formData.symptomsSummary,
        preferredDateTime: formData.availabilityDate
          ? new Date(formData.availabilityDate).toISOString()
          : new Date().toISOString(),
        consultationFee:   Number(formData.consultationFee),
        patientNotes:      formData.patientNotes,
        availabilityId:    formData.availabilityId,
      };

      const data = await createAppointment(payload);
      setSuccess('Appointment created successfully! Redirecting…');
      setTimeout(() => {
        const id = data?.appointment?._id || data?.appointment?.id;
        navigate(id ? `/patient/appointments/${id}` : '/patient/appointments');
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  /* ── slots shown in booking form (doctor-specific) ────────────── */
  const bookingSlots = doctorSlots.length > 0 ? doctorSlots : (selectedSlot ? [selectedSlot] : []);

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <DashboardLayout title="Book Appointment">
      <div className="space-y-6">

        {/* ── step indicator ───────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <StepBadge n={1} label="Browse Availability" active={step === STEPS.BROWSE} done={step === STEPS.BOOK} />
          <ChevronRight size={16} className="text-slate-300" />
          <StepBadge n={2} label="Confirm Booking"    active={step === STEPS.BOOK}   done={false} />
        </div>

        {/* ══════════════════════════════════════════════════════
            STEP 1 — BROWSE
        ══════════════════════════════════════════════════════ */}
        {step === STEPS.BROWSE && (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            {/* header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Stethoscope size={20} className="text-blue-500" />
                  All Available Slots
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Choose an open slot from any doctor — filtered to those with remaining capacity.
                </p>
              </div>
              <span className="text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-3 py-1">
                {filteredSlots.length} slot{filteredSlots.length !== 1 ? 's' : ''} found
              </span>
            </div>

            {/* ── filter bar ──────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">

              {/* date search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={searchDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => { setSearchDate(e.target.value); setFilterDay('all'); }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
              </div>

              {/* type filter */}
              <div className="relative">
                <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none"
                >
                  <option value="all">All Types</option>
                  <option value="telemedicine">Telemedicine</option>
                  <option value="in_person">In-Person</option>
                </select>
              </div>

              {/* day filter (only when no date is typed) */}
              {!searchDate && (
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={filterDay}
                    onChange={e => setFilterDay(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none"
                  >
                    <option value="all">Any Day</option>
                    {WEEKDAY.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              )}

              {/* clear */}
              {(searchDate || filterType !== 'all' || filterDay !== 'all') && (
                <button
                  type="button"
                  onClick={() => { setSearchDate(''); setFilterType('all'); setFilterDay('all'); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:text-red-500 hover:border-red-200 bg-white transition-colors"
                >
                  <X size={13} /> Clear
                </button>
              )}
            </div>

            {/* ── slot grid ───────────────────────────────────── */}
            {browseLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader className="animate-spin mb-3" size={28} />
                <p className="text-sm">Loading available slots…</p>
              </div>
            ) : browseError ? (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{browseError}</p>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Calendar size={36} className="mb-3 text-slate-300" />
                <p className="text-sm font-medium">No slots match your filters</p>
                <p className="text-xs mt-1">Try adjusting the day or consultation type</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSlots.map(slot => (
                  <SlotCard
                    key={slot._id}
                    slot={slot}
                    selected={false}
                    onSelect={handleSelectSlotCard}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 2 — BOOKING FORM
        ══════════════════════════════════════════════════════ */}
        {step === STEPS.BOOK && (
          <div className="space-y-5">

            {/* ── selected slot summary card ─────────────────── */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 p-5 text-white shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-blue-100 text-xs font-medium uppercase tracking-wide mb-1">Selected Slot</p>
                  <p className="text-xl font-bold">
                    {selectedSlot?.startTime} – {selectedSlot?.endTime}
                  </p>
                  <p className="text-blue-100 text-sm mt-1">{slotDayLabel(selectedSlot)}</p>

                  <div className="flex items-center gap-3 mt-3 text-sm">
                    {selectedSlot?.consultationType === 'telemedicine' || selectedSlot?.consultationType === 'both' ? (
                      <span className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1">
                        <Video size={13} /> Telemedicine
                      </span>
                    ) : null}
                    {selectedSlot?.consultationType === 'in_person' || selectedSlot?.consultationType === 'both' ? (
                      <span className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1">
                        <MapPin size={13} /> In-Person
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setStep(STEPS.BROWSE); setSelectedSlot(null); setError(''); setSuccess(''); }}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-xl px-3 py-2 text-sm font-medium transition-colors flex-shrink-0"
                >
                  <ArrowLeft size={14} />
                  Change
                </button>
              </div>
            </div>

            {/* ── booking form ───────────────────────────────── */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500 mb-6">
                Booking as <strong className="text-slate-700">{user?.fullName}</strong>
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* consultation type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Consultation Type *
                  </label>
                  <div className="flex gap-3">
                    {[
                      { value: 'telemedicine', label: 'Telemedicine', icon: Video,   disabled: selectedSlot?.consultationType === 'in_person' },
                      { value: 'physical',     label: 'In-Person',    icon: MapPin,  disabled: selectedSlot?.consultationType === 'telemedicine' },
                    ].map(({ value, label, icon: Icon, disabled }) => (
                      <label
                        key={value}
                        className={`
                          flex-1 flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all
                          ${disabled ? 'opacity-40 cursor-not-allowed' :
                            formData.appointmentType === value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600'}
                        `}
                      >
                        <input
                          type="radio"
                          name="appointmentType"
                          value={value}
                          checked={formData.appointmentType === value}
                          onChange={handleChange}
                          disabled={disabled}
                          className="sr-only"
                        />
                        <Icon size={16} />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* optional date selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                    <Calendar size={14} />
                    Preferred Date
                    <span className="text-slate-400 font-normal text-xs">(optional — filters slots below)</span>
                  </label>
                  <input
                    type="date"
                    name="availabilityDate"
                    value={formData.availabilityDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* ── slot picker ─────────────────────────────── */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                    <Clock size={14} />
                    Select Time Slot *
                  </label>

                  {slotLoading ? (
                    <div className="flex items-center gap-2 py-6 text-slate-400 text-sm">
                      <Loader size={16} className="animate-spin" /> Refreshing slots…
                    </div>
                  ) : bookingSlots.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">
                      No available slots for selected filters
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {bookingSlots.map(slot => {
                        const rem   = remainingLabel(slot);
                        const isSel = formData.availabilityId === String(slot._id);
                        const full  = rem <= 0;
                        return (
                          <button
                            key={slot._id}
                            type="button"
                            disabled={full}
                            onClick={() => handlePickSlot(slot)}
                            className={`
                              relative p-4 rounded-xl border-2 text-left transition-all
                              ${full ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' :
                                isSel
                                  ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100'
                                  : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer'}
                            `}
                          >
                            {isSel && (
                              <CheckCircle size={15} className="absolute top-2.5 right-2.5 text-blue-500" />
                            )}
                            <p className="text-sm font-semibold text-slate-700">
                              {slot.startTime} – {slot.endTime}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{slotDayLabel(slot)}</p>
                            <p className={`text-xs mt-2 font-medium ${full ? 'text-red-500' : 'text-emerald-600'}`}>
                              {full ? 'Fully booked' : `${rem} slot${rem !== 1 ? 's' : ''} left`}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* consultation fee */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Consultation Fee (LKR) *
                  </label>
                  <input
                    type="number"
                    name="consultationFee"
                    placeholder="e.g. 1500"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>

                {/* reason */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason for Visit *
                  </label>
                  <input
                    name="reason"
                    placeholder="e.g. Regular checkup, Follow-up, Fever…"
                    value={formData.reason}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>

                {/* symptoms */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Symptoms Summary
                    <span className="text-slate-400 font-normal ml-1">(optional)</span>
                  </label>
                  <textarea
                    name="symptomsSummary"
                    placeholder="Describe your symptoms or concerns…"
                    value={formData.symptomsSummary}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>

                {/* notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Additional Notes
                    <span className="text-slate-400 font-normal ml-1">(optional)</span>
                  </label>
                  <textarea
                    name="patientNotes"
                    placeholder="Any extra information for the doctor…"
                    value={formData.patientNotes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>

                {/* error / success */}
                {error && !loading && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle size={17} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle size={17} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-700">{success}</p>
                  </div>
                )}

                {/* submit */}
                <button
                  type="submit"
                  disabled={loading || !formData.availabilityId || !!success}
                  className="w-full rounded-xl bg-slate-900 px-5 py-3.5 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader size={16} className="animate-spin" /> Creating Appointment…</>
                  ) : (
                    <><CheckCircle size={16} /> Confirm Appointment</>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

/* ─── tiny helper component ───────────────────────────────────────────────── */
function StepBadge({ n, label, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`
          w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
          ${done   ? 'bg-emerald-500 text-white'
          : active ? 'bg-blue-600 text-white'
                   : 'bg-slate-200 text-slate-500'}
        `}
      >
        {done ? <CheckCircle size={13} /> : n}
      </span>
      <span className={`text-sm font-medium ${active ? 'text-slate-800' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}

export default BookAppointmentPage;