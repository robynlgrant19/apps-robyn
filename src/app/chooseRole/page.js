"use client";

import React from "react";
import Link from "next/link";

export default function Register() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Are you a...</h1>
      <Link href="/playerRegister">
        <button className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600">
          Player
        </button>
      </Link>
      <Link href="/coachRegister">
        <button className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600">
          Coach
        </button>
      </Link>
      </div>
  );
}
