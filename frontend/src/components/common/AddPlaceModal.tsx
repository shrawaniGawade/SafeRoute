import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  ShieldCheck,
  LocateFixed,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import { saveCustomPlace, type CreateCustomPlaceInput, type GeocodeResult } from '../../services/api';
import './AddPlaceModal.css';

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceAdded: (place: GeocodeResult) => void;
  initialQuery?: string;
  initialCoords?: { lat: number; lng: number };
  onStartPinPlacement?: () => void;
}

export const AddPlaceModal: React.FC<AddPlaceModalProps> = ({
  isOpen,
  onClose,
  onPlaceAdded,
  initialQuery = '',
  initialCoords,
  onStartPinPlacement,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('residential_society');
  const [pinType, setPinType] = useState<'exact_entrance' | 'complex_gate' | 'general_place'>('complex_gate');
  const [locality, setLocality] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Prefill initial query and coordinates
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMessage(null);

      if (initialQuery) {
        // Parse "Society Name, near Landmark" if present
        const nearMatch = initialQuery.match(/^(.+?)(?:,\s*|\s+)near(?:by)?\s+(.+)$/i);
        if (nearMatch) {
          setName(nearMatch[1].trim());
          setLandmark(nearMatch[2].trim());
        } else {
          setName(initialQuery.trim());
        }
      }

      if (initialCoords && typeof initialCoords.lat === 'number' && typeof initialCoords.lng === 'number') {
        setLat(initialCoords.lat.toFixed(6));
        setLng(initialCoords.lng.toFixed(6));
      }
    }
  }, [isOpen, initialQuery, initialCoords]);

  // Sync external coords update (e.g. from map click)
  useEffect(() => {
    if (initialCoords && typeof initialCoords.lat === 'number' && typeof initialCoords.lng === 'number') {
      setLat(initialCoords.lat.toFixed(6));
      setLng(initialCoords.lng.toFixed(6));
    }
  }, [initialCoords]);

  if (!isOpen) return null;

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setError('Unable to detect current GPS location. Please enter coordinates or drop a pin on the map.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Place name is required (e.g. Saiangel Society, Thorala Paduka Temple).');
      return;
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      setError('Please provide valid coordinates (Latitude -90 to 90, Longitude -180 to 180) or click "Drop Pin on Map".');
      return;
    }

    setIsSaving(true);

    try {
      const payload: CreateCustomPlaceInput = {
        name: trimmedName,
        category,
        pinType,
        lat: parsedLat,
        lng: parsedLng,
        locality: locality.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        description: description.trim() || undefined,
      };

      const result = await saveCustomPlace(payload);
      const saved = result.place;

      setSuccessMessage('Place saved to SafeRoute! Future searches and routes can now find this location.');

      const geocodeItem: GeocodeResult = {
        placeId: `cp_${saved._id}`,
        name: saved.name,
        displayName:
          saved.address ||
          `${saved.name}${saved.landmark ? ` (near ${saved.landmark})` : ''}, ${saved.locality || ''}, ${saved.city || ''}`.replace(
            /,\s*,/g,
            ','
          ),
        label: saved.name,
        lat: saved.lat,
        lng: saved.lng,
        type: saved.category,
        category: saved.category,
        pinType: saved.pinType,
        source: 'user_manual_pin',
        verificationStatus: saved.verificationStatus || 'community_submitted',
        landmark: saved.landmark,
        locality: saved.locality,
        importance: 0.95,
        confidence: 0.9,
      };

      setTimeout(() => {
        onPlaceAdded(geocodeItem);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="add-place-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-place-title">
      <div className="add-place-modal-card">
        <div className="add-place-header">
          <div className="add-place-header-info">
            <div className="header-icon-badge">
              <MapPin size={20} />
            </div>
            <div>
              <h2 id="add-place-title" className="add-place-title">
                Add Missing Place to SafeRoute
              </h2>
              <p className="add-place-subtitle">
                Can’t find your residential society, temple, or gate? Add it to make SafeRoute navigation work for your community.
              </p>
            </div>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="modal-alert-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="modal-alert-success" role="status">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="add-place-form">
          {/* Place Name */}
          <div className="form-group">
            <label htmlFor="custom-place-name" className="form-label">
              Place / Society Name <span className="required">*</span>
            </label>
            <input
              id="custom-place-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Saiangel Society, Thorala Paduka Temple"
              required
            />
          </div>

          {/* Category & Pin Type */}
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="custom-place-category" className="form-label">
                Category <span className="required">*</span>
              </label>
              <select
                id="custom-place-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="residential_society">🏢 Residential Society / Apartment</option>
                <option value="society_entrance">🚪 Society Entrance Gate</option>
                <option value="building_entrance">🏢 Building / Wing Entrance</option>
                <option value="temple_religious">🛕 Temple / Religious Landmark</option>
                <option value="hospital_clinic">🏥 Hospital / Clinic</option>
                <option value="school_college">🎓 School / College</option>
                <option value="shop_market">🛍️ Local Shop / Market</option>
                <option value="office_business">💼 Office / Business Park</option>
                <option value="junction_lane">🛣️ Road Junction / Internal Lane</option>
                <option value="other">📍 Other Local Landmark</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="custom-place-pin-type" className="form-label">
                Pin Location Type
              </label>
              <select
                id="custom-place-pin-type"
                className="form-select"
                value={pinType}
                onChange={(e) => setPinType(e.target.value as any)}
              >
                <option value="complex_gate">Society Main Gate (Best for Navigation)</option>
                <option value="exact_entrance">Exact Pedestrian / Vehicle Entrance</option>
                <option value="general_place">General Compound / Center</option>
              </select>
            </div>
          </div>

          {/* Locality & Landmark */}
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="custom-place-locality" className="form-label">
                Locality / Area
              </label>
              <input
                id="custom-place-locality"
                type="text"
                className="form-input"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Bhosari / Dighi, Alandi Road"
              />
            </div>

            <div className="form-group">
              <label htmlFor="custom-place-landmark" className="form-label">
                Nearby Landmark
              </label>
              <input
                id="custom-place-landmark"
                type="text"
                className="form-input"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Thorala Paduka Temple"
              />
            </div>
          </div>

          {/* City & State */}
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="custom-place-city" className="form-label">
                City / Region
              </label>
              <input
                id="custom-place-city"
                type="text"
                className="form-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pune, Pimpri-Chinchwad"
              />
            </div>

            <div className="form-group">
              <label htmlFor="custom-place-state" className="form-label">
                State
              </label>
              <input
                id="custom-place-state"
                type="text"
                className="form-input"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Maharashtra"
              />
            </div>
          </div>

          {/* Coordinates Picker Row */}
          <div className="coordinates-picker-box">
            <div className="coordinates-header">
              <span className="coordinates-title">
                <Navigation size={14} /> Geographic Coordinates (Latitude, Longitude)
              </span>
              <div className="coord-actions">
                {onStartPinPlacement && (
                  <button
                    type="button"
                    className="coord-action-chip"
                    onClick={() => {
                      onStartPinPlacement();
                      onClose();
                    }}
                    title="Click or drag pin on the interactive map"
                  >
                    <MapPin size={12} />
                    <span>Drop Pin on Map</span>
                  </button>
                )}
                <button
                  type="button"
                  className="coord-action-chip"
                  onClick={handleUseGPS}
                  disabled={isLocating}
                  title="Detect GPS location"
                >
                  {isLocating ? <Loader2 size={12} className="spin-icon" /> : <LocateFixed size={12} />}
                  <span>{isLocating ? 'Detecting...' : 'Current GPS'}</span>
                </button>
              </div>
            </div>

            <div className="form-row-2" style={{ marginTop: '8px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  type="text"
                  className="form-input"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="Latitude (e.g. 18.642953)"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  type="text"
                  className="form-input"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="Longitude (e.g. 73.876243)"
                  required
                />
              </div>
            </div>
            {lat && lng && (
              <div className="coord-preview">
                Selected: <strong>{lat}, {lng}</strong>
              </div>
            )}
          </div>

          {/* Description / Navigation Tip */}
          <div className="form-group">
            <label htmlFor="custom-place-desc" className="form-label">
              Navigation Instructions / Landmark Note (Optional)
            </label>
            <textarea
              id="custom-place-desc"
              className="form-textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Main visitor gate is on the north side off the service lane facing Thorala Paduka Temple."
            />
          </div>

          {/* Privacy & Verification Note */}
          <div className="verification-notice">
            <ShieldCheck size={16} className="notice-icon" />
            <span>
              Community contributions are stored in SafeRoute's verified database and labeled as community-submitted
              until verified. No personal data is exposed.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions-row">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-save-place" disabled={isSaving || !name.trim() || !lat || !lng}>
              {isSaving ? (
                <>
                  <Loader2 size={16} className="spin-icon" />
                  <span>Saving Location...</span>
                </>
              ) : (
                <>
                  <MapPin size={16} />
                  <span>Save Place to SafeRoute</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
