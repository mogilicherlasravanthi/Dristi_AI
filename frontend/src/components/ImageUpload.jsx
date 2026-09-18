import React, { useState, useRef } from 'react';

/**
 * ImageUpload Component
 * Allows healthcare workers to select a local retinal/fundus image (JPG, JPEG, PNG),
 * view a local browser preview, check file metadata, and replace/remove the image.
 * 
 * All state is kept local to the browser. No file data is sent to external servers.
 */
export default function ImageUpload({ selectedFile, onImageSelect, onImageRemove }) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Helper to process selected file
  const processFile = (file) => {
    if (!file) return;

    // Validate image format
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert('Invalid file format. Please upload a JPG, JPEG, or PNG retinal fundus image.');
      return;
    }

    // Create local object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    onImageSelect(file);
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  // Handle Drag & Drop events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Remove / reset image
  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemove();
  };

  // Format file size in KB / MB
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-container">
      {!selectedFile ? (
        <div
          className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload Retinal Image drop area"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current && fileInputRef.current.click();
            }
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className="file-input-hidden"
            aria-hidden="true"
            id="retinal-image-input"
          />

          <div className="drop-zone-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
            </svg>
          </div>

          <p className="drop-zone-title">Upload Retinal Image</p>
          <p className="drop-zone-subtitle">
            Drag & drop fundus image here, or click to browse files
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.5rem' }}>
            Supported Formats: JPG, JPEG, PNG
          </p>
        </div>
      ) : (
        <div className="preview-card">
          <div className="preview-image-wrapper">
            <img
              src={previewUrl}
              alt="Retinal Fundus Image Preview"
              className="preview-image"
            />
          </div>

          <div className="file-details">
            <div className="file-info">
              <span className="file-name" title={selectedFile.name}>
                📷 {selectedFile.name}
              </span>
              <span className="file-size">{formatFileSize(selectedFile.size)}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                aria-label="Change selected retinal image"
              >
                Change
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleRemove}
                aria-label="Remove selected retinal image"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Hidden input for changing image */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className="file-input-hidden"
            aria-hidden="true"
            id="retinal-image-input-replace"
          />
        </div>
      )}
    </div>
  );
}
