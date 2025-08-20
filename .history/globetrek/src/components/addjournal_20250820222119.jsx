'use client'

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';

export default function AddJournalForm() {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [mishaps, setMishaps] = useState('');
  const [media, setMedia] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to add a journal.');
      return;
    }

    try {
      let mediaURLs = [];
      for (const file of media) {
        const storageRef = ref(storage, `media/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        mediaURLs.push(url);
      }

      await addDoc(collection(db, 'journals'), {
        userId: user.uid,
        title,
        location,
        date,
        description,
        mishaps,
        mediaURLs,
        createdAt: new Date(),
      });

      // Reset form
      setTitle('');
      setLocation('');
      setDate('');
      setDescription('');
      setMishaps('');
      setMedia([]);
      alert('Journal entry created!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMediaChange = (e) => {
    setMedia([...e.target.files]);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-6">
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
    </div>
  );
}