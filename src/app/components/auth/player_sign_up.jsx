"use client";

import React, { useState } from 'react';
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth"
import { setDoc, doc } from "firebase/firestore";

export default function PlayerSignUp() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [jerseyNumber, setJerseyNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const PlayerSignUp = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "players", user.uid), {
            firstName: firstName,
            lastName: lastName,
            jerseyNumber: jerseyNumber,
            email: email,
            uid: user.uid,
            createdAt: new Date(),
            });
        } catch(error) {
            if (error.code === 'auth/email-already-in-use' ) {
                setErrorMessage("This email is already in use");
            } 
        } 
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8  rounded-lg">
          
          {errorMessage && <p className="text-red-500 text-md">{errorMessage}</p>}
    
          <form onSubmit={PlayerSignUp} className="space-y-4">
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
              <label className="text-gray-700 text-md">Jersey Number</label>
              <input
                type="number"
                placeholder="Enter your jersey number"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
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
            </div>
    
            <button type="submit" className="w-full py-2 text-white bg-green-600 rounded-md hover:bg-green-700">
              Sign Up
            </button>
          </form>
        </div>
      );
    }