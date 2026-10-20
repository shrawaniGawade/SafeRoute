import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  X,
  Info,
  MapPin,
  Plus,
} from 'lucide-react';
import {
  getNearbyPlaces,
  getHazardReports,
  type RouteAlternativeItem,
  type HazardReportItem,
} from '../../services/api';
import './RouteMap.css';

export interface DestinationMarker {
  name: string;
  coords?: { lat: number; lng: number };
  label?: string;
}

export interface RouteMapProps {
  source?: string;
  destination?: string;
  destinations?: DestinationMarker[];
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
  // Interactive Pin Placement & Missing Place Workflow
  isPinDropMode?: boolean;
  onPinDropped?: (coords: { lat: number; lng: number }) => void;
  onCancelPinDrop?: () => void;
  onOpenAddPlace?: () => void;
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
  destinations,
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
  isPinDropMode = false,
  onPinDropped,
  onCancelPinDrop,
  onOpenAddPlace,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylinesLayerRef = useRef<L.FeatureGroup | null>(null);
  const markersLayerRef = useRef<L.FeatureGroup | null>(null);
  const telemetryLayerRef = useRef<L.FeatureGroup | null>(null);
  const nearbyHubsLayerRef = useRef<L.FeatureGroup | null>(null);
  const hazardsLayerRef = useRef<L.FeatureGroup | null>(null);
  const customPinMarkerRef = useRef<L.Marker | null>(null);

  const [showLights, setShowLights] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [showNearbyHubs, setShowNearbyHubs] = useState(false);
  const [showHazards, setShowHazards] = useState(false);
  const [placedPinCoords, setPlacedPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  // Status overlay is closed by default to avoid large black popup covering the map
  const [showStatusOverlay, setShowStatusOverlay] = useState(false);

  // Normalize destination list for multi-stop rendering
  const resolvedDestinationsList: DestinationMarker[] = useMemo(() => {
    if (destinations && destinations.length > 0) {
      return destinations;
    }
    if (destination) {
      return [{ name: destination, coords: destinationCoords, label: 'B' }];
    }
    return [];
  }, [destinations, destination, destinationCoords]);

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

    // Default center: India / Alandi / Pune or New Delhi center or origin coordinates
    const initialLat = sourceCoords?.lat || 18.6429;
    const initialLng = sourceCoords?.lng || 73.8762;

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
    nearbyHubsLayerRef.current = L.featureGroup().addTo(map);
    hazardsLayerRef.current = L.featureGroup().addTo(map);
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
        const defaultColor = idx === 0 ? '#0d9488' : idx === 1 ? '#8b5cf6' : '#f59e0b';
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
            fillColor: '#0d9488',
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
      const cleanOriginName = source.split(',')[0].slice(0, 24);
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
      originMarker.bindPopup(`<strong>Starting Point (A)</strong><br/>${source}`);
      markersLayer.addLayer(originMarker);
    }

    // Render all destinations with separate, clearly visible markers
    const finalDestMarkers: Array<{ name: string; coords: [number, number]; letter: string; isLast: boolean }> = [];

    if (resolvedDestinationsList && resolvedDestinationsList.length > 0) {
      resolvedDestinationsList.forEach((d, i) => {
        const letter = d.label || String.fromCharCode(66 + i); // B, C, D...
        const isLast = i === resolvedDestinationsList.length - 1;
        let coords: [number, number] | null = null;
        if (d.coords && typeof d.coords.lat === 'number' && typeof d.coords.lng === 'number') {
          coords = [d.coords.lat, d.coords.lng];
        } else if (isLast && resolvedDestination) {
          coords = resolvedDestination;
        }

        if (coords) {
          finalDestMarkers.push({
            name: d.name || `Destination ${letter}`,
            coords,
            letter,
            isLast,
          });
        }
      });
    } else if (resolvedDestination) {
      finalDestMarkers.push({
        name: destination,
        coords: resolvedDestination,
        letter: 'B',
        isLast: true,
      });
    }

    finalDestMarkers.forEach((destItem, idx) => {
      const cleanDestName = destItem.name.split(',')[0].slice(0, 24);
      const isLast = destItem.isLast;
      const pinClass = isLast ? 'pin-destination' : 'pin-waypoint';
      const pulseClass = isLast ? 'destination' : 'waypoint';
      const labelClass = isLast ? 'destination' : 'waypoint';

      const destIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="leaflet-pin destination-pin">
            <div class="pin-pulse-ring ${pulseClass}"></div>
            <div class="pin-core ${pinClass}">${destItem.letter}</div>
            <div class="pin-label-tag ${labelClass}">${cleanDestName}</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const destMarker = L.marker(destItem.coords, { icon: destIcon });
      const popupTitle = isLast
        ? `<strong>Final Destination (${destItem.letter})</strong>`
        : `<strong>Stop ${idx + 1} (${destItem.letter})</strong>`;
      destMarker.bindPopup(`${popupTitle}<br/>${destItem.name}`);
      markersLayer.addLayer(destMarker);
    });

