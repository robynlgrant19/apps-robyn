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
  const [position, setPosition] = useState("");
  const playerImages = {
  "Robyn Grant": "/playerPhotos/robyngrant.jpg",
  "Maci Peller": "/playerPhotos/macipeller.JPG",
  "Jamie Steinmetz": "/playerPhotos/jamiesteinmetz.JPG",
  "Jacqueline Martin": "/playerPhotos/jacquelinemartin.JPG",
  "Laura Castronova": "/playerPhotos/lauracastronova.JPG",
  "Emma Lemery": "/playerPhotos/emmalemery.JPG", 
  "Gracie Menicci": "/playerPhotos/graciemenicci.JPG", 
  "Emily Gerrie": "/playerPhotos/emilygerrie.JPG", 
  "Katie Porrello": "/playerPhotos/katieporrello.JPG", 
  "Caeli Reed": "/playerPhotos/caelireed.JPG", 
  "Morgan Cunningham": "/playerPhotos/morgancunningham.JPG",
  "Adriana Dooley": "/playerPhotos/adrianadooley.JPG",
  "Mylee Serkis": "/playerPhotos/myleeserkis.JPG",
  "Teagan Wilson": "/playerPhotos/teaganwilson.JPG",
  "Alanna Hoag": "/playerPhotos/alannahoag.JPG",
  "Cera Luciani": "/playerPhotos/ceraluciani.JPG",
  "Madelynn Wiggins": "/playerPhotos/madelynnwiggins.JPG",

  };


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
    console.log("✅ Submit button clicked");
  setError(""); // clear previous errors

  
  if (!position) {
    setError("Please select your position");
    return;
  }

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
      position: position,
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
        <div className="max-w-4xl w-full bg-white shadow-lg rounded-2xl p-10 my-8 mx-auto">
  {loading ? (
    <div className="text-center text-gray-500">Loading player data...</div>
  ) : playerData ? (
    <div className="flex flex-col items-center text-center space-y-6">
      {/* --- PLAYER PHOTO --- */}
      {(() => {
        const fullName = `${playerData.firstName} ${playerData.lastName}`;
        const defaultPhoto = "/playerPhotos/defaultProfile.png";
        const manualPhoto = playerImages?.[fullName];
        const fallbackPhoto =
          `/playerPhotos/${playerData.firstName}${playerData.lastName}`.toLowerCase() + ".jpg";
        const imagePath = manualPhoto || fallbackPhoto || defaultPhoto;

        return (
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
            <img
              src={imagePath}
              alt={`${playerData.firstName} ${playerData.lastName}`}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultPhoto;
              }}
              className="w-full h-full object-cover bg-gray-100 transition-transform duration-300 hover:scale-105"
            />

            {/* --- Jersey Number Badge --- */}
            {/*<div
              className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white text-xl sm:text-2xl font-bold w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-md border-4 border-white`}
            >
              #{playerData.jerseyNumber}
            </div> */}
          </div>
        );
      })()}

      {/* --- PLAYER NAME --- */}
      <h2 className="mt-6 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-wide uppercase">
        {playerData.firstName} {playerData.lastName}
      </h2>
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
  <li className="bg-white p-6 rounded-lg shadow-md hover:bg-gray-200 transition-all cursor-pointer flex justify-between items-center">
    {/* LEFT: Team Info */}
    <div>
      <h3 className="text-xl font-semibold text-gray-900">
        {team.gender}'s {team.sport}
      </h3>
      <p className="text-gray-600">{team.school}</p>
    </div>

    {/* RIGHT: Team Logo */}
    <img
      src={`/teamLogos/${team.school.toLowerCase().replace(/\s+/g, '')}.jpg`}
      alt={`${team.school} logo`}
      className="w-16 h-16 sm:w-20 sm:h-20 object-contain ml-4"
      onError={(e) => (e.currentTarget.src = '/teamLogos/default.png')}
    />
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
          </select>




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
