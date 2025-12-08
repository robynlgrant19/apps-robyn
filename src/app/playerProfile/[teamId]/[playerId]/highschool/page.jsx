"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { teamColorClasses } from "../../../../teamColors";

export default function HighschoolPlayerProfile() {
  const { teamId, playerId } = useParams();
  const router = useRouter();

  const [player, setPlayer] = useState(null);
  const [teamColors, setTeamColors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");

  const hockeySayings = [
    "Sharpening skates...",
    "Taping sticks...",
    "Warming up the goalie...",
    "Flooding the ice...",
    "Sniping top shelf...",
    "Lacing up the skates...",
    "Making a line change...",
    "Stacking the pads...",
    "Going bar down...",
    "Backchecking hard...",
    "Blocking a shot...",
  ];

  // Random loading message
  useEffect(() => {
    const random = Math.floor(Math.random() * hockeySayings.length);
    setLoadingMessage(hockeySayings[random]);
  }, []);

  // Fetch player
  useEffect(() => {
    if (!playerId) return;

    const loadPlayer = async () => {
      const snap = await getDoc(doc(db, "players", playerId));
      if (snap.exists()) {
        setPlayer(snap.data());
      }
    };

    loadPlayer();
  }, [playerId]);

  // Fetch team colors
  useEffect(() => {
    if (!teamId) return;

    const loadTeamColors = async () => {
      const snap = await getDoc(doc(db, "teams", teamId));
      if (snap.exists()) {
        const team = snap.data();
        const schoolName = team.school?.trim();
        setTeamColors(teamColorClasses[schoolName] || {});
      }
      setLoading(false);
    };

    loadTeamColors();
  }, [teamId]);

  if (loading || !player) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white text-gray-800">
        <img
          src="/puck.png"
          alt="Loading..."
          className="w-16 h-16 mb-6 object-contain animate-spin"
        />
        <h2 className="text-2xl font-semibold">{loadingMessage}</h2>
      </div>
    );
  }

  // Image fallback logic
  const fullName = `${player.firstName} ${player.lastName}`;
  const defaultPhoto = "/playerPhotos/defaultProfile.png";
  const fallbackPhoto =
    `/playerPhotos/${player.firstName}${player.lastName}`.toLowerCase() + ".JPG";
  const imagePath = fallbackPhoto || defaultPhoto;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* NAVBAR */}
      <nav
        className={`w-full p-4 shadow-md fixed top-0 left-0 z-50 ${teamColors?.gradient}`}
      >
        <div className="container mx-auto flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="text-white px-4 py-2 text-xl"
          >
            ⬅
          </button>
          <h1 className="text-white text-2xl font-semibold">RG PERFORMANCE</h1>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <div className="max-w-5xl mx-auto mt-24">
        {/* PLAYER HEADER */}
        <div
          className={`bg-white border-l-8 ${teamColors?.border} rounded-xl shadow-lg p-6 ring-1 ring-gray-200 mb-10`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
            {/* PHOTO + NAME BLOCK */}
            <div className="flex items-center gap-6">
              {/* PHOTO */}
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-gray-200 shadow-md">
                <img
                  src={imagePath}
                  alt={fullName}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultPhoto;
                  }}
                  className="w-full h-full object-cover object-top bg-gray-100"
                />
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 uppercase tracking-wide">
                  {player.firstName} {player.lastName}
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 mt-1 font-medium">
                  {player.position || "Position not available"}
                </p>
              </div>
            </div>

            {/* JERSEY NUMBER */}
            <div className={`text-5xl sm:text-6xl font-impact ${teamColors?.text}`}>
              #{player.jerseyNumber}
            </div>
          </div>
        </div>

        {/* HIGH SCHOOL CONTENT COMING SOON SECTION */}
        <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            High School Player Stats Coming Soon
          </h2>
          <p className="text-gray-600">
            This profile layout will be customized for high-school stat tracking.
          </p>
        </div>
      </div>
    </div>
  );
}

