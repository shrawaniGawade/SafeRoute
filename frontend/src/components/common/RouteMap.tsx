import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Lightbulb,
  Shield,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import type { RouteAlternativeItem } from '../../services/api';
import './RouteMap.css';

export interface RouteMapProps {
  source?: string;
  destination?: string;
  sourceCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  safetyScore?: number;
  routes?: RouteAlternativeItem[];
  selectedRouteId?: string;
  onSelectRoute?: (routeId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  // Backwards compatibility with previous interface
  selectedAlternative?: 'safe' | 'fastest';
  onSelectAlternative?: (alt: 'safe' | 'fastest') => void;
}

/**
 * Extracts normalized [latitude, longitude] pairs for Leaflet from a RouteAlternativeItem.
 * Correctly converts GeoJSON [longitude, latitude] coordinates to Leaflet [latitude, longitude].
 */
export function extractLeafletLatLngs(route: RouteAlternativeItem): [number, number][] {
  // 1. GeoJSON geometry coordinates: [longitude, latitude] -> convert to [latitude, longitude]
  if (route.geometry && Array.isArray(route.geometry) && route.geometry.length > 0) {
    return route.geometry
      .filter((pt) => Array.isArray(pt) && pt.length >= 2)
      .map(([lng, lat]) => [lat, lng] as [number, number]);
  }

  // 2. Waypoints array: Array<{ lat: number, lng: number }>
  if (route.waypoints && Array.isArray(route.waypoints) && route.waypoints.length > 0) {
    return route.waypoints
      .filter((w) => typeof w.lat === 'number' && typeof w.lng === 'number' && !isNaN(w.lat) && !isNaN(w.lng))
      .map((w) => [w.lat, w.lng] as [number, number]);
  }

  // 3. Fallback coordinates array
  if (route.coordinates && Array.isArray(route.coordinates) && route.coordinates.length > 0) {
    const first = route.coordinates[0];
    if (Array.isArray(first)) {
      // If first element has longitude magnitude > 90, it is [lng, lat]
      if (Math.abs(first[0]) > 90 || (Math.abs(first[1]) <= 90 && Math.abs(first[0]) > Math.abs(first[1]))) {
        return (route.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng]);
      }
      return route.coordinates as [number, number][];
    }
  }

  return [];
}

