"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-100 via-white to-emerald-50 flex items-center justify-center px-6 sm:px-12 py-12">
      <div className="relative w-full sm:max-w-6xl">
        {/* Offset green background box */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-900 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>

        {/* Main white card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative flex flex-col-reverse sm:flex-row items-center justify-between bg-white shadow-lg sm:rounded-3xl px-6 py-8 sm:px-12 sm:py-10"
        >
          {/* Left side – Text */}
          <div className="sm:w-1/2 text-center sm:text-left">
            <h1 className="text-3xl font-semibold text-emerald-700">
              Welcome to
            </h1>
            <h2 className="text-4xl font-extrabold text-emerald-900 mt-1 tracking-tight">
              RG PERFORMANCE
            </h2>

            <p className="mt-5 text-gray-700 text-lg leading-relaxed max-w-md mx-auto sm:mx-0">
              Track your games, stats, and team moments — all in one fun, friendly place.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:justify-start justify-center">
              <Link href="/pages/lobby">
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-full shadow-lg transition-transform hover:scale-105 w-full sm:w-auto">
                  Sign In
                </button>
              </Link>
              <Link href="/pages/chooseRole">
                <button className="bg-white text-emerald-700 border border-emerald-400 hover:bg-emerald-100 px-6 py-2 rounded-full shadow-md transition-transform hover:scale-105 w-full sm:w-auto">
                  Create Account
                </button>
              </Link>
            </div>
          </div>

          {/* Right side – Image */}
          <div className="sm:w-1/2 flex justify-center mb-8 sm:mb-0">
            <div className="bg-white p-4 rounded-2xl">
              <img
                src="/hockeyfriends.webp"
                alt="friends playing hockey"
                className="w-80 sm:w-[400px] md:w-[460px] lg:w-[500px] h-auto object-contain"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-6 text-center text-sm text-gray-500"
      >
        {/* <p>Built by Robyn Grant</p> */}
      </motion.div>
    </div>
  );
}







