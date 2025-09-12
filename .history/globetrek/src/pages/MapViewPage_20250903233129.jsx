import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  ArrowLeft, MapPin, Calendar, Camera, X, 
  Plane, User, LogOut, Navigation, AlertCircle, Plus,
  Edit3, Search, Filter, Maximize2, Minimize2, ChevronLeft,
  ChevronRight, ExternalLink, Clock, MapIcon, Loader2,
  RefreshCw, Info, Eye
} from 'lucide-react';

const MapView = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const clusterGroupRef = useRef(null);
  
  // State management
  const [journals, setJournals] = useState([]);
  const [filteredJournals, setFilteredJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [userName, setUserName] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  
  // Filter states
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedLocations, setSelectedLocations] = useState([]);

  // Fetch user and journals with error handling
  const fetchUserAndJournals = useCallback(async () => {
    try {
      setError('');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        navigate('/');
        return;
      }

      // Get user name with fallback
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
        
      if (userError) {
        console.warn('Could not fetch user name:', userError);
      }
      
      setUserName(userData?.name || 'Traveler');

      // Fetch journals with better error handling
      const { data: journalsData, error: journalsError } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (journalsError) {
        throw new Error(`Failed to load journals: ${journalsError.message}`);
      }

      const validJournals = journalsData || [];
      setJournals(validJournals);
      setFilteredJournals(validJournals);
      
      console.log(`Loaded ${validJournals.length} journals`);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load your journeys. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Load Leaflet map with clustering
  const loadLeafletMap = useCallback(async () => {
    if (mapLoaded || !mapContainer.current || mapLoading) return;
    
    setMapLoading(true);
    
    try {
      // Load CSS if not already loaded
      if (!document.querySelector('link[href*="leaflet"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        cssLink.crossOrigin = '';
        document.head.appendChild(cssLink);
      }

      // Load Leaflet JS
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.crossOrigin = '';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load map library'));
          document.head.appendChild(script);
        });
      }

      // Load MarkerCluster plugin
      if (!window.L.MarkerClusterGroup) {
        // Load cluster CSS
        const clusterCSS = document.createElement('link');
        clusterCSS.rel = 'stylesheet';
        clusterCSS.href = 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css';
        document.head.appendChild(clusterCSS);

        const clusterDefaultCSS = document.createElement('link');
        clusterDefaultCSS.rel = 'stylesheet';
        clusterDefaultCSS.href = 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css';
        document.head.appendChild(clusterDefaultCSS);

        // Load cluster JS
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load clustering library'));
          document.head.appendChild(script);
        });
      }

      const L = window.L;
      
      // Initialize map with better defaults
      map.current = L.map(mapContainer.current, {
        zoomControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        maxZoom: 18,
        minZoom: 2
      }).setView([20, 0], 2);

      // Add zoom control in better position
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map.current);

      // Add tile layer with better attribution
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map.current);

      // Initialize marker cluster group
      clusterGroupRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        chunkInterval: 200,
        chunkDelay: 50,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false,
        maxClusterRadius: 50,
        iconCreateFunction: function(cluster) {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="cluster-marker"><span>${count}</span></div>`,
            className: 'marker-cluster-custom',
            iconSize: [40, 40]
          });
        }
      });

      // Handle cluster clicks
      clusterGroupRef.current.on('clusterclick', function(e) {
        const cluster = e.layer;
        const markers = cluster.getAllChildMarkers();
        const journalsInCluster = markers.map(marker => marker.journalData);
        
        if (journalsInCluster.length > 1) {
          setSelectedCluster({
            journals: journalsInCluster,
            position: e.latlng
          });
        } else {
          setSelectedJournal(journalsInCluster[0]);
        }
      });

      map.current.addLayer(clusterGroupRef.current);
      setMapLoaded(true);
      
    } catch (err) {
      console.error('Error loading map:', err);
      setError(`Failed to load map: ${err.message}. Please refresh to try again.`);
    } finally {
      setMapLoading(false);
    }
  }, [mapLoaded, mapLoading]);

  // Update map markers based on filtered journals
  const updateMapMarkers = useCallback(() => {
    if (!mapLoaded || !clusterGroupRef.current) return;

    // Clear existing markers
    clusterGroupRef.current.clearLayers();
    markersRef.current = [];

    const journalsWithCoords = filteredJournals.filter(journal => 
      journal.lat && journal.lng && 
      !isNaN(parseFloat(journal.lat)) && 
      !isNaN(parseFloat(journal.lng))
    );

    if (journalsWithCoords.length === 0) {
      return;
    }

    const L = window.L;
    const bounds = [];

    journalsWithCoords.forEach((journal, index) => {
      const lat = parseFloat(journal.lat);
      const lng = parseFloat(journal.lng);
      
      if (lat && lng) {
        // Create custom marker
        const markerIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="marker-pin">
              <div class="marker-number">${index + 1}</div>
            </div>
          `,
          iconSize: [32, 45],
          iconAnchor: [16, 45],
          popupAnchor: [0, -45]
        });

        const marker = L.marker([lat, lng], { 
          icon: markerIcon,
          riseOnHover: true
        });

        // Store journal data with marker
        marker.journalData = journal;

        // Create hover tooltip
        const tooltipContent = `
          <div class="tooltip-content">
            <h4 class="tooltip-title">${journal.title || 'Untitled Journey'}</h4>
            <p class="tooltip-location"><i class="icon-location"></i>${journal.location || 'Unknown location'}</p>
            <p class="tooltip-date"><i class="icon-calendar"></i>${journal.date ? new Date(journal.date).toLocaleDateString() : 'No date'}</p>
            ${journal.description ? `<p class="tooltip-preview">${journal.description.substring(0, 60)}${journal.description.length > 60 ? '...' : ''}</p>` : ''}
            <small class="tooltip-hint">Click to read full journal</small>
          </div>
        `;

        marker.bindTooltip(tooltipContent, {
          direction: 'top',
          offset: [0, -45],
          className: 'custom-tooltip',
          permanent: false,
          opacity: 0.95
        });

        // Handle marker click
        marker.on('click', (e) => {
          e.originalEvent?.stopPropagation();
          setSelectedJournal(journal);
          
          // Smooth fly to location
          map.current.flyTo([lat, lng], Math.max(map.current.getZoom(), 10), { 
            duration: 1.2,
            easeLinearity: 0.25
          });
        });

        clusterGroupRef.current.addLayer(marker);
        markersRef.current.push(marker);
        bounds.push([lat, lng]);
      }
    });

    // Fit map to show all markers with animation
    if (bounds.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      const mapBounds = group.getBounds();
      
      if (mapBounds.isValid()) {
        map.current.fitBounds(mapBounds.pad(0.1), {
          maxZoom: 12,
          animate: true,
          duration: 1.5
        });
      }
    }
  }, [filteredJournals, mapLoaded]);

  // Filter journals based on search and filters
  const applyFilters = useCallback(() => {
    let filtered = journals;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(journal => 
        journal.title?.toLowerCase().includes(term) ||
        journal.location?.toLowerCase().includes(term) ||
        journal.description?.toLowerCase().includes(term)
      );
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(journal => 
        new Date(journal.date) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(journal => 
        new Date(journal.date) <= new Date(dateRange.end)
      );
    }

    // Location filter
    if (selectedLocations.length > 0) {
      filtered = filtered.filter(journal => 
        selectedLocations.includes(journal.location)
      );
    }

    setFilteredJournals(filtered);
  }, [journals, searchTerm, dateRange, selectedLocations]);

  // Sign out handler
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out. Please try again.');
    }
  };

  // Retry mechanism
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError('');
    setLoading(true);
    fetchUserAndJournals();
  };

  // Initialize component
  useEffect(() => {
    fetchUserAndJournals();
  }, [fetchUserAndJournals]);

  // Load map when data is ready
  useEffect(() => {
    if (!loading && journals.length > 0 && !mapLoaded && !error) {
      loadLeafletMap();
    }
  }, [loading, journals.length, mapLoaded, error, loadLeafletMap]);

  // Update markers when filtered journals change
  useEffect(() => {
    if (mapLoaded) {
      updateMapMarkers();
    }
  }, [mapLoaded, updateMapMarkers]);

  // Apply filters when inputs change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Get unique locations for filter
  const uniqueLocations = [...new Set(journals.map(j => j.location).filter(Boolean))];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-blue-200 rounded-full mx-auto"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Your Journey Map</h3>
          <p className="text-gray-600">Gathering your travel memories...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const journalsWithCoords = filteredJournals.filter(j => j.lat && j.lng);
  const journalsWithoutCoords = filteredJournals.filter(j => !j.lat || !j.lng);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-300 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Journey Map</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search and filters */}
              <div className="hidden md:flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search journeys..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-48 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>

              {/* Stats */}
              <div className="text-sm text-gray-600 hidden sm:block">
                <span className="font-medium text-green-600">{journalsWithCoords.length}</span> mapped
                {journalsWithoutCoords.length > 0 && (
                  <span className="ml-2">
                    • <span className="font-medium text-amber-600">{journalsWithoutCoords.length}</span> text-only
                  </span>
                )}
              </div>

              {/* User menu */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{userName}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="border-t border-gray-200 py-4">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Locations</label>
                  <select
                    multiple
                    value={selectedLocations}
                    onChange={(e) => setSelectedLocations(Array.from(e.target.selectedOptions, option => option.value))}
                    className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                  >
                    {uniqueLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setDateRange({ start: '', end: '' });
                      setSelectedLocations([]);
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Info bar for text-only locations */}
      {journalsWithoutCoords.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center text-sm text-amber-800">
            <Info className="w-4 h-4 mr-2 text-amber-600 flex-shrink-0" />
            <span>
              {journalsWithoutCoords.length} journal{journalsWithoutCoords.length > 1 ? 's' : ''} without coordinates won't appear on the map. 
              <button 
                onClick={() => navigate('/add-journal')}
                className="ml-1 underline hover:no-underline font-medium"
              >
                Add locations to see them here
              </button>
            </span>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative" style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 4rem)' }}>
        {journals.length > 0 ? (
          <>
            {/* Map loading overlay */}
            {mapLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}

            <div ref={mapContainer} className="w-full h-full" />
            
            {/* Map controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors border"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Map legend */}
            {journalsWithCoords.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-20 max-w-xs">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <MapIcon className="w-4 h-4 mr-1" />
                  Map Legend
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mr-3 flex items-center justify-center text-white text-xs font-bold shadow-sm">1</div>
                    <span>Numbered markers show journey sequence</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-6 h-6 bg-orange-500 rounded-full mr-3 flex items-center justify-center text-white text-xs font-bold shadow-sm">3</div>
                    <span>Clustered markers for nearby locations</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Hover for preview • Click for full details
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Empty state
          <div className="flex items-center justify-center h-full text-center p-8">
            <div className="max-w-md">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">No Journeys Yet</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Start documenting your travels! Create journal entries with locations to see them visualized on your personal journey map.
              </p>
              <button
                onClick={() => navigate('/add-journal')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Journey
              </button>
            </div>
          </div>
        )}

        {/* Cluster Selection Modal */}
        {selectedCluster && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Multiple Journeys at this Location
                  </h3>
                  <button
                    onClick={() => setSelectedCluster(null)}
                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {selectedCluster.journals.map((journal, index) => (
                  <button
                    key={journal.id}
                    onClick={() => {
                      setSelectedJournal(journal);
                      setSelectedCluster(null);
                    }}
                    className="w-full p-4 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {journal.title || 'Untitled Journey'}
                        </h4>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{journal.date ? new Date(journal.date).toLocaleDateString() : 'No date'}</span>
                        </div>
                        {journal.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {journal.description.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                       </div> </div> </div>