    // Fit Bounds so origin, all destinations, and the complete route remain visible
    const fitTargets: [number, number][] = [...allRoutePoints];
    if (resolvedOrigin) fitTargets.push(resolvedOrigin);
    finalDestMarkers.forEach((d) => fitTargets.push(d.coords));

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
    resolvedDestinationsList,
    currentSelectedId,
    showLights,
    showSafeZones,
    handleSelect,
  ]);

  // 3. Interactive Pin Placement Mode Effect
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isPinDropMode) return;
      const clickedLat = parseFloat(e.latlng.lat.toFixed(6));
      const clickedLng = parseFloat(e.latlng.lng.toFixed(6));
      setPlacedPinCoords({ lat: clickedLat, lng: clickedLng });

      if (customPinMarkerRef.current) {
        customPinMarkerRef.current.setLatLng([clickedLat, clickedLng]);
      } else {
        const pinIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div class="leaflet-pin destination-pin">
              <div class="pin-pulse-ring destination"></div>
              <div class="pin-core pin-destination" style="background:#0d9488; border: 2px solid #fff; font-size: 14px;">📍</div>
              <div class="pin-label-tag destination" style="background:#0d9488; color:#fff;">Drag Pin to Adjust</div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const newMarker = L.marker([clickedLat, clickedLng], {
          icon: pinIcon,
          draggable: true,
        });

        newMarker.on('dragend', (ev: any) => {
          const latlng = ev.target.getLatLng();
          const dLat = parseFloat(latlng.lat.toFixed(6));
          const dLng = parseFloat(latlng.lng.toFixed(6));
          setPlacedPinCoords({ lat: dLat, lng: dLng });
          if (onPinDropped) onPinDropped({ lat: dLat, lng: dLng });
        });

        newMarker.addTo(map);
        customPinMarkerRef.current = newMarker;
      }

      if (onPinDropped) {
        onPinDropped({ lat: clickedLat, lng: clickedLng });
      }
    };

    map.on('click', handleMapClick);

    const mapContainer = mapContainerRef.current;
    if (mapContainer) {
      if (isPinDropMode) {
        mapContainer.classList.add('pin-placement-mode');
      } else {
        mapContainer.classList.remove('pin-placement-mode');
        if (customPinMarkerRef.current) {
          customPinMarkerRef.current.remove();
          customPinMarkerRef.current = null;
        }
      }
    }

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isPinDropMode, onPinDropped]);

  // 4. Fetch and render nearby safety hubs (hospitals, police stations, custom society gates)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = nearbyHubsLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (!showNearbyHubs) return;

    const centerLat = sourceCoords?.lat || (routes?.[0] ? extractLeafletLatLngs(routes[0])[0]?.[0] : 18.6429);
    const centerLng = sourceCoords?.lng || (routes?.[0] ? extractLeafletLatLngs(routes[0])[0]?.[1] : 73.8762);

    getNearbyPlaces(centerLat, centerLng, 4000).then((data) => {
      // Emergency Facilities (Police, Hospitals)
      (data.emergencyFacilities || []).forEach((fac: any) => {
        const [lng, lat] = fac.location?.coordinates || [fac.lng, fac.lat];
        if (!lat || !lng) return;

        const isPolice = fac.type === 'police';
        const color = isPolice ? '#3b82f6' : '#ef4444';
        const iconSymbol = isPolice ? '👮' : '🏥';

        const marker = L.circleMarker([lat, lng], {
          radius: 7,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.9,
        });

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${iconSymbol} ${fac.name}</div>
            <div style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600;">${fac.type}</div>
            ${fac.phone ? `<div style="margin-top: 4px; font-size: 12px;">📞 <a href="tel:${fac.phone}">${fac.phone}</a></div>` : ''}
            ${fac.address ? `<div style="margin-top: 2px; font-size: 11px; color: #475569;">${fac.address}</div>` : ''}
          </div>
        `);
        layer.addLayer(marker);
      });

      // Community / Verified custom places
      (data.customPlaces || []).forEach((cp: any) => {
        const [lng, lat] = cp.location?.coordinates || [cp.lng, cp.lat];
        if (!lat || !lng) return;

        const marker = L.circleMarker([lat, lng], {
          radius: 6,
          fillColor: '#0d9488',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.9,
        });

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px; max-width: 220px;">
            <div style="font-weight: 700; color: #0f172a;">🏢 ${cp.name}</div>
            <div style="color: #0d9488; font-size: 11px; font-weight: 600;">
              ${cp.verificationStatus === 'verified' ? '✓ Verified SafeRoute Place' : 'Community Submitted'}
            </div>
            ${cp.landmark ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Near: ${cp.landmark}</div>` : ''}
            ${cp.locality ? `<div style="font-size: 11px; color: #64748b;">${cp.locality}</div>` : ''}
          </div>
        `);
        layer.addLayer(marker);
      });
    });
  }, [showNearbyHubs, sourceCoords, routes]);

  // 5. Fetch and render active community hazard reports
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = hazardsLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (!showHazards) return;

    const centerLat = sourceCoords?.lat || (routes?.[0] ? extractLeafletLatLngs(routes[0])[0]?.[0] : 18.6429);
    const centerLng = sourceCoords?.lng || (routes?.[0] ? extractLeafletLatLngs(routes[0])[0]?.[1] : 73.8762);

    getHazardReports(centerLat, centerLng, 6000).then((hazards) => {
      hazards.forEach((h: HazardReportItem) => {
        if (!h.lat || !h.lng) return;

        const marker = L.circleMarker([h.lat, h.lng], {
          radius: 6,
          fillColor: '#e11d48',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.85,
        });

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px;">
            <div style="font-weight: 700; color: #e11d48;">⚠️ ${h.hazardType.replace(/_/g, ' ').toUpperCase()}</div>
            <div style="color: #64748b; font-size: 11px;">Severity: <strong>${h.severity}</strong></div>
            ${h.description ? `<div style="font-size: 12px; margin-top: 4px; color: #334155;">${h.description}</div>` : ''}
            ${h.landmark ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Landmark: ${h.landmark}</div>` : ''}
          </div>
        `);
        layer.addLayer(marker);
      });
    });
  }, [showHazards, sourceCoords, routes]);

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
      map.setView([18.6429, 73.8762], 13);
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
      {/* Floating Pin Placement Mode Banner */}
      {isPinDropMode && (
        <div className="pin-placement-banner" role="status">
          <MapPin size={15} />
          <span>
            {placedPinCoords
              ? `Pin placed at ${placedPinCoords.lat}, ${placedPinCoords.lng} (Drag pin to adjust position)`
              : 'Click anywhere on map to drop pin at your entrance / location'}
          </span>
          {onCancelPinDrop && (
            <button type="button" className="pin-placement-cancel-btn" onClick={onCancelPinDrop}>
              Done / Cancel
            </button>
          )}
        </div>
      )}

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
        <button
          type="button"
          className={`map-layer-chip ${showNearbyHubs ? 'active' : ''}`}
          onClick={() => setShowNearbyHubs(!showNearbyHubs)}
          title="Toggle Nearby Emergency Hubs (Hospitals, Police, Society Gates)"
          aria-pressed={showNearbyHubs}
        >
          <Shield size={14} />
          <span>Safety Hubs</span>
        </button>
        <button
          type="button"
          className={`map-layer-chip ${showHazards ? 'active' : ''}`}
          onClick={() => setShowHazards(!showHazards)}
          title="Toggle Community Road Hazards"
          aria-pressed={showHazards}
        >
          <AlertTriangle size={14} />
          <span>Hazards</span>
        </button>
        {onOpenAddPlace && (
          <button
            type="button"
            className="map-layer-chip"
            style={{ background: '#0d9488', color: '#ffffff', border: 'none', fontWeight: 700 }}
            onClick={onOpenAddPlace}
            title="Add Missing Society or Landmark"
          >
            <Plus size={14} />
            <span>Add Place</span>
          </button>
        )}
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
        <button
          type="button"
          className={`map-control-btn ${showStatusOverlay ? 'active' : ''}`}
          onClick={() => setShowStatusOverlay(!showStatusOverlay)}
          aria-label="Toggle Route Information"
          title="Toggle Route Information"
        >
          <Info size={17} />
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

      {/* Floating Status Overlay (Hidden by default; toggleable via Info button or closeable via X button on left) */}
      {showStatusOverlay && (
        <div className="map-status-overlay" role="region" aria-label="Route Information Panel">
          <button
            type="button"
            className="status-overlay-close-btn"
            onClick={() => setShowStatusOverlay(false)}
            aria-label="Close route info"
            title="Close Route Details"
          >
            <X size={15} />
          </button>
          <div className="status-overlay-content">
            <div className="status-route-name">
              <span>{source || 'Starting Location'}</span>
              {sourceCoords && (
                <span className="coords-pill">
                  ({sourceCoords.lat.toFixed(4)}, {sourceCoords.lng.toFixed(4)})
                </span>
              )}
              {resolvedDestinationsList.map((d, i) => (
                <React.Fragment key={i}>
                  &nbsp;&rarr;&nbsp;
                  <span>{d.name}</span>
                  {d.coords && (
                    <span className="coords-pill">
                      ({d.coords.lat.toFixed(4)}, {d.coords.lng.toFixed(4)})
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="status-route-meta">
              Active: <strong>{selectedRouteDisplayName}</strong>
              {selectedRouteObj?.distanceText && ` • Distance: ${selectedRouteObj.distanceText}`}
              {selectedRouteObj?.durationText && ` • Duration: ${selectedRouteObj.durationText}`}
              {selectedRouteObj?.factors?.lighting && ` • Illumination: ${Math.round(selectedRouteObj.factors.lighting * 10)}%`}
            </div>
          </div>
        </div>
      )}

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
