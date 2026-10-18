import React, { useState } from 'react';
import {
  Clock,
  Navigation,
  SlidersHorizontal,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Sparkles,
  ChevronRight,
  Footprints,
  Car
} from 'lucide-react';
import { RouteMap } from '../common/RouteMap';
import { ScoreBadge } from '../common/ScoreBadge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { LocationInput } from '../common/LocationInput';
import { predictRouteSafety, type SafetyInput, type SafetyResult } from '../../services/api';
import { usePredictions } from '../../context/PredictionContext';
import { useAuth } from '../../context/AuthContext';
import './RouteRecommendationPage.css';

interface RouteRecommendationPageProps {
  onNavigate: (route: string) => void;
}

export const RouteRecommendationPage: React.FC<RouteRecommendationPageProps> = ({ onNavigate }) => {
  const { currentPrediction, recordPrediction } = usePredictions();
  const { showToast } = useAuth();

  const [source, setSource] = useState(currentPrediction?.source || 'North Station, Boston, MA');
  const [destination, setDestination] = useState(currentPrediction?.destination || 'Boston Public Library, MA');
  const [sourceCoords, setSourceCoords] = useState<{ lat: number; lng: number } | undefined>();
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | undefined>();
  const [departureTime, setDepartureTime] = useState(currentPrediction?.departureTime || 'Now');
  const [travelMode, setTravelMode] = useState<'walking' | 'driving'>(currentPrediction?.travelMode === 'driving' ? 'driving' : 'walking');
  const [profile, setProfile] = useState<'night' | 'commute' | 'maximum' | 'custom'>('night');

  // Multi-factor sliders
  const [lighting, setLighting] = useState(currentPrediction?.factors.lighting || 9);
  const [crimeRisk, setCrimeRisk] = useState(currentPrediction?.factors.crime_risk || 1);
  const [accidentRisk, setAccidentRisk] = useState(currentPrediction?.factors.accident_risk || 2);
  const [crowdLevel, setCrowdLevel] = useState(currentPrediction?.factors.crowd_level || 8);
  const [showSliders, setShowSliders] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAlt, setSelectedAlt] = useState<'safe' | 'fastest'>('safe');

  // Handle Preset Changes
  const handleSelectPreset = (preset: 'night' | 'commute' | 'maximum' | 'custom') => {
    setProfile(preset);
    if (preset === 'night') {
      setLighting(9);
      setCrimeRisk(1);
      setAccidentRisk(2);
      setCrowdLevel(8);
      setShowSliders(false);
    } else if (preset === 'commute') {
      setLighting(7);
      setCrimeRisk(2);
      setAccidentRisk(3);
      setCrowdLevel(7);
      setShowSliders(false);
    } else if (preset === 'maximum') {
      setLighting(10);
      setCrimeRisk(1);
      setAccidentRisk(1);
      setCrowdLevel(9);
      setShowSliders(false);
    } else {
      setShowSliders(true);
    }
  };

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
    const tempCoords = sourceCoords;
    setSourceCoords(destCoords);
    setDestCoords(tempCoords);
    if (error) setError('');
  };

  const isSameLocation = Boolean(
    source.trim() &&
    destination.trim() &&
    source.trim().toLowerCase() === destination.trim().toLowerCase()
  );

  const isFormValid = Boolean(
    source.trim() &&
    destination.trim() &&
    !isSameLocation
  );

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim() || !destination.trim()) {
      setError('Please provide both starting point and destination.');
      return;
    }

    if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setError('Choose two different locations');
      return;
    }

    setLoading(true);
    setError('');

    const factors: SafetyInput = {
      lighting,
      crime_risk: crimeRisk,
      accident_risk: accidentRisk,
      crowd_level: crowdLevel,
      origin: source.trim(),
      source: source.trim(),
      destination: destination.trim(),
      departureTime,
      travelMode,
    };

    try {
      const result: SafetyResult = await predictRouteSafety(factors);
      recordPrediction({
        source: source.trim(),
        destination: destination.trim(),
        departureTime,
        travelMode,
        profile,
        factors,
        result,
      });
      showToast('Route safety score successfully evaluated!', 'success');
    } catch (err: any) {
      setError(err?.message || 'Could not connect to AI safety engine. Please verify the backend service.');
    } finally {
      setLoading(false);
    }
  };

  const activeResult = currentPrediction?.result;

  return (
    <div className="route-page-grid">
      {/* Left Column: Route Planner Form */}
      <div className="route-panel-card">
        <div className="panel-header">
          <h2>Route Safety Finder</h2>
          <p>AI-evaluated multi-factor route scoring prioritizing well-lit, active corridors.</p>
        </div>

        <form onSubmit={handleEvaluate} className="route-inputs-group">
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '13px',
              }}
            >
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {isSameLocation && (
            <div
              className="location-duplicate-warning"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#fffbeb',
                border: '1px solid #fde047',
                color: '#854d0e',
                fontSize: '13px',
                fontWeight: 500,
              }}
              role="alert"
            >
              <AlertTriangle size={16} />
              <span>Choose two different locations</span>
            </div>
          )}

          <div className="location-inputs-cluster">
            <LocationInput
              id="route-source"
              label="Origin / Start Location"
              value={source}
              onChange={(val, coords) => {
                setSource(val);
                if (coords) setSourceCoords(coords);
                if (error) setError('');
              }}
              onSelectLocation={(loc) => {
                setSource(loc.displayName);
                setSourceCoords({ lat: loc.lat, lng: loc.lng });
                if (error) setError('');
              }}
              placeholder="Search origin (e.g. Central Station)..."
              icon="origin"
              required
            />

            <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
              <button
                type="button"
                className="swap-locations-btn"
                onClick={handleSwap}
                title="Swap Origin and Destination"
                aria-label="Swap starting location and destination"
              >
                <RotateCw size={14} />
              </button>
            </div>

            <LocationInput
              id="route-dest"
              label="Destination"
              value={destination}
              onChange={(val, coords) => {
                setDestination(val);
                if (coords) setDestCoords(coords);
                if (error) setError('');
              }}
              onSelectLocation={(loc) => {
                setDestination(loc.displayName);
                setDestCoords({ lat: loc.lat, lng: loc.lng });
                if (error) setError('');
              }}
              placeholder="Search destination (e.g. Millennium Park)..."
              icon="destination"
              required
            />
          </div>

          {/* Time & Travel Mode Row */}
          <div className="time-mode-row">
            <div className="route-input-field">
              <label htmlFor="route-time">Departure</label>
              <div className="route-input-wrapper">
                <Clock className="route-field-icon" size={16} />
                <select
                  id="route-time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                >
                  <option value="Now">Depart Now</option>
                  <option value="Night (After 9 PM)">Night (After 9 PM)</option>
                  <option value="Late Night (After 12 AM)">Late Night (After 12 AM)</option>
                  <option value="Rush Hour (5 PM - 8 PM)">Rush Hour (5 PM - 8 PM)</option>
                  <option value="Morning (6 AM - 9 AM)">Morning (6 AM - 9 AM)</option>
                </select>
              </div>
            </div>

            <div className="route-input-field">
              <label htmlFor="route-mode">Travel Mode</label>
              <div className="route-input-wrapper">
                {travelMode === 'walking' ? (
                  <Footprints className="route-field-icon" size={16} />
                ) : (
                  <Car className="route-field-icon" size={16} />
                )}
                <select
                  id="route-mode"
                  value={travelMode}
                  onChange={(e) => setTravelMode(e.target.value as 'walking' | 'driving')}
                >
                  <option value="walking">Pedestrian Walk</option>
                  <option value="driving">Driving / Taxi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preset Profile Chips */}
          <div className="preset-chips-container">
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              Safety Preference
            </label>
            <div className="preset-chips-list">
              <button
                type="button"
                className={`preset-chip-btn ${profile === 'night' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('night')}
              >
                <span>🌙 Night Corridor</span>
              </button>
              <button
                type="button"
                className={`preset-chip-btn ${profile === 'commute' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('commute')}
              >
                <span>⚡ Fast & Safe</span>
              </button>
              <button
                type="button"
                className={`preset-chip-btn ${profile === 'maximum' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('maximum')}
              >
                <span>👥 Max Crowd</span>
              </button>
              <button
                type="button"
                className={`preset-chip-btn ${profile === 'custom' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('custom')}
              >
                <SlidersHorizontal size={13} />
                <span>Custom</span>
              </button>
            </div>
          </div>

          {/* Custom Sliders Panel */}
          {showSliders && (
            <div className="sliders-drawer">
              <div className="slider-unit">
                <div className="slider-meta-row">
                  <span>Streetlighting Priority</span>
                  <strong>{lighting}/10</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={lighting}
                  onChange={(e) => setLighting(Number(e.target.value))}
                  className="slider-input"
                />
              </div>

              <div className="slider-unit">
                <div className="slider-meta-row">
                  <span>Crime Tolerance (Lower is Safer)</span>
                  <strong>{crimeRisk}/10</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={crimeRisk}
                  onChange={(e) => setCrimeRisk(Number(e.target.value))}
                  className="slider-input"
                />
              </div>

              <div className="slider-unit">
                <div className="slider-meta-row">
                  <span>Accident Risk Tolerance</span>
                  <strong>{accidentRisk}/10</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={accidentRisk}
                  onChange={(e) => setAccidentRisk(Number(e.target.value))}
                  className="slider-input"
                />
              </div>

              <div className="slider-unit">
                <div className="slider-meta-row">
                  <span>Crowd Density Requirement</span>
                  <strong>{crowdLevel}/10</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={crowdLevel}
                  onChange={(e) => setCrowdLevel(Number(e.target.value))}
                  className="slider-input"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="evaluate-action-btn"
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <span>Evaluating Safety Factors...</span>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Find Safe Routes</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Interactive Map & Route Recommendations */}
      <div className="route-results-column">
        {loading ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '60px 20px',
            }}
          >
            <LoadingSpinner message="Evaluating real-time crime indexes, streetlights, and crowd density..." />
          </div>
        ) : (
          <>
            {/* Interactive Vector Map */}
            <RouteMap
              source={source}
              destination={destination}
              sourceCoords={sourceCoords}
              destinationCoords={destCoords}
              safetyScore={activeResult?.safety_score || 88}
              selectedAlternative={selectedAlt}
              onSelectAlternative={(alt) => setSelectedAlt(alt)}
            />

            {/* Navigability & Safety Policy Disclaimer */}
            <div
              style={{
                background: activeResult?.is_navigable ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${activeResult?.is_navigable ? '#bbf7d0' : '#fde047'}`,
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '12px',
                color: activeResult?.is_navigable ? '#166534' : '#854d0e',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                margin: '14px 0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <ShieldCheck size={15} />
                <span>
                  Safety Policy Notice &bull;{' '}
                  {activeResult?.is_navigable
                    ? 'Live Road Network'
                    : 'Demonstration & Sandbox Preview (Non-Navigable)'}
                </span>
              </div>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                {activeResult?.navigability_notice ||
                  'Demonstration safety preview. SafeRoute prioritizes illuminated, active corridors over shortest transit distance. No route can be guaranteed 100% safe.'}
              </p>
            </div>

            {/* Route Alternatives Selection */}
            <div className="alternatives-container">
              {/* Alternative 1: Primary Safe Route */}
              <div
                className={`alternative-card ${selectedAlt === 'safe' ? 'selected' : ''}`}
                onClick={() => setSelectedAlt('safe')}
              >
                <div className="alt-meta-block">
                  <div className="alt-route-icon safe">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="alt-details">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4>
                        {activeResult?.alternatives?.[0]?.name ||
                          'Primary Safe Corridor (Recommended)'}
                      </h4>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: '#e0f2fe',
                          color: '#0369a1',
                          fontWeight: 600,
                        }}
                      >
                        {activeResult?.alternatives?.[0]?.distanceText || 'Demo (1.8 km)'} &bull;{' '}
                        {activeResult?.alternatives?.[0]?.durationText || '22 mins'}
                      </span>
                    </div>
                    <p>
                      {activeResult?.alternatives?.[0]?.summary ||
                        'Via Lit Commercial Avenue • High foot traffic & CCTV coverage'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <ScoreBadge score={activeResult?.safety_score || 88} size="md" />
                  <button
                    type="button"
                    className="view-details-link-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('prediction-details');
                    }}
                  >
                    <span>Full Audit</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Alternative 2: Direct Shortcut */}
              <div
                className={`alternative-card ${selectedAlt === 'fastest' ? 'selected' : ''}`}
                onClick={() => setSelectedAlt('fastest')}
              >
                <div className="alt-meta-block">
                  <div className="alt-route-icon">
                    <Navigation size={22} />
                  </div>
                  <div className="alt-details">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4>
                        {activeResult?.alternatives?.[1]?.name ||
                          'Direct Shortcut Alternative'}
                      </h4>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: '#fef3c7',
                          color: '#b45309',
                          fontWeight: 600,
                        }}
                      >
                        {activeResult?.alternatives?.[1]?.distanceText || 'Demo (1.4 km)'} &bull;{' '}
                        {activeResult?.alternatives?.[1]?.durationText || '17 mins'}
                      </span>
                    </div>
                    <p>
                      {activeResult?.alternatives?.[1]?.summary ||
                        'Shorter distance but traverses unmonitored backstreets with diminished lighting'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <ScoreBadge
                    score={
                      activeResult?.alternatives?.[1]?.safety_score ||
                      Math.max((activeResult?.safety_score || 88) - 24, 45)
                    }
                    size="md"
                  />
                  <button
                    type="button"
                    className="view-details-link-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('prediction-details');
                    }}
                  >
                    <span>Full Audit</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* AI Scoring Logic Explanation */}
            {activeResult?.scoring_explanation && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  margin: '12px 0',
                }}
              >
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: '0 0 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={14} color="#087f8c" />
                  <span>AI Scoring Explanation & Model Inference</span>
                </h4>
                <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  {activeResult.scoring_explanation}
                </p>
              </div>
            )}

            {/* Factor Breakdown Grid */}
            <div className="factor-breakdown-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Safety Factor Matrix
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Model: {activeResult?.model || 'Random Forest Regressor'}
                </span>
              </div>

              <div className="factor-meters-grid">
                <div className="factor-meter-cell">
                  <span className="cell-label">Streetlighting</span>
                  <span className="cell-value">{lighting}/10</span>
                  <div className="cell-progress-track">
                    <div
                      className="cell-progress-bar green"
                      style={{ width: `${lighting * 10}%` }}
                    />
                  </div>
                </div>

                <div className="factor-meter-cell">
                  <span className="cell-label">Crime Security</span>
                  <span className="cell-value">{(10 - crimeRisk)}/10</span>
                  <div className="cell-progress-track">
                    <div
                      className="cell-progress-bar green"
                      style={{ width: `${(10 - crimeRisk) * 10}%` }}
                    />
                  </div>
                </div>

                <div className="factor-meter-cell">
                  <span className="cell-label">Traffic Safety</span>
                  <span className="cell-value">{(10 - accidentRisk)}/10</span>
                  <div className="cell-progress-track">
                    <div
                      className="cell-progress-bar amber"
                      style={{ width: `${(10 - accidentRisk) * 10}%` }}
                    />
                  </div>
                </div>

                <div className="factor-meter-cell">
                  <span className="cell-label">Crowd Density</span>
                  <span className="cell-value">{crowdLevel}/10</span>
                  <div className="cell-progress-track">
                    <div
                      className="cell-progress-bar green"
                      style={{ width: `${crowdLevel * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
