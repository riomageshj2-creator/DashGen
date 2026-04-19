import { useRef } from 'react';
import { Download, FileDown, FileText, Upload, Cloud, CloudOff, CheckCircle, XCircle, Share2, Link as LinkIcon } from 'lucide-react';
import { exportDashboardPdf, downloadInsightsCSV } from '../../utils/exportPdf';
import ThemeToggle from '../Layout/ThemeToggle';

export default function DashboardHeader({ fileName, summary, dashboardRef, onBack, onSave, isSaving, isSaved, fileId, onShare, onUnsave }) {
  const handleExportPdf = async () => {
    try {
      await exportDashboardPdf(dashboardRef, `${fileName || 'dashboard'}-report.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleDownloadInsights = () => {
    downloadInsightsCSV(summary, `${fileName || 'dashboard'}-insights.csv`);
  };

  const handleShare = async () => {
    if (!isSaved) {
      alert("Please save the dashboard to cloud first.");
      return;
    }
    
    const success = await onShare(fileId, true);
    if (success) {
      const shareUrl = `${window.location.origin}/shared/${fileId}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert(`Link copied to clipboard!\n${shareUrl}`);
      } catch(e) {
        prompt('Dashboard is now public. Copy this link to share:', shareUrl);
      }
    } else {
      alert("Failed to create share link. Please try again.");
    }
  };

  const handleToggleSave = async () => {
    if (isSaved) {
      if (window.confirm("Are you sure you want to remove this dashboard from the cloud?")) {
        await onUnsave(fileId);
      }
    } else {
      onSave();
    }
  };

  return (
    <div className="dashboard-header fade-in">
      <div className="dashboard-title">
        <h1>Dashboard</h1>
        <p>{fileName ? `Analyzing: ${fileName}` : 'Upload a file to get started'}</p>
      </div>

      <div className="dashboard-actions">
        {summary && (
          <>
            <button
              id="export-pdf-btn"
              className="btn btn-secondary btn-sm"
              onClick={handleExportPdf}
              title="Export as PDF"
            >
              <FileText size={15} />
              Export PDF
            </button>
            <button
              id="download-insights-btn"
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadInsights}
              title="Download insights CSV"
            >
              <FileDown size={15} />
              Insights CSV
            </button>
          </>
        )}
        
        <button
          className="btn btn-secondary btn-sm"
          onClick={onBack}
          title="Clear current dashboard"
        >
          <XCircle size={15} />
          Clear Dashboard
        </button>

        {summary && (
          <>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleShare}
              title="Share Dashboard"
            >
              <Share2 size={15} />
              Share Link
            </button>
            <button
              id="save-cloud-btn"
              className={`btn btn-sm ${isSaved ? 'btn-success' : 'btn-primary'}`}
              onClick={handleToggleSave}
              disabled={isSaving}
              title={isSaved ? "Remove from Cloud" : "Save Dashboard to Cloud"}
            >
              {isSaved ? <CheckCircle size={15} /> : isSaving ? <CloudOff size={15} /> : <Cloud size={15} />}
              {isSaved ? 'Saved' : isSaving ? 'Saving...' : 'Save to Cloud'}
            </button>
          </>
        )}
        
        <button
          id="upload-new-btn"
          className="btn btn-primary btn-sm"
          onClick={onBack}
        >
          <Upload size={15} />
          New Upload
        </button>
      </div>
    </div>
  );
}
