
"use client";

import React from "react";
import CoachSignUp from "../../components/auth/coach_sign_up";
import Link from "next/link";
import AuthDetails from "../../components/auth/authDetails";

export default function PlayerLogin() {
  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
         <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-900 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>

        <div className="relative px-6 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-16">
          <div className="max-w-md mx-auto">

            <CoachSignUp />

            <AuthDetails />

            <p className="mt-4 text-gray-600 text-center">
              Already have an account?{" "}
              <Link href="/">
                <span className="text-emerald-600 hover:underline cursor-pointer font-semibold">
                  Sign In
                </span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}