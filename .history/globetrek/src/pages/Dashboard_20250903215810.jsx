import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { Plane, MapPin, Camera, Calendar, LogOut, User } from "lucide-react";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Traveler");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    countries: 0,
    cities: 0,
    journals: 0,
    photos: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
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

        // ✅ Fetch user name
        if (location.state?.userName) {
          setUserName(location.state.userName);
        } else {
          const { data: userData } = await supabase
            .from("users")
            .select("name")
            .eq("id", user.id)
            .single();

          if (userData?.name) setUserName(userData.name);
        }

        // ✅ Fetch journals for stats
        const { data: journals, error: journalError } = await supabase
          .from("journals")
          .select("location, media_urls")
          .eq("user_id", user.id);

        if (journalError) throw journalError;

        if (journals) {
          const cities = new Set();
          const countries = new Set();
          let photosCount = 0;

          journals.forEach((j) => {
            if (j.location) {
              const parts = j.location.split(",").map((s) => s.trim());
              if (parts.length > 1) {
                cities.add(parts[0]);
                countries.add(parts[parts.length - 1]);
              } else {
                cities.add(parts[0]);
              }
            }

            if (j.media_urls) {
              photosCount += j.media_urls.length;
            }
          });

          setStats({
            countries: countries.size,
            cities: cities.size,
            journals: journals.length,
            photos: photosCount,
          });
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [location.state, navigate]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log()
      navigate("/"); // ✅ go to home instead of /signin
    } catch (err) {
      console.error("Error signing out:", err);
      alert("Error signing out. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <Plane className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">GlobeTrek</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Welcome, {userName}!</span>
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

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userName}! ✈️
          </h2>
          <p className="text-gray-600 text-lg">
            Ready for your next adventure? Your journey starts here.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <ActionCard
            icon={<MapPin className="w-6 h-6 text-blue-600" />}
            title="Share New Experience"
            description="Discover new destinations and create your perfect itinerary."
            buttonText="Add Journal"
            buttonAction={() => navigate("/add-journal")}
            buttonStyle="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600"
          />
          <ActionCard
            icon={<Camera className="w-6 h-6 text-green-600" />}
            title="Travel Journals"
            description="See your adventures and shared experiences."
            buttonText="View Journal"
            buttonAction={() => navigate("/all-journals")}
            buttonStyle="border border-gray-300 text-gray-700 hover:bg-gray-50"
          />
          <ActionCard
            icon={<Calendar className="w-6 h-6 text-purple-600" />}
            title="Map View"
            description="Keep track of your planned adventures and bookings."
            buttonText="View Map"
            buttonAction={() => navigate("/map-view")}
            buttonStyle="bg-gray-200 text-gray-800 hover:bg-gray-300"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard value={stats.countries} label="Countries Visited" />
          <StatCard value={stats.cities} label="Cities Explored" />
          <StatCard value={stats.journals} label="Journal Entries" />
          <StatCard value={stats.photos} label="Photos Shared" />
        </div>
      </main>
    </div>
  );
}

// 🔹 Small reusable card components
function ActionCard({ icon, title, description, buttonText, buttonAction, buttonStyle }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <button
        onClick={buttonAction}
        className={`w-full py-2 px-4 rounded-lg transition-all duration-200 ${buttonStyle}`}
      >
        {buttonText}
      </button>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="bg-white rounded-lg p-4 text-center border border-gray-200/50">
      <div className="text-2xl font-bold text-blue-600">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
