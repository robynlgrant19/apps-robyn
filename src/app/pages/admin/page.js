"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import AuthDetails from "../../components/auth/authDetails";

export default function Admin() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoaches = async () => {
      const coachesRef = collection(db, "coaches");
      const q = query(coachesRef, where("approved", "==", false));  // all unapproved coaches
      const querySnapshot = await getDocs(q);

      const coachesList = [];
      querySnapshot.forEach((doc) => {
        coachesList.push({ id: doc.id, ...doc.data() });
      });

      setCoaches(coachesList);
      setLoading(false);
    };

    fetchCoaches();
  }, []);

  const approveCoach = async (coachId) => {
    const coachRef = doc(db, "coaches", coachId);
    await updateDoc(coachRef, { approved: true });  //approve coach
    setCoaches((prevCoaches) => prevCoaches.filter((coach) => coach.id !== coachId));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      
      <nav className="bg-gradient-to-r from-emerald-900 via-emerald-600 to-emerald-500 p-4 flex justify-between items-center shadow-md">
      <h1 className="text-white text-xl font-bold">RG Performance</h1>
      <AuthDetails />
    </nav>
    

      
      <div className="flex flex-col items-center justify-center mt-10">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-semibold text-gray-700 mb-4">Admin Page</h1>
        </div>

       
        <div className="mt-6 w-full max-w-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Unapproved Coaches</h2>

          {loading ? (
            <p className="text-gray-500">Loading coaches...</p>
          ) : coaches.length > 0 ? (
            <ul className="space-y-4">
              {coaches.map((coach) => (
                <li key={coach.id} className="bg-white p-4 rounded-md shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {coach.firstName} {coach.lastName}
                  </h3>
                  <p className="text-gray-500">Email: {coach.email}</p>
                  <button
                    className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
                    onClick={() => approveCoach(coach.id)}
                  >
                    Approve Coach
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No unapproved coaches found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
