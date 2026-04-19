import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet } from 'lucide-react';

export default function FileDropzone({ onFileAccepted, uploading }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0 && !uploading) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted, uploading]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`upload-zone ${isDragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
      id="file-dropzone"
    >
      <input {...getInputProps()} />
      <div className="upload-icon">
        {isDragActive ? <FileSpreadsheet size={32} /> : <Upload size={32} />}
      </div>
      <h2>
        {isDragActive ? 'Drop your file here' : 'Upload your data file'}
      </h2>
      <p>
        {isDragActive
          ? 'Release to start processing'
          : 'Drag & drop your Excel or CSV file, or click to browse'}
      </p>
      <div className="upload-formats">
        <span className="upload-format-badge">.xlsx</span>
        <span className="upload-format-badge">.xls</span>
        <span className="upload-format-badge">.csv</span>
      </div>
    </div>
  );
}
