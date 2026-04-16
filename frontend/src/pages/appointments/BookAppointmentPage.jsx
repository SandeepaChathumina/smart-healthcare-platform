import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, AlertCircle, Loader } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { createAppointment } from '../../services/appointmentService';
import DashboardLayout from '../../layouts/DashboardLayout';
import axiosInstance from '../../lib/axios';

const BookAppointmentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentType: 'telemedicine',
    reason: '',
    symptomsSummary: '',
    availabilityDate: '',
    availabilityId: '',
    consultationFee: '',
    patientNotes: '',
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear slots and availabilityId if doctor or date changes
    if (name === 'doctorId' || name === 'availabilityDate' || name === 'appointmentType') {
      setAvailableSlots([]);
      setFormData((prev) => ({
        ...prev,
        availabilityId: '',
      }));
      setError('');
    }
  };

  // Fetch available slots when doctor and date are selected
  useEffect(() => {
    const fetchSlots = async () => {
      if (!formData.doctorId || !formData.availabilityDate) {
        setAvailableSlots([]);
        return;
      }

      try {
        setSlotLoading(true);
        setError('');

        const params = new URLSearchParams();
        params.append('date', formData.availabilityDate);
        if (formData.appointmentType !== 'physical') {
          params.append('consultationType', formData.appointmentType === 'telemedicine' ? 'telemedicine' : 'in_person');
        }

        const response = await axiosInstance.get(
          `/api/availability/doctor/${formData.doctorId}?${params.toString()}`
        );

        if (response.data.slots && response.data.slots.length > 0) {
          setAvailableSlots(response.data.slots);
        } else {
          setError('No available slots for the selected date and consultation type');
          setAvailableSlots([]);
        }
      } catch (err) {
        const message = err?.response?.data?.message || 'Failed to fetch available slots';
        setError(message);
        setAvailableSlots([]);
      } finally {
        setSlotLoading(false);
      }
    };

    const timer = setTimeout(fetchSlots, 500);
    return () => clearTimeout(timer);
  }, [formData.doctorId, formData.availabilityDate, formData.appointmentType]);

  const handleSelectSlot = (slotId) => {
    setFormData((prev) => ({
      ...prev,
      availabilityId: slotId,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.availabilityId) {
      setError('Please select an available time slot');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        doctorId: formData.doctorId,
        appointmentType: formData.appointmentType === 'physical' ? 'in_person' : formData.appointmentType,
        reason: formData.reason,
        symptomsSummary: formData.symptomsSummary,
        preferredDateTime: new Date(formData.availabilityDate).toISOString(),
        consultationFee: Number(formData.consultationFee),
        patientNotes: formData.patientNotes,
        availabilityId: formData.availabilityId,
      };

      const data = await createAppointment(payload);
      setSuccess('Appointment created successfully');

      setTimeout(() => {
        const appointmentId = data?.appointment?._id || data?.appointment?.id;
        if (appointmentId) {
          navigate(`/patient/appointments/${appointmentId}`);
        } else {
          navigate('/patient/appointments');
        }
      }, 1000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Book Appointment">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="mb-6 text-sm text-slate-600">
          Logged in as: <strong>{user?.fullName}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Doctor ID Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Doctor ID *</label>
              <input
                name="doctorId"
                placeholder="Enter doctor ID"
                value={formData.doctorId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Appointment Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Consultation Type *</label>
              <select
                name="appointmentType"
                value={formData.appointmentType}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="telemedicine">Telemedicine (Video)</option>
                <option value="physical">In-Person</option>
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Preferred Date *
              </label>
              <input
                type="date"
                name="availabilityDate"
                value={formData.availabilityDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Consultation Fee */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Consultation Fee *</label>
              <input
                type="number"
                name="consultationFee"
                placeholder="0.00"
                value={formData.consultationFee}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Available Slots Section */}
          {formData.doctorId && formData.availabilityDate && (
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <Clock size={16} />
                Available Time Slots *
              </label>
              {slotLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin text-blue-500" />
                  <span className="ml-2 text-slate-600">Loading available slots...</span>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot._id}
                      type="button"
                      onClick={() => handleSelectSlot(slot._id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.availabilityId === slot._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <div className="text-sm font-medium text-slate-700">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {slot.remainingCapacity} slot{slot.remainingCapacity !== 1 ? 's' : ''} available
                      </div>
                    </button>
                  ))}
                </div>
              ) : error ? (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">{error}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Select a doctor and date to view available slots</p>
              )}
            </div>
          )}

          {/* Additional Fields */}
          <div className="border-t pt-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Consultation *</label>
              <input
                name="reason"
                placeholder="e.g., Regular checkup, Follow-up..."
                value={formData.reason}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-2 mt-4">Symptoms Summary</label>
            <textarea
              name="symptomsSummary"
              placeholder="Describe your symptoms or medical concerns (optional)"
              value={formData.symptomsSummary}
              onChange={handleChange}
              rows="3"
              className="w-full rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="block text-sm font-medium text-slate-700 mb-2 mt-4">Additional Notes</label>
            <textarea
              name="patientNotes"
              placeholder="Any additional information for the doctor (optional)"
              value={formData.patientNotes}
              onChange={handleChange}
              rows="3"
              className="w-full rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Error/Success Messages */}
          {error && !slotLoading && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <AlertCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.availabilityId}
            className="w-full rounded-xl bg-slate-900 px-5 py-3 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Appointment...' : 'Create Appointment'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default BookAppointmentPage;