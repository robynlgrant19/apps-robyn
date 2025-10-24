"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import SignIn from "../../components/auth/sign_in";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-6 sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto w-full">
        {/* Green gradient background box (unchanged) */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-900 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>

        {/* White foreground box with subtle fade-in */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative px-4 py-6 bg-white shadow-lg sm:rounded-3xl sm:p-16"
        >
          <div className="max-w-md mx-auto">
            {/* Logo with slight fade-in */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <img
                src="/logo2.png"
                alt="RG Performance Logo"
                className="mx-auto w-60 h-48"
              />
            </motion.div>

            {/* Sign-in form */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <SignIn />
            </motion.div>

            {/* Register link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-6 text-center"
            >
              <p className="text-sm text-gray-700">
                Don't have an account?{" "}
                <Link
                  href="/pages/chooseRole"
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  Register here
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}






