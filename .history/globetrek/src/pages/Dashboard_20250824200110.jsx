import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { Plane, MapPin, Camera, Calendar, LogOut, User } from "lucide-react";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    countries: 0,
    cities: 0,
    journals: 0,
    photos: 0,
  });

  useEffect(() => {
    const fetchUserDataAndStats = async () => {
      try {
        // Get user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          navigate("/");
          return;
        }

        // Try to get name from navigation state
        const stateUserName = location.state?.userName;
        if (stateUserName) {
          setUserName(stateUserName);
        } else {
          // Otherwise fetch from DB
          const { data, error } = await supabase
            .from("users")
            .select("name")
            .eq("id", user.id)
            .single();

          if (error) {
            console.error("Error fetching user data:", error);
            setUserName("Traveler");
          } else if (data) {
            setUserName(data.name);
          }
        }

        // Fetch journals
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
                const city = parts[0];
                const country = parts[parts.length - 1];
                cities.add(city);
                countries.add(country);
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
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndStats();
  }, [location.state, navigate]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/"); // ✅ fixed signout to go home
    } catch (error) {
      console.error("Error signing out:", error);
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
      ...
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200/50">
          <div className="text-2xl font-bold text-blue-600">{stats.countries}</div>
          <div className="text-sm text-gray-600">Countries Visited</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200/50">
          <div className="text-2xl font-bold text-blue-600">{stats.cities}</div>
          <div className="text-sm text-gray-600">Cities Explored</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200/50">
          <div className="text-2xl font-bold text-blue-600">{stats.journals}</div>
          <div className="text-sm text-gray-600">Journal Entries</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200/50">
          <div className="text-2xl font-bold text-blue-600">{stats.photos}</div>
          <div className="text-sm text-gray-600">Photos Shared</div>
        </div>
      </div>
    </div>
  );
}
