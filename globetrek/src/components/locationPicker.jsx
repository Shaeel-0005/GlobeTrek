import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function LocationMarker({ position, setPosition, setLocationName }) {
  const map = useMap();

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
      
      // Reverse geocode to get location name
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { 'User-Agent': 'LocationPickerApp/1.0' } }
        );
        const data = await response.json();
        if (data.display_name) {
          setLocationName(data.display_name);
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
      }
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], map.getZoom());
    }
  }, [position, map]);

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

// Component to recenter map when search result is selected
function MapController({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 13);
    }
  }, [center, map]);
  
  return null;
}

export default function LocationPicker({ value, onChange, coords, onCoordsChange }) {
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 20, lng: 0 });
  const [markerPosition, setMarkerPosition] = useState(coords || null);
  const searchTimeoutRef = useRef();
  const suggestionsRef = useRef();

  // Search for locations
  const searchLocations = useCallback(async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { 'User-Agent': 'LocationPickerApp/1.0' } }
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Search failed:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onChange(value);

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  // Select suggestion
  const handleSelectSuggestion = (suggestion) => {
    const coords = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    };
    
    setSearchQuery(suggestion.display_name);
    onChange(suggestion.display_name);
    setMarkerPosition(coords);
    onCoordsChange(coords);
    setMapCenter(coords);
    setSuggestions([]);
    setShowMap(true);
  };

  // Update marker position and get location name
  const handleMarkerUpdate = (newPosition) => {
    setMarkerPosition(newPosition);
    onCoordsChange(newPosition);
  };

  const handleLocationNameUpdate = (name) => {
    setSearchQuery(name);
    onChange(name);
  };

  // Get user's current location
  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMarkerPosition(coords);
          onCoordsChange(coords);
          setMapCenter(coords);
          setShowMap(true);

          // Get location name
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`,
              { headers: { 'User-Agent': 'LocationPickerApp/1.0' } }
            );
            const data = await response.json();
            if (data.display_name) {
              setSearchQuery(data.display_name);
              onChange(data.display_name);
            }
          } catch (error) {
            console.error('Failed to get location name:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please search manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for a location..."
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm whitespace-nowrap"
          >
            📍 Use My Location
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <ul
            ref={suggestionsRef}
            className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, idx) => (
              <li
                key={suggestion.place_id}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900 text-sm">
                  {suggestion.display_name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {suggestion.type}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map Toggle */}
      {!showMap && (
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="w-full p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
        >
          🗺️ Show Map to Pin Location
        </button>
      )}

      {/* Map */}
      {showMap && (
        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-4 py-2 border-b border-blue-100">
            <p className="text-sm text-blue-800 font-medium">
              💡 Click anywhere on the map to pin your location
            </p>
          </div>
          
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={markerPosition ? 13 : 2}
            style={{ height: '400px', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker
              position={markerPosition}
              setPosition={handleMarkerUpdate}
              setLocationName={handleLocationNameUpdate}
            />
            <MapController center={mapCenter} />
          </MapContainer>

          {markerPosition && (
            <div className="bg-green-50 px-4 py-3 border-t border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    ✅ Location Pinned
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Coordinates: {markerPosition.lat.toFixed(5)}, {markerPosition.lng.toFixed(5)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMap(false)}
                  className="text-sm text-green-700 hover:text-green-900 font-medium"
                >
                  Hide Map
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
