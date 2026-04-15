import { FileText, Download, Trash2, Calendar, FileImage, File } from 'lucide-react';

const ReportCard = ({ report, onDownload, onDelete, isDeleting }) => {
  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'Lab Report':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'Prescription':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'Imaging':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getReportTypeColor = (type) => {
    switch (type) {
      case 'Lab Report':
        return 'bg-blue-100 text-blue-700';
      case 'Prescription':
        return 'bg-green-100 text-green-700';
      case 'Imaging':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-slate-100 p-3">
            {getReportTypeIcon(report.reportType)}
          </div>

          <div>
            <h3 className="font-bold text-slate-900">{report.reportTitle}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getReportTypeColor(
                  report.reportType
                )}`}
              >
                {report.reportType}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(report.uploadedAt)}
              </span>
              <span>{formatFileSize(report.fileSize)}</span>
            </div>

            {report.description && (
              <p className="mt-2 text-sm text-slate-600 line-clamp-2">{report.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onDownload(report._id, report.fileName)}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={() => onDelete(report._id)}
            disabled={isDeleting}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;