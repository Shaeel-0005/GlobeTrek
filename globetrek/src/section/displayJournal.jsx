import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  Image as ImageIcon, // Fixed the import error from before
  X
} from "lucide-react";

const DisplayJournal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [journal, setJournal] = useState(null);
  const [allJournals, setAllJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Delete State
  const [deleteId, setDeleteId] = useState(null); // Controls the modal
  const [deleting, setDeleting] = useState(false); // Controls the loading state during delete

  // Fetch selected journal
  useEffect(() => {
    const fetchJournal = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("journals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) console.log("Error fetching journal:", error);
      else setJournal(data);
      setLoading(false);
    };

    if (id) fetchJournal();
  }, [id]);

  // Fetch all journals (sidebar)
  useEffect(() => {
    const fetchAllJournals = async () => {
      const { data, error } = await supabase
        .from("journals")
        .select("id, title, media_urls, date")
        .order("date", { ascending: false });

      if (error) console.log("Error fetching all journals:", error);
      else setAllJournals(data);
    };

    fetchAllJournals();
  }, []);

  /* ==========================================
     UPDATED DELETE LOGIC (Hard Delete)
     ========================================== */
  const confirmDelete = async () => {
    if (!deleteId) return;
    
    setDeleting(true);

    try {
      // 1. Get current user (Security Check)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 2. Perform Hard Delete
      const { error } = await supabase
        .from("journals")
        .delete() // <--- Changed from .update() to .delete()
        .eq("id", deleteId)
        .eq("user_id", user.id);

      if (error) throw error;

      // 3. Navigate away on success
      navigate("/all-journals", { replace: true });

    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete journal.");
      setDeleting(false); // Only stop loading if it failed
      setDeleteId(null);  // Close modal
    }
  };

  // Skeleton Loader Component
  const JournalSkeleton = () => (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-64 bg-gray-200 rounded-xl mb-6"></div>
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR - Navigation */}
      <aside className="w-20 lg:w-64 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col z-10">
        <div className="p-4 border-b border-gray-100 flex items-center justify-center lg:justify-start">
           <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 hidden lg:block">
             TravelLog
           </span>
           <span className="lg:hidden text-2xl">🌍</span>
        </div>
        
        <div className="p-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center lg:justify-start w-full px-4 py-3 text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-200 group"
          >
            <ArrowLeft className="w-5 h-5 lg:mr-3 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden lg:inline font-medium">Dashboard</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <div className="max-w-5xl mx-auto px-6 py-10 lg:px-12">
          
          {loading ? (
            <JournalSkeleton />
          ) : journal ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* Header Section */}
              <div className="relative">
                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mb-6">
                  <button
                    onClick={() => navigate(`/edit-journal/${journal.id}`)}
                    className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:border-blue-300 hover:text-blue-600 transition"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(journal.id)}
                    className="flex items-center px-4 py-2 bg-white border border-gray-200 text-red-600 rounded-lg shadow-sm hover:bg-red-50 hover:border-red-200 transition"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>

                {/* Hero Image */}
                {journal.media_urls?.length > 0 ? (
                  <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-md mb-8 relative group">
                    <img
                      src={journal.media_urls[0]}
                      alt={journal.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                    <h1 className="absolute bottom-6 left-6 right-6 text-4xl font-bold text-white shadow-sm leading-tight">
                      {journal.title}
                    </h1>
                  </div>
                ) : (
                  <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                    {journal.title}
                  </h1>
                )}

                {/* Meta Data */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b border-gray-100 pb-8">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                    {journal.location || "Unknown Location"}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    {new Date(journal.date).toLocaleDateString(undefined, {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {/* Main Text Content */}
              <article className="prose prose-lg prose-blue max-w-none text-gray-600 leading-relaxed">
                <p className="whitespace-pre-wrap">{journal.description}</p>
              </article>

              {/* Mishaps Section */}
              {journal.mishaps && (
                <div className="bg-rose-50 border-l-4 border-rose-400 p-6 rounded-r-xl my-8">
                  <div className="flex items-start">
                    <AlertTriangle className="w-6 h-6 text-rose-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-rose-800 mb-1">Unexpected Turn</h3>
                      <p className="text-rose-700 italic">{journal.mishaps}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Gallery Grid */}
              {journal.media_urls?.length > 0 && (
                <div className="pt-8 border-t border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <ImageIcon className="w-6 h-6 mr-3 text-gray-400" />
                    Visual Memories
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {journal.media_urls.map((url, index) => (
                      <div
                        key={index}
                        onClick={() => window.open(url, "_blank")}
                        className="relative group cursor-zoom-in overflow-hidden rounded-xl bg-gray-100 aspect-[4/3]"
                      >
                        <img
                          src={url}
                          alt={`Memory ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              Journal not found.
            </div>
          )}
        </div>
      </main>

      {/* RIGHT SIDEBAR - List */}
      <aside className="w-72 border-l border-gray-200 bg-white hidden xl:flex flex-col">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-700">Journal History</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {allJournals.map((j) => (
            <div
              key={j.id}
              onClick={() => navigate(`/journal/${j.id}`)}
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                j.id === id
                  ? "bg-blue-50 border-blue-200 shadow-sm"
                  : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
              }`}
            >
              <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                {j.media_urls?.[0] ? (
                  <img
                    src={j.media_urls[0]}
                    alt={j.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon size={16} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${j.id === id ? 'text-blue-700' : 'text-gray-800'}`}>
                  {j.title || "Untitled Journey"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(j.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* DELETE MODAL (Uses updated logic) */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform scale-100 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <button 
                onClick={() => setDeleteId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete this memory?
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to delete this journal entry? This action cannot be undone and all photos associated with it will be permanently removed.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200 transition"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisplayJournal;