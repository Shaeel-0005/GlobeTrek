import { useEffect, useState, useCallback } from "react";
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
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";

export default function AllJournals() {
  const navigate = useNavigate();

  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Traveler");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* =========================
     FETCH USER + JOURNALS
     ========================= */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        navigate("/");
        return;
      }

      // Fetch user name
      const { data: userRow } = await supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();

      setUserName(userRow?.name || "Traveler");

      // Fetch journals
      const { data, error } = await supabase
        .from("journals")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("date", { ascending: false });

      if (error) throw error;
      setJournals(data || []);

    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =========================
     AUTH
     ========================= */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  /* =========================
     DELETE JOURNAL
     ========================= */
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from("journals")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", deleteId);

      if (error) throw error;

      setJournals((prev) => prev.filter(j => j.id !== deleteId));
      setDeleteId(null);

    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete journal.");
    } finally {
      setDeleting(false);
    }
  };

  /* =========================
     LOADING STATE
     ========================= */
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

  /* =========================
     UI
     ========================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center px-3 py-2 text-sm border rounded-md hover:bg-blue-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                My Journeys
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/add-journal")}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Journey
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              {userName}
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center px-3 py-2 border rounded-md hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {journals.length === 0 ? (
          <div className="text-center py-16">
            <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Journeys Yet</h2>
            <p className="text-gray-600 mb-6">
              Start documenting your adventures.
            </p>
            <button
              onClick={() => navigate("/add-journal")}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Add Your First Journey
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journals.map((j, idx) => (
              <div
                key={j.id}
                className="bg-white rounded-xl shadow border hover:shadow-lg transition overflow-hidden group"
              >

                {/* IMAGE */}
                <div className="h-48 relative bg-gray-100">
                  {j.media_urls?.length ? (
                    <img
                      src={j.media_urls[0]}
                      alt={j.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => navigate(`/edit-journal/${j.id}`)}
                      className="p-2 bg-white rounded-full text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(j.id)}
                      className="p-2 bg-white rounded-full text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">
                    {j.title || "Untitled Journey"}
                  </h3>

                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    {j.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {j.location}
                      </div>
                    )}
                    {j.date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(j.date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/journal/${j.id}`)}
                    className="w-full mt-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex justify-center items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Journey
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">
              Delete Journal?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2 bg-red-600 text-white rounded-md"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
