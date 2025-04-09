// Import Firebase v9+ modular SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDydQ71zXeW1MsuvmZEc97IvYv7dZ7iTRA",
  authDomain: "robyngrant-642bd.firebaseapp.com",
  projectId: "robyngrant-642bd",
  storageBucket: "robyngrant-642bd.firebasestorage.app",
  messagingSenderId: "629235295614",
  appId: "1:629235295614:web:9b2d1319419778cb39ff2f"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
