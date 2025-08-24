import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  ArrowLeft, MapPin, Calendar, Camera, X, 
  Plane, User, LogOut, Navigation 
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

        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();
        setUserName(userData?.name || 'Traveler');

        const { data, error } = await supabase
          .from('journals')
          .select('*')
          .eq('user_id', user.id)
          .not('location', 'is', null)
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching journals:', error);
        } else if (data) {
          setJournals(data);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndJournals();
  }, [navigate]);

  // Load map after journals fetched
  useEffect(() => {
    if (journals.length > 0 && !mapLoaded) {
      loadLeafletMap();
    }
  }, [journals, mapLoaded]);

  const loadLeafletMap = async () => {
    if (mapLoaded || !mapContainer.current) return;

    try {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);
      }

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
      map.current = L.map(mapContainer.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([20, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map.current);

      const validLocations = [];
      journals.forEach((journal, index) => {
        if (journal.location) {
          const coords = parseLocation(journal.location);
          if (coords) {
            const numberedIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `
                <div class="marker-pin">
                  <div class="marker-number">${index + 1}</div>
                </div>
              `,
              iconSize: [30, 42],
              iconAnchor: [15, 42]
            });

            const marker = L.marker([coords.lat, coords.lng], { 
              icon: numberedIcon,
              riseOnHover: true
            }).addTo(map.current);

            marker.bindTooltip(`
              <div class="tooltip-content">
                <h3 class="tooltip-title">${journal.title || 'Untitled Journey'}</h3>
                <p class="tooltip-location">${journal.location}</p>
                <p class="tooltip-date">${journal.date ? new Date(journal.date).toLocaleDateString() : ''}</p>
              </div>
            `, {
              direction: 'top',
              offset: [0, -42],
              className: 'custom-tooltip'
            });

            marker.on('click', () => {
              setSelectedJournal(journal);
              map.current.flyTo([coords.lat, coords.lng], 6, { duration: 1.5 });
            });

            markersRef.current.push(marker);
            validLocations.push([coords.lat, coords.lng]);
          }
        }
      });

      if (validLocations.length > 1) {
        L.polyline(validLocations, {
          color: '#3B82F6',
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 10'
        }).addTo(map.current);
      }

      if (validLocations.length > 0) {
        const group = new L.featureGroup(markersRef.current);
        map.current.fitBounds(group.getBounds().pad(0.1));
      }

      setMapLoaded(true);
    } catch (err) {
      console.error('Error loading map:', err);
    }
  };

  const parseLocation = (location) => {
    const locationMap = {
      'paris': { lat: 48.8566, lng: 2.3522 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'nyc': { lat: 40.7128, lng: -74.0060 },
      'rome': { lat: 41.9028, lng: 12.4964 },
      'barcelona': { lat: 41.3851, lng: 2.1734 },
      'amsterdam': { lat: 52.3676, lng: 4.9041 },
      'berlin': { lat: 52.5200, lng: 13.4050 },
      'sydney': { lat: -33.8688, lng: 151.2093 },
      'bangkok': { lat: 13.7563, lng: 100.5018 },
      'dubai': { lat: 25.2048, lng: 55.2708 },
      'singapore': { lat: 1.3521, lng: 103.8198 },
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'delhi': { lat: 28.6139, lng: 77.2090 },
      'bangalore': { lat: 12.9716, lng: 77.5946 },
      'karachi': { lat: 24.8607, lng: 67.0011 },
      'lahore': { lat: 31.5804, lng: 74.3587 },
      'islamabad': { lat: 33.6844, lng: 73.0479 },
      'rawalpindi': { lat: 33.5651, lng: 73.0169 },
      'faisalabad': { lat: 31.4504, lng: 73.1350 },
      'peshawar': { lat: 34.0151, lng: 71.5249 },
      'quetta': { lat: 30.1798, lng: 66.9750 },
      'multan': { lat: 30.1575, lng: 71.5249 },
      'istanbul': { lat: 41.0082, lng: 28.9784 },
      'cairo': { lat: 30.0444, lng: 31.2357 },
      'moscow': { lat: 55.7558, lng: 37.6176 },
      'beijing': { lat: 39.9042, lng: 116.4074 },
      'seoul': { lat: 37.5665, lng: 126.9780 },
      'mexico city': { lat: 19.4326, lng: -99.1332 },
      'buenos aires': { lat: -34.6118, lng: -58.3960 },
      'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
      'cape town': { lat: -33.9249, lng: 18.4241 },
      'los angeles': { lat: 34.0522, lng: -118.2437 },
      'chicago': { lat: 41.8781, lng: -87.6298 },
      'toronto': { lat: 43.6532, lng: -79.3832 },
      'vancouver': { lat: 49.2827, lng: -123.1207 }
    };
    const key = location.toLowerCase().trim();
    return locationMap[key] || null;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your journey map...</p>
        </div>
      </div>
    );
  }

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

      {/* Map */}
      <div className="relative h-[calc(100vh-4rem)]">
        {journals.length > 0 ? (
          <div ref={mapContainer} className="w-full h-full" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No journeys with locations yet.
          </div>
        )}

        {/* Journal Modal */}
        {selectedJournal && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
              <button
                onClick={() => setSelectedJournal(null)}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedJournal.title || 'Untitled Journey'}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                <MapPin className="inline w-4 h-4 mr-1 text-blue-600" />
                {selectedJournal.location} • {selectedJournal.date ? new Date(selectedJournal.date).toLocaleDateString() : ''}
              </p>

              <div className="prose max-w-none text-gray-700">
                {selectedJournal.content || "No content available for this journey."}
              </div>

              {selectedJournal.image_url && (
                <img
                  src={selectedJournal.image_url}
                  alt={selectedJournal.title}
                  className="mt-4 rounded-lg shadow"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
