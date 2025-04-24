"use client";

import React, { useState } from 'react';
import { auth, db } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const signIn = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const coachRef = doc(db, "coaches", user.uid);
      const coachSnap = await getDoc(coachRef);

      const playerRef = doc(db, "players", user.uid);
      const playerSnap = await getDoc(playerRef);

      if (coachSnap.exists()) {
        router.replace("/pages/homeCoach");
      } else if (playerSnap.exists()) {
        router.replace("/pages/homePlayer");
      } else {
        router.replace("/pages/admin");
      }

    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setErrorMessage('Incorrect password. Please try again.');
      } else if (error.code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Invalid email format. Please enter a valid email.');
      } else {
        setErrorMessage('Failed to sign in. Please try again.');
      }
    }
  };

  return (
    <div className="sign-in-container">
      <form onSubmit={signIn} className="space-y-6">
        <div>
          <label className="text-gray-800 text-sm block mb-1">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            required
            className="w-full text-sm text-gray-800 border border-gray-300 px-4 py-3 rounded-md outline-emerald-600"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="text-gray-800 text-sm block mb-1">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            required
            className="w-full text-sm text-gray-800 border border-gray-300 px-4 py-3 rounded-md outline-emerald-600"
            onChange={(e) => setPassword(e.target.value)}
          />
          {errorMessage && (
            <p className="bg-red-100 border border-red-400 text-red-600 px-4 py-3 rounded-md mt-2 text-sm">
              {errorMessage}
            </p>
          )}
        </div>

        <div>
          <button
            type="submit"
            className="w-full shadow-xl py-2.5 px-4 text-sm font-semibold rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none"
          >
            Log in
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignIn;



