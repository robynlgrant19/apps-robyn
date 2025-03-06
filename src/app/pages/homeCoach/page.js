"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import AuthDetails from "../../components/auth/authDetails";
import Modal from "../../components/modal";
import CreateTeam from "../../components/create_team";
import Link from "next/link"; 
import { onAuthStateChanged } from "firebase/auth";

export default function CoachHome() {
  const [coachData, setCoachData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [user, setUser] = useState(null);

  // Fetch coach data
  const fetchCoachData = async (user) => {
    if (!user) return;
    
    const coachRef = doc(db, "coaches", user.uid);
    const coachSnap = await getDoc(coachRef);

    if (coachSnap.exists()) {
      setCoachData(coachSnap.data());
    }

    // Fetch teams
    const teamsRef = collection(db, "teams");
    const q = query(teamsRef, where("coachId", "==", user.uid));
    const querySnapshot = await getDocs(q);

    const teamsData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setTeams(teamsData);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchCoachData(currentUser);
      } else {
        setUser(null);
        setCoachData(null);
        setTeams([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
          {loading ? (
            <p className="text-gray-500">Loading coach data...</p>
          ) : coachData ? (
            <div>
              {coachData.approved ? (
                <h1 className="text-2xl font-semibold text-gray-700">
                  <strong>Hello {coachData.firstName} {coachData.lastName}</strong>
                </h1>
              ) : (
                <p className="text-red-500">Your account is awaiting approval from an admin.</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No coach data found.</p>
          )}
        </div>

        {/* Teams Dashboard */}
        <div className="mt-6 w-full max-w-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Teams</h2>

          {teams.length > 0 ? (
            <ul className="space-y-4">
              {teams.map((team) => (
                <li key={team.id} className="bg-white p-4 rounded-md shadow-md">
                  <Link href={`/teamPage/${team.id}`} className="text-xl font-semibold text-gray-800 hover:underline">
                    {team.sport} - {team.school}
                  </Link>
                  <p className="text-gray-500">Gender: {team.gender}</p>
                  <p className="text-gray-500">Team Code: {team.teamCode}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No teams created yet.</p>
          )}

          {coachData?.approved ? (
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition mt-6"
              onClick={() => setIsModalOpen(true)}
            >
              Create Team
            </button>
          ) : (
            <p className="text-gray-500">You cannot create a team until your account is approved.</p>
          )}

          {/* Modal Component */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <CreateTeam onClose={() => setIsModalOpen(false)} />
          </Modal>
        </div>
      </div>
    </div>
  );
}


