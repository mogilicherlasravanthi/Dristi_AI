import React from 'react';
import { RefreshCw, Trash2, FileCheck, Eye } from 'lucide-react';

export default function ImagePreview({ imageFile, imagePreviewUrl, onChangeImage, onRemoveImage, disabled }) {
  if (!imageFile || !imagePreviewUrl) return null;

  const fileSizeKB = (imageFile.size / 1024).toFixed(1);
  const fileSizeMB = (imageFile.size / (1024 * 1024)).toFixed(2);
  const displaySize = imageFile.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;

  return (
    <div className="preview-card">
      <div className="preview-image-wrapper">
        <img
          src={imagePreviewUrl}
          alt="Retinal Fundus Photograph Preview"
          className="preview-image"
        />
      </div>

      <div className="file-details">
        <div className="file-info" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileCheck size={20} className="text-teal-600" />
          <div>
            <div className="file-name" title={imageFile.name}>{imageFile.name}</div>
            <div className="file-size">{displaySize} • {imageFile.type || 'Retinal Fundus Image'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            onClick={onChangeImage}
            disabled={disabled}
            title="Change uploaded image"
          >
            <RefreshCw size={14} />
            <span>Change</span>
          </button>

          <button
            type="button"
            className="btn btn-danger"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            onClick={onRemoveImage}
            disabled={disabled}
            title="Remove image"
          >
            <Trash2 size={14} />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}
