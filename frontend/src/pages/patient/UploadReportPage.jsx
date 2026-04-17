import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { uploadReport } from '../../services/patientService';
import { getAppointmentsByPatient } from '../../services/appointmentService';
import useAuth from '../../hooks/useAuth';
import { APP_ROUTES } from '../../constants/routes';

const UploadReportPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    reportTitle: '',
    reportType: 'Lab Report',
    appointmentId: '',
    description: '',
  });

  useEffect(() => {
    const loadAppointments = async () => {
      if (!user?.id) {
        setAppointmentsLoading(false);
        return;
      }

      try {
        const data = await getAppointmentsByPatient(user.id);
        setAppointments(data?.appointments || []);
      } catch (error) {
        setAppointments([]);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    loadAppointments();
  }, [user?.id]);

  const selectedAppointment = useMemo(
    () => appointments.find((item) => item._id === formData.appointmentId) || null,
    [appointments, formData.appointmentId]
  );

  const reportTypes = [
    'Lab Report',
    'Prescription',
    'Imaging',
    'Discharge Summary',
    'Other',
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Only PDF, JPEG, and PNG files are allowed');
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  const formatDateTime = (value) => {
    if (!value) return 'Not scheduled';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('en-GB', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!formData.reportTitle.trim()) {
      toast.error('Please enter a report title');
      return;
    }

    try {
      setUploading(true);

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('reportTitle', formData.reportTitle.trim());
      uploadFormData.append('reportType', formData.reportType);
      uploadFormData.append('description', formData.description.trim());

      if (selectedAppointment) {
        uploadFormData.append('appointmentId', selectedAppointment._id);
        uploadFormData.append('doctorId', selectedAppointment.doctorId || '');
        uploadFormData.append(
          'appointmentDetails',
          JSON.stringify({
            reason: selectedAppointment.reason || '',
            appointmentType: selectedAppointment.appointmentType || '',
            preferredDateTime: selectedAppointment.preferredDateTime || null,
            scheduledDateTime: selectedAppointment.scheduledDateTime || null,
            status: selectedAppointment.status || '',
          })
        );
      }

      await uploadReport(uploadFormData);
      toast.success('Report uploaded successfully!');
      navigate(APP_ROUTES.PATIENT_VIEW_REPORTS);
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to upload report';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout title="Upload Medical Report">
      <div className="max-w-3xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Upload File <span className="text-red-500">*</span>
            </label>

            {!file ? (
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-blue-400">
                  <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  <p className="mt-2 text-sm text-slate-600">Click or drag to upload</p>
                  <p className="text-xs text-slate-400">PDF, JPEG, PNG (Max 5MB)</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {preview && (
                  <div className="mt-3">
                    <img src={preview} alt="Preview" className="max-h-48 rounded-lg" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Report Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="reportTitle"
              value={formData.reportTitle}
              onChange={handleChange}
              placeholder="e.g., Blood Test Report - March 2026"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Report Type
            </label>
            <select
              name="reportType"
              value={formData.reportType}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {reportTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Link to Appointment (Optional)
            </label>
            <select
              name="appointmentId"
              value={formData.appointmentId}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={appointmentsLoading}
            >
              <option value="">No appointment linked</option>
              {appointments.map((appointment) => (
                <option key={appointment._id} value={appointment._id}>
                  {`${appointment.doctorName || 'Doctor'} - ${appointment.reason || 'Consultation'} - ${formatDateTime(
                    appointment.scheduledDateTime || appointment.preferredDateTime
                  )}`}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              The uploaded report can optionally store the linked appointment details.
            </p>
          </div>

          {selectedAppointment && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                Selected Appointment
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {selectedAppointment.doctorName || 'Doctor'} — {selectedAppointment.reason || 'Consultation'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDateTime(
                  selectedAppointment.scheduledDateTime || selectedAppointment.preferredDateTime
                )}
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Add any additional notes about this report"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex gap-3">
            <PrimaryButton type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Uploading...
                </>
              ) : (
                'Upload Report'
              )}
            </PrimaryButton>

            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.PATIENT_VIEW_REPORTS)}
              className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default UploadReportPage;