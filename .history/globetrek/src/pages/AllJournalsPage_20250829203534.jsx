import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Camera,
  User,
  LogOut,
  Plane,
  Plus,
  Eye,
} from "lucide-react";

export default function AllJournals() {
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [selectedJournal, setSelectedJournal] = useState(null);
  console.log(selectedJournal);
  useEffect(() => {
    const fetchUserAndJournals = async () => {
      try {
        // Get current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          navigate("/");
          return;
        }

        // Get user name
        const { data: userData } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single();

        setUserName(userData?.name || "Traveler");

        // Get all journals (ordered by date desc)
        const { data, error } = await supabase
          .from("journals")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (error) {
          console.error("Error fetching journals:", error);
        } else if (data) {
          setJournals(data);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndJournals();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <Camera className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your journeys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
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
                  <Camera className="w-5 h-5 text-blue-600" />
                  <span>My Journeys</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/add-journal")}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-md hover:from-blue-700 hover:to-blue-600 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Journey
              </button>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Travel Journal
                </h2>
                <p className="text-gray-600">
                  Your documented adventures and memories
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {journals.length}
                </div>
                <div className="text-sm text-gray-600">Total Journeys</div>
              </div>
            </div>
          </div>
        </div>

        {/* Journals Grid */}
        {journals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journals.map((journal, index) => (
              <div
                key={journal.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 overflow-hidden"
              >
                {/* Image */}
                {journal.media_urls && journal.media_urls.length > 0 ? (
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={journal.media_urls[0]}
                      alt={journal.title}
                      className="w-full h-full object-cover"
                    />
                    {journal.media_urls.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        +{journal.media_urls.length - 1} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {journal.title || "Untitled Journey"}
                    </h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {journal.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                        <span>{journal.location}</span>
                      </div>
                    )}

                    {journal.date && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-green-600" />
                        <span>
                          {new Date(journal.date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {journal.description && (
                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                      {journal.description}
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setSelectedJournal(journal);
                      navigate(`/journal/${journal.id}`);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2 px-4 rounded-md hover:from-blue-700 hover:to-blue-600 transition-colors text-sm font-medium flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Journey
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Journeys Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start documenting your travels and adventures!
            </p>
            <button
              onClick={() => navigate("/add-journal")}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-md hover:from-blue-700 hover:to-blue-600 transition-colors font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Journey
            </button>
          </div>
        )}
      </main>

      Full Journal Modal
      {selectedJournal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedJournal.title || "Untitled Journey"}
              </h2>
              <button
                onClick={() => setSelectedJournal(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Location and Date */}
              <div className="flex flex-wrap gap-4 mb-6">
                {selectedJournal.location && (
                  <div className="flex items-center text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-full">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{selectedJournal.location}</span>
                  </div>
                )}

                {selectedJournal.date && (
                  <div className="flex items-center text-sm bg-green-50 text-green-700 px-3 py-2 rounded-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {new Date(selectedJournal.date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedJournal.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Journey Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedJournal.description}
                  </p>
                </div>
              )}

              {/* Mishaps */}
              {selectedJournal.mishaps && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Mishaps & Challenges
                  </h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 leading-relaxed whitespace-pre-wrap">
                      {selectedJournal.mishaps}
                    </p>
                  </div>
                </div>
              )}

              {/* Media Gallery */}
              {selectedJournal.media_urls &&
                selectedJournal.media_urls.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Camera className="w-5 h-5 mr-2 text-purple-600" />
                      Media Gallery ({selectedJournal.media_urls.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedJournal.media_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Journey photo ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => window.open(url, "_blank")}
                        />
                      ))}
                    </div>
                  </div>
                )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedJournal(null)}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-md hover:from-blue-700 hover:to-blue-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for line-clamp */}
      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
