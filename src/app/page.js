"use client";

import React from "react";
import Link from "next/link";
import SignIn from "./components/auth/sign_in";
import AuthDetails from "./components/auth/authDetails";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-6 sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-green-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            {/* Logo Section */}
            {/* <div className="text-center mb-6">
              <img src="../public/logo.png" alt="RG Performance Logo" className="mx-auto w-32" />
            </div> */}

            <h1 className="text-2xl text-gray-400 font-semibold mb-6 text-center">RG Performance Sign In</h1>
            <SignIn />
            <AuthDetails />
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-700">
                Don't have an account?{" "}
                <Link href="/pages/chooseRole" className="text-green-600 font-semibold hover:underline">
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





