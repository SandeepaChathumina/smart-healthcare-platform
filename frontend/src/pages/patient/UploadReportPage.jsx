import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { uploadReport } from '../../services/patientService';
import { APP_ROUTES } from '../../constants/routes';

const UploadReportPage = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    reportTitle: '',
    reportType: 'Lab Report',
    description: '',
    appointmentId: '',
  });

  const reportTypes = [
    'Lab Report',
    'Prescription',
    'Imaging',
    'Discharge Summary',
    'Other',
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPEG, PNG files are allowed');
        return;
      }

      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!formData.reportTitle.trim()) {
      toast.error('Please enter a report title');
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', selectedFile);
    uploadFormData.append('reportTitle', formData.reportTitle);
    uploadFormData.append('reportType', formData.reportType);
    uploadFormData.append('description', formData.description);
    if (formData.appointmentId) {
      uploadFormData.append('appointmentId', formData.appointmentId);
    }

    try {
      setUploading(true);
      const response = await uploadReport(uploadFormData);
      toast.success('Report uploaded successfully!');
      navigate(APP_ROUTES.PATIENT_VIEW_REPORTS);
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to upload report';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  return (
    <DashboardLayout title="Upload Medical Report">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Upload Medical Document</h2>
            <p className="mt-1 text-sm text-slate-600">
              Upload lab reports, prescriptions, imaging results, or other medical documents.
              Supported formats: PDF, JPEG, PNG (Max 5MB)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Document File *
              </label>
              
              {!selectedFile ? (
                <div
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 transition hover:border-blue-400 hover:bg-blue-50/30"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <Upload className="mb-3 h-10 w-10 text-slate-400" />
                  <p className="text-sm text-slate-600">Click to browse or drag and drop</p>
                  <p className="mt-1 text-xs text-slate-400">PDF, JPEG, PNG (max 5MB)</p>
                  <input
                    id="fileInput"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {preview && selectedFile.type.startsWith('image/') ? (
                        <img src={preview} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100">
                          <File className="h-8 w-8 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Report Title */}
            <div>
              <label htmlFor="reportTitle" className="mb-2 block text-sm font-semibold text-slate-700">
                Report Title *
              </label>
              <input
                id="reportTitle"
                name="reportTitle"
                type="text"
                value={formData.reportTitle}
                onChange={handleChange}
                placeholder="e.g., Blood Test Results, Chest X-Ray, etc."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            {/* Report Type */}
            <div>
              <label htmlFor="reportType" className="mb-2 block text-sm font-semibold text-slate-700">
                Report Type *
              </label>
              <select
                id="reportType"
                name="reportType"
                value={formData.reportType}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {reportTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add any additional notes about this report..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Appointment ID (Optional) */}
            <div>
              <label htmlFor="appointmentId" className="mb-2 block text-sm font-semibold text-slate-700">
                Related Appointment ID (Optional)
              </label>
              <input
                id="appointmentId"
                name="appointmentId"
                type="text"
                value={formData.appointmentId}
                onChange={handleChange}
                placeholder="If this report is from a specific appointment"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Uploading...
                  </span>
                ) : (
                  'Upload Report'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(APP_ROUTES.PATIENT_VIEW_REPORTS)}
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UploadReportPage;