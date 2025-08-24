import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ArrowLeft, MapPin, Calendar, Camera, X, Plane, User, LogOut } from 'lucide-react';

const MapView = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [toast, setToast] = useState(null);
  const [userName, setUserName] = useState('');
  const markersRef = useRef([]);

  // Simple toast function
  const showToast = (title, description, variant = 'default') => {
    setToast({ title, description, variant });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchUserAndJournals = async () => {
      try {
        // Get current user
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

        // Get journals
        const { data, error } = await supabase
          .from('journals')
          .select('*')
          .eq('user_id', user.id)
          .not('location', 'is', null);
          
        if (error) {
          console.error('Error fetching journals:', error);
          showToast(
            "Error loading journals",
            "Could not load your travel journals.",
            "destructive"
          );
        } else if (data) {
          setJournals(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndJournals();
  }, [navigate]);

  const initializeMap = (token) => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [0, 20],
      zoom: 2
    });

    map.current.addControl(new mapboxgl.NavigationControl());
    
    // Add markers for journals with valid locations
    journals.forEach(journal => {
      if (journal.location && map.current) {
        const coords = parseLocation(journal.location);
        if (coords) {
          const marker = new mapboxgl.Marker({
            color: '#3B82F6'
          })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map.current);

          // Add click event
          marker.getElement().addEventListener('click', () => {
            setSelectedJournal(journal);
          });

          markersRef.current.push(marker);
        }
      }
    });

    if (markersRef.current.length > 0) {
      // Fit map to show all markers
      const bounds = new mapboxgl.LngLatBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  };

  // Simple location parser - in production, use proper geocoding
  const parseLocation = (location) => {
    const locationMap = {
      'paris': { lat: 48.8566, lng: 2.3522 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'rome': { lat: 41.9028, lng: 12.4964 },
      'barcelona': { lat: 41.3851, lng: 2.1734 },
      'amsterdam': { lat: 52.3676, lng: 4.9041 },
      'berlin': { lat: 52.5200, lng: 13.4050 },
      'sydney': { lat: -33.8688, lng: 151.2093 },
      'bangkok': { lat: 13.7563, lng: 100.5018 },
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'delhi': { lat: 28.6139, lng: 77.2090 },
      'karachi': { lat: 24.8607, lng: 67.0011 },
      'lahore': { lat: 31.5804, lng: 74.3587 },
      'islamabad': { lat: 33.6844, lng: 73.0479 },
      'dubai': { lat: 25.2048, lng: 55.2708 }
    };
    
    const key = location.toLowerCase().trim();
    return locationMap[key] || null;
  };

  const handleMapboxTokenSubmit = () => {
    if (mapboxToken.trim()) {
      initializeMap(mapboxToken);
    } else {
      showToast(
        "Token required",
        "Please enter your Mapbox public token.",
        "destructive"
      );
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      showToast('Error', 'Error signing out. Please try again.', 'destructive');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your journeys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.variant === 'destructive' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'
        }`}>
          <div className="font-semibold">{toast.title}</div>
          <div className="text-sm">{toast.description}</div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
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
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Map View</span>
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {journals.length} {journals.length === 1 ? 'journey' : 'journeys'} mapped
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

      <div className="flex-1 relative">
        {!map.current ? (
          <div className="max-w-md mx-auto p-8 mt-20">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-center text-gray-900 mb-4">Configure Mapbox</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 text-center">
                    Enter your Mapbox public token to view your journeys on the map.
                  </p>
                  <input
                    type="text"
                    placeholder="pk.eyJ1Ijoi..."
                    value={mapboxToken}
                    onChange={(e) => setMapboxToken(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button 
                    onClick={handleMapboxTokenSubmit}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2 px-4 rounded-md hover:from-blue-700 hover:to-blue-600 transition-colors"
                  >
                    Load Map
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Get your token from{' '}
                    <a 
                      href="https://mapbox.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      mapbox.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Map Container */}
            <div ref={mapContainer} className="absolute inset-0" />

            {/* Journal Preview Modal */}
            {selectedJournal && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full max-h-[80vh] overflow-auto">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedJournal.title || 'Untitled Journey'}
                    </h3>
                    <button
                      onClick={() => setSelectedJournal(null)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    {selectedJournal.location && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span>{selectedJournal.location}</span>
                      </div>
                    )}
                    
                    {selectedJournal.date && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span>{new Date(selectedJournal.date).toLocaleDateString()}</span>
                      </div>
                    )}

                    {selectedJournal.description && (
                      <p className="text-sm text-gray-700 leading-relaxed">{selectedJournal.description}</p>
                    )}

                    {selectedJournal.media_urls && selectedJournal.media_urls.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Camera className="w-4 h-4 text-purple-600" />
                          <span>{selectedJournal.media_urls.length} photo{selectedJournal.media_urls.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedJournal.media_urls.slice(0, 4).map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-20 object-cover rounded-md border border-gray-200"
                            />
                          ))}
                          {selectedJournal.media_urls.length > 4 && (
                            <div className="w-full h-20 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
                              <span className="text-sm text-gray-500">+{selectedJournal.media_urls.length - 4} more</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => setSelectedJournal(null)} 
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2 px-4 rounded-md hover:from-blue-700 hover:to-blue-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Stats */}
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
                <div className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {journals.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      Journeys Mapped
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {journals.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md p-6">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Journeys Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start documenting your travels to see them appear on the map!
              </p>
              <button 
                onClick={() => navigate('/add-journal')}
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2 px-6 rounded-md hover:from-blue-700 hover:to-blue-600 transition-colors"
              >
                Start Journaling
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;