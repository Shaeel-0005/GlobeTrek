'use client'

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './firebase';
import {Homepage,Dashboard,SignIn,SignUp} from './pages/index';
import { setPersistence, browserSessionPersistence } from "firebase/auth";


export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  
useEffect(() => {
  const auth = getAuth(app);
  setPersistence(auth, browserSessionPersistence);
}, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);
console.log("Auth User:", user);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/signin" element={user ? <Navigate to="/dashboard" /> : <SignIn />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignUp />} />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/signin" />}
        />
        
      </Routes>
    </Router>
</>
  );
}