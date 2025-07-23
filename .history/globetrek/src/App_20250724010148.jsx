import React, { useEffect } from 'react';
import './App.css';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("User:", user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
      <h1 className="text-4xl font-bold text-white mb-2">GlobeTrek 🌍 is Live!</h1>
      <p className="text-white text-lg">Tracking your journeys with memories and maps!</p>
    </div>
  );
}

export default App;
