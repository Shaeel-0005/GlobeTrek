import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useParams } from "react-router-dom";

const DisplayJournal = () => {
  const { id } = useParams();
  const [journal, setJournal] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchJournal = async () => {
      const { data, error } = await supabase
        .from("journals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.log("Error fetching journal:", error);
      } else {
        setJournal(data);
      }
    };

    fetchJournal();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      {journal ? (
        <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
          {/* Cover Image */}
          {journal.media_urls?.length > 0 ? (
            <img
              src={journal.media_urls[0]}
              alt={journal.title}
              className="w-full h-72 object-cover"
            />
          ) : (
            <div className="w-full h-72 bg-gradient-to-r from-blue-200 to-purple-200 flex items-center justify-center">
              <span className="text-gray-500">No Image Available</span>
            </div>
          )}

          {/* Journal Content */}
          <div className="p-6 space-y-4">
            {/* Title & Date */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {journal.title || "Untitled Journey"}
              </h1>
              <p className="text-sm text-gray-500">
                {journal.date
                  ? new Date(journal.date).toLocaleDateString()
                  : ""}
              </p>
            </div>

            {/* Location */}
            {journal.location && (
              <div className="flex items-center text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 mr-2 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 22s8-4.5 8-11c0-4.418-3.582-8-8-8s-8 3.582-8 8c0 6.5 8 11 8 11z"
                  />
                </svg>
                <span>{journal.location}</span>
              </div>
            )}

            {/* Description */}
            {journal.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {journal.description}
                </p>
              </div>
            )}

            {/* Mishaps */}
            {journal.mishaps && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-red-700 mb-1">
                  Mishaps
                </h2>
                <p className="text-red-600">{journal.mishaps}</p>
              </div>
            )}

            {/* Media Carousel */}
            {journal.media_urls?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Gallery
                </h2>
                <div className="flex space-x-4 overflow-x-auto pb-2">
                  {journal.media_urls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Journal media ${idx + 1}`}
                      className="h-32 rounded-lg shadow cursor-pointer hover:opacity-80 transition"
                      onClick={() => setPreviewUrl(url)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-600">Loading...</div>
      )}

      {/* Fullscreen Image Preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="Full Preview"
            className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
};

export default DisplayJournal;
