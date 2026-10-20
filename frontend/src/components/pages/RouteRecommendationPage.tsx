import React, { useState } from 'react';
import {
  Clock,
  SlidersHorizontal,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Footprints,
  Car,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { RouteMap } from '../common/RouteMap';
import { LocationInput } from '../common/LocationInput';
import { RouteList } from '../routes/RouteList';
import { AddPlaceModal } from '../common/AddPlaceModal';
import {
  predictRouteSafety,
  type SafetyInput,
  type SafetyResult,
  type RouteAlternativeItem,
  type GeocodeResult,
} from '../../services/api';
import { usePredictions } from '../../context/PredictionContext';
import { useAuth } from '../../context/AuthContext';
import './RouteRecommendationPage.css';

interface RouteRecommendationPageProps {
  onNavigate: (route: string) => void;
}

export interface DestinationStop {
  id: string;
  address: string;
  coords?: { lat: number; lng: number };
}

export const RouteRecommendationPage: React.FC<RouteRecommendationPageProps> = ({ onNavigate }) => {
  const { currentPrediction, recordPrediction } = usePredictions();
  const { showToast } = useAuth();

  const [source, setSource] = useState(currentPrediction?.source || 'North Station, Boston, MA');
  const [sourceCoords, setSourceCoords] = useState<{ lat: number; lng: number } | undefined>();

  const [destinations, setDestinations] = useState<DestinationStop[]>(() => {
    if (currentPrediction?.destinations && currentPrediction.destinations.length > 0) {
      return currentPrediction.destinations.map((d: any, idx: number) => ({
        id: d.id || `dest-${idx}-${Date.now()}`,
        address: typeof d === 'string' ? d : d.address || d.name || '',
        coords: typeof d === 'object' ? d.coords : undefined,
      }));
    }
    return [
      {
        id: 'dest-0',
        address: currentPrediction?.destination || 'Boston Public Library, MA',
        coords: undefined,
      },
    ];
  });

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
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(Boolean(currentPrediction?.result));
  const [selectedRouteId, setSelectedRouteId] = useState<string>('alt_safe_corridor');

  // Missing Place & Interactive Pin Placement State
  const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false);
  const [modalInitialQuery, setModalInitialQuery] = useState('');
  const [modalInitialCoords, setModalInitialCoords] = useState<{ lat: number; lng: number } | undefined>();
  const [isPinDropMode, setIsPinDropMode] = useState(false);
  const [activeInputTarget, setActiveInputTarget] = useState<'origin' | number>('origin');

  const handleOpenAddPlace = (target: 'origin' | number, queryText = '') => {
    setActiveInputTarget(target);
    setModalInitialQuery(queryText);
    setIsAddPlaceModalOpen(true);
  };

  const handlePlaceAdded = (place: GeocodeResult) => {
    if (activeInputTarget === 'origin') {
      setSource(place.displayName);
      setSourceCoords({ lat: place.lat, lng: place.lng });
    } else if (typeof activeInputTarget === 'number') {
      handleDestinationSelect(activeInputTarget, {
        displayName: place.displayName,
        lat: place.lat,
        lng: place.lng,
      });
    }
    showToast(`Added "${place.name}" to SafeRoute!`, 'success');
  };

  const handlePinDropped = (coords: { lat: number; lng: number }) => {
    setModalInitialCoords(coords);
    showToast(`Pin dropped at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}. Opening place form...`, 'info');
    setIsPinDropMode(false);
    setIsAddPlaceModalOpen(true);
  };

  // Handle destination list modifications
  const handleAddDestination = () => {
    setDestinations((prev) => [
      ...prev,
      {
        id: `dest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        address: '',
        coords: undefined,
      },
    ]);
  };

  const handleRemoveDestination = (idx: number) => {
    if (destinations.length <= 1) return;
    setDestinations((prev) => prev.filter((_, i) => i !== idx));
    if (error) setError('');
    setErrorStatus(null);
  };

  const handleMoveDestination = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= destinations.length) return;
    setDestinations((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
    if (error) setError('');
    setErrorStatus(null);
  };

  const handleDestinationAddressChange = (
    idx: number,
    address: string,
    coords?: { lat: number; lng: number }
  ) => {
    setDestinations((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        address,
        coords: coords || (address !== copy[idx].address ? undefined : copy[idx].coords),
      };
      return copy;
    });
    if (error) setError('');
    setErrorStatus(null);
  };

  const handleDestinationSelect = (
    idx: number,
    loc: { displayName: string; lat: number; lng: number }
  ) => {
    setDestinations((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        address: loc.displayName,
        coords: { lat: loc.lat, lng: loc.lng },
      };
      return copy;
    });
    if (error) setError('');
    setErrorStatus(null);
  };

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
    if (destinations.length === 1) {
      const tempSource = source;
      const tempSourceCoords = sourceCoords;
      setSource(destinations[0].address);
      setSourceCoords(destinations[0].coords);
      setDestinations([
        {
          ...destinations[0],
          address: tempSource,
          coords: tempSourceCoords,
        },
      ]);
    } else {
      const allPoints = [{ address: source, coords: sourceCoords }, ...destinations];
      allPoints.reverse();
      setSource(allPoints[0].address);
      setSourceCoords(allPoints[0].coords);
      setDestinations(
        allPoints.slice(1).map((pt, idx) => ({
          id: destinations[idx]?.id || `dest-${idx}-${Date.now()}`,
          address: pt.address,
          coords: pt.coords,
        }))
      );
    }
    if (error) setError('');
    setErrorStatus(null);
  };

  const isSameLocation = Boolean(
    source.trim() &&
    destinations.some(
      (d) => d.address.trim() && d.address.trim().toLowerCase() === source.trim().toLowerCase()
    )
  );

  const hasDuplicateDestinations = Boolean(
    destinations.some(
      (d, i) =>
        d.address.trim() &&
        destinations.some(
          (other, j) => i !== j && other.address.trim().toLowerCase() === d.address.trim().toLowerCase()
        )
    )
  );

  const isFormValid = Boolean(
    source.trim() &&
    destinations.length > 0 &&
    destinations.every((d) => d.address.trim().length > 0) &&
    !isSameLocation &&
    !hasDuplicateDestinations
  );

  const performEvaluation = async (startLoc: string, currentDestinations: DestinationStop[]) => {
    if (!startLoc.trim() || currentDestinations.length === 0 || !currentDestinations.every((d) => d.address.trim())) {
      setError('Please provide starting point and all destination stops.');
      setErrorStatus(400);
      return;
    }

    if (
      currentDestinations.some(
        (d) => d.address.trim().toLowerCase() === startLoc.trim().toLowerCase()
      )
    ) {
      setError('Choose two different locations');
      setErrorStatus(400);
      return;
    }

    setLoading(true);
    setError('');
    setErrorStatus(null);

    const primaryFinalDest = currentDestinations[currentDestinations.length - 1];

    const factors: SafetyInput = {
      lighting,
      crime_risk: crimeRisk,
      accident_risk: accidentRisk,
      crowd_level: crowdLevel,
      origin: startLoc.trim(),
      source: startLoc.trim(),
      destination: primaryFinalDest.address.trim(),
      destinations: currentDestinations.map((d) => ({
        id: d.id,
        address: d.address.trim(),
        name: d.address.trim(),
        coords: d.coords,
      })),
      departureTime,
      travelMode,
      originCoords: sourceCoords,
      destinationCoords: primaryFinalDest.coords,
    };

    try {
      const result: SafetyResult = await predictRouteSafety(factors);
      setHasSearched(true);
      if (result.originCoords) {
        setSourceCoords(result.originCoords);
      }
      if (result.destinationPoints && result.destinationPoints.length > 0) {
        setDestinations((prev) =>
          prev.map((d, i) => {
            const pt = result.destinationPoints?.[i];
            if (pt && typeof pt.lat === 'number' && typeof pt.lng === 'number') {
              return { ...d, coords: { lat: pt.lat, lng: pt.lng } };
            }
            return d;
          })
        );
      } else if (result.destinationCoords) {
        setDestinations((prev) =>
          prev.map((d, i) => {
            if (i === prev.length - 1) {
              return { ...d, coords: result.destinationCoords };
            }
            return d;
          })
        );
      }
      recordPrediction({
        source: startLoc.trim(),
        destination: primaryFinalDest.address.trim(),
        destinations: currentDestinations.map((d) => ({
          id: d.id,
          address: d.address.trim(),
          name: d.address.trim(),
          coords: d.coords,
        })),
        departureTime,
        travelMode,
        profile,
        factors,
        result,
      });
      if (result.alternatives && result.alternatives.length > 0) {
        const targetId = result.recommendedRouteId || result.alternatives[0].id;
        setSelectedRouteId(targetId);
      }
      showToast('Route safety score successfully evaluated!', 'success');
    } catch (err: any) {
      setHasSearched(true);
      const status =
        err?.statusCode ||
        (err?.message?.includes('429')
          ? 429
          : err?.message?.includes('404')
          ? 404
          : err?.message?.includes('422')
          ? 422
          : 500);
      setErrorStatus(status);

      // Clean error messaging (ISSUE-11 Task 5: Raw errors are never shown)
      if (status === 429) {
        setError('Route service is busy. Please retry in a minute.');
      } else if (status === 404) {
        setError('No route available between these points.');
      } else if (status === 422) {
        setError(err?.userMessage || err?.message || 'Unable to resolve destination location. Please verify addresses.');
      } else {
        setError(err?.userMessage || "Couldn't load routes.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    await performEvaluation(source, destinations);
  };

  const handleLoadDemo = () => {
    const demoStart = 'North Station, Boston, MA';
    const demoEnd = 'Boston Public Library, MA';
    setSource(demoStart);
    setSourceCoords({ lat: 42.3662, lng: -71.0603 });
    const demoStops: DestinationStop[] = [
      {
        id: 'dest-0',
        address: demoEnd,
        coords: { lat: 42.3498, lng: -71.0776 },
      },
    ];
    setDestinations(demoStops);
    setError('');
    setErrorStatus(null);
    performEvaluation(demoStart, demoStops);
  };

  const activeResult = currentPrediction?.result;

  const defaultDemoRoutes: RouteAlternativeItem[] = [
    {
      id: 'alt_safe_corridor',
      letter: 'A',
      name: 'Route A: Primary Safe Corridor (Recommended)',
      summary: 'Via Well-Lit Commercial Avenue & Active Pedestrian Corridor',
      type: 'safe_corridor',
      safety_score: activeResult?.safety_score || 88,
      rating: 'Optimal Safety (Low Risk)',
      isRecommended: true,
      isNavigable: false,
      distanceText: travelMode === 'driving' ? '2.1 km' : '1.8 km',
      durationText: travelMode === 'driving' ? '7 mins' : '22 mins',
      color: '#0d9488',
      factors: {
        lighting: lighting || 9,
        crime_risk: crimeRisk || 1,
        accident_risk: accidentRisk || 2,
        crowd_level: crowdLevel || 8,
        emergency_proximity: 8.5,
      },
      safetyAttributes: ['High Municipal Lighting', 'Active Foot Traffic', 'Safe Haven Nearby'],
      caveats: ['Prioritizes personal security over shortest transit distance.'],
    },
    {
      id: 'alt_balanced_transit',
      letter: 'B',
      name: 'Route B: Balanced Transit Avenue',
      summary: 'Via Mixed Commercial Boulevard & Monitored Public Transit Links',
      type: 'balanced_transit',
      safety_score: Math.max((activeResult?.safety_score || 88) - 14, 68),
      rating: 'Moderate Caution (Balanced)',
      isRecommended: false,
      isNavigable: false,
      distanceText: travelMode === 'driving' ? '1.8 km' : '1.6 km',
      durationText: travelMode === 'driving' ? '6 mins' : '19 mins',
      color: '#8b5cf6',
      factors: {
        lighting: Math.max(1, (lighting || 9) - 2),
        crime_risk: Math.min(10, (crimeRisk || 1) + 2),
        accident_risk: Math.min(10, (accidentRisk || 2) + 1),
        crowd_level: Math.max(1, (crowdLevel || 8) - 2),
        emergency_proximity: 7.0,
      },
      safetyAttributes: ['Active Transit Arteries', 'Steady Streetlighting'],
      caveats: ['Intermittent quiet zones between commercial blocks.'],
    },
    {
      id: 'alt_direct_shortcut',
      letter: 'C',
      name: 'Route C: Direct Shortcut (Fastest / Higher Risk)',
      summary: 'Traverses unmonitored back alleys and industrial cut-throughs',
      type: 'direct_shortcut',
      safety_score: Math.max((activeResult?.safety_score || 88) - 36, 48),
      rating: 'Elevated Risk (Dark Zones)',
      isRecommended: false,
      isNavigable: false,
      distanceText: travelMode === 'driving' ? '1.5 km' : '1.4 km',
      durationText: travelMode === 'driving' ? '5 mins' : '16 mins',
      color: '#f59e0b',
      factors: {
        lighting: Math.max(1, (lighting || 9) - 5),
        crime_risk: Math.min(10, (crimeRisk || 1) + 4.5),
        accident_risk: Math.min(10, (accidentRisk || 2) + 2.5),
        crowd_level: Math.max(1, (crowdLevel || 8) - 5),
        emergency_proximity: 4.5,
      },
      safetyAttributes: ['Shortest direct linear displacement'],
      caveats: ['Diminished streetlighting with dark zones.', 'Isolated during late hours.'],
    },
  ];

  const currentRoutes: RouteAlternativeItem[] =
    activeResult?.alternatives && activeResult.alternatives.length > 0
      ? activeResult.alternatives
      : (hasSearched && !error && currentPrediction?.result ? defaultDemoRoutes : []);

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

          {hasDuplicateDestinations && !isSameLocation && (
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
              <span>Please ensure all destination stops are unique</span>
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
              onAddMissingPlace={(q) => handleOpenAddPlace('origin', q)}
              placeholder="Search origin (e.g. Saiangel Society, Thorala Paduka Temple)..."
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

            <div className="destinations-stack">
              {destinations.map((dest, idx) => {
                const isOnlyOne = destinations.length === 1;
                const isFirst = idx === 0;
                const isLast = idx === destinations.length - 1;
                const letter = String.fromCharCode(66 + idx);
                const labelText = isOnlyOne
                  ? 'Destination'
                  : isLast
                  ? `Final Destination (${letter})`
                  : `Stop ${idx + 1} (${letter})`;

                return (
                  <div key={dest.id} className="destination-item-wrapper">
                    <LocationInput
                      id={`route-dest-${dest.id}`}
                      label={labelText}
                      value={dest.address}
                      onChange={(val, coords) => {
                        handleDestinationAddressChange(idx, val, coords);
                      }}
                      onSelectLocation={(loc) => {
                        handleDestinationSelect(idx, loc);
                      }}
                      onAddMissingPlace={(q) => handleOpenAddPlace(idx, q)}
                      placeholder={
                        isLast
                          ? 'Search destination (e.g. Saiangel Society, Alandi)...'
                          : `Search Stop ${idx + 1}...`
                      }
                      icon={isLast ? 'destination' : 'origin'}
                      required
                      headerAction={
                        destinations.length > 1 ? (
                          <div className="dest-row-actions">
                            <button
                              type="button"
                              className="dest-action-btn"
                              disabled={isFirst}
                              onClick={() => handleMoveDestination(idx, 'up')}
                              title="Move stop earlier"
                              aria-label={`Move ${labelText} earlier`}
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              className="dest-action-btn"
                              disabled={isLast}
                              onClick={() => handleMoveDestination(idx, 'down')}
                              title="Move stop later"
                              aria-label={`Move ${labelText} later`}
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              type="button"
                              className="dest-action-btn delete-btn"
                              onClick={() => handleRemoveDestination(idx)}
                              title="Remove this stop"
                              aria-label={`Remove ${labelText}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>

            <div className="add-destination-container">
              <button
                type="button"
                className="add-destination-btn"
                onClick={handleAddDestination}
              >
                <Plus size={15} />
                <span>Add Destination / Stop</span>
              </button>
            </div>
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
        {/* Interactive Vector Map with Animated Loading Corridor Line (ISSUE-11 Task 1) */}
        <RouteMap
          source={source}
          destination={destinations[destinations.length - 1]?.address || ''}
          destinations={destinations.map((d, idx) => ({
            id: d.id,
            name: d.address,
            coords: d.coords,
            label: String.fromCharCode(66 + idx),
            isFinal: idx === destinations.length - 1,
          }))}
          sourceCoords={sourceCoords}
          destinationCoords={destinations[destinations.length - 1]?.coords}
          safetyScore={activeResult?.safety_score || 88}
          routes={currentRoutes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={(id) => setSelectedRouteId(id)}
          isLoading={loading}
          error={error || null}
          isPinDropMode={isPinDropMode}
          onPinDropped={handlePinDropped}
          onCancelPinDrop={() => setIsPinDropMode(false)}
          onOpenAddPlace={() => handleOpenAddPlace('origin', '')}
        />

        {/* Modular Route Alternatives List: Loading Skeletons, Error State, Empty States, and Route Cards */}
        <RouteList
          routes={currentRoutes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={(id) => setSelectedRouteId(id)}
          onNavigateDetails={() => onNavigate('prediction-details')}
          isLoading={loading}
          error={error}
          errorStatus={errorStatus}
          onRetry={() => performEvaluation(source, destinations)}
          hasSearched={hasSearched}
          onUseDemoLocations={handleLoadDemo}
          recommendationSummary={activeResult?.explanation?.summary || activeResult?.statusMessage}
          hasEligibleRoute={activeResult?.recommendedIndex !== undefined ? activeResult.recommendedIndex !== -1 : true}
          className="routes-sidebar"
        />

        {/* Evaluated Telemetry and Score Breakdown (Rendered when routes are successfully displayed) */}
        {!loading && !error && currentRoutes.length > 0 && (
          <>
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
                  <Sparkles size={14} color="#0d9488" />
                  <span>AI Scoring Explanation & Model Inference</span>
                </h4>
                <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  {activeResult.scoring_explanation}
                </p>
              </div>
            )}

            {/* Factor Explanations (FR-4.8: One-line reason per factor) */}
            {activeResult?.explanation?.factorReasons && activeResult.explanation.factorReasons.length > 0 && (
              <div
                style={{
                  background: '#ffffff',
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
                    margin: '0 0 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ShieldCheck size={14} color="#0d9488" />
                  <span>Recommendation Factor Explanations</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeResult.explanation.factorReasons.map((fr, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ color: '#334155', fontWeight: 500 }}>{fr.reason}</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: fr.score >= 80 ? '#166534' : fr.score >= 50 ? '#854d0e' : '#991b1b',
                          background: fr.score >= 80 ? '#dcfce7' : fr.score >= 50 ? '#fef9c3' : '#fee2e2',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                        }}
                      >
                        {fr.score}/100
                      </span>
                    </div>
                  ))}
                </div>
                {activeResult.explanation.disclaimer && (
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '10px 0 0', fontStyle: 'italic' }}>
                    {activeResult.explanation.disclaimer}
                  </p>
                )}
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

      {/* Missing Place & Manual Pin Placement Modal */}
      <AddPlaceModal
        isOpen={isAddPlaceModalOpen}
        onClose={() => setIsAddPlaceModalOpen(false)}
        onPlaceAdded={handlePlaceAdded}
        initialQuery={modalInitialQuery}
        initialCoords={modalInitialCoords}
        onStartPinPlacement={() => setIsPinDropMode(true)}
      />
    </div>
  );
};
