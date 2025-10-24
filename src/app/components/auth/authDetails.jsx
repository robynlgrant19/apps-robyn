"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const AuthDetails = () => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false); 
  const router = useRouter();

  useEffect(() => {
  const listen = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setAuthUser(null);
      setLoading(false);
      return;
    }

    console.log("🧍 Logged in user:", user.uid);

    // 🔍 Step 2: Add these debug logs here
    const coachRef = doc(db, "coaches", user.uid);
    const coachSnap = await getDoc(coachRef);
    const playerRef = doc(db, "players", user.uid);
    const playerSnap = await getDoc(playerRef);

    console.log("📄 coach exists?", coachSnap.exists());
    console.log("📄 player exists?", playerSnap.exists());

    setRedirecting(true);
    const currentPath = window.location.pathname;

    // ✅ Admin shortcut
    if (user.email === "robynlgrant19@gmail.com") {
      if (currentPath !== "/admin") router.replace("../pages/admin");
      setAuthUser(user);
      setRedirecting(false);
      setLoading(false);
      return;
    }

    // ✅ Wait for Firestore docs to appear (up to ~3 s)
    let attempts = 0;
    while (attempts < 6) {
      if (coachSnap.exists() || playerSnap.exists()) break;
      console.log(`⏳ Waiting for Firestore doc (attempt ${attempts + 1})...`);
      await new Promise((r) => setTimeout(r, 500));
      attempts++;
    }

    // ✅ Now redirect based on role
    if (coachSnap.exists() && currentPath !== "/homeCoach") {
      router.replace("../pages/homeCoach");
    } else if (playerSnap.exists() && currentPath !== "/homePlayer") {
      router.replace("../pages/homePlayer");
    } else {
      console.log("⚠️ No Firestore role found after waiting.");
    }

    setAuthUser(user);
    setRedirecting(false);
    setLoading(false);
  });

  return () => listen();
}, [router]);




  // sign out
  const userSignOut = async () => {
    try {
      await signOut(auth);
      setAuthUser(null);
      router.replace("/");
    } catch (error) {
      console.log(error);
    }
  };

  //redirect
  if (loading || redirecting) return null;

  return (
    <div>
      {authUser ? (
        <button onClick={userSignOut}>
          Sign Out
        </button>
      ) : null}
    </div>
  );
};

export default AuthDetails;


