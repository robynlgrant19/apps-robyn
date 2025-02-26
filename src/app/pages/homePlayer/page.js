"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import AuthDetails from "../../components/auth/authDetails";
import Modal from "../../components/modal";

export default function Register() {
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  

  useEffect(() => {
    const fetchPlayerData = async () => {
      const user = auth.currentUser;
      if (user) {
        const playerRef = doc(db, "players", user.uid);
        const playerSnap = await getDoc(playerRef);

        if (playerSnap.exists()) {
          setPlayerData(playerSnap.data());
        }
      }
      setLoading(false);
    };

    fetchPlayerData();
  }, []);
    
  


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-green-600 p-4 flex justify-between items-center shadow-md">
        <h1 className="text-white text-xl font-bold">RG Performance</h1>
        <AuthDetails />
      </nav>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center mt-10">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-semibold text-gray-700 mb-4">Welcome Back!</h1>
          
          {loading ? (
            <p className="text-gray-500">Loading player data...</p>
          ) : playerData ? (
            <div>
              <p className="text-gray-700"> <strong> {playerData.firstName} {playerData.lastName} #{playerData.jerseyNumber}</strong></p>
            </div>
          ) : (
            <p className="text-gray-500">No player data found.</p>
          )}
        </div>

        {/* Dashboard */}
        <div className="mt-6 w-full max-w-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Teams</h2>
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition" 
            onClick={() => setIsModalOpen(true)}
          >
            Join a Team
          </button>

          {/* Modal Component */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <h2 className="text-xl font-bold">Enter Team Code</h2>
            <p>This is the content of the pop-up.</p>
          </Modal>
          
        </div>
      </div>
    </div>
  );
}



