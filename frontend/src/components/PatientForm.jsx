import React from 'react';
import { User, Calendar, MapPin, Clock, Hash } from 'lucide-react';

export default function PatientForm({ formData, onChange, disabled }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon">
          <User size={18} />
        </div>
        <div>
          <h2 className="card-title">Patient Information</h2>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Enter basic demographic details for the screening report</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Patient ID <span className="required">*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            name="patientId"
            className="form-input"
            value={formData.patientId || ''}
            onChange={handleChange}
            placeholder="e.g. PAT-2026-0891"
            required
            disabled={disabled}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Age (Years) <span className="required">*</span>
          </label>
          <input
            type="number"
            name="age"
            className="form-input"
            value={formData.age || ''}
            onChange={handleChange}
            placeholder="e.g. 54"
            min="1"
            max="120"
            required
            disabled={disabled}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Gender <span className="required">*</span>
          </label>
          <select
            name="sex"
            className="form-select"
            value={formData.sex || 'Female'}
            onChange={handleChange}
            disabled={disabled}
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Screening Center / Location
          </label>
          <input
            type="text"
            name="location"
            className="form-input"
            value={formData.location || ''}
            onChange={handleChange}
            placeholder="e.g. PHC Rampur, District Hospital"
            disabled={disabled}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Diabetes Duration (Years)
          </label>
          <input
            type="number"
            name="diabetesDuration"
            className="form-input"
            value={formData.diabetesDuration || ''}
            onChange={handleChange}
            placeholder="e.g. 8"
            min="0"
            max="60"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
