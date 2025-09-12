import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  ArrowLeft, MapPin, Calendar, Camera, X, 
  Plane, User, LogOut, Navigation, AlertCircle, Plus,
  Maximize2, Search, Filter, ChevronLeft, ChevronRight,
  Edit, Trash2, Share2, ZoomIn, ZoomOut, Layers
} from 'lucide-react';

// Mock Supabase for demo
const mockSupabase = {
  auth: {
    getUser: async () => ({
      data: { user: { id: 'demo-user' } },
      error: null
    }),
    signOut: async () => ({ error: null })
  },
  from: (table) => ({
    select: (fields) => ({
      eq: (field, value) => ({
        single: async () => ({ data: { name: 'Demo User' }, error: null }),
        not: (field, op, value) => ({
          order: (field, options) => ({
            then: async () => ({
              data: mockJournals,
              error: null
            })
          })
        })
      })
    })
  })
};

// Mock journals data with various scenarios
const mockJournals = [
  {
    id: 1,
    title: "Paris Adventure",
    location: "Paris, France",
    lat: 48.8566,
    lng: 2.3522,
    date: "2024-06-15",
    description: "Explored the beautiful streets of Paris, visited the Louvre, and had amazing croissants at a local café. The city's charm is absolutely captivating with its blend of historic architecture and modern culture.",
    mishaps: "Got lost in the metro system for an hour, but discovered a hidden jazz club!",
    media_urls: [
      "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=400&h=300&fit=crop"
    ]
  },
  {
    id: 2,
    title: "Eiffel Tower at Sunset",
    location: "Paris, France",
    lat: 48.8584,
    lng: 2.2945,
    date: "2024-06-16",
    description: "Watched the sunset from the Eiffel Tower. The city lights beginning to twinkle was magical.",
    mishaps: null,
    media_urls: [
      "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=400&h=300&fit=crop"
    ]
  },
  {
    id: 3,
    title: "Tokyo Street Food",
    location: "Tokyo, Japan",
    lat: 35.6762,
    lng: 139.6503,
    date: "2024-07-20",
    description: "Amazing ramen experience in Shibuya. The flavors were incredible and the atmosphere was so authentic.",
    mishaps: "Language barrier made ordering challenging, but the staff were incredibly patient and helpful.",
    media_urls: [
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop"
    ]
  },
  {
    id: 4,
    title: "Shibuya Crossing",
    location: "Tokyo, Japan", 
    lat: 35.6598,
    lng: 139.7006,
    date: "2024-07-21",
    description: "The famous scramble crossing was even more impressive in person. Pure urban energy!",
    mishaps: null,
    media_urls: []
  },
  {
    id: 5,
    title: "Central Park Morning",
    location: "New York, USA",
    lat: 40.7829,
    lng: -73.9654,
    date: "2024-08-10",
    description: "Early morning jog through Central Park. The city was just waking up and it felt peaceful despite being in the heart of Manhattan.",
    mishaps: "Forgot to bring water and got dehydrated halfway through.",
    media_urls: [
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop"
    ]
  },
  {
    id: 6,
    title: "Brooklyn Bridge Walk",
    location: "New York, USA",
    lat: 40.7061,
    lng: -73.9969,
    date: "2024-08-11",
    description: "Walked across the iconic Brooklyn Bridge at golden hour. The views of Manhattan's skyline were breathtaking.",
    mishaps: null,
    media_urls: [
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1546436836-07a91091f160?w=400&h=300&fit=crop"
    ]
  }
];

const MapView = () => {
  const navigate = (path) => console.log(`Navigate to: ${path}`);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const clustersRef = useRef([]);
  
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [userName, setUserName] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previewJournal, setPreviewJournal] = useState(null);
  const [previewTimer, setPreviewTimer] = useState(null);

  // Fetch user + journals
  useEffect(() => {
    const fetchUserAndJournals = async () => {
      try {
        const { data: { user }, error: authError } = await mockSupabase.auth.getUser();
        if (authError || !user) {
          navigate('/');
          return;
        }

        const { data: userData } = await mockSupabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();
        setUserName(userData?.name || 'Demo User');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setJournals(mockJournals);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndJournals();
  }, []);

  // Load map after journals fetched
  useEffect(() => {
    if (!loading && !mapLoaded && journals.length > 0) {
      loadLeafletMap();
    }
  }, [loading, mapLoaded, journals]);

  // Group journals by proximity
  const groupJournalsByProximity = useCallback((journals) => {
    const groups = [];
    const used = new Set();
    const PROXIMITY_THRESHOLD = 0.01; // ~1km

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
  }, []);

  const loadLeafletMap = async () => {
    if (mapLoaded || !mapContainer.current) return;

    try {
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);
      }

      // Load Leaflet JS
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const L = window.L;
      
      // Initialize map
      map.current = L.map(mapContainer.current, {
        zoomControl: false, // Custom zoom controls
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        zoomSnap: 0.5
      }).setView([20, 0], 2);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map.current);

      const journalGroups = groupJournalsByProximity(
        journals.filter(j => j.lat && j.lng && 
          !isNaN(parseFloat(j.lat)) && !isNaN(parseFloat(j.lng)))
      );

      const validLocations = [];
      let markerIndex = 1;

      journalGroups.forEach((group) => {
        const mainJournal = group[0];
        const lat = parseFloat(mainJournal.lat);
        const lng = parseFloat(mainJournal.lng);
        
        if (!lat || !lng) return;

        let markerHtml, clickHandler;

        if (group.length === 1) {
          // Single journal marker
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
        } else {
          // Cluster marker
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
          riseOnHover: true
        }).addTo(map.current);

        // Hover preview for single markers
        if (group.length === 1) {
          marker.on('mouseover', () => showPreview(mainJournal, marker));
          marker.on('mouseout', () => schedulePreviewHide());
          markerIndex++;
        }

        marker.on('click', clickHandler);
        markersRef.current.push(marker);
        validLocations.push([lat, lng]);
      });

      // Draw path between locations
      if (validLocations.length > 1) {
        // Sort by date for chronological path
        const sortedJournals = [...journals]
          .filter(j => j.lat && j.lng && j.date)
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        const chronologicalPath = sortedJournals.map(j => [
          parseFloat(j.lat), 
          parseFloat(j.lng)
        ]);

        if (chronologicalPath.length > 1) {
          L.polyline(chronologicalPath, {
            color: '#3B82F6',
            weight: 3,
            opacity: 0.6,
            dashArray: '8, 12',
            className: 'travel-path'
          }).addTo(map.current);
        }
      }

      // Fit map to show all markers
      if (validLocations.length > 0) {
        const group = new L.featureGroup(markersRef.current);
        const bounds = group.getBounds();
        
        if (bounds.isValid()) {
          map.current.fitBounds(bounds.pad(0.1), {
            maxZoom: 12,
            animate: true,
            duration: 1.5
          });
        }
      }

      setMapLoaded(true);

    } catch (err) {
      console.error('Error loading map:', err);
      setError('Failed to load map. Please try refreshing the page.');
    }
  };

  const showPreview = (journal, marker) => {
    if (previewTimer) {
      clearTimeout(previewTimer);
    }
    setPreviewJournal({ ...journal, marker });
  };

  const schedulePreviewHide = () => {
    const timer = setTimeout(() => {
      setPreviewJournal(null);
    }, 300);
    setPreviewTimer(timer);
  };

  const clearPreview = () => {
    if (previewTimer) {
      clearTimeout(previewTimer);
    }
    setPreviewJournal(null);
  };

  const handleSignOut = async () => {
    try {
      await mockSupabase.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleImageNavigation = (direction) => {
    if (!selectedJournal?.media_urls) return;
    const totalImages = selectedJournal.media_urls.length;
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  const filteredJournals = journals.filter(journal =>
    journal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    journal.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    journal.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset image index when journal changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedJournal]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-t-2 border-blue-300 mx-auto animate-spin animation-delay-75"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your journey map...</p>
          <p className="text-gray-400 text-sm mt-2">Preparing interactive experience</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Map</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Retry Loading
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const journalsWithCoords = journals.filter(j => j.lat && j.lng);
  const journalsWithoutCoords = journals.filter(j => !j.lat || !j.lng);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <header className={`bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-20 transition-all duration-300 ${isFullscreen ? 'h-12' : 'h-16'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 border border-gray-300 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {!isFullscreen && "Dashboard"}
              </button>
              
              {!isFullscreen && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                    <Navigation className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                    <span>Journey Map</span>
                  </h1>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {!isFullscreen && (
                <>
                  {/* Search */}
                  <div className="relative hidden md:block">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search journals..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                    />
                  </div>

                  {/* Stats */}
                  <div className="text-sm text-gray-600 hidden lg:block">
                    <span className="font-semibold text-green-600">{journalsWithCoords.length}</span> mapped
                    {journalsWithoutCoords.length > 0 && (
                      <span className="ml-2">
                        • <span className="font-semibold text-amber-600">{journalsWithoutCoords.length}</span> unmapped
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{userName}</span>
                  </div>
                </>
              )}

              {/* Map Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                
                {!isFullscreen && (
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors shadow-sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Info bar for unmapped journals */}
      {journalsWithoutCoords.length > 0 && !isFullscreen && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 mr-2 text-amber-600 flex-shrink-0" />
              <span>
                <strong>{journalsWithoutCoords.length}</strong> journal{journalsWithoutCoords.length > 1 ? 's' : ''} without coordinates won't appear on the map.
              </span>
            </div>
            <button 
              onClick={() => navigate('/add-journal')}
              className="text-sm font-medium text-amber-800 hover:text-amber-900 underline hover:no-underline transition-colors"
            >
              Add coordinates →
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className={`relative ${isFullscreen ? 'h-screen' : 'h-[calc(100vh-4rem)]'}`}>
        {journals.length > 0 ? (
          <>
            <div ref={mapContainer} className="w-full h-full" />
            
            {/* Custom Zoom Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
              <button
                onClick={() => map.current?.zoomIn()}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors flex items-center justify-center text-gray-700 hover:text-blue-600"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => map.current?.zoomOut()}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors flex items-center justify-center text-gray-700 hover:text-blue-600"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
            </div>

            {/* Map Legend */}
            {journalsWithCoords.length > 0 && !isFullscreen && (
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 z-10 max-w-xs">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                  <Layers className="w-4 h-4 mr-2 text-blue-600" />
                  Map Legend
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center text-gray-600">
                    <div className="single-marker-mini mr-3">
                      <div className="marker-number-mini">1</div>
                    </div>
                    Single journal location
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="cluster-marker-mini mr-3">
                      <div className="cluster-count-mini">3</div>
                    </div>
                    Multiple journals nearby
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-6 h-1 bg-blue-500 mr-3 rounded" style={{backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, #3B82F6 4px, #3B82F6 8px)'}}></div>
                    Chronological travel path
                  </div>
                </div>
              </div>
            )}

            {/* Quick Preview Card */}
            {previewJournal && (
              <div className="absolute z-30 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-4 max-w-sm border border-gray-200/50"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -100%)',
                  marginTop: '-80px'
                }}
                onMouseEnter={clearPreview}
                onMouseLeave={schedulePreviewHide}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight pr-2">
                    {previewJournal.title || 'Untitled Journey'}
                  </h3>
                  {previewJournal.media_urls?.length > 0 && (
                    <Camera className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center text-xs text-gray-500 mb-2 space-x-3">
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {previewJournal.location}
                  </div>
                  {previewJournal.date && (
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(previewJournal.date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {previewJournal.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {previewJournal.description.length > 80 
                      ? previewJournal.description.substring(0, 80) + '...'
                      : previewJournal.description
                    }
                  </p>
                )}

                <button
                  onClick={() => {
                    setSelectedJournal(previewJournal);
                    clearPreview();
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Click to read full details →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-md">
              <div className="relative mb-6">
                <MapPin className="w-20 h-20 text-gray-300 mx-auto" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-3">Your Journey Awaits</h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Start documenting your adventures! Add journal entries with locations to see them beautifully displayed on your personal journey map.
              </p>
              <button
                onClick={() => navigate('/add-journal')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Journal
              </button>
            </div>
          </div>
        )}

        {/* Cluster Selection Modal */}
        {selectedCluster && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  {selectedCluster.length} Journals at {selectedCluster[0].location}
                </h2>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="p-1 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-3 overflow-y-auto max-h-96">
                {selectedCluster.map((journal, index) => (
                  <div
                    key={journal.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer group"
                    onClick={() => {
                      setSelectedJournal(journal);
                      setSelectedCluster(null);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {journal.title || 'Untitled Journey'}
                          </h3>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          {journal.date && (
                            <div className="flex items-center mr-4">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(journal.date).toLocaleDateString()}
                            </div>
                          )}
                          {journal.media_urls?.length > 0 && (
                            <div className="flex items-center">
                              <Camera className="w-4 h-4 mr-1" />
                              {journal.media_urls.length} photo{journal.media_urls.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        {journal.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {journal.description.length > 100 
                              ? journal.description.substring(0, 100) + '...'
                              : journal.description
                            }
                          </p>
                        )}
                      </div>

                      {journal.media_urls?.[0] && (
                        <div className="ml-4 flex-shrink-0">
                          <img
                            src={journal.media_urls[0]}
                            alt=""
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-blue-600 group-hover:text-blue-700 font-medium">
                        Click to view full details →
                      </span>
                      {journal.mishaps && (
                        <div className="flex items-center text-xs text-amber-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Has mishaps
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Journal Detail Modal */}
        {selectedJournal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedJournal.title || 'Untitled Journey'}
                  </h2>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="w-4 h-4 mr-1 text-blue-600" />
                    <span className="mr-4">{selectedJournal.location}</span>
                    {selectedJournal.date && (
                      <>
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        <span>{new Date(selectedJournal.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => console.log('Edit journal:', selectedJournal.id)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit journal"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => console.log('Share journal:', selectedJournal.id)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Share journal"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedJournal(null)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Media Gallery */}
                {selectedJournal.media_urls && selectedJournal.media_urls.length > 0 && (
                  <div className="relative bg-gray-900">
                    <img
                      src={selectedJournal.media_urls[currentImageIndex]}
                      alt={`${selectedJournal.title} - ${currentImageIndex + 1}`}
                      className="w-full h-64 sm:h-80 object-cover"
                    />
                    
                    {/* Image Navigation */}
                    {selectedJournal.media_urls.length > 1 && (
                      <>
                        <button
                          onClick={() => handleImageNavigation('prev')}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors flex items-center justify-center"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleImageNavigation('next')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors flex items-center justify-center"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        
                        {/* Image Indicators */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {selectedJournal.media_urls.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Image Counter */}
                        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {selectedJournal.media_urls.length}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="p-6 space-y-6">
                  {/* Description */}
                  {selectedJournal.description && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                        Journal Entry
                      </h3>
                      <div className="prose max-w-none text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg">
                        {selectedJournal.description}
                      </div>
                    </div>
                  )}

                  {/* Mishaps */}
                  {selectedJournal.mishaps && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                        Mishaps & Challenges
                      </h3>
                      <div className="prose max-w-none text-gray-700 text-sm leading-relaxed bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
                        {selectedJournal.mishaps}
                      </div>
                    </div>
                  )}

                  {/* Photo Thumbnails */}
                  {selectedJournal.media_urls && selectedJournal.media_urls.length > 1 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <Camera className="w-4 h-4 mr-2 text-blue-600" />
                        All Photos ({selectedJournal.media_urls.length})
                      </h3>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {selectedJournal.media_urls.map((url, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`relative group aspect-square overflow-hidden rounded-lg ${
                              index === currentImageIndex 
                                ? 'ring-2 ring-blue-500 ring-offset-2' 
                                : 'hover:ring-2 hover:ring-gray-300'
                            }`}
                          >
                            <img
                              src={url}
                              alt={`${selectedJournal.title} - ${index + 1}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                            {index === currentImageIndex && (
                              <div className="absolute inset-0 bg-blue-500/20"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-between items-center flex-shrink-0">
                <div className="text-sm text-gray-500">
                  Created {selectedJournal.date ? new Date(selectedJournal.date).toLocaleDateString() : 'on unknown date'}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => console.log('Edit journal:', selectedJournal.id)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Edit Journal
                  </button>
                  <button
                    onClick={() => setSelectedJournal(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        /* Single Marker Styles */
        .single-marker {
          width: 40px;
          height: 40px;
          position: relative;
        }

        .single-marker::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #3B82F6, #1D4ED8);
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: translate(-50%, 0) rotate(-45deg);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          transition: all 0.3s ease;
        }

        .single-marker:hover::before {
          transform: translate(-50%, -2px) rotate(-45deg) scale(1.1);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
        }

        .marker-number {
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-weight: bold;
          font-size: 12px;
          z-index: 10;
        }

        .marker-pulse {
          position: absolute;
          top: 8px;
          left: 50%;
          width: 16px;
          height: 16px;
          background: rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          transform: translateX(-50%);
          animation: pulse 2s infinite;
        }

        /* Cluster Marker Styles */
        .cluster-marker {
          width: 40px;
          height: 40px;
          position: relative;
        }

        .cluster-marker::before {
          content: '';
          position: absolute;
          top: 5px;
          left: 50%;
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #10B981, #059669);
          border: 3px solid white;
          border-radius: 50%;
          transform: translateX(-50%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          transition: all 0.3s ease;
        }

        .cluster-marker:hover::before {
          transform: translateX(-50%) scale(1.1);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
        }

        .cluster-count {
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-weight: bold;
          font-size: 12px;
          z-index: 10;
        }

        .cluster-pulse {
          position: absolute;
          top: 8px;
          left: 50%;
          width: 24px;
          height: 24px;
          background: rgba(16, 185, 129, 0.3);
          border-radius: 50%;
          transform: translateX(-50%);
          animation: pulse 2s infinite;
        }

        /* Legend Mini Markers */
        .single-marker-mini {
          width: 20px;
          height: 20px;
          position: relative;
        }

        .single-marker-mini::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #3B82F6, #1D4ED8);
          border: 2px solid white;
          border-radius: 50% 50% 50% 0;
          transform: translate(-50%, 0) rotate(-45deg);
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
        }

        .marker-number-mini {
          position: absolute;
          top: 2px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-weight: bold;
          font-size: 8px;
          z-index: 10;
        }

        .cluster-marker-mini {
          width: 20px;
          height: 20px;
          position: relative;
        }

        .cluster-marker-mini::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 50%;
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #10B981, #059669);
          border: 2px solid white;
          border-radius: 50%;
          transform: translateX(-50%);
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
        }

        .cluster-count-mini {
          position: absolute;
          top: 4px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-weight: bold;
          font-size: 8px;
          z-index: 10;
        }

        /* Animations */
        @keyframes pulse {
          0% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          50% {
            opacity: 0.5;
            transform: translateX(-50%) scale(1.2);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }

        /* Utility Classes */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .animation-delay-75 {
          animation-delay: 0.075s;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .single-marker, .cluster-marker {
            width: 35px;
            height: 35px;
          }

          .single-marker::before, .cluster-marker::before {
            width: 26px;
            height: 26px;
          }

          .marker-number, .cluster-count {
            font-size: 11px;
            top: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default MapView;
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  {selectedCluster.length} Journals at {selectedCluster[0].location}
                </h2>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="p-1 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-3 overflow-y-auto max-h-96">
                {selectedCluster.map((journal, index) => (
                  <div
                    key={journal.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer group"
                    onClick={() => {
                      setSelectedJournal(journal);
                      setSelectedCluster(null);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {journal.title || 'Untitled Journey'}
                          </h3>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          {journal.date && (
                            <div className="flex items-center mr-4">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(journal.date).toLocaleDateString()}
                            </div>
                          )}
                          {journal.media_urls?.length > 0 && (
                            <div className="flex items-center">
                              <Camera className="w-4 h-4 mr-1" />
                              {journal.media_urls.length} photo{journal.media_urls.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        {journal.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {journal.description.length > 100 
                              ? journal.description.substring(0, 100) + '...'
                              : journal.description
                            }
                          </p>
                        )}
                      </div>

                      {journal.media_urls?.[0] && (
                        <div className="ml-4 flex-shrink-0">
                          <img
                            src={journal.media_urls[0]}
                            alt=""
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-blue-600 group-hover:text-blue-700 font-medium">
                        Click to view full details →
                      </span>
                      {journal.mishaps && (
                        <div className="flex items-center text-xs text-amber-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Has mishaps
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Journal Detail Modal */}
        {selectedJournal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedJournal.title || 'Untitled Journey'}
                  </h2>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="w-4 h-4 mr-1 text-blue-600" />
                    <span className="mr-4">{selectedJournal.location}</span>
                    {selectedJournal.date && (
                      <>
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        <span>{new Date(selectedJournal.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => console.log('Edit journal:', selectedJournal.id)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit journal"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => console.log('Share journal:', selectedJournal.id)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Share journal"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedJournal(null)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Media Gallery */}
                {selectedJournal.media_urls && selectedJournal.media_urls.length > 0 && (
                  <div className="relative bg-gray-900">
                    <img
                      src={selectedJournal.media_urls[currentImageIndex]}
                      alt={`${selectedJournal.title} - ${currentImageIndex + 1}`}
                      className="w-full h-64 sm:h-80 object-cover"
                    />
                    
                    {/* Image Navigation */}
                    {selectedJournal.media_urls.length > 1 && (
                      <>
                        <button
                          onClick={() => handleImageNavigation('prev')}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors flex items-center justify-center"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleImageNavigation('next')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors flex items-center justify-center"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        
                        {/* Image Indicators */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {selectedJournal.media_urls.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Image Counter */}
                        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {selectedJournal.media_urls.length}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="p-6 space-y-6">
                  {/* Description */}
                  {selectedJournal.description && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                        Journal Entry
                      </h3>
                      <div className="prose max-w-none text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg">
                        {selectedJournal.description}
                      </div>
                    </div>
                  )}

                  {/* Mishaps */}
                  {selectedJournal.mishaps && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                        Mishaps & Challenges
                      </h3>
                      <div className="prose max-w-none text-gray-700 text-sm leading-relaxed bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
                        {selectedJournal.mishaps}
                      </div>
                    </div>
                  )}

                  {/* Photo Thumbnails */}
                  {selectedJournal.media_urls && selectedJournal.media_urls.length > 1 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <Camera className="w-4 h-4 mr-2 text-blue-600" />
                        All Photos ({selectedJournal.media_urls.length})
                      </h3>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {selectedJournal.media_urls.map((url, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`relative group aspect-square overflow-hidden rounded-lg ${
                              index === currentImageIndex 
                                ? 'ring-2 ring-blue-500 ring-offset-2' 
                                : 'hover:ring-2 hover:ring-gray-300'
                            }`}
                          >
                            <img
                              src={url}
                              alt={`${selectedJournal.title} - ${index + 1}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                            {index === currentImageIndex && (
                              <div className="absolute inset-0 bg-blue-500/20"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-between items-center flex-shrink-0">
                <div className="text-sm text-gray-500">
                  Created {selectedJournal.date ? new Date(selectedJournal.date).toLocaleDateString() : 'on unknown date'}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => console.log('Edit journal:', selectedJournal.id)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Edit Journal
                  </button>
                  <button
                    onClick={() => setSelectedJournal(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        /* Single Marker Styles */
        .single-marker {
          width: 40px;
          height: 40px;
          position: relative;
        }

        .single-marker::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #3B82F6, #1D4ED8);
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: translate(-50%, 0) rotate(-45deg);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          transition: all 0.3s ease;
        }

        .single-marker:hover::before {
          transform: translate(-50%, -2px) rotate(-45deg) scale(1.1);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
        }

        .marker-number {
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-weight: bold;
          font-size: 12px;
          z-index: 10;
        }

        .marker-pulse {
          position: absolute;
          top: 8px;
          left: 50%;
          width: 16px;
          height: 16px;
          background: rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          transform: translateX(-50%);
          animation: pulse 2s infinite;
        }

        /* Cluster Marker Styles */
        .cluster-marker {
          width: 40px;
          height: 40px;
          position: relative;
        }

        .cluster-marker::before {
          content: '';
          position: absolute;
          top: 5px;
          left: 50%;
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #10B981, #059669);
          border: 3px solid white;
          border-radius: 50%;
          transform: translateX(-50%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          transition: all 0.3s ease;
        }

        .cluster-marker:hover::before {
          transform: translateX(-50%) scale(1.1);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
        }

        .cluster-count {
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-weight: bold;
          font-size: 12px;
          z-index: 10;
        }

        .cluster-pulse {
          position: absolute;
          top: 8px;
          left: 50%;
          width: 24px;
          height: 24px;
          background: rgba(16, 185, 129, 0.3);
          border-radius: 50%;
          transform: translateX(-50%);
          animation: pulse 2s infinite;
        }

        /* Legend Mini Markers */
        .single-marker-mini {
          width: 20px;
          height: 20px;
          position: relative;
        }

        .single-marker-mini::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #3B82F6, #1D4ED8);
          border: 2px solid white;
          border-radius: 50% 50% 50% 0;
          transform: translate(-50%, 0) rotate(-45deg);
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
        }

        .marker-number-mini {
          position: absolute;
          top: 2px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-weight: bold;
          font-size: 8px;
          z-index: 10;
        }

        .cluster-marker-mini {
          width: 20px;
          height: 20px;
          position: relative;
        }

        .cluster-marker-mini::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 50%;
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #10B981, #059669);
          border: 2px solid white;
          border-radius: 50%;
          transform: translateX(-50%);
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
        }

        .cluster-count-mini {
          position: absolute;
          top: 4px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-weight: bold;
          font-size: 8px;
          z-index: 10;
        }

        /* Animations */
        @keyframes pulse {
          0% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          50% {
            opacity: 0.5;
            transform: translateX(-50%) scale(1.2);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }

        /* Utility Classes */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .animation-delay-75 {
          animation-delay: 0.075s;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .single-marker, .cluster-marker {
            width: 35px;
            height: 35px;
          }

          .single-marker::before, .cluster-marker::before {
            width: 26px;
            height: 26px;
          }

          .marker-number, .cluster-count {
            font-size: 11px;
            top: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default MapView;