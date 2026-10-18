import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Lightbulb,
  Shield,
  Layers
} from 'lucide-react';
import type { RouteAlternativeItem } from '../../services/api';
import './RouteMap.css';

interface RouteMapProps {
  source?: string;
  destination?: string;
  sourceCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  safetyScore?: number;
  routes?: RouteAlternativeItem[];
  selectedRouteId?: string;
  onSelectRoute?: (routeId: string) => void;
  // Backwards compatibility with previous interface
  selectedAlternative?: 'safe' | 'fastest';
  onSelectAlternative?: (alt: 'safe' | 'fastest') => void;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  source = '742 Evergreen Terrace',
  destination = 'Springfield Central Station',
  sourceCoords,
  destinationCoords,
  safetyScore = 88,
  routes,
  selectedRouteId,
  onSelectRoute,
  selectedAlternative = 'safe',
  onSelectAlternative,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLights, setShowLights] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
  const handleReset = () => setZoomLevel(1);

  // Fallback route IDs if not provided
  const routeAId = routes?.[0]?.id || 'alt_safe_corridor';
  const routeBId = routes?.[1]?.id || 'alt_balanced_transit';
  const routeCId = routes?.[2]?.id || 'alt_direct_shortcut';

  // Determine current active selection
  const currentSelectedId =
    selectedRouteId ||
    (selectedAlternative === 'fastest' ? routeCId : routeAId);

  const isRouteASelected = currentSelectedId === routeAId;
  const isRouteBSelected = currentSelectedId === routeBId;
  const isRouteCSelected = currentSelectedId === routeCId;

  const handleSelect = (id: string) => {
    if (onSelectRoute) {
      onSelectRoute(id);
    }
    if (onSelectAlternative) {
      onSelectAlternative(
        id === routeCId || id.includes('shortcut') || id.includes('fastest')
          ? 'fastest'
          : 'safe'
      );
    }
  };

  // Determine which routes to render (if 1 route returned by provider, only render Route A)
  const totalRoutesCount = routes && routes.length > 0 ? routes.length : 3;
  const renderRouteB = totalRoutesCount >= 2;
  const renderRouteC = totalRoutesCount >= 3;

  // Selected route metadata for overlay
  const selectedRouteObj = routes?.find((r) => r.id === currentSelectedId) || routes?.[0];
  const selectedRouteDisplayName = selectedRouteObj?.name || (isRouteASelected ? 'Primary Safe Corridor (Route A)' : isRouteBSelected ? 'Balanced Transit Avenue (Route B)' : 'Direct Shortcut (Route C)');

  return (
    <div className="route-map-container" role="region" aria-label="Interactive Route Safety Map">
      {/* Layer Toggles */}
      <div className="map-layers-bar">
        <button
          type="button"
          className={`map-layer-chip ${showLights ? 'active' : ''}`}
          onClick={() => setShowLights(!showLights)}
          title="Toggle Streetlight Telemetry"
        >
          <Lightbulb size={14} />
          <span>Streetlights</span>
        </button>
        <button
          type="button"
          className={`map-layer-chip ${showSafeZones ? 'active' : ''}`}
          onClick={() => setShowSafeZones(!showSafeZones)}
          title="Toggle Verified Police / Safe Havens"
        >
          <Shield size={14} />
          <span>Safe Zones</span>
        </button>
        <button
          type="button"
          className={`map-layer-chip ${isRouteASelected ? 'active' : ''}`}
          onClick={() => handleSelect(routeAId)}
          title="Select Route A (Safest Corridor)"
        >
          <Layers size={14} />
          <span>Route A ({selectedRouteObj?.safety_score || safetyScore}/100)</span>
        </button>
      </div>

      {/* Map Control Buttons */}
      <div className="map-controls-bar">
        <button
          type="button"
          className="map-control-btn"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <button
          type="button"
          className="map-control-btn"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <button
          type="button"
          className="map-control-btn"
          onClick={handleReset}
          aria-label="Reset zoom"
          title="Reset View"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Vector City Grid SVG */}
      <svg
        className="map-svg-canvas"
        viewBox="0 0 800 480"
        preserveAspectRatio="xMidYMid meet"
        style={{
          transform: `scale(${zoomLevel})`,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <defs>
          <pattern id="city-blocks" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="56" height="56" fill="#0f192d" rx="6" />
          </pattern>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base Grid Background */}
        <rect width="800" height="480" fill="#070c17" />
        <rect x="0" y="0" width="800" height="480" fill="url(#city-blocks)" />

        {/* Arterial Avenues (Main Streets) */}
        <path d="M 0 120 L 800 120" stroke="#1e293b" strokeWidth="14" />
        <path d="M 0 220 L 800 220" stroke="#1e293b" strokeWidth="16" />
        <path d="M 0 360 L 800 360" stroke="#1e293b" strokeWidth="14" />
        <path d="M 120 0 L 120 480" stroke="#1e293b" strokeWidth="14" />
        <path d="M 240 0 L 240 480" stroke="#1e293b" strokeWidth="16" />
        <path d="M 360 0 L 360 480" stroke="#1e293b" strokeWidth="14" />
        <path d="M 480 0 L 480 480" stroke="#1e293b" strokeWidth="16" />
        <path d="M 680 0 L 680 480" stroke="#1e293b" strokeWidth="14" />

        {/* Street Name Labels */}
        <text x="20" y="114" fill="#475569" fontSize="10" fontWeight="600">CENTRAL BLVD</text>
        <text x="20" y="214" fill="#475569" fontSize="10" fontWeight="600">LIGHTED COMMERCIAL CORRIDOR</text>
        <text x="20" y="354" fill="#475569" fontSize="10" fontWeight="600">SOUTH AVE</text>
        <text x="248" y="460" fill="#475569" fontSize="10" fontWeight="600">4TH ST</text>
        <text x="488" y="460" fill="#475569" fontSize="10" fontWeight="600">TRANSIT WAY</text>

        {/* Streetlight Nodes (Toggleable) */}
        {showLights && (
          <g id="streetlights">
            {[
              [120, 360], [180, 360], [240, 360],
              [240, 300], [240, 260], [240, 220],
              [320, 220], [400, 220], [480, 220],
              [480, 170], [480, 120], [580, 120], [680, 120]
            ].map(([x, y], idx) => (
              <circle
                key={`light-${idx}`}
                cx={x}
                cy={y}
                r="4"
                fill="#facc15"
                filter="url(#neon-glow)"
                opacity="0.9"
              />
            ))}
          </g>
        )}

        {/* Safe Zones / Police Boiled Points */}
        {showSafeZones && (
          <g id="safe-zones">
            <g transform="translate(240, 220)">
              <circle r="12" fill="rgba(8, 127, 140, 0.25)" />
              <circle r="6" fill="#087f8c" />
              <text x="14" y="4" fill="#38bdf8" fontSize="10" fontWeight="700">POLICE SUB-STATION</text>
            </g>
            <g transform="translate(480, 120)">
              <circle r="12" fill="rgba(16, 185, 129, 0.25)" />
              <circle r="6" fill="#10b981" />
              <text x="14" y="4" fill="#34d399" fontSize="10" fontWeight="700">24/7 TRANSIT HUB</text>
            </g>
          </g>
        )}

        {/* Route C: Direct Shortcut (Fastest / Higher Risk) */}
        {renderRouteC && (
          <g id="route-c-group">
            {/* Transparent click target */}
            <path
              d="M 120 360 L 360 360 L 360 260 L 580 260 L 680 120"
              fill="none"
              stroke="transparent"
              strokeWidth="24"
              cursor="pointer"
              onClick={() => handleSelect(routeCId)}
            />
            {/* Visible styled line: selected is thicker (8px) with glow */}
            <path
              d="M 120 360 L 360 360 L 360 260 L 580 260 L 680 120"
              fill="none"
              stroke="#f59e0b"
              strokeWidth={isRouteCSelected ? '8' : '4'}
              strokeDasharray="6 6"
              filter={isRouteCSelected ? 'url(#neon-glow)' : undefined}
              opacity={isRouteCSelected ? '1' : '0.55'}
              cursor="pointer"
              onClick={() => handleSelect(routeCId)}
            />
          </g>
        )}

        {/* Route B: Balanced Active Avenue */}
        {renderRouteB && (
          <g id="route-b-group">
            {/* Transparent click target */}
            <path
              d="M 120 360 L 120 220 L 360 220 L 360 120 L 680 120"
              fill="none"
              stroke="transparent"
              strokeWidth="24"
              cursor="pointer"
              onClick={() => handleSelect(routeBId)}
            />
            {/* Visible styled line: selected is thicker (8px) with glow */}
            <path
              d="M 120 360 L 120 220 L 360 220 L 360 120 L 680 120"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={isRouteBSelected ? '8' : '4'}
              strokeDasharray="10 4"
              filter={isRouteBSelected ? 'url(#neon-glow)' : undefined}
              opacity={isRouteBSelected ? '1' : '0.6'}
              cursor="pointer"
              onClick={() => handleSelect(routeBId)}
            />
          </g>
        )}

        {/* Route A: Primary Safe Corridor (Recommended) */}
        <g id="route-a-group">
          {/* Transparent click target */}
          <path
            d="M 120 360 L 240 360 L 240 220 L 480 220 L 480 120 L 680 120"
            fill="none"
            stroke="transparent"
            strokeWidth="24"
            cursor="pointer"
            onClick={() => handleSelect(routeAId)}
          />
          {/* Outer glow stroke: selected is thicker (8px) with neon glow */}
          <path
            d="M 120 360 L 240 360 L 240 220 L 480 220 L 480 120 L 680 120"
            fill="none"
            stroke="#087f8c"
            strokeWidth={isRouteASelected ? '8' : '4'}
            filter={isRouteASelected ? 'url(#neon-glow)' : undefined}
            opacity={isRouteASelected ? '1' : '0.65'}
            cursor="pointer"
            onClick={() => handleSelect(routeAId)}
          />
          {/* Inner core stroke */}
          <path
            d="M 120 360 L 240 360 L 240 220 L 480 220 L 480 120 L 680 120"
            fill="none"
            stroke="#38bdf8"
            strokeWidth={isRouteASelected ? '3' : '1.5'}
            cursor="pointer"
            onClick={() => handleSelect(routeAId)}
          />
        </g>

        {/* Origin Marker A */}
        <g transform="translate(120, 360)">
          <circle r="18" fill="rgba(8, 127, 140, 0.35)" className="pulse-ring" />
          <circle r="11" fill="#087f8c" stroke="#ffffff" strokeWidth="2.5" />
          <text textAnchor="middle" y="4" fill="#ffffff" fontSize="10" fontWeight="bold">A</text>
          {source && (
            <g transform="translate(0, -20)">
              <rect x="-60" y="-16" width="120" height="18" rx="4" fill="#0f172a" opacity="0.85" />
              <text textAnchor="middle" y="-4" fill="#38bdf8" fontSize="9" fontWeight="600">
                {source.split(',')[0].slice(0, 18)}
              </text>
            </g>
          )}
        </g>

        {/* Destination Marker B */}
        <g transform="translate(680, 120)">
          <circle r="18" fill="rgba(16, 185, 129, 0.35)" className="pulse-ring" />
          <circle r="11" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
          <text textAnchor="middle" y="4" fill="#ffffff" fontSize="10" fontWeight="bold">B</text>
          {destination && (
            <g transform="translate(0, -20)">
              <rect x="-60" y="-16" width="120" height="18" rx="4" fill="#0f172a" opacity="0.85" />
              <text textAnchor="middle" y="-4" fill="#34d399" fontSize="9" fontWeight="600">
                {destination.split(',')[0].slice(0, 18)}
              </text>
            </g>
          )}
        </g>
      </svg>

      {/* Floating Status Overlay */}
      <div className="map-status-overlay">
        <div className="status-route-name">
          <span>{source || 'Starting Location'}</span>
          {sourceCoords && <span className="coords-pill">({sourceCoords.lat.toFixed(4)}, {sourceCoords.lng.toFixed(4)})</span>}
          &nbsp;&rarr;&nbsp;
          <span>{destination || 'Destination'}</span>
          {destinationCoords && <span className="coords-pill">({destinationCoords.lat.toFixed(4)}, {destinationCoords.lng.toFixed(4)})</span>}
        </div>
        <div className="status-route-meta">
          Active: <strong>{selectedRouteDisplayName}</strong> &bull; Illumination: {selectedRouteObj?.factors?.lighting ? `${selectedRouteObj.factors.lighting * 10}%` : '92%'} &bull; CCTV Monitored
        </div>
      </div>

      {/* Map Legend */}
      <div className="map-legend">
        <div className="legend-item" onClick={() => handleSelect(routeAId)} style={{ cursor: 'pointer' }}>
          <div className="legend-color-line safe"></div>
          <span style={{ fontWeight: isRouteASelected ? 700 : 400 }}>Route A (Safe Corridor)</span>
        </div>
        {renderRouteB && (
          <div className="legend-item" onClick={() => handleSelect(routeBId)} style={{ cursor: 'pointer' }}>
            <div className="legend-color-line balanced" style={{ background: '#8b5cf6', boxShadow: isRouteBSelected ? '0 0 8px #8b5cf6' : 'none' }}></div>
            <span style={{ fontWeight: isRouteBSelected ? 700 : 400 }}>Route B (Balanced Transit)</span>
          </div>
        )}
        {renderRouteC && (
          <div className="legend-item" onClick={() => handleSelect(routeCId)} style={{ cursor: 'pointer' }}>
            <div className="legend-color-line alt" style={{ boxShadow: isRouteCSelected ? '0 0 8px #f59e0b' : 'none' }}></div>
            <span style={{ fontWeight: isRouteCSelected ? 700 : 400 }}>Route C (Direct Shortcut)</span>
          </div>
        )}
        <div className="legend-item">
          <div className="legend-color-dot light"></div>
          <span>Continuous Streetlighting</span>
        </div>
      </div>
    </div>
  );
};
