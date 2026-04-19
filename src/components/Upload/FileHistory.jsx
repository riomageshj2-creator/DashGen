import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileSpreadsheet, Clock, Rows3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function FileHistory({ userId, onLoadFile }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    loadFiles();
  }, [userId]);

  const loadFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setFiles(data);
    }
    setLoading(false);
  };

  const deleteFile = async (e, fileId) => {
    e.stopPropagation();
    const { error } = await supabase
      .from('uploaded_files')
      .delete()
      .eq('id', fileId);

    if (!error) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="file-history">
        <h3><Clock size={16} /> Recent Uploads</h3>
        <div className="file-history-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="file-history-item" style={{ opacity: 0.5 }}>
              <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)' }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: '40%', height: 10 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (files.length === 0) return null;

  return (
    <div className="file-history fade-in">
      <h3><Clock size={16} /> Recent Uploads</h3>
      <div className="file-history-list">
        {files.map((file) => (
          <div
            key={file.id}
            className="file-history-item"
            onClick={() => onLoadFile(file)}
          >
            <div className="file-icon">
              <FileSpreadsheet size={20} />
            </div>
            <div className="file-info">
              <p>{file.file_name}</p>
              <span>
                {file.created_at
                  ? format(new Date(file.created_at), 'MMM d, yyyy · h:mm a')
                  : 'Unknown date'}
              </span>
            </div>
            <div className="file-meta">
              {file.row_count && (
                <span className="file-meta-badge">
                  <Rows3 size={11} style={{ marginRight: 4, verticalAlign: -1 }} />
                  {file.row_count} rows
                </span>
              )}
              {file.file_size && (
                <span className="file-meta-badge">{formatSize(file.file_size)}</span>
              )}
            </div>
            <button
              className="btn-icon btn-sm"
              onClick={(e) => deleteFile(e, file.id)}
              title="Delete"
              style={{ width: 28, height: 28, flexShrink: 0 }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