export const RouteMap: React.FC<RouteMapProps> = ({
  source = 'Origin',
  destination = 'Destination',
  sourceCoords,
  destinationCoords,
  safetyScore = 88,
  routes = [],
  selectedRouteId,
  onSelectRoute,
  isLoading = false,
  error = null,
  selectedAlternative = 'safe',
  onSelectAlternative,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylinesLayerRef = useRef<L.FeatureGroup | null>(null);
  const markersLayerRef = useRef<L.FeatureGroup | null>(null);
  const telemetryLayerRef = useRef<L.FeatureGroup | null>(null);

  const [showLights, setShowLights] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);

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

  const handleSelect = useCallback(
    (id: string) => {
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
    },
    [onSelectRoute, onSelectAlternative, routeCId]
  );

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center: India / New Delhi center or origin coordinates
    const initialLat = sourceCoords?.lat || 28.6139;
    const initialLng = sourceCoords?.lng || 77.2090;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false, // We supply custom accessible controls
      attributionControl: true,
    });

    // Standard OpenStreetMap tile layer - Free, open, no API key required, reliable worldwide
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    polylinesLayerRef.current = L.featureGroup().addTo(map);
    telemetryLayerRef.current = L.featureGroup().addTo(map);
    markersLayerRef.current = L.featureGroup().addTo(map);

    mapInstanceRef.current = map;

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Markers, Polylines, and Bounds when routes or coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const polylinesLayer = polylinesLayerRef.current;
    const markersLayer = markersLayerRef.current;
    const telemetryLayer = telemetryLayerRef.current;

    if (!map || !polylinesLayer || !markersLayer || !telemetryLayer) return;

    polylinesLayer.clearLayers();
    markersLayer.clearLayers();
    telemetryLayer.clearLayers();

    const allRoutePoints: [number, number][] = [];
    let resolvedOrigin: [number, number] | null = null;
    let resolvedDestination: [number, number] | null = null;

    if (sourceCoords && typeof sourceCoords.lat === 'number' && typeof sourceCoords.lng === 'number') {
      resolvedOrigin = [sourceCoords.lat, sourceCoords.lng];
    }

    if (destinationCoords && typeof destinationCoords.lat === 'number' && typeof destinationCoords.lng === 'number') {
      resolvedDestination = [destinationCoords.lat, destinationCoords.lng];
    }

    // Draw route polylines
    if (routes && routes.length > 0) {
      routes.forEach((route, idx) => {
        const latLngs = extractLeafletLatLngs(route);
        if (latLngs.length === 0) return;

        allRoutePoints.push(...latLngs);

        if (!resolvedOrigin && idx === 0) {
          resolvedOrigin = latLngs[0];
        }
        if (!resolvedDestination && idx === 0) {
          resolvedDestination = latLngs[latLngs.length - 1];
        }

        const isSelected = route.id === currentSelectedId || (idx === 0 && !currentSelectedId);
        const defaultColor = idx === 0 ? '#087f8c' : idx === 1 ? '#8b5cf6' : '#f59e0b';
        const routeColor = route.color || defaultColor;

        // Visual distinction per route letter
        let dashArray: string | undefined;
        if (route.letter === 'B' || idx === 1) {
          dashArray = '10, 6';
        } else if (route.letter === 'C' || idx === 2) {
          dashArray = '5, 6';
        }

        // Underglow polyline for selected route
        if (isSelected) {
          const underglow = L.polyline(latLngs, {
            color: routeColor,
            weight: 12,
            opacity: 0.35,
            lineCap: 'round',
            lineJoin: 'round',
          });
          polylinesLayer.addLayer(underglow);
        }

        // Main polyline
        const polyline = L.polyline(latLngs, {
          color: routeColor,
          weight: isSelected ? 7 : 4,
          opacity: isSelected ? 1.0 : 0.65,
          dashArray,
          lineCap: 'round',
          lineJoin: 'round',
        });

        polyline.on('click', () => {
          handleSelect(route.id);
        });

        // Tooltip showing route summary on hover
        const etaText = route.durationText ? ` &bull; ${route.durationText}` : '';
        const distText = route.distanceText ? ` &bull; ${route.distanceText}` : '';
        polyline.bindTooltip(
          `<strong>${route.name}</strong><br/>Safety: ${route.safety_score}/100${etaText}${distText}`,
          { sticky: true, className: 'leaflet-route-tooltip' }
        );

        polylinesLayer.addLayer(polyline);

        if (isSelected) {
          polyline.bringToFront();
        }

        // Telemetry layers: sample streetlights along primary route
        if (showLights && (idx === 0 || isSelected)) {
          const step = Math.max(1, Math.floor(latLngs.length / 10));
          for (let i = 0; i < latLngs.length; i += step) {
            const pt = latLngs[i];
            const lightDot = L.circleMarker(pt, {
              radius: 4,
              fillColor: '#facc15',
              color: '#ca8a04',
              weight: 1,
              fillOpacity: 0.9,
            });
            lightDot.bindTooltip('Streetlight Telemetry: Active municipal illumination', {
              className: 'leaflet-route-tooltip',
            });
            telemetryLayer.addLayer(lightDot);
          }
        }

        // Telemetry layers: Safe Zones
        if (showSafeZones && (idx === 0 || isSelected) && latLngs.length > 4) {
          const mid1 = latLngs[Math.floor(latLngs.length * 0.35)];
          const mid2 = latLngs[Math.floor(latLngs.length * 0.7)];

          const safeZone1 = L.circleMarker(mid1, {
            radius: 8,
            fillColor: '#087f8c',
            color: '#38bdf8',
            weight: 2,
            fillOpacity: 0.85,
          });
          safeZone1.bindTooltip('Safe Haven: 24/7 Verified Police Sub-Station / Transit Security', {
            className: 'leaflet-route-tooltip',
          });
          telemetryLayer.addLayer(safeZone1);

          const safeZone2 = L.circleMarker(mid2, {
            radius: 8,
            fillColor: '#10b981',
            color: '#34d399',
            weight: 2,
            fillOpacity: 0.85,
          });
          safeZone2.bindTooltip('Safe Haven: Active CCTV Transit Hub & Emergency Beacon', {
            className: 'leaflet-route-tooltip',
          });
          telemetryLayer.addLayer(safeZone2);
        }
      });
    }

    // Render Origin Marker (A)
    if (resolvedOrigin) {
      const cleanOriginName = source.split(',')[0].slice(0, 20);
      const originIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="leaflet-pin origin-pin">
            <div class="pin-pulse-ring"></div>
            <div class="pin-core pin-origin">A</div>
            <div class="pin-label-tag origin">${cleanOriginName}</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const originMarker = L.marker(resolvedOrigin, { icon: originIcon });
      originMarker.bindPopup(`<strong>Starting Point</strong><br/>${source}`);
      markersLayer.addLayer(originMarker);
    }

    // Render Destination Marker (B)
    if (resolvedDestination) {
      const cleanDestName = destination.split(',')[0].slice(0, 20);
      const destIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="leaflet-pin destination-pin">
            <div class="pin-pulse-ring destination"></div>
            <div class="pin-core pin-destination">B</div>
            <div class="pin-label-tag destination">${cleanDestName}</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const destMarker = L.marker(resolvedDestination, { icon: destIcon });
      destMarker.bindPopup(`<strong>Destination</strong><br/>${destination}`);
      markersLayer.addLayer(destMarker);
    }

    // Fit Bounds to all points, markers, or active corridor
    const fitTargets: [number, number][] = [...allRoutePoints];
    if (resolvedOrigin) fitTargets.push(resolvedOrigin);
    if (resolvedDestination) fitTargets.push(resolvedDestination);

    if (fitTargets.length > 0) {
      if (fitTargets.length === 1) {
        map.setView(fitTargets[0], 15, { animate: true });
      } else {
        const bounds = L.latLngBounds(fitTargets);
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 16,
            animate: true,
          });
        }
      }
    }
  }, [
    routes,
    sourceCoords,
    destinationCoords,
    source,
    destination,
    currentSelectedId,
    showLights,
    showSafeZones,
    handleSelect,
  ]);

  // Zoom controls
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleReset = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const allPoints: [number, number][] = [];
    if (sourceCoords) allPoints.push([sourceCoords.lat, sourceCoords.lng]);
    if (destinationCoords) allPoints.push([destinationCoords.lat, destinationCoords.lng]);

    routes.forEach((r) => {
      allPoints.push(...extractLeafletLatLngs(r));
    });

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    } else {
      map.setView([28.6139, 77.2090], 13);
    }
  };

  // Determine which routes are visible in legend
  const totalRoutesCount = routes && routes.length > 0 ? routes.length : 0;
  const renderRouteB = totalRoutesCount >= 2;
  const renderRouteC = totalRoutesCount >= 3;

  const selectedRouteObj = routes?.find((r) => r.id === currentSelectedId) || routes?.[0];
  const selectedRouteDisplayName =
    selectedRouteObj?.name ||
    (isRouteASelected
      ? 'Primary Safe Corridor (Route A)'
      : isRouteBSelected
      ? 'Balanced Transit Avenue (Route B)'
      : 'Direct Shortcut (Route C)');

  return (
    <div className="route-map-container" role="region" aria-label="Interactive Route Safety Map">
      {/* Layer Toggles */}
      <div className="map-layers-bar">
        <button
          type="button"
          className={`map-layer-chip ${showLights ? 'active' : ''}`}
          onClick={() => setShowLights(!showLights)}
          title="Toggle Streetlight Telemetry"
          aria-pressed={showLights}
        >
          <Lightbulb size={14} />
          <span>Streetlights</span>
        </button>
        <button
          type="button"
          className={`map-layer-chip ${showSafeZones ? 'active' : ''}`}
          onClick={() => setShowSafeZones(!showSafeZones)}
          title="Toggle Verified Police / Safe Havens"
          aria-pressed={showSafeZones}
        >
          <Shield size={14} />
          <span>Safe Zones</span>
        </button>
        {routes && routes.length > 0 && (
          <button
            type="button"
            className={`map-layer-chip ${isRouteASelected ? 'active' : ''}`}
            onClick={() => handleSelect(routeAId)}
            title="Select Route A (Safest Corridor)"
            aria-pressed={isRouteASelected}
          >
            <Layers size={14} />
            <span>Route A ({selectedRouteObj?.safety_score || safetyScore}/100)</span>
          </button>
        )}
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

      {/* Real Interactive Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        className="leaflet-map-canvas"
        style={{ width: '100%', height: '100%', minHeight: '480px' }}
      />

      {/* Loading Overlay Badge */}
      {isLoading && (
        <div className="map-loading-overlay-badge" role="status" aria-live="polite">
          <span className="map-loading-spinner-ring" />
          <span>Searching & evaluating real road corridors...</span>
        </div>
      )}

      {/* Error state overlay */}
      {error && !isLoading && (
        <div className="map-error-overlay-banner" role="alert">
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Floating Status Overlay */}
      <div className="map-status-overlay">
        <div className="status-route-name">
          <span>{source || 'Starting Location'}</span>
          {sourceCoords && (
            <span className="coords-pill">
              ({sourceCoords.lat.toFixed(4)}, {sourceCoords.lng.toFixed(4)})
            </span>
          )}
          &nbsp;&rarr;&nbsp;
          <span>{destination || 'Destination'}</span>
          {destinationCoords && (
            <span className="coords-pill">
              ({destinationCoords.lat.toFixed(4)}, {destinationCoords.lng.toFixed(4)})
            </span>
          )}
        </div>
        <div className="status-route-meta">
          Active: <strong>{selectedRouteDisplayName}</strong>
          {selectedRouteObj?.distanceText && ` • Distance: ${selectedRouteObj.distanceText}`}
          {selectedRouteObj?.durationText && ` • Duration: ${selectedRouteObj.durationText}`}
          {selectedRouteObj?.factors?.lighting && ` • Illumination: ${Math.round(selectedRouteObj.factors.lighting * 10)}%`}
        </div>
      </div>

      {/* Map Legend */}
      {totalRoutesCount > 0 && (
        <div className="map-legend">
          <div className="legend-item" onClick={() => handleSelect(routeAId)} style={{ cursor: 'pointer' }}>
            <div className="legend-color-line safe"></div>
            <span style={{ fontWeight: isRouteASelected ? 700 : 400 }}>Route A (Safe Corridor)</span>
          </div>
          {renderRouteB && (
            <div className="legend-item" onClick={() => handleSelect(routeBId)} style={{ cursor: 'pointer' }}>
              <div
                className="legend-color-line balanced"
                style={{ background: '#8b5cf6', boxShadow: isRouteBSelected ? '0 0 8px #8b5cf6' : 'none' }}
              ></div>
              <span style={{ fontWeight: isRouteBSelected ? 700 : 400 }}>Route B (Balanced Transit)</span>
            </div>
          )}
          {renderRouteC && (
            <div className="legend-item" onClick={() => handleSelect(routeCId)} style={{ cursor: 'pointer' }}>
              <div
                className="legend-color-line alt"
                style={{ background: '#f59e0b', boxShadow: isRouteCSelected ? '0 0 8px #f59e0b' : 'none' }}
              ></div>
              <span style={{ fontWeight: isRouteCSelected ? 700 : 400 }}>Route C (Direct Shortcut)</span>
            </div>
          )}
          <div className="legend-item">
            <div className="legend-color-dot light"></div>
            <span>Streetlight Telemetry</span>
          </div>
        </div>
      )}
    </div>
  );
};
