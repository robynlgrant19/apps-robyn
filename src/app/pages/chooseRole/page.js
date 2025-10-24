"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Role() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-6 sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto w-full">
        {/* Green background (unchanged) */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-900 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>

        {/* White box with fade-in motion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20"
        >
          <div className="max-w-md mx-auto">
            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-2xl text-gray-600 font-semibold mb-6 text-center"
            >
              I am a...
            </motion.h1>

            {/* Option cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col space-y-4"
            >
              <Link href="/pages/playerRegister">
                <div className="bg-white border-2 border-emerald-500 p-6 rounded-lg shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">Player</h2>
                  <p className="text-gray-600 text-center">
                    I belong to an organized team as an active player. I want to see my individual progress and statistics.
                  </p>
                </div>
              </Link>

              <Link href="/pages/coachRegister">
                <div className="bg-white border-2 border-emerald-500 p-6 rounded-lg shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">Coach</h2>
                  <p className="text-gray-600 text-center">
                    I coach an organized team. I want to lead and guide my players in their growth and performance.
                  </p>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}




