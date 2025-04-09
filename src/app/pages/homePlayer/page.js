"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase"; 
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import AuthDetails from "../../components/auth/authDetails";
import Modal from "../../components/modal";
import Link from "next/link";

export default function PlayerHome() {
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamCode, setTeamCode] = useState("");
  const [error, setError] = useState("");
  const [teams, setTeams] = useState([]);
  const [user, setUser] = useState(null);
  const [jerseyNumber, setJerseyNumber] = useState("");

  const fetchPlayerData = async (user) => {
    if (!user) return;

    const playerRef = doc(db, "players", user.uid);
    const playerSnap = await getDoc(playerRef);

    if (playerSnap.exists()) {
      setPlayerData(playerSnap.data());
    }

    const teamsRef = collection(db, "teams");
    const q = query(teamsRef, where("players", "array-contains", user.uid));
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

      // Update team with the player
      await updateDoc(teamDoc.ref, {
        players: arrayUnion(auth.currentUser.uid),
      });

      // Update player with the jersey number
      await updateDoc(doc(db, "players", auth.currentUser.uid), {
        jerseyNumber: jerseyNumber,
      });

      // After joining the team, re-fetch the player data to update the teams
      await fetchPlayerData(auth.currentUser);

      setIsModalOpen(false);
      setTeamCode("");
      setJerseyNumber("");
    } else {
      setError("Invalid team code.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-emerald-900 to-emerald-500 w-full p-4 shadow-md fixed top-0 left-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-white text-2xl font-semibold">RG PERFORMANCE</h1>
          <AuthDetails />
        </div>
      </nav>

      <div className="flex-grow pt-20 w-full">
        {/* Profile Section */}
        <div className="max-w-4xl w-full bg-white shadow-lg rounded-xl p-8 my-8 mx-auto">
          {loading ? (
            <div className="text-center text-gray-500">Loading player data...</div>
          ) : playerData ? (
            <div className="text-center space-y-4">
              {/* Player Name and Jersey */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  #{playerData.jerseyNumber}
                </div>
                <h2 className="text-3xl font-semibold text-gray-800 mt-4">
                  {playerData.firstName} {playerData.lastName}
                </h2>
                <p className="text-lg text-gray-600">{playerData.position}</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">No player data found.</div>
          )}
        </div>

        <div className="max-w-4xl w-full bg-white shadow-lg rounded-xl p-8 my-8 mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Teams</h2>
          {teams.length > 0 ? (
            <ul className="space-y-4">
              {teams.map((team) => (
                <Link key={team.id} href={`/playerProfile/${team.id}/${user.uid}`} passHref>
                  <li className="bg-gray-100 p-6 rounded-lg shadow-md hover:bg-gray-200 transition-all cursor-pointer">
                    <h3 className="text-xl font-semibold text-gray-900">{team.gender}'s {team.sport}</h3>
                    <p className="text-gray-600">{team.school}</p>
                  </li>
                </Link>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">You are not part of any teams yet.</p>
          )}
        </div>

        {/* Join Team Button */}
        <div className="flex justify-center w-full mt-8">
          <button
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg shadow-lg hover:bg-emerald-700 transition"
            onClick={() => setIsModalOpen(true)}
          >
            Join a Team
          </button>
        </div>
      </div>

      {/* Modal for Joining a Team */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 space-y-2">
          <h2 className="text-gray-800">Team Code</h2>
          <input
            type="text"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. ABC123"
          />
          {error && <p className="text-red-600">{error}</p>}
          <h2 className="text-gray-800">Jersey Number</h2>
          <input
            type="number"
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. 19"
          />
          <button
            onClick={handleSubmit}
            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Submit
          </button>
        </div>
      </Modal>
    </div>
  );
}
