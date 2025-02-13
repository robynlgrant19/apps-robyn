// Import Firebase v9+ modular SDK
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDydQ71zXeW1MsuvmZEc97IvYv7dZ7iTRA",
  authDomain: "robyngrant-642bd.firebaseapp.com",
  projectId: "robyngrant-642bd",
  storageBucket: "robyngrant-642bd.firebasestorage.app",
  messagingSenderId: "629235295614",
  appId: "1:629235295614:web:9b2d1319419778cb39ff2f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
//onst auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Export Firestore
export { db, collection, getDocs };
export const auth = getAuth(app);
