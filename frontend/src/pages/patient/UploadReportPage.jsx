import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, FileText, X } from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '../../layouts/DashboardLayout';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { uploadReport, getReportById, updateReport } from '../../services/patientService';
import { getAppointmentsByPatient } from '../../services/appointmentService';
import useAuth from '../../hooks/useAuth';
import { APP_ROUTES } from '../../constants/routes';

const UploadReportPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editReportId = searchParams.get('edit');
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [existingFile, setExistingFile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [formData, setFormData] = useState({
    reportTitle: '',
    reportType: 'Lab Report',
    appointmentId: '',
    description: '',
  });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!user?.id) {
        setAppointmentsLoading(false);
        return;
      }

      try {
        const data = await getAppointmentsByPatient(user.id);
        setAppointments(data?.appointments || []);
      } catch {
        setAppointments([]);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    loadAppointments();
  }, [user?.id]);

  useEffect(() => {
    const loadReportForEdit = async () => {
      if (!editReportId) return;
      try {
        setReportLoading(true);
        const data = await getReportById(editReportId);
        const report = data?.report;
        if (!report) return;

        setFormData({
          reportTitle: report.reportTitle || '',
          reportType: report.reportType || 'Lab Report',
          appointmentId:
            typeof report.appointmentId === 'string'
              ? report.appointmentId
              : report.appointmentId?._id || '',
          description: report.description || '',
        });
        setExistingFile({
          fileName: report.fileName,
          fileSize: report.fileSize,
          mimeType: report.mimeType,
        });
      } catch (error) {
        const message = error?.response?.data?.message || 'Failed to load report for editing';
        await Swal.fire({
          icon: 'error',
          title: 'Unable to load report',
          text: message,
        });
        navigate(APP_ROUTES.PATIENT_VIEW_REPORTS);
      } finally {
        setReportLoading(false);
      }
    };

    loadReportForEdit();
  }, [editReportId, navigate]);

  const reportTypes = [
    'Lab Report',
    'Prescription',
    'Imaging',
    'Discharge Summary',
    'Other'
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid file size',
          text: 'File size must be less than 5MB',
        });
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid file type',
          text: 'Only PDF, JPEG, and PNG files are allowed',
        });
        return;
      }
      
      setFile(selectedFile);
      setExistingFile(null);
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file && !existingFile && !editReportId) {
      await Swal.fire({
        icon: 'error',
        title: 'File required',
        text: 'Please select a PDF/image file to upload',
      });
      return;
    }
    
    if (!formData.reportTitle.trim()) {
      await Swal.fire({
        icon: 'error',
        title: 'Title required',
        text: 'Please enter a report title',
      });
      return;
    }
    
    const uploadFormData = new FormData();
    if (file) {
      uploadFormData.append('file', file);
    }
    uploadFormData.append('reportTitle', formData.reportTitle);
    uploadFormData.append('reportType', formData.reportType);
    uploadFormData.append('description', formData.description);
    uploadFormData.append('appointmentId', formData.appointmentId || '');
    
    try {
      setUploading(true);
      if (editReportId) {
        await updateReport(editReportId, uploadFormData);
      } else {
        await uploadReport(uploadFormData);
      }
      await Swal.fire({
        icon: 'success',
        title: editReportId ? 'Report updated' : 'Report uploaded',
        text: editReportId
          ? 'Your medical document was updated successfully.'
          : 'Your medical document was uploaded successfully.',
      });
      navigate(APP_ROUTES.PATIENT_VIEW_REPORTS);
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to upload report';
      await Swal.fire({
        icon: 'error',
        title: editReportId ? 'Update failed' : 'Upload failed',
        text: message,
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (editReportId) {
      setExistingFile(null);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return 'Not scheduled';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const formatDoctor = (appointment) => {
    const doctor = appointment?.doctorId;
    if (!doctor) return 'Doctor';
    if (typeof doctor === 'string') return `Doctor ${doctor}`;
    const fullName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ').trim();
    return fullName ? `Dr. ${fullName}` : 'Doctor';
  };

  return (
    <DashboardLayout title="Upload Medical Report">
      <div className="max-w-3xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        {reportLoading ? (
          <div className="rounded-2xl bg-slate-100 p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-3 text-slate-600">Loading report data...</p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Upload File <span className="text-red-500">*</span>
            </label>
            
            {!file && !existingFile ? (
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition">
                  <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  <p className="mt-2 text-sm text-slate-600">
                    Click or drag to upload
                  </p>
                  <p className="text-xs text-slate-400">
                    PDF, JPEG, PNG (Max 5MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="border rounded-xl p-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      {file ? (
                        <>
                          <p className="font-medium text-slate-900">{file.name}</p>
                          <p className="text-xs text-slate-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-slate-900">{existingFile.fileName}</p>
                          <p className="text-xs text-slate-500">
                            {(existingFile.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </>
                      )}
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
          
          {/* Report Title */}
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
          
          {/* Report Type */}
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
              {reportTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          {/* Appointment Link (Optional) */}
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
                  {`${formatDoctor(appointment)} - ${appointment.reason || 'Consultation'} - ${formatDateTime(
                    appointment.scheduledDateTime || appointment.preferredDateTime
                  )}`}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              The uploaded report will store doctor and appointment details from this selection.
            </p>
          </div>
          
          {/* Description */}
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
          
          {/* Submit Buttons */}
          <div className="flex gap-3">
            <PrimaryButton type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Uploading...
                </>
              ) : (
                editReportId ? 'Update Report' : 'Upload Report'
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
        )}
      </div>
    </DashboardLayout>
  );
};

export default UploadReportPage;