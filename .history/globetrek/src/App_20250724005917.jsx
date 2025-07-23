import React from 'react';
import './App.css'


import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log("User:", user);
  });
  return () => unsubscribe();
}, []);


function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
      <h1 className="text-4xl font-bold text-white">GlobeTrek 🌍 is Live!</h1>
      <p>something</p>
    </div>
  );
}

export default App;
