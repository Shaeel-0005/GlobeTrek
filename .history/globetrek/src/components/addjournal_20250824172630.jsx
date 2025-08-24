import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

// Debounce hook for performance optimization
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef();
  
  return useCallback((...args) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// Custom hook for location autocomplete with multiple API fallbacks
const useLocationAutocomplete = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortControllerRef = useRef();

  // Multiple geocoding APIs for better coverage
  const searchAPIs = [
    {
      name: 'OpenStreetMap Nominatim',
      search: async (query, signal) => {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&addressdetails=1&limit=3&extratags=1&namedetails=1`,
          { 
            signal,
            headers: { 'User-Agent': 'TravelJournalApp/1.0' }
          }
        );
        if (!response.ok) throw new Error('Nominatim failed');
        return await response.json();
      }
    },
    {
      name: 'LocationIQ',
      search: async (query, signal) => {
        // Note: Replace with your actual API key
        const response = await fetch(
          `https://us1.locationiq.com/v1/search.php?key=YOUR_LOCATIONIQ_API_KEY&q=${encodeURIComponent(
            query
          )}&format=json&limit=3&addressdetails=1&extratags=1&namedetails=1`,
          { signal }
        );
        if (!response.ok) throw new Error('LocationIQ failed');
        return await response.json();
      }
    }
  ];

  const searchLocations = useCallback(async (query) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      setIsSearching(true);
      let allResults = [];

      // Try each API and combine results
      for (const api of searchAPIs) {
        try {
          const results = await api.search(query, abortControllerRef.current.signal);
          
          // Normalize results format
          const normalizedResults = results.map(result => ({
            ...result,
            source: api.name,
            display_name: result.display_name || result.formatted || `${result.name}, ${result.state || result.country}`,
            place_id: result.place_id || result.osm_id || `${api.name}-${result.lat}-${result.lon}`,
            type: result.type || result.category || 'location',
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon || result.lng)
          }));

          allResults = [...allResults, ...normalizedResults];
          
          // If we get good results from first API, we can break early for speed
          if (normalizedResults.length >= 3) break;
          
        } catch (apiError) {
          console.warn(`${api.name} search failed:`, apiError);
          // Continue to next API
        }
      }

      // Remove duplicates based on coordinates proximity
      const uniqueResults = [];
      allResults.forEach(result => {
        const isDuplicate = uniqueResults.some(existing => {
          const latDiff = Math.abs(existing.lat - result.lat);
          const lonDiff = Math.abs(existing.lon - result.lon);
          return latDiff < 0.001 && lonDiff < 0.001; // ~100m tolerance
        });
        
        if (!isDuplicate) {
          uniqueResults.push(result);
        }
      });

      // Sort by relevance (exact matches first, then by distance from search term)
      const sortedResults = uniqueResults
        .sort((a, b) => {
          const queryLower = query.toLowerCase();
          const aName = a.display_name.toLowerCase();
          const bName = b.display_name.toLowerCase();
          
          // Exact matches first
          if (aName.includes(queryLower) && !bName.includes(queryLower)) return -1;
          if (!aName.includes(queryLower) && bName.includes(queryLower)) return 1;
          
          // Prefer results that start with query
          const aStarts = aName.startsWith(queryLower);
          const bStarts = bName.startsWith(queryLower);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          
          return 0;
        })
        .slice(0, 5); // Limit to 5 results

      setSuggestions(sortedResults);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("All location search APIs failed:", error);
        setSuggestions([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { suggestions, isSearching, searchLocations, clearSuggestions };
};

const INITIAL_FORM_STATE = {
  title: "",
  location: "",
  coords: null,
  date: "",
  description: "",
  mishaps: "",
  media: []
};

export default function AddJournalForm() {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const navigate = useNavigate();
  const { suggestions, isSearching, searchLocations, clearSuggestions } = useLocationAutocomplete();
  
  // Refs for managing focus and clicks
  const locationInputRef = useRef();
  const suggestionsRef = useRef();
  
  // Debounced search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchLocations, 300);

  // Generic form field handler
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(""); // Clear error when user makes changes
  }, []);

  // Location input handler with debounced search
  const handleLocationChange = useCallback((e) => {
    const value = e.target.value;
    handleFieldChange('location', value);
    
    // Reset coordinates when user types (they might be changing location)
    if (formData.coords) {
      setFormData(prev => ({ ...prev, coords: null }));
    }
    
    if (value.length > 2) {
      debouncedSearch(value);
    } else {
      clearSuggestions();
    }
  }, [handleFieldChange, debouncedSearch, clearSuggestions, formData.coords]);

  // Handle location suggestion selection
  const handleSelectSuggestion = useCallback((suggestion) => {
    const coords = { 
      lat: parseFloat(suggestion.lat), 
      lng: parseFloat(suggestion.lon) 
    };
    
    setFormData(prev => ({
      ...prev,
      location: suggestion.display_name,
      coords
    }));
    
    clearSuggestions();
    locationInputRef.current?.blur(); // Remove focus to hide suggestions
  }, [clearSuggestions]);

  // Media file handler with validation
  const handleMediaChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB limit per file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        setError(`File ${file.name} has unsupported format.`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length !== files.length) return;
    
    handleFieldChange('media', validFiles);
  }, [handleFieldChange]);

  // Enhanced media upload with progress tracking
  const uploadMediaFiles = async (files, userId) => {
    if (!files.length) return [];
    
    const uploadPromises = files.map(async (file, index) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${index}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      try {
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, file, { 
            upsert: true,
            onUploadProgress: (progress) => {
              const percentage = Math.round((progress.loaded / progress.total) * 100);
              setUploadProgress(prev => Math.max(prev, percentage));
            }
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("media")
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
        throw new Error(`Failed to upload ${file.name}`);
      }
    });

    return Promise.all(uploadPromises);
  };

  // Enhanced form submission with better error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setUploadProgress(0);

    try {
      // Validate form data
      if (!formData.title.trim()) throw new Error("Title is required");
      if (!formData.location.trim()) throw new Error("Location is required");
      if (!formData.date) throw new Error("Date is required");
      if (!formData.description.trim()) throw new Error("Description is required");

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) throw new Error("You must be logged in to add a journal.");

      // Upload media files with progress tracking
      let mediaURLs = [];
      if (formData.media.length > 0) {
        mediaURLs = await uploadMediaFiles(formData.media, user.id);
      }

      // Insert journal entry
      const journalData = {
        user_id: user.id,
        title: formData.title.trim(),
        location: formData.location,
        lat: formData.coords?.lat || null,
        lng: formData.coords?.lng || null,
        date: formData.date,
        description: formData.description.trim(),
        mishaps: formData.mishaps.trim() || null,
        media_urls: mediaURLs,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from("journals").insert(journalData);
      if (insertError) throw insertError;

      // Reset form and show success
      setFormData(INITIAL_FORM_STATE);
      setShowSuccess(true);

      // Navigate after delay
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/dashboard");
      }, 2000);

    } catch (err) {
      console.error('Form submission error:', err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Handle clicks outside suggestions to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !locationInputRef.current?.contains(event.target)
      ) {
        clearSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearSuggestions]);

  // Handle location input focus - show suggestions if there's text
  const handleLocationFocus = useCallback(() => {
    if (formData.location.length > 2 && suggestions.length === 0) {
      debouncedSearch(formData.location);
    }
  }, [formData.location, suggestions.length, debouncedSearch]);

  // Handle keyboard navigation for suggestions
  const handleLocationKeyDown = useCallback((e) => {
    if (suggestions.length === 0) return;
    
    if (e.key === 'Escape') {
      clearSuggestions();
      locationInputRef.current?.blur();
    }
  }, [suggestions.length, clearSuggestions]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-6 relative">
      {/* Success notification */}
      {showSuccess && (
        <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-md animate-fade-in-out text-sm font-medium z-20">
          ✅ Journal entry created!
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Add New Journal Entry
      </h2>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Upload progress */}
      {loading && uploadProgress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading files...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
            placeholder="Give your adventure a title..."
          />
        </div>

        {/* Location Field with Autocomplete */}
        <div className="relative">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Location *
            {formData.coords && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                📍 Coordinates saved
              </span>
            )}
          </label>
          <div className="relative">
            <input
              ref={locationInputRef}
              type="text"
              value={formData.location}
              onChange={handleLocationChange}
              onFocus={handleLocationFocus}
              onKeyDown={handleLocationKeyDown}
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
              placeholder="Start typing a location..."
              autoComplete="off"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Location Suggestions */}
          {suggestions.length > 0 && (
            <ul 
              ref={suggestionsRef}
              className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 shadow-lg max-h-60 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.place_id}-${index}`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                >
                  <div className="font-medium text-gray-900">
                    {suggestion.display_name}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    {suggestion.type && (
                      <div className="text-xs text-gray-500 capitalize">
                        {suggestion.type}
                      </div>
                    )}
                    {suggestion.source && (
                      <div className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                        {suggestion.source === 'OpenStreetMap Nominatim' ? 'OSM' : 'LocationIQ'}
                      </div>
                    )}
                  </div>
                </li>
              ))}
              
              {/* Add manual entry option */}
              <li
                onClick={() => {
                  // Allow user to manually enter location without coordinates
                  setFormData(prev => ({
                    ...prev,
                    coords: null // Clear coords but keep the typed location
                  }));
                  clearSuggestions();
                  locationInputRef.current?.blur();
                }}
                className="p-3 hover:bg-yellow-50 cursor-pointer text-sm border-t-2 border-yellow-100 bg-yellow-25"
              >
                <div className="font-medium text-yellow-700 flex items-center">
                  <span className="mr-2">✏️</span>
                  Use "{formData.location}" as entered
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  Save without exact coordinates (location will be stored as text only)
                </div>
              </li>
            </ul>
          )}
          
          {/* Show message if user typed but no coordinates saved */}
          {formData.location.length > 2 && !formData.coords && suggestions.length === 0 && !isSearching && (
            <div className="text-xs text-amber-600 mt-1 flex items-center">
              <span className="mr-1">💡</span>
              No matching locations found. You can still save this as a text-only location.
            </div>
          )}
        </div>

        {/* Date Field */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleFieldChange('date', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
            max={new Date().toISOString().split('T')[0]} // Prevent future dates
          />
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-vertical"
            rows="4"
            required
            placeholder="Describe your experience, what you saw, how you felt..."
          />
        </div>

        {/* Mishaps Field */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Mishaps or Challenges
          </label>
          <textarea
            value={formData.mishaps}
            onChange={(e) => handleFieldChange('mishaps', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-vertical"
            rows="2"
            placeholder="Any challenges or unexpected events? (optional)"
          />
        </div>

        {/* Media Upload Field */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Photos & Videos
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors duration-200">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm"
              onChange={handleMediaChange}
              className="w-full p-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: JPEG, PNG, WebP, MP4, WebM. Max 10MB per file.
            </p>
          </div>
          {formData.media.length > 0 && (
            <p className="text-sm text-green-600 mt-2">
              {formData.media.length} file(s) selected
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white p-3 rounded-lg font-medium transition-all duration-200 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              {uploadProgress > 0 ? 'Uploading...' : 'Saving...'}
            </div>
          ) : (
            "Save Journal Entry"
          )}
        </button>
      </form>

      {/* Custom Styles */}
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
          .animate-fade-in-out {
            animation: fadeInOut 2s ease-in-out forwards;
          }
        `}
      </style>
    </div>
  );
}