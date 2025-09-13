import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Camera,
  X,
  Save,
  Trash2,
  Plus,
  Upload,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function EditJournal() {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);
  
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form data
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [mishaps, setMishaps] = useState("");
  const [mediaUrls, setMediaUrls] = useState([]);
  const [coordinates, setCoordinates] = useState({ lat: "", lng: "" });

  useEffect(() => {
    const fetchJournal = async () => {
      try {
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          navigate("/");
          return;
        }

        // Fetch the journal
        const { data, error } = await supabase
          .from("journals")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            setError("Journal not found or you don't have permission to edit it.");
          } else {
            setError("Failed to load journal. Please try again.");
          }
          return;
        }

        setJournal(data);
        setTitle(data.title || "");
        setLocation(data.location || "");
        setDate(data.date || "");
        setDescription(data.description || "");
        setMishaps(data.mishaps || "");
        setMediaUrls(data.media_urls || []);
        setCoordinates({
          lat: data.lat || "",
          lng: data.lng || ""
        });

      } catch (err) {
        console.error("Error fetching journal:", err);
        setError("Failed to load journal. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJournal();
    }
  }, [id, navigate]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    setError("");

    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `journal-images/${fileName}`;

        const { data, error } = await supabase.storage
          .from("media")
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from("media")
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setMediaUrls(prev => [...prev, ...uploadedUrls]);
      setSuccess("Images uploaded successfully!");

    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setMediaUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title for your journal.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updateData = {
        title: title.trim(),
        location: location.trim(),
        date: date || null,
        description: description.trim(),
        mishaps: mishaps.trim(),
        media_urls: mediaUrls,
        lat: coordinates.lat ? parseFloat(coordinates.lat) : null,
        lng: coordinates.lng ? parseFloat(coordinates.lng) : null,
      };

      const { error } = await supabase
        .from("journals")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setSuccess("Journal updated successfully!");
      setTimeout(() => {
        navigate("/all-journals");
      }, 1500);

    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save journal. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this journal? This action cannot be undone."
    );
    
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const { error } = await supabase
        .from("journals")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      navigate("/all-journals");
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete journal. Please try again.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading journal...</p>
        </div>
      </div>
    );
  }

  if (error && !journal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/all-journals")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Journals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/all-journals")}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Journals
              </button>
              <h1 className="text-xl font-bold text-gray-900">Edit Journal</h1>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleDelete}
                disabled={deleting || saving}
                className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </button>
              <button
                onClick={handleSave}
                disabled={saving || deleting}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Journal Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your journal title..."
                maxLength={200}
              />
            </div>

            {/* Location and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Where did you go?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Coordinates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coordinates (Optional)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="any"
                  value={coordinates.lat}
                  onChange={(e) => setCoordinates(prev => ({ ...prev, lat: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  step="any"
                  value={coordinates.lng}
                  onChange={(e) => setCoordinates(prev => ({ ...prev, lng: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Longitude"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Add coordinates to display this journal on the map
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Share your experience, what you saw, how you felt..."
              />
            </div>

            {/* Mishaps */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mishaps or Challenges
              </label>
              <textarea
                value={mishaps}
                onChange={(e) => setMishaps(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any problems, funny incidents, or challenges you faced?"
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Camera className="w-4 h-4 inline mr-1" />
                Photos
              </label>
              
              {/* Current Images */}
              {mediaUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  {mediaUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Journal image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {uploading ? "Uploading..." : "Add Photos"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}