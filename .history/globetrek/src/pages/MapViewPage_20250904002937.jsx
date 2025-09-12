import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '.';
import { 
  ArrowLeft, MapPin, Calendar, Camera, X, 
  User, LogOut, Navigation, AlertCircle, Plus,
  Maximize2, Search, ChevronLeft, ChevronRight,
  Edit, Trash2, Share2, ZoomIn, ZoomOut, Layers
} from 'lucide-react';

const MapView = () => {
  const navigate = (path) => console.log(`Navigate to: ${path}`); // Replace with react-router useNavigate
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [userName, setUserName] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previewJournal, setPreviewJournal] = useState(null);
  const [previewTimer, setPreviewTimer] = useState(null);

  // Fetch user and journals from Supabase
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
          .eq('user_id', user.id) // Filter by user
          .is('deleted_at', null) // Soft delete
          .order('date', { ascending: false });
        
        if (journalsError) throw journalsError;
        setJournals(journalsData || []);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load data. Try refreshing.');
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

    // Cleanup markers on unmount
    return () => {
      if (map.current) {
        markersRef.current.forEach(marker => map.current.removeLayer(marker));
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
      }
    };
  }, [loading, mapLoaded, journals]);

  // Group journals by proximity
  const groupJournalsByProximity = useCallback((journals) => {
    const groups = [];
    const used = new Set();
    const PROXIMITY_THRESHOLD = 0.05; // ~5km

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
          script.onerror = () => reject(new Error('Failed to load Leaflet'));
          document.head.appendChild(script);
        });
      }

      const L = window.L;
      
      map.current = L.map(mapContainer.current, {
        zoomControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        zoomSnap: 0.5
      }).setView([20, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map.current);

      const journalGroups = groupJournalsByProximity(
        journals.filter(j => j.lat && j.lng && !isNaN(j.lat) && !isNaN(j.lng))
      );

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
        }).addTo(map.current);

        if (group.length === 1) {
          marker.on('mouseover', () => showPreview(mainJournal));
          marker.on('mouseout', () => schedulePreviewHide());
          if (L.Browser.touch) {
            marker.on('click', (e) => {
              L.DomEvent.stopPropagation(e);
              showPreview(mainJournal);
            });
            marker.on('dblclick', clickHandler);
          } else {
            marker.on('click', clickHandler);
          }
        } else {
          marker.on('click', clickHandler);
        }

        markersRef.current.push(marker);
        validLocations.push([lat, lng]);
      });

      if (validLocations.length > 1) {
        const sortedJournals = [...journals]
          .filter(j => j.lat && j.lng && j.date)
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        const path = sortedJournals.map(j => [parseFloat(j.lat), parseFloat(j.lng)]);

        if (path.length > 1) {
          L.polyline(path, {
            color: '#3B82F6',
            weight: 3,
            opacity: 0.6,
            dashArray: '8, 12'
          }).addTo(map.current);
        }
      }

      if (validLocations.length > 0) {
        const group = L.featureGroup(markersRef.current);
        const bounds = group.getBounds();
        if (bounds.isValid()) {
          map.current.fitBounds(bounds.pad(0.1), { maxZoom: 12, animate: true });
        }
      }

      setMapLoaded(true);
    } catch (err) {
      console.error('Map error:', err);
      setError('Failed to load map. Check network or refresh.');
    }
  };

  const showPreview = (journal) => {
    if (previewTimer) clearTimeout(previewTimer);
    setPreviewJournal(journal);
  };

  const schedulePreviewHide = () => {
    const timer = setTimeout(() => setPreviewJournal(null), 500);
    setPreviewTimer(timer);
  };

  const clearPreview = () => {
    if (previewTimer) clearTimeout(previewTimer);
    setPreviewJournal(null);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out. Try again.');
    }
  };

  const handleImageNavigation = (direction) => {
    if (!selectedJournal?.media_urls) return;
    const len = selectedJournal.media_urls.length;
    setCurrentImageIndex(prev => direction === 'next' ? (prev + 1) % len : (prev - 1 + len) % len);
  };

  useEffect(() => setCurrentImageIndex(0), [selectedJournal]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your journey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const journalsWithCoords = journals.filter(j => j.lat && j.lng && !isNaN(j.lat) && !isNaN(j.lng));
  const journalsWithoutCoords = journals.filter(j => !j.lat || !j.lng || isNaN(j.lat) || isNaN(j.lng));

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <header className={`bg-white/90 border-b sticky top-0 z-20 ${isFullscreen ? 'h-12' : 'h-16 md:h-20'}`}>
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {!isFullscreen && 'Dashboard'}
            </button>
            {!isFullscreen && (
              <div className="flex items-center space-x-3">
                <Navigation className="w-8 h-8 text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-full p-2" />
                <h1 className="text-xl font-bold text-gray-900">Journey Map</h1>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {!isFullscreen && (
              <>
                <div className="relative hidden md:block">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search journals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                    aria-label="Search journals"
                  />
                </div>
                <div className="text-sm text-gray-600 hidden lg:block">
                  <span className="font-semibold text-green-600">{journalsWithCoords.length}</span> mapped
                  {journalsWithoutCoords.length > 0 && (
                    <span className="ml-2">• <span className="font-semibold text-amber-600">{journalsWithoutCoords.length}</span> unmapped</span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{userName}</span>
                </div>
              </>
            )}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              {!isFullscreen && (
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 border text-sm text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 rounded-lg"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {journalsWithoutCoords.length > 0 && !isFullscreen && (
        <div className="bg-amber-50 p-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
              <span>
                <strong>{journalsWithoutCoords.length}</strong> journal{journalsWithoutCoords.length > 1 ? 's' : ''} missing coordinates. Add locations to display on map.
              </span>
            </div>
            <button 
              onClick={() => navigate('/add-journal')}
              className="text-sm text-amber-800 hover:text-amber-900 underline"
              aria-label="Add coordinates to journals"
            >
              Add coordinates →
            </button>
          </div>
        </div>
      )}

      <div className={`relative ${isFullscreen ? 'h-screen' : 'h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]'}`}>
        {journals.length > 0 ? (
          <>
            <div ref={mapContainer} className="w-full h-full" role="region" aria-label="Journey Map" />
            <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
              <button
                onClick={() => map.current?.zoomIn()}
                className="w-12 h-12 md:w-10 md:h-10 bg-white/90 rounded-lg shadow-lg hover:bg-white flex items-center justify-center text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-6 h-6 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => map.current?.zoomOut()}
                className="w-12 h-12 md:w-10 md:h-10 bg-white/90 rounded-lg shadow-lg hover:bg-white flex items-center justify-center text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-6 h-6 md:w-5 md:h-5" />
              </button>
            </div>
            {journalsWithCoords.length > 0 && !isFullscreen && (
              <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 bg-white/95 rounded-xl shadow-lg p-4 z-10 max-w-xs">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                  <Layers className="w-4 h-4 mr-2 text-blue-600" />
                  Map Legend
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center text-gray-600">
                    <div className="single-marker-mini mr-3"><div className="marker-number-mini">1</div></div>
                    Single journal
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="cluster-marker-mini mr-3"><div className="cluster-count-mini">3</div></div>
                    Multiple journals
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-6 h-1 bg-blue-500 mr-3 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, #3B82F6 4px, #3B82F6 8px)' }}></div>
                    Travel path
                  </div>
                </div>
              </div>
            )}
            {previewJournal && (
              <div 
                className="absolute z-30 bg-white/95 rounded-lg shadow-xl p-4 max-w-sm border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                style={{ left: '50%', top: '50%', transform: 'translate(-50%, -100%)', marginTop: '-80px' }}
                onMouseEnter={clearPreview}
                onMouseLeave={schedulePreviewHide}
                tabIndex={0}
                role="dialog"
                aria-label="Journal Preview"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm pr-2">{previewJournal.title || 'Untitled'}</h3>
                  {previewJournal.media_urls?.length > 0 && (
                    <Camera className="w-4 h-4 text-blue-600" aria-hidden="true" />
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-500 mb-2 space-x-3">
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" aria-hidden="true" />
                    {previewJournal.location}
                  </div>
                  {previewJournal.date && (
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
                      {new Date(previewJournal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
                {previewJournal.description && (
                  <p className="text-xs text-gray-600 line-clamp-3 mb-2">{previewJournal.description}</p>
                )}
                <button
                  onClick={() => {
                    setSelectedJournal(previewJournal);
                    clearPreview();
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
                  aria-label={`View full details of ${previewJournal.title || 'Untitled'}`}
                >
                  View full details →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-md p-4">
              <MapPin className="w-20 h-20 text-gray-300 mx-auto mb-6" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-gray-700 mb-3">No Journals Yet</h2>
              <p className="text-gray-500 mb-6">Start your adventure! Add journal entries with locations to see them on your map.</p>
              <button
                onClick={() => navigate('/add-journal')}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Create your first journal"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Journal
              </button>
            </div>
          </div>
        )}

        {selectedCluster && (
          <div className="absolute inset-0 z-40 bg-black/50 p-4 md:p-6 flex items-center justify-center" role="dialog" aria-label="Nearby Journals">
            <div className="bg-white/95 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Nearby Journals</h2>
                <button
                  onClick={() => { setSelectedCluster(null); clearPreview(); }}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Close nearby journals"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {selectedCluster.map((journal) => (
                  <div key={journal.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 text-sm pr-2">{journal.title || 'Untitled'}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/edit-journal/${journal.id}`)}
                          className="p-1 text-gray-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title="Edit Journal"
                          aria-label={`Edit ${journal.title || 'Untitled'}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await supabase.from('journals').update({ deleted_at: new Date() }).eq('id', journal.id);
                              setJournals(journals.filter(j => j.id !== journal.id));
                              setSelectedCluster(null);
                            } catch (err) {
                              console.error('Delete error:', err);
                              setError('Failed to delete journal.');
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                          title="Delete Journal"
                          aria-label={`Delete ${journal.title || 'Untitled'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" aria-hidden="true" />
                        {journal.location}
                      </div>
                      {journal.date && (
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
                          {new Date(journal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                    {journal.description && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-3">{journal.description}</p>
                    )}
                    <button
                      onClick={() => {
                        setSelectedJournal(journal);
                        setSelectedCluster(null);
                        clearPreview();
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline mt-2"
                      aria-label={`View details of ${journal.title || 'Untitled'}`}
                    >
                      View Details →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedJournal && (
          <div className="absolute inset-0 z-40 bg-black/50 p-4 md:p-6 flex items-center justify-center" role="dialog" aria-label="Journal Details">
            <div className="bg-white/95 rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">{selectedJournal.title || 'Untitled Journey'}</h2>
                <button
                  onClick={() => { setSelectedJournal(null); clearPreview(); }}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Close journal details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-blue-600" aria-hidden="true" />
                    {selectedJournal.location}
                  </div>
                  {selectedJournal.date && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-blue-600" aria-hidden="true" />
                      {new Date(selectedJournal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
                {selectedJournal.media_urls?.length > 0 && (
                  <div className="relative">
                    <img
                      src={selectedJournal.media_urls[currentImageIndex]}
                      alt={`${selectedJournal.title || 'Journal'} image ${currentImageIndex + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                      loading="lazy"
                    />
                    {selectedJournal.media_urls.length > 1 && (
                      <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-between px-2">
                        <button
                          onClick={() => handleImageNavigation('prev')}
                          className="bg-white/80 p-2 rounded-full shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleImageNavigation('next')}
                          className="bg-white/80 p-2 rounded-full shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Next image"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      Image {currentImageIndex + 1} of {selectedJournal.media_urls.length}
                    </div>
                  </div>
                )}
                {selectedJournal.description && (
                  <p className="text-sm text-gray-700">{selectedJournal.description}</p>
                )}
                {selectedJournal.mishaps && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">Mishap: {selectedJournal.mishaps}</p>
                  </div>
                )}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => navigate(`/edit-journal/${selectedJournal.id}`)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Edit ${selectedJournal.title || 'Untitled'}`}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => console.log(`Share journal: ${selectedJournal.id}`)}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    aria-label={`Share ${selectedJournal.title || 'Untitled'}`}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;