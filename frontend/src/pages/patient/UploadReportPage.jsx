import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { uploadReport } from '../../services/patientService';
import { APP_ROUTES } from '../../constants/routes';

const UploadReportPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    reportTitle: '',
    reportType: 'Lab Report',
    appointmentId: '',
    description: '',
  });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

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
        toast.error('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Only PDF, JPEG, and PNG files are allowed');
        return;
      }
      
      setFile(selectedFile);
      
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
    
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    if (!formData.reportTitle.trim()) {
      toast.error('Please enter a report title');
      return;
    }
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('reportTitle', formData.reportTitle);
    uploadFormData.append('reportType', formData.reportType);
    uploadFormData.append('description', formData.description);
    if (formData.appointmentId) {
      uploadFormData.append('appointmentId', formData.appointmentId);
    }
    
    try {
      setUploading(true);
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

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <DashboardLayout title="Upload Medical Report">
      <div className="max-w-3xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
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
          
          {/* Appointment ID (Optional) */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Appointment ID (Optional)
            </label>
            <input
              type="text"
              name="appointmentId"
              value={formData.appointmentId}
              onChange={handleChange}
              placeholder="Link to a specific appointment"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
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