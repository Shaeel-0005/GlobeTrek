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
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function EditJournal() {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);

  /* ======================
     STATE
     ====================== */

  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [mishaps, setMishaps] = useState("");
  const [mediaUrls, setMediaUrls] = useState([]);
  const [coordinates, setCoordinates] = useState({ lat: "", lng: "" });

  /* ======================
     FETCH JOURNAL
     ====================== */

  useEffect(() => {
    const fetchJournal = async () => {
      try {
        setLoading(true);
        setError("");

        const { data: { user }, error: authError } =
          await supabase.auth.getUser();

        if (authError || !user) {
          navigate("/");
          return;
        }

        const { data, error } = await supabase
          .from("journals")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error) {
          setError(
            error.code === "PGRST116"
              ? "Journal not found or access denied."
              : "Failed to load journal."
          );
          return;
        }

        setJournal(data);
        setTitle(data.title ?? "");
        setLocation(data.location ?? "");
        setDate(data.date ?? "");
        setDescription(data.description ?? "");
        setMishaps(data.mishaps ?? "");
        setMediaUrls(data.media_urls ?? []);
        setCoordinates({
          lat: data.lat ?? "",
          lng: data.lng ?? "",
        });
      } catch (err) {
        console.error(err);
        setError("Something went wrong while loading the journal.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchJournal();
  }, [id, navigate]);

  /* ======================
     IMAGE UPLOAD
     ====================== */

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          if (!file.type.startsWith("image/")) {
            throw new Error("Only image files are allowed");
          }

          if (file.size > 5 * 1024 * 1024) {
            throw new Error("Image must be under 5MB");
          }

          const ext = file.name.split(".").pop();
          const fileName = `${crypto.randomUUID()}.${ext}`;
          const filePath = `journal-images/${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("media")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from("media")
            .getPublicUrl(filePath);

          return data.publicUrl;
        })
      );

      setMediaUrls((prev) => [...prev, ...uploadedUrls]);
      setSuccess("Images uploaded successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  /* ======================
     SAVE JOURNAL
     ====================== */

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Journal title is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setSuccess("Journal updated successfully!");
      setTimeout(() => navigate("/all-journals"), 1200);
    } catch (err) {
      console.error(err);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  /* ======================
     DELETE JOURNAL
     ====================== */

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this journal permanently? This cannot be undone."
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("journals")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      navigate("/all-journals", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Failed to delete journal.");
      setDeleting(false);
    }
  };

  /* ======================
     UI STATES
     ====================== */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !journal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => navigate("/all-journals")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Journals
          </button>
        </div>
      </div>
    );
  }

  /* ======================
     RENDER
     ====================== */

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/all-journals")}
            className="flex items-center text-sm text-gray-700 hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="flex items-center px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Delete
            </button>

            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-6 bg-white mt-6 rounded-xl shadow">
        {success && (
          <div className="p-3 bg-green-100 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Journal title"
          className="w-full p-3 border rounded-lg"
        />

        {/* Location & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="p-3 border rounded-lg"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-3 border rounded-lg"
          />
        </div>

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Description"
          className="w-full p-3 border rounded-lg"
        />

        {/* Mishaps */}
        <textarea
          value={mishaps}
          onChange={(e) => setMishaps(e.target.value)}
          rows={3}
          placeholder="Mishaps or challenges"
          className="w-full p-3 border rounded-lg"
        />

        {/* Images */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleImageUpload}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center px-4 py-2 border rounded-lg"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            Add Photos
          </button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} className="h-32 w-full object-cover rounded-lg" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
