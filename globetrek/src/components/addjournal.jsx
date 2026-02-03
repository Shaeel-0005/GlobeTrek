import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase"; // ✅ REMOVED getStorageClient import
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

  // ✅ FIXED: Use main supabase client (no getStorageClient needed)
  const uploadMediaFiles = async (files, userId) => {
    if (!files.length) return [];
    
    // 🔒 STEP 1: VALIDATE FRESH SESSION
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !session?.user) {
      throw new Error("Session expired. Please log in again.");
    }
    if (session.user.id !== userId) {
      throw new Error("Security mismatch: User ID changed during upload.");
    }

    // 🚀 STEP 2: USE MAIN SUPABASE CLIENT (no separate storage client needed)
    const bucket = "media";
    
    // 📁 STEP 3: SANITIZE & PREPARE FILES
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'video/mp4', 'video/webm'
      ];
      
      if (file.size > maxSize) {
        console.warn(`Skipped: ${file.name} exceeds 10MB limit`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        console.warn(`Skipped: ${file.name} has unsupported type: ${file.type}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      throw new Error("No valid files to upload. Check file types and sizes.");
    }

    // 📤 STEP 4: UPLOAD WITH PROGRESS & ERROR ISOLATION
    const uploadResults = await Promise.allSettled(
      validFiles.map(async (file, index) => {
        // Generate secure path: userId/timestamp_index.ext
        const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
        const safeName = `${Date.now()}_${index}.${ext}`;
        const filePath = `${userId}/${safeName}`;
        
        try {
          // ✅ UPLOAD using main supabase client
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
              upsert: false,
              onUploadProgress: (progress) => {
                if (progress.total) {
                  const fileProgress = Math.round((progress.loaded / progress.total) * 100);
                  const globalProgress = Math.min(
                    99,
                    Math.round(((index * 100 + fileProgress) / validFiles.length))
                  );
                  setUploadProgress(globalProgress);
                }
              }
            });

          if (uploadError) {
            console.error(`Upload failed for ${file.name}:`, uploadError);
            throw new Error(`Upload failed for "${file.name}": ${uploadError.message}`);
          }

          // ✅ GET PUBLIC URL (AWAITED)
          const { data: urlData, error: urlError } = await supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
          
          if (urlError || !urlData?.publicUrl) {
            throw new Error(`Failed to generate access URL for "${file.name}"`);
          }
          
          return urlData.publicUrl;
          
        } catch (err) {
          console.error(`Critical failure for ${file.name}:`, err);
          if (err.message?.includes('403') || err.message?.includes('unauthorized')) {
            throw new Error(
              `Storage permission denied for "${file.name}". ` +
              `Verify RLS policies on "media" bucket.`
            );
          }
          if (err.message?.includes('404') || err.message?.includes('bucket')) {
            throw new Error(
              `Storage bucket "media" not found. ` +
              `Create bucket in Supabase Storage dashboard.`
            );
          }
          throw err;
        }
      })
    );

    // 🧪 STEP 5: PROCESS RESULTS & HANDLE PARTIAL FAILURES
    const successfulUrls = [];
    const errors = [];
    
    uploadResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        successfulUrls.push(result.value);
      } else {
        const fileName = validFiles[index]?.name || `file_${index}`;
        errors.push(`"${fileName}": ${result.reason?.message || 'Unknown error'}`);
      }
    });

    // 🚨 REPORT PARTIAL FAILURES
    if (errors.length > 0 && successfulUrls.length === 0) {
      throw new Error(`All uploads failed:\n• ${errors.join('\n• ')}`);
    } else if (errors.length > 0) {
      console.warn("Partial upload success:", errors);
      setError(
        `⚠️ ${errors.length} file(s) failed to upload. ` +
        `Journal saved with ${successfulUrls.length} successful media item(s).`
      );
    }

    return successfulUrls;
  };

  // Enhanced form submission with better error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setUploadProgress(0);

    try {
      // ✅ VALIDATE SESSION
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error("Session expired. Please log in again.");
      }
      const userId = session.user.id;

      // Validate form data
      if (!formData.title.trim()) throw new Error("Title is required");
      if (!formData.location.trim()) throw new Error("Location is required");
      if (!formData.date) throw new Error("Date is required");
      if (!formData.description.trim()) throw new Error("Description is required");

      // ✅ UPLOAD MEDIA (uses userId from session)
      let mediaURLs = [];
      if (formData.media.length > 0) {
        mediaURLs = await uploadMediaFiles(formData.media, userId);
      }

      // ✅ INSERT JOURNAL (uses validated userId)
      const journalData = {
        user_id: userId,
        title: formData.title.trim(),
        location: formData.location,
        lat: formData.coords?.lat || null,
        lng: formData.coords?.lng || null,
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
      setError("");

      // Navigate after delay
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/dashboard");
      }, 2000);

    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || "Failed to save journal. Please try again.");
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
            max={new Date().toISOString().split('T')[0]}
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