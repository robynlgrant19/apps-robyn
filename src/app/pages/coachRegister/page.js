"use client";

import React from "react";
import SignUp from "../../components/auth/sign_up";
import Link from "next/link";
import AuthDetails from "../../components/auth/authDetails";


export default function Register() {
  return (
    <div>
    <h1 className="text-4xl font-bold text-gray-800 mb-6">Create an Account</h1>
    <SignUp />
    <p className="mt-4 text-gray-600">
      Already have an account?{" "}
      <Link href="/">
        <span className="text-blue-500 hover:underline cursor-pointer">Sign In</span>
      </Link>
    </p>
     <AuthDetails />


  </div>
  );
}