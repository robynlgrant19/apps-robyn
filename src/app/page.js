"use client";

import React, { useState } from "react";
import Link from "next/link";
import SignIn from "./components/auth/sign_in";
import AuthDetails from "./components/auth/authDetails";

export default function Home() {

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Welcome to APPS</h1>
      <p className="text-lg text-gray-600 mb-6">Athlete Performance Progression System</p>


      
      <Link href="/pages/chooseRole">
        <button className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600">
          Register
        </button>
      </Link>

      <AuthDetails />
      <SignIn />
    
    </div>

  );
}


