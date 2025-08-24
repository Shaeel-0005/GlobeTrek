import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function AddJournalForm() {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [mishaps, setMishaps] = useState("");
  const [media, setMedia] = useState([]);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔎 fetch suggestions from OpenStreetMap
  const searchLocations = async (query) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=5`
      );
      return await res.json();
    } catch (err) {
      console.error("Location search failed:", err);
      return [];
    }
  };

  const handleLocationChange = async (e) => {
    const value = e.target.value;
    setLocation(value);

    if (value.length > 2) {
      const results = await searchLocations(value);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setLocation(suggestion.display_name);
    setCoords({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to add a journal.");
        setLoading(false);
        return;
      }

      let mediaURLs = [];
      for (const file of media) {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("media")
          .getPublicUrl(filePath);

        mediaURLs.push(urlData.publicUrl);
      }

      // ✅ Insert journal with location name + coords
      const { error: insertError } = await supabase.from("journals").insert({
        user_id: user.id,
        title,
        location, // pretty display name
        lat: coords?.lat || null,
        lng: coords?.lng || null,
        date,
        description,
        mishaps,
        media_urls: mediaURLs,
        created_at: new Date(),
      });

      if (insertError) throw insertError;

      // reset form
      setTitle("");
      setLocation("");
      setCoords(null);
      setDate("");
      setDescription("");
      setMishaps("");
      setMedia([]);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMediaChange = (e) => {
    setMedia([...e.target.files]);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-6 relative">
      {showSuccess && (
        <div className="absolute top-4 right-4 bg-teal-500 text-white px-4 py-2 rounded-lg shadow-md animate-fade-in-out text-sm font-medium">
          Journal entry created!
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        Add New Journal Entry
      </h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        {/* 📍 Location with autocomplete */}
        <div className="relative">
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={handleLocationChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />

          {suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border rounded w-full mt-1 shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  onClick={() => handleSelectSuggestion(s)}
                  className="p-2 hover:bg-blue-100 cursor-pointer text-sm"
                >
                  {s.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            rows="4"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Mishaps
          </label>
          <textarea
            value={mishaps}
            onChange={(e) => setMishaps(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            rows="2"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Media (Photos/Videos)
          </label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleMediaChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white p-2 rounded transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Saving..." : "Save Journal"}
        </button>
      </form>

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
