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
    if (user) {
      setRedirecting(true);

      const currentPath = window.location.pathname;

      // Admin user
      if (user.email === "robynlgrant19@gmail.com") {
        if (currentPath !== "/admin") {
          router.replace("../pages/admin");
        }
        setAuthUser(user);
        setRedirecting(false);
        setLoading(false);
        return;
      }

      // Check role
      const coachRef = doc(db, "coaches", user.uid);
      const coachSnap = await getDoc(coachRef);
      const playerRef = doc(db, "players", user.uid);
      const playerSnap = await getDoc(playerRef);

      if (coachSnap.exists() && currentPath !== "/homeCoach") {
        router.replace("../pages/homeCoach");
      } else if (playerSnap.exists() && currentPath !== "/homePlayer") {
        router.replace("../pages/homePlayer");
      } else if (!coachSnap.exists() && !playerSnap.exists() && currentPath !== "/admin") {
        router.replace("../pages/admin");
      }

      setAuthUser(user);
      setRedirecting(false);
      setLoading(false);
    } else {
      setAuthUser(null);
      setLoading(false);
    }
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


