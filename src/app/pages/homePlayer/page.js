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
  //const [position, setPosition] = useState("");

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

    // check if jersey number already exists
    if (!querySnapshot.empty) {
        setError(`Jersey #${jerseyNumber} is already taken for this team.`);
        return;
      }

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
  setError(""); // clear previous errors

  /*
  if (!position) {
    setError("Please select your position");
    return;
  }*/

  if (!jerseyNumber) {
    setError("Please enter your jersey number");
    return;
  }

  try {
    // Find the team by code
    const teamRef = collection(db, "teams");
    const teamQuery = query(teamRef, where("teamCode", "==", teamCode));
    const querySnapshot = await getDocs(teamQuery);

    if (querySnapshot.empty) {
      setError("Invalid team code.");
      return;
    }

    const teamDoc = querySnapshot.docs[0];
    const teamData = teamDoc.data();

    // Check if the player is already on the team
    if (teamData.players.includes(auth.currentUser.uid)) {
      setError("You are already part of this team.");
      return;
    }

    // Check jersey number uniqueness within this team
    const jerseyQuery = query(
      collection(db, "players"),
      where("teamId", "==", teamDoc.id),
      where("jerseyNumber", "==", Number(jerseyNumber))
    );
    const jerseySnapshot = await getDocs(jerseyQuery);

    if (!jerseySnapshot.empty) {
      setError(`Jersey #${jerseyNumber} is already taken for this team.`);
      return;
    }

    // Add player UID to the team’s players array
    await updateDoc(teamDoc.ref, {
      players: arrayUnion(auth.currentUser.uid),
    });

    // Update player document with jersey number  and teamId
    await updateDoc(doc(db, "players", auth.currentUser.uid), {
      jerseyNumber: Number(jerseyNumber),
      teamId: teamDoc.id,
    });

    // Refresh player data
    await fetchPlayerData(auth.currentUser);

    // Clear modal form
    setIsModalOpen(false);
    setTeamCode("");
    setJerseyNumber("");
    setPosition("");
  } catch (err) {
    console.error(err);
    setError("Failed to join the team. Please try again.");
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
            className="w-full text-md px-4 py-3 rounded-md bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            placeholder="e.g. ABC123"
          />

          <h2 className="text-gray-800">Jersey Number</h2>
          <input
            type="number"
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
            className="w-full text-md px-4 py-3 rounded-md bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            placeholder="e.g. 19"
          />

{/*
          <h2 className="text-gray-800">Position</h2>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full text-md px-4 py-3 rounded-md bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          >
            <option value="" disabled>Select your position</option>
            <option value="F">Forward</option>
            <option value="D">Defense</option>
            <option value="G">Goalie</option>
          </select>*/}




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
