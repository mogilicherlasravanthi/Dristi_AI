import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function ImageUploader({ onImageSelect, disabled, error, setError }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndSelect = (file) => {
    setError(null);
    if (!file) return;

    // Check file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(png|jpe?g|tiff?)$/i)) {
      setError('Invalid file format. Please upload a PNG, JPG, or TIFF retinal image.');
      return;
    }

    // Check file size (max 15MB)
    const maxSizeMB = 15;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit. Please upload a smaller image.`);
      return;
    }

    onImageSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div className="upload-container">
      <div
        className={`drop-zone ${isDragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="file-input-hidden"
          accept="image/png, image/jpeg, image/jpg, image/tiff"
          onChange={handleChange}
          disabled={disabled}
        />

        <div className="drop-zone-icon">
          <UploadCloud size={30} />
        </div>

        <h3 className="drop-zone-title">Upload Retinal Fundus Photograph</h3>
        <p className="drop-zone-subtitle">
          Drag & drop your fundus image here, or <span style={{ color: '#0284c7', fontWeight: 600 }}>browse files</span>
        </p>

        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
          <ImageIcon size={14} />
          <span>Supported Formats: PNG, JPG, JPEG, TIFF (Max 15MB)</span>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontSize: '0.85rem' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
