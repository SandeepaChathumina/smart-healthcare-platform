import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import { createAppointment } from '../../services/appointmentService';

const BookAppointmentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentType: 'telemedicine',
    reason: '',
    symptomsSummary: '',
    preferredDateTime: '',
    consultationFee: '',
    patientNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);

      const payload = {
        ...formData,
        consultationFee: Number(formData.consultationFee),
      };

      const data = await createAppointment(payload);
      setSuccess('Appointment created successfully');

      const appointmentId = data?.appointment?._id || data?.appointment?.id;
      if (appointmentId) {
        navigate(`/patient/appointments/${appointmentId}`);
      }
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="doctorId"
            placeholder="Doctor ID"
            value={formData.doctorId}
            onChange={handleChange}
            className="w-full rounded-xl border p-3"
            required
          />

          <select
            name="appointmentType"
            value={formData.appointmentType}
            onChange={handleChange}
            className="w-full rounded-xl border p-3"
          >
            <option value="telemedicine">Telemedicine</option>
            <option value="physical">Physical</option>
          </select>

          <input
            name="reason"
            placeholder="Reason"
            value={formData.reason}
            onChange={handleChange}
            className="w-full rounded-xl border p-3"
            required
          />

          <textarea
            name="symptomsSummary"
            placeholder="Symptoms Summary"
            value={formData.symptomsSummary}
            onChange={handleChange}
            className="w-full rounded-xl border p-3"
          />

          <input
            type="datetime-local"
            name="preferredDateTime"
            value={formData.preferredDateTime}
            onChange={handleChange}
            className="w-full rounded-xl border p-3"
            required
          />

          <input
            type="number"
            name="consultationFee"
            placeholder="Consultation Fee"
            value={formData.consultationFee}
            onChange={handleChange}
            className="w-full rounded-xl border p-3"
            required
          />

          <textarea
            name="patientNotes"
            placeholder="Patient Notes"
            value={formData.patientNotes}
            onChange={handleChange}
            className="w-full rounded-xl border p-3"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-3 text-white disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Appointment'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default BookAppointmentPage;