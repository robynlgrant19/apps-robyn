"use client";

import React, { useState, useEffect } from 'react';
import { auth } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const signIn = (e) => {
    e.preventDefault();
    setErrorMessage('');

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        //console.log(userCredential);
        setEmail('');
        setPassword('');
      })
      .catch((error) => {
        if (error.code === 'auth/wrong-password') {
          setErrorMessage('Incorrect password. Please try again.');
        } else if (error.code === 'auth/user-not-found') {
          setErrorMessage('No account found with this email.');
        } else if (error.code === 'auth/invalid-email') {
          setErrorMessage('Invalid email format. Please enter a valid email.');
        } else {
          setErrorMessage('Failed to sign in. Please try again.');
        }
      });
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
            className="w-full text-sm text-gray-800 border border-gray-300 px-4 py-3 rounded-md outline-green-600"
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
            className="w-full text-sm text-gray-800 border border-gray-300 px-4 py-3 rounded-md outline-green-600"
            onChange={(e) => setPassword(e.target.value)}
          />
          {errorMessage && <p className="bg-red-100 border border-red-400 text-red-600 px-4 py-3 rounded-md mt-2 text-sm">{errorMessage}</p>}
        </div>

        
        <div>
          <button
            type="submit"
            className="w-full shadow-xl py-2.5 px-4 text-sm font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
          >
            Log in
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignIn;


