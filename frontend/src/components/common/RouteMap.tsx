import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Lightbulb,
  Shield,
  Layers
} from 'lucide-react';
import './RouteMap.css';

interface RouteMapProps {
  source?: string;
  destination?: string;
  safetyScore?: number;
  selectedAlternative?: 'safe' | 'fastest';
  onSelectAlternative?: (alt: 'safe' | 'fastest') => void;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  source = '742 Evergreen Terrace',
  destination = 'Springfield Central Station',
  safetyScore = 88,
  selectedAlternative = 'safe',
  onSelectAlternative,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLights, setShowLights] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
  const handleReset = () => setZoomLevel(1);

  // SVG Coordinates for city grid
  // Origin Pin A: (120, 360)
  // Destination Pin B: (680, 120)
  // Safe Route Path: (120,360) -> (240, 360) -> (240, 220) -> (480, 220) -> (480, 120) -> (680, 120)
  // Direct / Fastest Path: (120,360) -> (360, 360) -> (360, 260) -> (580, 260) -> (680, 120)

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
          className={`map-layer-chip ${selectedAlternative === 'safe' ? 'active' : ''}`}
          onClick={() => onSelectAlternative?.('safe')}
        >
          <Layers size={14} />
          <span>Safest Route ({safetyScore}/100)</span>
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

        {/* Alternative Route B (Direct / Unlit Shortcut) */}
        <path
          d="M 120 360 L 360 360 L 360 260 L 580 260 L 680 120"
          fill="none"
          stroke="#f59e0b"
          strokeWidth={selectedAlternative === 'fastest' ? '7' : '4'}
          strokeDasharray="6 6"
          opacity={selectedAlternative === 'fastest' ? '1' : '0.55'}
          cursor="pointer"
          onClick={() => onSelectAlternative?.('fastest')}
        />

        {/* Primary Safe Route A (Evaluated Safe Corridor) */}
        <path
          d="M 120 360 L 240 360 L 240 220 L 480 220 L 480 120 L 680 120"
          fill="none"
          stroke="#087f8c"
          strokeWidth={selectedAlternative === 'safe' ? '8' : '5'}
          filter="url(#neon-glow)"
          cursor="pointer"
          onClick={() => onSelectAlternative?.('safe')}
        />
        <path
          d="M 120 360 L 240 360 L 240 220 L 480 220 L 480 120 L 680 120"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3"
        />

        {/* Origin Marker A */}
        <g transform="translate(120, 360)">
          <circle r="16" fill="rgba(8, 127, 140, 0.3)" className="pulse-ring" />
          <circle r="10" fill="#087f8c" stroke="#ffffff" strokeWidth="2.5" />
          <text textAnchor="middle" y="4" fill="#ffffff" fontSize="10" fontWeight="bold">A</text>
        </g>

        {/* Destination Marker B */}
        <g transform="translate(680, 120)">
          <circle r="16" fill="rgba(16, 185, 129, 0.3)" className="pulse-ring" />
          <circle r="10" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
          <text textAnchor="middle" y="4" fill="#ffffff" fontSize="10" fontWeight="bold">B</text>
        </g>
      </svg>

      {/* Floating Status Overlay */}
      <div className="map-status-overlay">
        <div className="status-route-name">
          <span>{source || 'Starting Location'}</span> &rarr; <span>{destination || 'Destination'}</span>
        </div>
        <div className="status-route-meta">
          Showing: {selectedAlternative === 'safe' ? 'SafeRoute Primary Corridor' : 'Direct Alternative'} &bull; Illumination: 92% &bull; CCTV Active
        </div>
      </div>

      {/* Map Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color-line safe"></div>
          <span>Primary Safe Corridor</span>
        </div>
        <div className="legend-item">
          <div className="legend-color-line alt"></div>
          <span>Direct Shortcut (Moderate Risk)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color-dot light"></div>
          <span>Continuous Streetlighting</span>
        </div>
      </div>
    </div>
  );
};
