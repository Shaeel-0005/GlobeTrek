import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  ArrowLeft, MapPin, Calendar, Camera, X, 
  Plane, User, LogOut, Navigation, AlertCircle, Plus
} from 'lucide-react';

const MapView = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [userName, setUserName] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState('');
  const markersRef = useRef([]);

  // Fetch user + journals
  useEffect(() => {
    const fetchUserAndJournals = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          navigate('/');
          return;
        }

        // Get user name
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();
        setUserName(userData?.name || 'Traveler');

        // Fetch journals with coordinates
        const { data, error } = await supabase
          .from('journals')
          .select('*')
          .eq('user_id', user.id)
          .not('location', 'is', null)
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching journals:', error);
          setError('Failed to load journals');
        } else if (data) {
          console.log('Fetched journals:', data); // Debug log
          setJournals(data);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndJournals();
  }, [navigate]);

  // Load map after journals fetched
  useEffect(() => {
    if (!loading && !mapLoaded) {
      loadLeafletMap();
    }
  }, [loading, mapLoaded]);

  const loadLeafletMap = async () => {
    if (mapLoaded || !mapContainer.current) return;

    try {
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        cssLink.crossOrigin = '';
        document.head.appendChild(cssLink);
      }

      // Load Leaflet JS
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
          script.crossOrigin = '';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const L = window.L;
      
      // Initialize map
      map.current = L.map(mapContainer.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true
      }).setView([20, 0], 2);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map.current);

      // Process journals and add markers
      const validLocations = [];
      const journalsWithCoords = journals.filter(journal => 
        journal.lat && journal.lng && 
        !isNaN(parseFloat(journal.lat)) && 
        !isNaN(parseFloat(journal.lng))
      );

      console.log('Journals with valid coordinates:', journalsWithCoords); // Debug log

      journalsWithCoords.forEach((journal, index) => {
        const lat = parseFloat(journal.lat);
        const lng = parseFloat(journal.lng);
        
        if (lat && lng) {
          // Create custom numbered marker
          const numberedIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div class="marker-pin">
                <div class="marker-number">${index + 1}</div>
              </div>
            `,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
            popupAnchor: [0, -42]
          });

          const marker = L.marker([lat, lng], { 
            icon: numberedIcon,
            riseOnHover: true,
            title: journal.title || 'Untitled Journey'
          }).addTo(map.current);

          // Create tooltip
          marker.bindTooltip(`
            <div class="tooltip-content">
              <h3 class="tooltip-title">${journal.title || 'Untitled Journey'}</h3>
              <p class="tooltip-location">${journal.location}</p>
              <p class="tooltip-date">${journal.date ? new Date(journal.date).toLocaleDateString() : 'No date'}</p>
            </div>
          `, {
            direction: 'top',
            offset: [0, -42],
            className: 'custom-tooltip',
            permanent: false,
            opacity: 0.9
          });

          // Handle marker click
          marker.on('click', () => {
            setSelectedJournal(journal);
            map.current.flyTo([lat, lng], Math.max(map.current.getZoom(), 8), { 
              duration: 1.5 
            });
          });

          markersRef.current.push(marker);
          validLocations.push([lat, lng]);
        }
      });

      // Draw path between locations if multiple exist
      if (validLocations.length > 1) {
        const polyline = L.polyline(validLocations, {
          color: '#3B82F6',
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 10',
          className: 'travel-path'
        }).addTo(map.current);

        // Add path tooltip
        polyline.bindTooltip('Travel Path', { 
          sticky: true,
          className: 'path-tooltip'
        });
      }

      // Fit map to show all markers
      if (validLocations.length > 0) {
        const group = new L.featureGroup(markersRef.current);
        const bounds = group.getBounds();
        
        if (bounds.isValid()) {
          map.current.fitBounds(bounds.pad(0.1), {
            maxZoom: 15,
            animate: true,
            duration: 1.5
          });
        }
      } else {
        // No valid coordinates found
        console.warn('No journals with valid coordinates found');
      }

      setMapLoaded(true);

    } catch (err) {
      console.error('Error loading map:', err);
      setError('Failed to load map. Please try refreshing the page.');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your journey map...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const journalsWithCoords = journals.filter(j => j.lat && j.lng);
  const journalsWithoutCoords = journals.filter(j => !j.lat || !j.lng);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                  <Plane className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  <span>Journey Map</span>
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-green-600">{journalsWithCoords.length}</span> mapped
                {journalsWithoutCoords.length > 0 && (
                  <span className="ml-2">
                    • <span className="font-medium text-amber-600">{journalsWithoutCoords.length}</span> text-only
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{userName}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Info bar for text-only locations */}
      {journalsWithoutCoords.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
            <span>
              {journalsWithoutCoords.length} journal{journalsWithoutCoords.length > 1 ? 's' : ''} without coordinates won't appear on the map. 
              <button 
                onClick={() => navigate('/add-journal')}
                className="ml-1 underline hover:no-underline font-medium"
              >
                Add coordinates when editing
              </button>
            </span>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative h-[calc(100vh-4rem)]">
        {journals.length > 0 ? (
          <>
            <div ref={mapContainer} className="w-full h-full" />
            
            {/* Map legend */}
            {journalsWithCoords.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Legend</h3>
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold">1</div>
                  Numbered markers show journey sequence
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-4 h-1 bg-blue-500 mr-2" style={{borderStyle: 'dashed'}}></div>
                  Dotted line shows travel path
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No journeys to display</h2>
              <p className="text-gray-500 mb-6">Start creating journal entries with locations to see them on the map!</p>
              <button
                onClick={() => navigate('/add-journal')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Journey
              </button>
            </div>
          </div>
        )}

        {/* Journal Detail Modal */}
        {selectedJournal && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedJournal.title || 'Untitled Journey'}
                </h2>
                <button
                  onClick={() => setSelectedJournal(null)}
                  className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <MapPin className="w-4 h-4 mr-1 text-blue-600" />
                  <span className="mr-4">{selectedJournal.location}</span>
                  {selectedJournal.date && (
                    <>
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      <span>{new Date(selectedJournal.date).toLocaleDateString()}</span>
                    </>
                  )}
                </div>

                {selectedJournal.description && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                    <div className="prose max-w-none text-gray-700 text-sm leading-relaxed">
                      {selectedJournal.description}
                    </div>
                  </div>
                )}

                {selectedJournal.mishaps && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Mishaps & Challenges</h3>
                    <div className="prose max-w-none text-gray-700 text-sm leading-relaxed bg-amber-50 p-3 rounded-lg">
                      {selectedJournal.mishaps}
                    </div>
                  </div>
                )}

                {selectedJournal.media_urls && selectedJournal.media_urls.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Camera className="w-4 h-4 mr-1" />
                      Media ({selectedJournal.media_urls.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedJournal.media_urls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`${selectedJournal.title} - ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                            onClick={() => window.open(url, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg cursor-pointer" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .marker-pin {
          width: 30px;
          height: 42px;
          border-radius: 50% 50% 50% 0;
          background: linear-gradient(135deg, #3B82F6, #1D4ED8);
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -21px 0 0 -15px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
        }
        
        .marker-number {
          color: white;
          font-weight: bold;
          font-size: 12px;
          transform: rotate(45deg);
          margin-top: -2px;
        }
        
        .marker-pin:hover {
          transform: rotate(-45deg) scale(1.1);
          transition: transform 0.2s ease;
        }
        
        .custom-tooltip {
          background: rgba(0, 0, 0, 0.8) !important;
          border: none !important;
          border-radius: 6px !important;
          color: white !important;
          font-size: 12px !important;
          padding: 8px 10px !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
        }
        
        .tooltip-title {
          font-weight: 600 !important;
          margin: 0 0 4px 0 !important;
          color: #60A5FA !important;
        }
        
        .tooltip-location, .tooltip-date {
          margin: 2px 0 !important;
          color: #D1D5DB !important;
          font-size: 11px !important;
        }
        
        .travel-path {
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        
        .path-tooltip {
          background: rgba(59, 130, 246, 0.9) !important;
          border: none !important;
          border-radius: 4px !important;
          color: white !important;
          font-size: 11px !important;
          padding: 4px 8px !important;
        }
      `}</style>
    </div>
  );
};

export default MapView;