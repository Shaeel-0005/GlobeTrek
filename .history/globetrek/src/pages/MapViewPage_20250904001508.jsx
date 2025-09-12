import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ArrowLeft, MapPin, Calendar, Camera, X, 
  Plane, User, LogOut, Navigation, AlertCircle, Plus,
  Maximize2, Search, Filter, ChevronLeft, ChevronRight,
  Edit, Trash2, Share2, ZoomIn, ZoomOut, Layers
} from 'lucide-react';

// Replace with your Supabase credentials
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MapView = () => {
  const navigate = (path) => console.log(`Navigate to: ${path}`);
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

  // Fetch user + journals from real Supabase
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
          .select('*')
          .not('deleted_at', 'is', null)
          .order('date', { ascending: false });
        
        if (journalsError) throw journalsError;
        
        setJournals(journalsData || []);
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

  // Group journals by proximity (increased threshold for better clustering)
  const groupJournalsByProximity = useCallback((journals) => {
    const groups = [];
    const used = new Set();
    const PROXIMITY_THRESHOLD = 0.05; // Increased for nearby locations ~5km

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
      // Load Leaflet CSS (cache if possible)
      if (!document.querySelector('link[href*="leaflet"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);
      }

      // Load Leaflet JS
      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const L = window.L;
      
      // Initialize map
      map.current = L.map(mapContainer.current, {
        zoomControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        zoomSnap: 0.5
      }).setView([20, 0], 2);

      // Add tile layer with caching
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        tileSize: 256,
        useCache: true // Enable caching if browser supports
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
          riseOnHover: true
        }).addTo(map.current);

        // Hover preview for single markers (with mobile tap fallback)
        if (group.length === 1) {
          marker.on('mouseover', () => showPreview(mainJournal, marker));
          marker.on('mouseout', () => schedulePreviewHide());
          if (L.Browser.touch) {
            marker.on('click', (e) => {
              L.DomEvent.stopPropagation(e); // Prevent map click
              showPreview(mainJournal, marker);
            });
          }
        } else if (L.Browser.touch) {
          marker.on('click', clickHandler);
        }

        marker.on('click', clickHandler);
        markersRef.current.push(marker);
        validLocations.push([lat, lng]);
      });

      // Draw path
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

      // Fit bounds
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
    const timer = setTimeout(() => setPreviewJournal(null), 500); // Increased delay
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
    }
  };

  const handleImageNavigation = (direction) => {
    if (!selectedJournal?.media_urls) return;
    const len = selectedJournal.media_urls.length;
    setCurrentImageIndex(prev => direction === 'next' ? (prev + 1) % len : (prev - 1 + len) % len);
  };

  useEffect(() => setCurrentImageIndex(0), [selectedJournal]);

  if (loading) return <div>Loading...</div>; // Add skeleton

  if (error) return <div>Error: {error}. <button onClick={() => window.location.reload()}>Retry</button></div>;

  const journalsWithCoords = journals.filter(j => j.lat && j.lng);
  const journalsWithoutCoords = journals.filter(j => !j.lat || !j.lng);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header with responsive adjustments */}
      <header className={`bg-white/90 border-b sticky top-0 z-20 ${isFullscreen ? 'h-12' : 'h-16 md:h-20'}`}>
        {/* ... (keep existing, add mobile menu if needed) */}
      </header>

      {/* Info bar */}
      {journalsWithoutCoords.length > 0 && !isFullscreen && (
        <div className="bg-amber-50 p-3">
          {/* ... */}
        </div>
      )}

      {/* Map Container */}
      <div className={`relative ${isFullscreen ? 'h-screen' : 'h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]'}`}>
        {journals.length > 0 ? (
          <>
            <div ref={mapContainer} className="w-full h-full" />
            {/* Zoom controls larger for touch */}
            <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
              <button onClick={() => map.current?.zoomIn()} className="w-12 h-12 md:w-10 md:h-10 bg-white rounded-lg">
                <ZoomIn className="w-6 h-6 md:w-5 md:h-5" />
              </button>
              <button onClick={() => map.current?.zoomOut()} className="w-12 h-12 md:w-10 md:h-10 bg-white rounded-lg">
                <ZoomOut className="w-6 h-6 md:w-5 md:h-5" />
              </button>
            </div>
            {/* Legend responsive */}
            {journalsWithCoords.length > 0 && !isFullscreen && (
              <div className="absolute bottom-4 left-4 bg-white rounded-xl p-4 z-10 max-w-xs md:max-w-md">
                {/* ... */}
              </div>
            )}
            {/* Preview with truncation */}
            {previewJournal && (
              <div className="absolute z-30 bg-white rounded-lg p-4 max-w-sm" 
                style={{left: '50%', top: '50%', transform: 'translate(-50%, -100%)', marginTop: '-80px'}}
                onMouseEnter={clearPreview} onMouseLeave={schedulePreviewHide}>
                <h3>{previewJournal.title}</h3>
                <p className="line-clamp-3">{previewJournal.description}</p>
                {/* ... */}
              </div>
            )}
          </>
        ) : (
          <div>No journals. Add one.</div> // Improved empty state
        )}

        {/* Cluster Modal responsive */}
        {selectedCluster && (
          <div className="absolute inset-0 z-40 bg-black/50 p-4 overflow-auto">
            <div className="bg-white rounded-xl max-w-md w-full p-6 mx-auto">
              {/* ... */}
            </div>
          </div>
        )}

        {/* Journal Modal with gallery swipe */}
        {selectedJournal && (
          <div className="absolute inset-0 z-40 bg-black/50 p-4 overflow-auto">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 mx-auto">
              {/* ... add swipe for images */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;