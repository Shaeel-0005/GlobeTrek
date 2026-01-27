import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import LocationPicker from "./LocationPicker"; // Ensure path is correct

const INITIAL_FORM_STATE = {
  title: "",
  location: "",
  coords: null,
  date: "",
  description: "",
  mishaps: "",
  media: []
};

export default function AddJournalForm() {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const navigate = useNavigate();

  // Unified field handler
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(""); 
  }, [error]);

  // Media file handler
  const handleMediaChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large (Max 10MB).`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        setError(`File ${file.name} format not supported.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === files.length) {
      handleFieldChange('media', validFiles);
    }
  }, [handleFieldChange]);

  // Supabase Media Upload
  const uploadMediaFiles = async (files, userId) => {
    const uploadPromises = files.map(async (file, index) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${index}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(prev => Math.max(prev, percentage));
          }
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);
      return urlData.publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Basic Validation
      if (!formData.title.trim()) throw new Error("Please enter a title.");
      if (!formData.location.trim()) throw new Error("Please select a location.");
      if (!formData.date) throw new Error("Please select a date.");

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Authentication failed. Please log in again.");

      // 1. Upload Media
      let mediaURLs = [];
      if (formData.media.length > 0) {
        mediaURLs = await uploadMediaFiles(formData.media, user.id);
      }

      // 2. Insert to Database
      const { error: insertError } = await supabase.from("journals").insert({
        user_id: user.id,
        title: formData.title.trim(),
        location: formData.location,
        lat: formData.coords?.lat || null,
        lng: formData.coords?.lng || null,
        date: formData.date,
        description: formData.description.trim(),
        mishaps: formData.mishaps.trim() || null,
        media_urls: mediaURLs,
      });

      if (insertError) throw insertError;

      setShowSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);

    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-xl mt-8 relative">
      {/* Success Notification */}
      {showSuccess && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-6 py-2 rounded-full shadow-lg z-50 animate-bounce">
          Success! Redirecting...
        </div>
      )}

      <h2 className="text-3xl font-extrabold mb-8 text-gray-800 border-b pb-4">
        New Journal Entry
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title */}
        <section>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Adventure Title *</label>
          <input
            type="text"
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="e.g., Sunset at the Amalfi Coast"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            required
          />
        </section>

        {/* INTEGRATED LOCATION PICKER */}
        <section>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
          <LocationPicker
            value={formData.location}
            onChange={(val) => handleFieldChange('location', val)}
            coords={formData.coords}
            onCoordsChange={(coords) => handleFieldChange('coords', coords)}
          />
        </section>

        {/* Date */}
        <section>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
          <input
            type="date"
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg outline-none"
            value={formData.date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => handleFieldChange('date', e.target.value)}
            required
          />
        </section>

        {/* Description */}
        <section>
          <label className="block text-sm font-semibold text-gray-700 mb-2">The Story *</label>
          <textarea
            rows="4"
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write about your day..."
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            required
          />
        </section>

        {/* Media Upload */}
        <section>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Photos & Videos</label>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleMediaChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {formData.media.length > 0 && (
              <p className="mt-2 text-sm text-blue-600 font-medium">{formData.media.length} files attached</p>
            )}
          </div>
        </section>

        {/* Submit Button */}
        <div className="pt-4">
          {loading && uploadProgress > 0 && (
            <div className="mb-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-xs text-center mt-1 text-gray-500">Uploading: {uploadProgress}%</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-lg font-bold text-white transition-all shadow-lg ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
            }`}
          >
            {loading ? "Processing..." : "Save My Memory"}
          </button>
        </div>
      </form>
    </div>
  );
}