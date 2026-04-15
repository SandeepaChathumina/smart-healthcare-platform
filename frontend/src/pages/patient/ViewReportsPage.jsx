import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Search, Filter, FileText, Download, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import ReportCard from '../../components/patient/ReportCard';
import { getMyReports, deleteReport, downloadReport } from '../../services/patientService';
import { APP_ROUTES } from '../../constants/routes';

const ViewReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState({
    reportType: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });

  const reportTypes = ['All', 'Lab Report', 'Prescription', 'Imaging', 'Discharge Summary', 'Other'];

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: filter.page,
        limit: filter.limit,
      };
      if (filter.reportType && filter.reportType !== 'All') {
        params.reportType = filter.reportType;
      }

      const response = await getMyReports(params);
      setReports(response.reports || []);
      setPagination({
        total: response.total || 0,
        page: response.page || 1,
        pages: response.pages || 1,
      });
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to load reports';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filter.page, filter.reportType]);

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      setDeletingId(reportId);
      await deleteReport(reportId);
      toast.success('Report deleted successfully');
      loadReports();
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to delete report';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (reportId, fileName) => {
    try {
      const response = await downloadReport(reportId);
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
      const message = error?.response?.data?.message || 'Failed to download report';
      toast.error(message);
    }
  };

  const handlePageChange = (newPage) => {
    setFilter((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <DashboardLayout title="My Medical Reports">
      <div className="space-y-6">
        {/* Header with Upload Button */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Medical Documents</h2>
            <p className="mt-1 text-sm text-slate-600">
              View and manage all your uploaded medical reports and documents
            </p>
          </div>

          <Link
            to={APP_ROUTES.PATIENT_UPLOAD_REPORT}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
          >
            <Upload className="h-4 w-4" />
            Upload New Report
          </Link>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-600">Filter by:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {reportTypes.map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, reportType: type, page: 1 }))
                  }
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    filter.reportType === type || (type === 'All' && !filter.reportType)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex items-center justify-center rounded-3xl bg-white p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No Reports Found</h3>
            <p className="mt-2 text-sm text-slate-600">
              You haven't uploaded any medical reports yet.
            </p>
            <Link
              to={APP_ROUTES.PATIENT_UPLOAD_REPORT}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              <Upload className="h-4 w-4" />
              Upload Your First Report
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard
                  key={report._id}
                  report={report}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  isDeleting={deletingId === report._id}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewReportsPage;