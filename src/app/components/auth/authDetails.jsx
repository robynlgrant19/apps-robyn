"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";

const AuthDetails = () => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // ⛔ Pages where we MUST skip Firestore role lookup
  const signupPages = ["/pages/playerRegister", "/pages/coachRegister"];
  const isSignupPage = signupPages.includes(pathname);

  useEffect(() => {
    const listen = onAuthStateChanged(auth, async (user) => {
      // If on sign-up page → don't run any redirect logic
      if (isSignupPage) {
        console.log("🛑 Skipping role-check because user is on a signup page.");
        setAuthUser(user);
        setLoading(false);
        return;
      }

      if (!user) {
        setAuthUser(null);
        setLoading(false);
        return;
      }

      console.log("🧍 Logged in user:", user.uid);

      const coachRef = doc(db, "coaches", user.uid);
      const playerRef = doc(db, "players", user.uid);

      let coachSnap = await getDoc(coachRef);
      let playerSnap = await getDoc(playerRef);

      console.log("📄 coach exists?", coachSnap.exists());
      console.log("📄 player exists?", playerSnap.exists());

      setRedirecting(true);

      // Admin special route
      if (user.email === "robynlgrant19@gmail.com") {
        if (pathname !== "/admin") router.replace("../pages/admin");
        setAuthUser(user);
        setRedirecting(false);
        setLoading(false);
        return;
      }

      // 🔄 Poll Firestore for up to ~3 seconds
      let attempts = 0;
      while (attempts < 6 && !coachSnap.exists() && !playerSnap.exists()) {
        console.log(`⏳ Waiting for Firestore doc (attempt ${attempts + 1})...`);
        await new Promise((r) => setTimeout(r, 500));
        coachSnap = await getDoc(coachRef);
        playerSnap = await getDoc(playerRef);
        attempts++;
      }

      // Route based on role
      if (coachSnap.exists() && pathname !== "/homeCoach") {
        router.replace("../pages/homeCoach");
      } else if (playerSnap.exists() && pathname !== "/homePlayer") {
        router.replace("../pages/homePlayer");
      } else if (!coachSnap.exists() && !playerSnap.exists()) {
        console.log("⚠️ No Firestore role found after waiting.");
      }

      setAuthUser(user);
      setRedirecting(false);
      setLoading(false);
    });

    return () => listen();
  }, [router, pathname, isSignupPage]);

  const userSignOut = async () => {
    try {
      await signOut(auth);
      setAuthUser(null);
      router.replace("/");
    } catch (error) {
      console.log(error);
    }
  };

  if (loading || redirecting) return null;

  return (
    <div>
      {authUser ? <button onClick={userSignOut}>Sign Out</button> : null}
    </div>
  );
};

export default AuthDetails;



