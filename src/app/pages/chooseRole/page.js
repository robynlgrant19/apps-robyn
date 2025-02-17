"use client";

import React from "react";
import Link from "next/link";

export default function Register() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-6 sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-green-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
          <h1 className="text-2xl text-gray-400 font-semibold mb-6 text-center">I am a...</h1>
            <div className="flex flex-col space-y-4">
              {/* Player Button */}
              <Link href="/pages/playerRegister">
                <div className="bg-white border-2 border-green-500 p-6 rounded-lg shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">Player</h2>
                  <p className="text-gray-600 text-center">
                    I belong to an organized team as an active player. I want to see my indivudal progress and statistics
                  </p>
                </div>
              </Link>

              {/* Coach Button */}
              <Link href="/pages/coachRegister">
                <div className="bg-white border-2 border-green-500 p-6 rounded-lg shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">Coach</h2>
                  <p className="text-gray-600 text-center">
                    I lead an organized team. I want to lead and guide my players in their growth and performance.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



