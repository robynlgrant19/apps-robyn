"use client";

import React from "react";
import Link from "next/link";
import SignIn from "./components/auth/sign_in";
import AuthDetails from "./components/auth/authDetails";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-6 sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-900 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-6 bg-white shadow-lg sm:rounded-3xl sm:p-16">

          <div className="max-w-md mx-auto">
           
          <div className="text-center">
            <img src="/logo2.png" alt="RG Performance Logo" className="mx-auto w-60 h-48" />
          </div>




            
            <SignIn />
            <AuthDetails />
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-700">
                Don't have an account?{" "}
                <Link href="/pages/chooseRole" className="text-emerald-600 font-semibold hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





