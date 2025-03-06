"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import AuthDetails from "../../components/auth/authDetails";
import Modal from "../../components/modal";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

export default function PlayerHome() {
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamCode, setTeamCode] = useState("");
  const [error, setError] = useState("");
  const [teams, setTeams] = useState([]);
  const [user, setUser] = useState(null);


  const fetchPlayerData = async (user) => {
    if (!user) return;

    const playerRef = doc(db, "players", user.uid);
    const playerSnap = await getDoc(playerRef);

    if (playerSnap.exists()) {
      setPlayerData(playerSnap.data());
    }

    // Fetch teams the player is part of
    const teamsRef = collection(db, "teams");
    const q = query(teamsRef, where("players", "array-contains", user.uid));
    const querySnapshot = await getDocs(q);

    const teamsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTeams(teamsData);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchPlayerData(currentUser); 
      } else {
        setUser(null);
        setPlayerData(null);
        setTeams([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    const teamRef = collection(db, "teams");
    const teamQuery = query(teamRef, where("teamCode", "==", teamCode));
    const querySnapshot = await getDocs(teamQuery);

    if (!querySnapshot.empty) {
      const teamDoc = querySnapshot.docs[0];
      const teamData = teamDoc.data();
      
      if (teamData.players.includes(auth.currentUser.uid)) {
        setError("You are already part of this team.");
        return;
      }

      await updateDoc(teamDoc.ref, {
        players: arrayUnion(auth.currentUser.uid),
      });
      setIsModalOpen(false);
      setTeamCode(""); // Reset the team code field
    } else {
      setError("Invalid team code.");
    }
  };

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
            <p className="text-gray-500">Loading player data...</p>
          ) : playerData ? (
            <div>
              <h1 className="text-2xl font-semibold text-gray-700">
                <strong>{playerData.firstName} {playerData.lastName} #{playerData.jerseyNumber}</strong>
              </h1>
            </div>
          ) : (
            <p className="text-gray-500">No player data found.</p>
          )}
        </div>

        {/* Dashboard */}
        <div className="mt-6 w-full max-w-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Teams</h2>
          
          {teams.length > 0 ? (
            <ul className="space-y-4">
            {teams.map((team) => (
              <li key={team.id} className="bg-white p-4 rounded-md shadow-md">
                <Link href={`/playerProfile/${team.id}/${user.uid}`}>
                  <h3 className="text-gray-900 cursor-pointer hover:underline">{team.sport} - {team.school}</h3>
                </Link>
                <p className="text-gray-500">Gender: {team.gender}</p>
              </li>
            ))}
          </ul>
          ) : (
            <p className="text-gray-500">No teams yet</p>
          )}
          
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition mt-6"
            onClick={() => setIsModalOpen(true)}
          >
            Join a Team
          </button>

          {/* Modal Component */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <div className="space-y-4">
              <h2 className="text-gray-800 text-xl font-bold">Enter Team Code</h2>
              <input
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter team code"
              />
              {error && <p className="text-red-600">{error}</p>}
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition w-full"
              >
                Submit
              </button>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
}

  
  






