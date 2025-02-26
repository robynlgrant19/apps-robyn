"use client";

import React, { useState } from 'react';
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth"
import { setDoc, doc } from "firebase/firestore";

export default function CoachSignUp() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const CoachSignUp = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "coaches", user.uid), {
            firstName: firstName,
            lastName: lastName,
            email: email,
            role:"coach",
            uid: user.uid,
            createdAt: new Date(),
            });
        } catch(error) {
          if (error.code === 'auth/email-already-in-use' ) {
            setErrorMessage("This email is already in use");
        }  else if (error.code === 'auth/invalid-email') {
          setErrorMessage('Invalid email format. Please enter a valid email.');
        } else {
          setErrorMessage('Failed to sign in. Please try again.');
        }
        } 
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8  rounded-lg">
          
          <form onSubmit={CoachSignUp} className="space-y-4">
            <div>
              <label className="text-gray-700 text-md">First Name</label>
              <input
                type="text"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full text-md border border-gray-300 px-4 py-2 rounded-md outline-green-500"
              />
            </div>

            <div>
              <label className="text-gray-700 text-md">Last Name</label>
              <input
                type="text"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full text-md border border-gray-300 px-4 py-2 rounded-md outline-green-500"
              />
            </div>
    
            <div>
              <label className="text-gray-700 text-md">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-md border border-gray-300 px-4 py-2 rounded-md outline-green-500"
              />
            </div>
    
            <div>
              <label className="text-gray-700 text-md">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-md border border-gray-300 px-4 py-2 rounded-md outline-green-500"
              />
              {errorMessage && <p className="bg-red-100 border border-red-400 text-red-600 px-4 py-3 rounded-md mt-2 text-sm">{errorMessage}</p>}
            </div>
    
            <button type="submit" className="w-full py-2 text-white bg-green-600 rounded-md hover:bg-green-700">
              Sign Up
            </button>
          </form>
        </div>
      );
    }