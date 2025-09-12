import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const DisplayJournal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [journal, setJournal] = useState(null);
  const [allJournals, setAllJournals] = useState([]);

  // Fetch selected journal
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

  // Fetch all journals (for right sidebar)
  useEffect(() => {
    const fetchAllJournals = async () => {
      const { data, error } = await supabase
        .from("journals")
        .select("id, title, media_urls, date")
        .order("date", { ascending: false });

      if (error) {
        console.log("Error fetching all journals:", error);
      } else {
        setAllJournals(data);
      }
    };

    fetchAllJournals();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* LEFT SIDEBAR */}
      <aside className="w-56 border-r border-gray-200 bg-white/80 backdrop-blur-sm p-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center px-3 py-2 w-full text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        {journal ? (
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Cover Image */}
            {journal.media_urls?.length > 0 && (
              <div className="h-72 w-full overflow-hidden">
                <img
                  src={journal.media_urls[0]}
                  alt={journal.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {journal.title}
              </h1>
              <p className="text-sm text-gray-500 mb-4">
                {journal.location} •{" "}
                {new Date(journal.date).toLocaleDateString()}
              </p>
              <p className="text-gray-700 mb-4">{journal.description}</p>

              {journal.mishaps && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <h2 className="font-semibold text-red-700 mb-2">Mishaps</h2>
                  <p className="text-red-600">{journal.mishaps}</p>
                </div>
              )}

              {/* Media Carousel */}
              {journal.media_urls?.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">
                    Memories Gallery
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {journal.media_urls.map((url, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => window.open(url, "_blank")}
                      >
                        <img
                          src={url}
                          alt={`Memory ${index + 1}`}
                          className="w-full h-40 object-cover rounded-md shadow-sm group-hover:opacity-80 transition"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="w-64 border-l border-gray-200 bg-white/80 backdrop-blur-sm p-4 overflow-y-auto">
        <h2 className="font-semibold text-gray-700 mb-4">All Journals</h2>
        <div className="space-y-3">
          {allJournals.map((j) => (
            <div
              key={j.id}
              onClick={() => navigate(`/journal/${j.id}`)}
              className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-blue-50 transition ${
                j.id === id ? "bg-blue-100" : ""
              }`}
            >
              <img
                src={
                  j.media_urls?.[0] ||
                  "https://via.placeholder.com/50x50?text=No+Image"
                }
                alt={j.title}
                className="w-12 h-12 rounded-md object-cover"
              />
              <div>
                <p className="text-sm font-medium text-gray-800 line-clamp-1">
                  {j.title || "Untitled"}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(j.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default DisplayJournal;
