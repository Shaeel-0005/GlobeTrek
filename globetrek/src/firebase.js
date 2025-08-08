// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAEKRnDTMgChRd7f9XPl8bdI94Y0mV3bhk",
  authDomain: "globetrek-d01b0.firebaseapp.com",
  projectId: "globetrek-d01b0",
  storageBucket: "globetrek-d01b0.firebasestorage.app",
  messagingSenderId: "28250269470",
  appId: "1:28250269470:web:24a5dc8132898a7d904b0f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app }; 