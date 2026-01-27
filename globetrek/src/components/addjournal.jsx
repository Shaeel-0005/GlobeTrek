import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import LocationPicker from "./locationPicker"; 

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

  // Generic form field handler
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(""); // Clear error when user makes changes
  }, []);

  // Media file handler with validation
  const handleMediaChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB limit per file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    
    // Validate files
    const invalidFiles = files.filter(file => {
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is 10MB.`);
        return true;
      }
      if (!allowedTypes.includes(file.type)) {
        setError(`File ${file.name} has unsupported format.`);
        return true;
      }
      return false;
    });

    if (invalidFiles.length > 0) {
      // Reset input to allow re-selection of valid files
      e.target.value = null;
      return;
    }
    
    handleFieldChange('media', files);
  }, [handleFieldChange]);

  // CRITICAL FIX: Proper Supabase URL retrieval with await
  const uploadMediaFiles = async (files, userId) => {
  if (!files.length) return [];
  
  // 🔒 CRITICAL: Validate userId format BEFORE upload
  if (!userId || typeof userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error("Invalid user session. Please log in again.");
  }

  const uploadPromises = files.map(async (file, index) => {
    // 🛡️ Sanitize extension (prevent path traversal)
    const cleanExt = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
    const fileName = `${Date.now()}_${index}.${cleanExt}`;
    const filePath = `${userId}/${fileName}`; // NO TRAILING SLASH
    
    try {
      // ✅ UPLOAD (await required)
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { 
          upsert: false, // Prevent accidental overwrites
          onUploadProgress: (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(prev => Math.max(prev, percentage));
          }
        });

      if (uploadError) throw uploadError;

      // ✅ GET PUBLIC URL (SYNCHRONOUS - NO AWAIT!)
      const { data } = supabase.storage.from("media").getPublicUrl(filePath);
      if (!data?.publicUrl) throw new Error("Failed to generate public URL");
      
      return data.publicUrl;
    } catch (error) {
      console.error(`Upload failed for ${file.name}:`, error);
      
      // 💡 User-friendly RLS error hint
      if (error.message?.includes('row-level security') || error.statusCode === 400) {
        throw new Error(
          `Storage permission error for "${file.name}". ` +
          `Admin: Check Storage RLS policies for bucket "media".`
        );
      }
      throw error;
    }
  });

  return Promise.all(uploadPromises);
};

  // Enhanced form submission with better error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setUploadProgress(0);

    try {
      // Validate form data
      if (!formData.title.trim()) throw new Error("Title is required");
      if (!formData.location.trim()) throw new Error("Location is required");
      if (!formData.date) throw new Error("Date is required");
      if (!formData.description.trim()) throw new Error("Description is required");

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) throw new Error("You must be logged in to add a journal.");

      // Upload media files with progress tracking
      let mediaURLs = [];
      if (formData.media.length > 0) {
        mediaURLs = await uploadMediaFiles(formData.media, user.id);
      }

      // Insert journal entry
      const journalData = {
        user_id: user.id,
        title: formData.title.trim(),
        location: formData.location,
        lat: formData.coords?.lat || null,
        lng: formData.coords?.lng || null, // FIXED: was 'lon' in coords but 'lng' in DB
        date: formData.date,
        description: formData.description.trim(),
        mishaps: formData.mishaps.trim() || null,
        media_urls: mediaURLs,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from("journals").insert(journalData);
      if (insertError) throw insertError;

      // Reset form and show success
      setFormData(INITIAL_FORM_STATE);
      setShowSuccess(true);

      // Navigate after delay
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/dashboard");
      }, 2000);

    } catch (err) {
      console.error('Form submission error:', err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-6 relative">
      {/* Success notification */}
      {showSuccess && (
        <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-md animate-fade-in-out text-sm font-medium z-20">
          ✅ Journal entry created!
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Add New Journal Entry
      </h2>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Upload progress */}
      {loading && uploadProgress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading files...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
            placeholder="Give your adventure a title..."
          />
        </div>

        {/* REPLACED LOCATION FIELD WITH LOCATIONPICKER */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Location *
            {formData.coords && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                📍 Coordinates saved
              </span>
            )}
          </label>
          <LocationPicker
            value={formData.location}
            onChange={(value) => handleFieldChange('location', value)}
            coords={formData.coords}
            onCoordsChange={(coords) => handleFieldChange('coords', coords)}
          />
        </div>

        {/* Date Field */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleFieldChange('date', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
            max={new Date().toISOString().split('T')[0]} // Prevent future dates
          />
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-vertical"
            rows="4"
            required
            placeholder="Describe your experience, what you saw, how you felt..."
          />
        </div>

        {/* Mishaps Field */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Mishaps or Challenges
          </label>
          <textarea
            value={formData.mishaps}
            onChange={(e) => handleFieldChange('mishaps', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-vertical"
            rows="2"
            placeholder="Any challenges or unexpected events? (optional)"
          />
        </div>

        {/* Media Upload Field */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Photos & Videos
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors duration-200">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm"
              onChange={handleMediaChange}
              className="w-full p-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: JPEG, PNG, WebP, MP4, WebM. Max 10MB per file.
            </p>
          </div>
          {formData.media.length > 0 && (
            <p className="text-sm text-green-600 mt-2">
              {formData.media.length} file(s) selected
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white p-3 rounded-lg font-medium transition-all duration-200 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              {uploadProgress > 0 ? 'Uploading...' : 'Saving...'}
            </div>
          ) : (
            "Save Journal Entry"
          )}
        </button>
      </form>

      {/* Custom Styles */}
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
          .animate-fade-in-out {
            animation: fadeInOut 2s ease-in-out forwards;
          }
        `}
      </style>
    </div>
  );
}
