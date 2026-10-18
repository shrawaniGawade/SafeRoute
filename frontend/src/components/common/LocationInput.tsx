import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Loader2, LocateFixed, X } from 'lucide-react';
import { geocodeLocations, type GeocodeResult } from '../../services/api';
import './LocationInput.css';

export interface SelectedLocation {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

export interface LocationInputProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string, coords?: { lat: number; lng: number }) => void;
  onSelectLocation?: (location: SelectedLocation) => void;
  placeholder?: string;
  icon?: 'origin' | 'destination';
  required?: boolean;
  disabled?: boolean;
  enableCurrentLocation?: boolean;
  className?: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  id,
  label,
  value,
  onChange,
  onSelectLocation,
  placeholder = 'Search place or address...',
  icon = 'origin',
  required = false,
  disabled = false,
  enableCurrentLocation = true,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch geocoding suggestions with 400ms debounce
  const fetchSuggestions = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const results = await geocodeLocations(trimmed, 5);
      setSuggestions(results);
      setIsOpen(true);
      setHighlightedIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setLocationError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 3) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(val);
      }, 400);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setHasSearched(false);
    }
  };

  const handleSelectSuggestion = (item: GeocodeResult) => {
    const cleanName = item.name || item.displayName.split(',')[0].trim();
    const displayName = item.displayName || cleanName;

    setInputValue(displayName);
    onChange(displayName, { lat: item.lat, lng: item.lng });

    if (onSelectLocation) {
      onSelectLocation({
        name: cleanName,
        displayName,
        lat: item.lat,
        lng: item.lng,
      });
    }

    setIsOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;

      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;

      default:
        break;
    }
  };

  // Use my location (browser geolocation)
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const myLocText = 'My Current Location';

        setInputValue(myLocText);
        onChange(myLocText, { lat, lng });

        if (onSelectLocation) {
          onSelectLocation({
            name: myLocText,
            displayName: `${myLocText} (${lat}, ${lng})`,
            lat,
            lng,
          });
        }

        setIsLocating(false);
        setIsOpen(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please search manually.');
        } else {
          setLocationError('Unable to detect current location.');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleClear = () => {
    setInputValue('');
    onChange('', undefined);
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`location-input-component ${className}`} ref={containerRef}>
      {label && (
        <div className="location-label-row">
          <label htmlFor={id} className="location-field-label">
            {label}
            {required && <span className="required-star">*</span>}
          </label>
          {enableCurrentLocation && (
            <button
              type="button"
              className="use-my-location-chip"
              onClick={handleUseMyLocation}
              disabled={isLocating || disabled}
              title="Detect current GPS location"
              aria-label="Use my current GPS location"
            >
              {isLocating ? (
                <Loader2 size={12} className="spin-icon" />
              ) : (
                <LocateFixed size={12} />
              )}
              <span>{isLocating ? 'Detecting...' : 'Use my location'}</span>
            </button>
          )}
        </div>
      )}

      <div className={`location-input-box ${isOpen ? 'active-dropdown' : ''}`}>
        <div className="location-box-icon" aria-hidden="true">
          {icon === 'origin' ? (
            <MapPin size={18} className="icon-origin" />
          ) : (
            <Navigation size={18} className="icon-destination" />
          )}
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          className="location-text-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && inputValue.trim().length >= 3) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${id}-suggestions`}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${id}-opt-${highlightedIndex}` : undefined
          }
        />

        <div className="location-box-actions">
          {isLoading && (
            <div className="input-loading-indicator" aria-label="Searching places">
              <Loader2 size={16} className="spin-icon" />
            </div>
          )}

          {inputValue.length > 0 && !isLoading && (
            <button
              type="button"
              className="clear-input-btn"
              onClick={handleClear}
              title="Clear input"
              aria-label="Clear location input"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {locationError && (
        <div className="location-status-error" role="alert">
          {locationError}
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div
          id={`${id}-suggestions`}
          className="location-suggestions-dropdown"
          role="listbox"
        >
          {suggestions.length > 0 ? (
            <ul className="suggestions-list">
              {suggestions.map((item, idx) => {
                const isHighlighted = idx === highlightedIndex;
                const cleanName = item.name || item.displayName.split(',')[0].trim();
                const addressSub = item.displayName.replace(cleanName, '').replace(/^,\s*/, '');

                return (
                  <li
                    key={item.placeId || idx}
                    id={`${id}-opt-${idx}`}
                    role="option"
                    aria-selected={isHighlighted}
                    className={`suggestion-item ${isHighlighted ? 'highlighted' : ''}`}
                    onClick={() => handleSelectSuggestion(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <div className="suggestion-icon-wrap" aria-hidden="true">
                      <MapPin size={16} />
                    </div>
                    <div className="suggestion-details">
                      <span className="suggestion-title">{cleanName}</span>
                      {addressSub && (
                        <span className="suggestion-address">{addressSub}</span>
                      )}
                    </div>
                    <span className="suggestion-type-badge">{item.type || 'place'}</span>
                  </li>
                );
              })}
            </ul>
          ) : hasSearched && !isLoading ? (
            <div className="no-suggestions-state" role="status">
              <MapPin size={18} className="no-places-icon" />
              <span>No places found</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
