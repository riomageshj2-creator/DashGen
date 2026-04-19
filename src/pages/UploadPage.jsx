import FileDropzone from '../components/Upload/FileDropzone';
import FileHistory from '../components/Upload/FileHistory';
import PageHero from '../components/Layout/PageHero';
import { LayoutDashboard } from 'lucide-react';

export default function UploadPage({ userId, onFileAccepted, onLoadFromHistory, uploading, progress, error }) {
  return (
    <div className="upload-page fade-in">
      <PageHero 
        title="Generate Dashboard"
        description="Upload your trading data (Excel or CSV) and instantly generate meaningful analytics, charts, and visualizations."
        icon={LayoutDashboard}
      />
      <FileDropzone onFileAccepted={onFileAccepted} uploading={uploading} />

      {uploading && (
        <div className="upload-progress">
          <div className="upload-progress-bar">
            <div className="upload-progress-fill" />
          </div>
          <p>{progress}</p>
        </div>
      )}

      {error && (
        <div className="auth-error" style={{ maxWidth: '640px', marginTop: '16px' }}>
          ⚠️ {error}
        </div>
      )}

      <FileHistory userId={userId} onLoadFile={onLoadFromHistory} />
    </div>
  );
}
