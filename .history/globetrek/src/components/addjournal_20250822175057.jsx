'use client'

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function AddJournalForm() {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [mishaps, setMishaps] = useState('');
  const [media, setMedia] = useState([]);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to add a journal.');
      return;
    }

    try {
      let mediaURLs = [];
      for (const file of media) {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError, data } = await supabase.storage
          .from('media')
          .upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
        mediaURLs.push(urlData.publicUrl);
      }

      const { error } = await supabase.from('journals').insert({
        user_id: user.id,
        title,
        location,
        date,
        description,
        mishaps,
        media_urls: mediaURLs,
        created_at: new Date(),
      });
      if (error) throw error;

      setTitle('');
      setLocation('');
      setDate('');
      setDescription('');
      setMishaps('');
      setMedia([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
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
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Add New Journal Entry</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            rows="4"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">Mishaps</label>
          <textarea
            value={mishaps}
            onChange={(e) => setMishaps(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            rows="2"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">Media (Photos/Videos)</label>
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
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          Save Journal
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
            animation: fadeInOut 3s ease-in-out forwards;
          }
        `}
      </style>
    </div>
  );
}