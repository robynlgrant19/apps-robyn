
"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import CoachSignUp from "../../components/auth/coach_sign_up";
import AuthDetails from "../../components/auth/authDetails";

export default function PlayerLogin() {
  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        {/* Emerald gradient offset box — unchanged */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-900 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>

        {/* White card with subtle fade-in animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative px-6 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-16"
        >
          <div className="max-w-md mx-auto">
            <div className="text-2xl text-emerald-700 font-semibold text-center"> Coach Sign Up </div>
            {/* Coach Sign-Up form */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <CoachSignUp />
            </motion.div>

            {/* Auth details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <AuthDetails />
            </motion.div>

            {/* Sign-in link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-4 text-gray-600 text-center"
            >
              Already have an account?{" "}
              <Link href="/pages/lobby">
                <span className="text-emerald-600 hover:underline cursor-pointer font-semibold">
                  Sign In
                </span>
              </Link>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
