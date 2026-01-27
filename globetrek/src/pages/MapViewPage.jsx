import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map.css';
import { 
  ArrowLeft, MapPin, Calendar, Camera, X, 
  User, LogOut, Navigation, AlertCircle, Plus,
  Maximize2, Search, ChevronLeft, ChevronRight,
  Edit, Trash2, Share2, ZoomIn, ZoomOut, Layers,
  Crosshair, Filter, TrendingUp
} from 'lucide-react';

const MapView = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const markersGroupRef = useRef(null);
  const pathLineRef = useRef(null);
  const isMapInitialized = useRef(false);
  const searchTimeoutRef = useRef(null);
  const previewTimerRef = useRef(null);
  
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapInitializing, setMapInitializing] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [userName, setUserName] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previewJournal, setPreviewJournal] = useState(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [showStats, setShowStats] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Debounced search to prevent map updates on every keystroke
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const filteredJournals = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return journals;
    
    const term = debouncedSearchTerm.toLowerCase();
    return journals.filter(journal => 
      journal.title?.toLowerCase().includes(term) ||
      journal.location?.toLowerCase().includes(term) ||
      journal.description?.toLowerCase().includes(term)
    );
  }, [journals, debouncedSearchTerm]);

  const journalsWithCoords = useMemo(() => 
    filteredJournals.filter(j => j.lat && j.lng && !isNaN(j.lat) && !isNaN(j.lng)),
    [filteredJournals]
  );

  const journalsWithoutCoords = useMemo(() => 
    filteredJournals.filter(j => !j.lat || !j.lng || isNaN(j.lat) || isNaN(j.lng)),
    [filteredJournals]
  );

  // Calculate journey statistics
  const journeyStats = useMemo(() => {
    if (journalsWithCoords.length === 0) return null;

    const sortedByDate = [...journalsWithCoords]
      .filter(j => j.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const locations = new Set(journalsWithCoords.map(j => j.location));
    
    let totalDistance = 0;
    for (let i = 1; i < sortedByDate.length; i++) {
      const prev = sortedByDate[i - 1];
      const curr = sortedByDate[i];
      const distance = Math.sqrt(
        Math.pow(curr.lat - prev.lat, 2) + 
        Math.pow(curr.lng - prev.lng, 2)
      ) * 111; // Rough km conversion
      totalDistance += distance;
    }

    return {
      totalJournals: journalsWithCoords.length,
      uniqueLocations: locations.size,
      totalDistance: Math.round(totalDistance),
      firstDate: sortedByDate[0]?.date,
      lastDate: sortedByDate[sortedByDate.length - 1]?.date
    };
  }, [journalsWithCoords]);

  useEffect(() => {
    const fetchUserAndJournals = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          navigate('/');
          return;
        }

        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();
        setUserName(userData?.name || 'User');

        const { data: journalsData, error: journalsError } = await supabase
          .from('journals')
          .select('id, user_id, title, location, lat, lng, date, description, mishaps, media_urls')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('date', { ascending: false });
        
        if (journalsError) throw journalsError;
        setJournals(journalsData || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndJournals();
  }, [navigate]);

  // Initialize map ONCE when component mounts and data is ready
  useEffect(() => {
    if (!mapContainer.current || isMapInitialized.current || journals.length === 0) {
      return;
    }

    initializeMap();
    
    return () => {
      cleanupMap();
    };
  }, [journals.length]); // Only depend on whether we have data

  // UPDATE markers when filtered journals change (without recreating map)
  useEffect(() => {
    if (!map.current || !isMapInitialized.current) return;

    updateMapMarkers();
  }, [filteredJournals]);

  const initializeMap = () => {
    if (isMapInitialized.current) return;
    
    try {
      setMapInitializing(true);
      isMapInitialized.current = true;
      
      map.current = L.map(mapContainer.current, {
        zoomControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        zoomSnap: 0.5,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true
      }).setView([20, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map.current);

      // Create a feature group for markers
      markersGroupRef.current = L.featureGroup().addTo(map.current);

      updateMapMarkers();
      setMapLoaded(true);
      setMapInitializing(false);
      console.log('Map initialized successfully');
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to load map. Please refresh the page.');
      isMapInitialized.current = false;
      setMapInitializing(false);
    }
  };

  const updateMapMarkers = useCallback(() => {
    if (!map.current || !markersGroupRef.current) return;

    // Clear existing markers and lines
    markersGroupRef.current.clearLayers();
    markersRef.current = [];
    
    if (pathLineRef.current) {
      map.current.removeLayer(pathLineRef.current);
      pathLineRef.current = null;
    }

    const validJournals = journalsWithCoords;
    if (validJournals.length === 0) return;

    const journalGroups = groupJournalsByProximity(validJournals);
    const validLocations = [];
    let markerIndex = 1;

    journalGroups.forEach((group) => {
      const mainJournal = group[0];
      const lat = parseFloat(mainJournal.lat);
      const lng = parseFloat(mainJournal.lng);
      
      if (isNaN(lat) || isNaN(lng)) return;

      let markerHtml, clickHandler;

      if (group.length === 1) {
        markerHtml = `
          <div class="single-marker">
            <div class="marker-number">${markerIndex}</div>
            <div class="marker-pulse"></div>
          </div>
        `;
        clickHandler = () => {
          setSelectedJournal(mainJournal);
          clearPreview();
        };
        markerIndex++;
      } else {
        markerHtml = `
          <div class="cluster-marker">
            <div class="cluster-count">${group.length}</div>
            <div class="cluster-pulse"></div>
          </div>
        `;
        clickHandler = () => {
          setSelectedCluster(group);
          clearPreview();
        };
      }

      const customIcon = L.divIcon({
        className: 'custom-marker-icon',
        html: markerHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      const marker = L.marker([lat, lng], { 
        icon: customIcon,
        riseOnHover: true,
        keyboard: true
      });

      if (group.length === 1) {
        marker.on('mouseover', () => showPreview(mainJournal, marker));
        marker.on('mouseout', () => schedulePreviewHide());
        
        if (L.Browser.touch) {
          marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            showPreview(mainJournal, marker);
          });
          marker.on('dblclick', clickHandler);
        } else {
          marker.on('click', clickHandler);
        }
      } else {
        marker.on('click', clickHandler);
      }

      markersGroupRef.current.addLayer(marker);
      markersRef.current.push(marker);
      validLocations.push([lat, lng]);
    });

    // Draw path line
    if (validLocations.length > 1) {
      const sortedJournals = [...validJournals]
        .filter(j => j.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const path = sortedJournals.map(j => [parseFloat(j.lat), parseFloat(j.lng)]);

      if (path.length > 1) {
        pathLineRef.current = L.polyline(path, {
          color: '#3B82F6',
          weight: 3,
          opacity: 0.6,
          dashArray: '8, 12',
          smoothFactor: 1
        }).addTo(map.current);
      }
    }

    // Fit bounds with animation
    if (validLocations.length > 0) {
      const bounds = markersGroupRef.current.getBounds();
      if (bounds.isValid()) {
        map.current.fitBounds(bounds.pad(0.1), { 
          maxZoom: 12, 
          animate: true,
          duration: 0.5
        });
      }
    }
  }, [journalsWithCoords]);

  const cleanupMap = () => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }
    
    if (!map.current) return;
    
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
    }
    
    if (pathLineRef.current) {
      map.current.removeLayer(pathLineRef.current);
    }
    
    markersRef.current = [];
    map.current.remove();
    map.current = null;
    markersGroupRef.current = null;
    pathLineRef.current = null;
    isMapInitialized.current = false;
    setMapLoaded(false);
  };

  const groupJournalsByProximity = (journals) => {
    const groups = [];
    const used = new Set();
    const PROXIMITY_THRESHOLD = 0.05;

    journals.forEach((journal, i) => {
      if (used.has(i) || !journal.lat || !journal.lng) return;

      const group = [journal];
      used.add(i);

      journals.forEach((other, j) => {
        if (used.has(j) || i === j || !other.lat || !other.lng) return;

        const distance = Math.sqrt(
          Math.pow(journal.lat - other.lat, 2) + 
          Math.pow(journal.lng - other.lng, 2)
        );

        if (distance < PROXIMITY_THRESHOLD) {
          group.push(other);
          used.add(j);
        }
      });

      groups.push(group);
    });

    return groups;
  };

  const showPreview = useCallback((journal, markerElement) => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }
    
    // Get marker position if available
    if (markerElement && markerElement._icon) {
      const rect = markerElement._icon.getBoundingClientRect();
      setPreviewPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10 // Position above the marker
      });
    }
    
    setPreviewJournal(journal);
  }, []);

  const schedulePreviewHide = useCallback(() => {
    previewTimerRef.current = setTimeout(() => {
      setPreviewJournal(null);
    }, 200); // Short delay - tooltip stays if mouse enters it
  }, []);

  const clearPreview = useCallback(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }
    setPreviewJournal(null);
  }, []);

  const recenterMap = useCallback(() => {
    if (!map.current || !markersGroupRef.current || journalsWithCoords.length === 0) return;
    
    const bounds = markersGroupRef.current.getBounds();
    if (bounds.isValid()) {
      map.current.fitBounds(bounds.pad(0.1), { 
        maxZoom: 12, 
        animate: true,
        duration: 0.8
      });
    }
  }, [journalsWithCoords.length]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out. Please try again.');
    }
  };

  const handleDeleteJournal = async (journalId) => {
    try {
      await supabase
        .from('journals')
        .update({ deleted_at: new Date() })
        .eq('id', journalId);
      
      setJournals(journals.filter(j => j.id !== journalId));
      setSelectedJournal(null);
      setSelectedCluster(null);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete journal. Please try again.');
    }
  };

  const handleImageNavigation = useCallback((direction) => {
    if (!selectedJournal?.media_urls) return;
    const len = selectedJournal.media_urls.length;
    setCurrentImageIndex(prev => 
      direction === 'next' ? (prev + 1) % len : (prev - 1 + len) % len
    );
  }, [selectedJournal]);

  const handleKeyPress = useCallback((e) => {
    if (!selectedJournal?.media_urls || selectedJournal.media_urls.length <= 1) return;
    
    if (e.key === 'ArrowLeft') {
      handleImageNavigation('prev');
    } else if (e.key === 'ArrowRight') {
      handleImageNavigation('next');
    }
  }, [selectedJournal, handleImageNavigation]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedJournal]);

  useEffect(() => {
    if (selectedJournal) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [selectedJournal, handleKeyPress]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <Navigation className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
          </div>
          <p className="text-gray-600 font-medium">Loading your journey...</p>
        </div>
      </div>
    );
  }

  if (error && !mapLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something Went Wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <header className={`bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 transition-all ${isFullscreen ? 'h-12' : 'h-16 md:h-20'}`}>
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-blue-50 hover:text-blue-600 border border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {!isFullscreen && <span className="hidden sm:inline">Dashboard</span>}
            </button>
            {!isFullscreen && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Journey Map</h1>
                  {journeyStats && (
                    <p className="text-xs text-gray-500">
                      {journeyStats.totalJournals} {journeyStats.totalJournals === 1 ? 'location' : 'locations'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            {!isFullscreen && (
              <>
                <div className="relative hidden md:block">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search journals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm w-48 lg:w-64 transition-all"
                    aria-label="Search journals"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {journeyStats && (
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Toggle statistics"
                  >
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Stats</span>
                  </button>
                )}
                
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{userName}</span>
                </div>
              </>
            )}
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            
            {!isFullscreen && (
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Unmapped journals alert */}
      {journalsWithoutCoords.length > 0 && !isFullscreen && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 p-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center text-sm text-amber-900">
              <AlertCircle className="w-4 h-4 mr-2 text-amber-600 flex-shrink-0" />
              <span>
                <strong>{journalsWithoutCoords.length}</strong> journal{journalsWithoutCoords.length > 1 ? 's' : ''} {journalsWithoutCoords.length > 1 ? 'are' : 'is'} missing location data
              </span>
            </div>
            <button 
              onClick={() => navigate('/add-journal')}
              className="text-sm text-amber-900 hover:text-amber-950 underline underline-offset-2 font-medium transition-colors"
              aria-label="Add locations to journals"
            >
              Add Locations →
            </button>
          </div>
        </div>
      )}

      {/* Search results indicator */}
      {searchTerm && !isFullscreen && (
        <div className="bg-blue-50 border-b border-blue-200 p-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
            <span className="text-blue-900">
              Showing <strong>{filteredJournals.length}</strong> of <strong>{journals.length}</strong> journals
            </span>
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-700 hover:text-blue-900 underline"
            >
              Clear filter
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`relative ${isFullscreen ? 'h-screen' : 'h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]'}`}>
        {mapInitializing && (
          <div className="absolute inset-0 z-50 bg-white/90 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Initializing map...</p>
            </div>
          </div>
        )}

        {journals.length > 0 ? (
          <>
            <div ref={mapContainer} className="w-full h-full relative z-0" role="region" aria-label="Interactive Journey Map" />
            
            {/* Map controls */}
            <div className="absolute top-4 right-4 z-[15] flex flex-col space-y-2">
              <button
                onClick={() => map.current?.zoomIn()}
                className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white flex items-center justify-center text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => map.current?.zoomOut()}
                className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white flex items-center justify-center text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={recenterMap}
                className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white flex items-center justify-center text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Recenter Map"
                title="Fit all markers"
              >
                <Crosshair className="w-5 h-5" />
              </button>
            </div>

            {/* Legend */}
            {journalsWithCoords.length > 0 && !isFullscreen && (
              <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 z-[15] max-w-xs">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                  <Layers className="w-4 h-4 mr-2 text-blue-600" />
                  Map Legend
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center text-gray-600">
                    <div className="single-marker-mini mr-3"><div className="marker-number-mini">1</div></div>
                    <span>Single journal</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="cluster-marker-mini mr-3"><div className="cluster-count-mini">3</div></div>
                    <span>Multiple journals</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-6 h-1 bg-blue-500 mr-3 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, #3B82F6 4px, #3B82F6 8px)' }}></div>
                    <span>Journey path</span>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics panel */}
            {showStats && journeyStats && !isFullscreen && (
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 z-[15] max-w-xs animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                    Journey Stats
                  </h3>
                  <button
                    onClick={() => setShowStats(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close statistics"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Journals:</span>
                    <span className="font-semibold text-gray-900">{journeyStats.totalJournals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unique Locations:</span>
                    <span className="font-semibold text-gray-900">{journeyStats.uniqueLocations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Distance:</span>
                    <span className="font-semibold text-gray-900">~{journeyStats.totalDistance} km</span>
                  </div>
                  {journeyStats.firstDate && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">First Entry:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(journeyStats.firstDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Latest Entry:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(journeyStats.lastDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preview tooltip */}
            {previewJournal && (
              <div 
                className="fixed z-[25] pointer-events-auto animate-in fade-in zoom-in-95 duration-200" 
                style={{ 
                  left: `${previewPosition.x}px`,
                  top: `${previewPosition.y}px`,
                  transform: 'translate(-50%, -100%)',
                  paddingBottom: '20px' // Extra hover zone for smooth transition
                }}
                onMouseEnter={clearPreview}
                onMouseLeave={schedulePreviewHide}
                role="dialog"
                aria-label="Journal Preview"
              >
                <div className="relative bg-white/98 backdrop-blur-sm rounded-xl shadow-2xl p-4 max-w-sm border-2 border-blue-200">
                  {/* Arrow pointer pointing down to marker */}
                  <div className="absolute -bottom-[18px] left-1/2 transform -translate-x-1/2 z-10">
                    <div className="w-4 h-4 bg-white border-r-2 border-b-2 border-blue-200 transform rotate-45"></div>
                  </div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm pr-2 line-clamp-1">
                    {previewJournal.title || 'Untitled Journey'}
                  </h3>
                  {previewJournal.media_urls?.length > 0 && (
                    <div className="flex items-center space-x-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      <Camera className="w-3 h-3" />
                      <span className="text-xs font-medium">{previewJournal.media_urls.length}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-500 mb-2 space-x-3">
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">{previewJournal.location}</span>
                  </div>
                  {previewJournal.date && (
                    <div className="flex items-center flex-shrink-0">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(previewJournal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
                {previewJournal.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">{previewJournal.description}</p>
                )}
                <button
                  onClick={() => {
                    setSelectedJournal(previewJournal);
                    clearPreview();
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:underline"
                >
                  View Full Details →
                </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-md p-8 text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Start Your Journey</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                You haven't created any journals yet. Begin documenting your adventures and watch your journey map come to life!
              </p>
              <button
                onClick={() => navigate('/add-journal')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Journal
              </button>
            </div>
          </div>
        )}

        {/* Cluster modal */}
        {selectedCluster && (
          <div 
            className="absolute inset-0 z-[30] bg-black/50 backdrop-blur-sm p-4 md:p-6 flex items-center justify-center animate-in fade-in duration-200" 
            onClick={() => setSelectedCluster(null)}
            role="dialog" 
            aria-label="Nearby Journals"
          >
            <div 
              className="bg-white/98 rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2">
                <h2 className="text-lg font-bold text-gray-900">
                  Nearby Journals ({selectedCluster.length})
                </h2>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {selectedCluster.map((journal, index) => (
                  <div 
                    key={journal.id} 
                    className="border-b border-gray-200 pb-4 last:border-b-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            #{index + 1}
                          </span>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {journal.title || 'Untitled Journey'}
                          </h3>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 space-x-3 flex-wrap">
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {journal.location}
                          </div>
                          {journal.date && (
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(journal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          )}
                          {journal.media_urls?.length > 0 && (
                            <div className="flex items-center text-blue-600">
                              <Camera className="w-3 h-3 mr-1" />
                              {journal.media_urls.length}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={() => navigate(`/edit-journal/${journal.id}`)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title="Edit"
                          aria-label={`Edit ${journal.title || 'journal'}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(journal.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                          title="Delete"
                          aria-label={`Delete ${journal.title || 'journal'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {journal.description && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{journal.description}</p>
                    )}
                    <button
                      onClick={() => {
                        setSelectedJournal(journal);
                        setSelectedCluster(null);
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:underline mt-2 inline-block"
                    >
                      View Full Details →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Journal detail modal */}
        {selectedJournal && (
          <div 
            className="absolute inset-0 z-[30] bg-black/50 backdrop-blur-sm p-4 md:p-6 flex items-center justify-center animate-in fade-in duration-200" 
            onClick={() => setSelectedJournal(null)}
            role="dialog" 
            aria-label="Journal Details"
          >
            <div 
              className="bg-white/98 rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 pr-4">
                  {selectedJournal.title || 'Untitled Journey'}
                </h2>
                <button
                  onClick={() => setSelectedJournal(null)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-600 space-x-4 flex-wrap">
                  <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                    <MapPin className="w-4 h-4 mr-1.5 text-blue-600" />
                    {selectedJournal.location}
                  </div>
                  {selectedJournal.date && (
                    <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                      <Calendar className="w-4 h-4 mr-1.5 text-blue-600" />
                      {new Date(selectedJournal.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                  )}
                </div>

                {selectedJournal.media_urls?.length > 0 && (
                  <div className="relative rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={selectedJournal.media_urls[currentImageIndex]}
                      alt={`${selectedJournal.title || 'Journal'} - Image ${currentImageIndex + 1}`}
                      className="w-full h-64 object-cover"
                      loading="lazy"
                    />
                    {selectedJournal.media_urls.length > 1 && (
                      <>
                        <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-between px-2">
                          <button
                            onClick={() => handleImageNavigation('prev')}
                            className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleImageNavigation('next')}
                            className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Next image"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-700" />
                          </button>
                        </div>
                        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                          {currentImageIndex + 1} / {selectedJournal.media_urls.length}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {selectedJournal.description && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedJournal.description}
                    </p>
                  </div>
                )}

                {selectedJournal.mishaps && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-900 mb-1">Mishap Reported</p>
                        <p className="text-sm text-red-800">{selectedJournal.mishaps}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => navigate(`/edit-journal/${selectedJournal.id}`)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Journal
                  </button>
                  <button
                    onClick={() => console.log('Share:', selectedJournal.id)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteConfirm && (
          <div 
            className="absolute inset-0 z-[40] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setDeleteConfirm(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Journal?</h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                This action cannot be undone. The journal will be permanently deleted.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteJournal(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error toast */}
      {error && mapLoaded && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 max-w-md animate-in slide-in-from-bottom-2 duration-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-white hover:text-red-100 focus:outline-none"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MapView;