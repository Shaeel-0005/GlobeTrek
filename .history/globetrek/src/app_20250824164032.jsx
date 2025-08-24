'use client'

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { Homepage, Dashboard, LoginModal, SignUp, MapView } from './pages/index';
import { AddJournal } from './components/index';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  console.log("Auth User:", user);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <button
        className="bg-red-500 text-white px-3 py-1 rounded absolute top-20 right-4 z-200"
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.reload(); // quick way to reset app state
          console.log("Auth User:", user);
        }}
      >
        Sign Out
      </button>

      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/signin" element={user ? <Navigate to="/dashboard" /> : <LoginModal />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignUp />} />
          <Route path="/add-journal" element={<AddJournal />} />
          <Route path="/add-journal" element={<Map />} />
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/signin" />}
          />
        </Routes>
      </Router>
    </>
  );
}