import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Trash2, Eye, Upload, Calendar, FileType } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAllReports, deleteReport, downloadReport } from '../../services/patientService';
import { APP_ROUTES } from '../../constants/routes';

const ViewReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const reportTypes = ['All', 'Lab Report', 'Prescription', 'Imaging', 'Discharge Summary', 'Other'];

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = filterType !== 'All' ? { reportType: filterType } : {};
      const data = await getAllReports(params);
      setReports(data.reports || []);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filterType]);

  const handleDownload = async (reportId, fileName) => {
    try {
      setDownloadingId(reportId);
      const response = await downloadReport(reportId);
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download report');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      setDeletingId(reportId);
      await deleteReport(reportId);
      toast.success('Report deleted successfully');
      loadReports();
    } catch (error) {
      toast.error('Failed to delete report');
    } finally {
      setDeletingId(null);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('image')) return '🖼️';
    return '📎';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout title="My Medical Reports">
      <div className="space-y-6">
        {/* Header with Upload Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-600">
              View and manage all your uploaded medical reports and documents
            </p>
          </div>
          <Link
            to={APP_ROUTES.PATIENT_UPLOAD_REPORT}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            Upload New Report
          </Link>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {reportTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        
        {/* Reports List */}
        {loading ? (
          <div className="rounded-2xl bg-slate-100 p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-3 text-slate-600">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl bg-slate-100 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-3 text-lg font-semibold text-slate-900">No reports found</h3>
            <p className="mt-1 text-sm text-slate-600">
              {filterType !== 'All' 
                ? `No ${filterType} reports available. Try a different filter.`
                : 'Upload your first medical report to get started.'}
            </p>
            {filterType === 'All' && (
              <Link
                to={APP_ROUTES.PATIENT_UPLOAD_REPORT}
                className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Upload Report
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <div
                key={report._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getFileIcon(report.mimeType)}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{report.reportTitle}</h3>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <FileType className="h-3 w-3" />
                            {report.reportType}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(report.uploadedAt)}
                          </span>
                          <span>{report.fileName}</span>
                          <span>{(report.fileSize / 1024).toFixed(1)} KB</span>
                        </div>
                        {report.description && (
                          <p className="mt-2 text-sm text-slate-600">{report.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(report._id, report.fileName)}
                      disabled={downloadingId === report._id}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      {downloadingId === report._id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-transparent"></div>
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(report._id)}
                      disabled={deletingId === report._id}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === report._id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewReportsPage;