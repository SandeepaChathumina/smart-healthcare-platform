import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Stethoscope,
  UserRound,
  BadgeInfo,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { createAppointment } from "../../services/appointmentService";
import { getAllAvailabilitySlots } from "../../services/doctorService";
import axios from "../../lib/axios";

const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:5001";

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatLocalDateInput = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayLocal = () => formatLocalDateInput(new Date());

const formatAvailabilityDay = (slot) => {
  if (slot.specificDate) {
    return new Date(slot.specificDate).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return `Every ${WEEKDAY[slot.dayOfWeek]}`;
};

const getRemaining = (slot) => {
  return slot.remainingCapacity ?? Math.max(0, (slot.maxAppointments || 0) - (slot.bookedCount || 0));
};

const getDefaultDateForSlot = (slot) => {
  if (slot.specificDate) {
    return formatLocalDateInput(slot.specificDate);
  }

  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const currentDay = date.getDay();
  const targetDay = Number(slot.dayOfWeek);
  const diff = (targetDay - currentDay + 7) % 7;
  date.setDate(date.getDate() + diff);
  return formatLocalDateInput(date);
};

const timeToMinutes = (value) => {
  const [h, m] = String(value).split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (value) => {
  const h = Math.floor(value / 60);
  const m = value % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const buildIntervals = (slot) => {
  if (!slot) return [];

  const result = [];
  const slotStart = timeToMinutes(slot.startTime);
  const slotEnd = timeToMinutes(slot.endTime);
  const breaks = Array.isArray(slot.breakTime) ? slot.breakTime : [];

  for (let start = slotStart; start + 30 <= slotEnd; start += 30) {
    const end = start + 30;
    const blocked = breaks.some((item) => {
      const breakStart = timeToMinutes(item.start);
      const breakEnd = timeToMinutes(item.end);
      return start < breakEnd && breakStart < end;
    });

    if (!blocked) {
      result.push({ start: minutesToTime(start), end: minutesToTime(end) });
    }
  }

  return result;
};

const getDoctorDetailsById = async (doctorId) => {
  const response = await axios.get(`${AUTH_BASE_URL}/api/patient/doctors/${doctorId}`);
  return response.data;
};

const BookAppointmentPage = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchDate, setSearchDate] = useState("");
  const [formData, setFormData] = useState({
    appointmentType: "telemedicine",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    symptomsSummary: "",
    patientNotes: "",
  });

  useEffect(() => {
    const loadSlots = async () => {
      try {
        setLoadingSlots(true);
        setError("");

        const data = await getAllAvailabilitySlots();
        const rawSlots = data?.availability || [];

        const uniqueDoctorIds = [...new Set(rawSlots.map((slot) => String(slot.doctorId)).filter(Boolean))];

        const doctorResults = await Promise.allSettled(
          uniqueDoctorIds.map(async (doctorId) => {
            const result = await getDoctorDetailsById(doctorId);
            return result?.doctor || null;
          })
        );

        const doctorMap = new Map();

        doctorResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value?._id) {
            doctorMap.set(String(result.value._id), result.value);
          }
        });

        const mergedSlots = rawSlots.map((slot) => {
          const doctorDetails = doctorMap.get(String(slot.doctorId));

          return {
            ...slot,
            doctor: {
              ...(slot.doctor || {}),
              id: doctorDetails?._id || slot.doctorId,
              fullName:
                doctorDetails?.fullName ||
                slot.doctor?.fullName ||
                "Doctor Name Unavailable",
              specialization:
                doctorDetails?.specialization ||
                "Specialization Unavailable",
              email: doctorDetails?.email || null,
              phone: doctorDetails?.phone || null,
              qualifications: doctorDetails?.qualifications || null,
              experience: doctorDetails?.experience ?? null,
              consultationFee: doctorDetails?.consultationFee ?? null,
            },
          };
        });

        setSlots(mergedSlots);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load doctor availability");
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, []);

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const typeOk =
        filterType === "all" ||
        slot.consultationType === filterType ||
        slot.consultationType === "both";

      const remainingOk = getRemaining(slot) > 0;

      if (!typeOk || !remainingOk) return false;

      if (!searchDate) return true;

      const selectedDate = new Date(`${searchDate}T00:00:00`);
      if (Number.isNaN(selectedDate.getTime())) return true;

      if (slot.specificDate) {
        const slotDate = new Date(slot.specificDate);
        return (
          slotDate.getFullYear() === selectedDate.getFullYear() &&
          slotDate.getMonth() === selectedDate.getMonth() &&
          slotDate.getDate() === selectedDate.getDate()
        );
      }

      return Number(slot.dayOfWeek) === selectedDate.getDay();
    });
  }, [slots, filterType, searchDate]);

  const intervalOptions = useMemo(() => buildIntervals(selectedSlot), [selectedSlot]);

  useEffect(() => {
    if (!selectedSlot) return;

    const nextDate = getDefaultDateForSlot(selectedSlot);
    const nextTime = buildIntervals(selectedSlot)[0]?.start || "";

    setFormData((prev) => ({
      ...prev,
      appointmentType:
        selectedSlot.consultationType === "both"
          ? prev.appointmentType
          : selectedSlot.consultationType,
      appointmentDate: nextDate,
      appointmentTime: nextTime,
    }));
    setError("");
  }, [selectedSlot]);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedSlot) {
      setError("Please select a doctor time slot first");
      return;
    }

    if (!formData.reason.trim()) {
      setError("Reason for visit is required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        doctorId: selectedSlot.doctorId,
        availabilityId: selectedSlot._id,
        appointmentType:
          selectedSlot.consultationType === "both"
            ? formData.appointmentType
            : selectedSlot.consultationType,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        reason: formData.reason.trim(),
        symptomsSummary: formData.symptomsSummary.trim(),
        patientNotes: formData.patientNotes.trim(),
      };

      const data = await createAppointment(payload);
      const appointmentId = data?.appointment?._id;
      setSuccess("Appointment created successfully");

      setTimeout(() => {
        navigate(appointmentId ? `/patient/appointments/${appointmentId}` : "/patient/appointments");
      }, 1200);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create appointment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Book Appointment">
      <div className="space-y-6">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-blue-700">Book Appointment</h1>
          <p className="mt-2 text-sm text-slate-500">
            Pick a doctor availability slot, choose a 30-minute time, and send the booking request.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <Stethoscope size={18} className="text-blue-600" />
                Available Doctor Slots
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {filteredSlots.length} found
              </span>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All appointment types</option>
                <option value="telemedicine">Telemedicine</option>
                <option value="in_person">In-person</option>
              </select>

              <input
                type="date"
                value={searchDate}
                min={getTodayLocal()}
                onChange={(e) => setSearchDate(e.target.value)}
                className="rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="mr-2 animate-spin" size={18} /> Loading slots...
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="rounded-2xl bg-blue-50 p-6 text-sm text-blue-700">
                No doctor slots are available for the selected filters.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredSlots.map((slot) => {
                  const selected = selectedSlot?._id === slot._id;
                  const remaining = getRemaining(slot);

                  return (
                    <button
                      key={slot._id}
                      type="button"
                      onClick={() => handleSlotSelect(slot)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-blue-100 bg-white hover:border-blue-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {slot.consultationType === "both"
                            ? "Telemedicine / In-person"
                            : slot.consultationType === "telemedicine"
                            ? "Telemedicine"
                            : "In-person"}
                        </span>
                        {selected && <CheckCircle2 size={18} className="text-blue-600" />}
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <UserRound size={15} className="text-blue-500" />
                          {slot.doctor?.fullName || "Doctor Name Unavailable"}
                        </div>

                        <div className="flex items-center gap-2 text-slate-600">
                          <BadgeInfo size={14} className="text-blue-500" />
                          {slot.doctor?.specialization || "Specialization Unavailable"}
                        </div>

                        <div className="flex items-center gap-2 font-medium text-slate-800">
                          <Clock size={14} className="text-blue-500" />
                          {slot.startTime} - {slot.endTime}
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-blue-500" />
                          {formatAvailabilityDay(slot)}
                        </div>

                        <div>{remaining} appointment space(s) left</div>

                        {slot.breakTime?.length > 0 && (
                          <div className="text-xs text-slate-500">
                            Breaks: {slot.breakTime.map((item) => `${item.start}-${item.end}`).join(", ")}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
            <h2 className="text-lg font-bold text-blue-700">Booking Form</h2>
            <p className="mt-1 text-sm text-slate-500">
              Patients only request the appointment. The doctor will set the consultation fee when accepting it.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Selected slot</label>
                <div className="rounded-2xl bg-blue-50 p-4 text-sm text-slate-700">
                  {selectedSlot ? (
                    <>
                      <div className="font-semibold text-blue-700">
                        {selectedSlot.doctor?.fullName || "Doctor Name Unavailable"}
                      </div>
                      <div className="mt-1 text-slate-600">
                        {selectedSlot.doctor?.specialization || "Specialization Unavailable"}
                      </div>
                      <div className="mt-2 font-medium">{formatAvailabilityDay(selectedSlot)}</div>
                      <div className="mt-1">
                        {selectedSlot.startTime} - {selectedSlot.endTime}
                      </div>
                    </>
                  ) : (
                    "Choose a doctor slot from the left side"
                  )}
                </div>
              </div>

              {selectedSlot?.consultationType === "both" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Appointment type</label>
                  <select
                    value={formData.appointmentType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, appointmentType: e.target.value }))}
                    className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="telemedicine">Telemedicine</option>
                    <option value="in_person">In-person</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Appointment type</label>
                  <div className="rounded-xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {selectedSlot?.consultationType === "telemedicine" ? "Telemedicine" : "In-person"}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Appointment date</label>
                <input
                  type="date"
                  value={formData.appointmentDate}
                  min={getTodayLocal()}
                  disabled={Boolean(selectedSlot?.specificDate)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, appointmentDate: e.target.value }))}
                  className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
                />
                {selectedSlot && !selectedSlot.specificDate && (
                  <p className="mt-2 text-xs text-slate-500">
                    Choose a date that falls on {WEEKDAY[selectedSlot.dayOfWeek]}.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Available 30-minute times</label>
                <div className="grid grid-cols-2 gap-2">
                  {intervalOptions.map((item) => (
                    <button
                      key={item.start}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, appointmentTime: item.start }))}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        formData.appointmentTime === item.start
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-blue-100 bg-white text-slate-700 hover:bg-blue-50"
                      }`}
                    >
                      {item.start} - {item.end}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Reason for visit</label>
                <input
                  value={formData.reason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Ex: Fever, follow-up, headache"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Symptoms summary</label>
                <textarea
                  value={formData.symptomsSummary}
                  onChange={(e) => setFormData((prev) => ({ ...prev, symptomsSummary: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Additional notes</label>
                <textarea
                  value={formData.patientNotes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, patientNotes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Optional"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle size={16} className="mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  <CheckCircle2 size={16} className="mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !selectedSlot}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : "Create Appointment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BookAppointmentPage;