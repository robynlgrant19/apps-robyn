"use client";

import { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { teamColorClasses } from "../../../teamColors";

export default function HighSchoolTeamPage() {
  const { id } = useParams();
  const router = useRouter();

  const [teamData, setTeamData] = useState(null);
  const [teamColors, setTeamColors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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
    const random = hockeySayings[Math.floor(Math.random() * hockeySayings.length)];
    setMessage(random);
  }, []);

  // Load team info
  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "teams", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setTeamData(data);
        setTeamColors(teamColorClasses[data.school] || {});
      }

      setTimeout(() => setLoading(false), 800);
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-800">
        <img
          src="/puck.png"
          alt="Loading..."
          className="w-16 h-16 mb-6 object-contain animate-spin"
        />
        <h2 className="text-2xl font-semibold">{message}</h2>
      </div>
    );
  }

  if (!teamData) {
    return <p className="text-center text-xl text-red-600 p-10">Team not found.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* NAV BAR */}
      <nav className={`w-full p-4 shadow-md fixed top-0 left-0 z-50 ${teamColors?.gradient}`}>
        <div className="container mx-auto flex justify-between items-center">
          <button onClick={() => router.back()} className="text-white px-4 py-2 text-xl">
            ⬅
          </button>
          <h1 className="text-white text-2xl font-semibold">RG PERFORMANCE</h1>
        </div>
      </nav>

      {/* MAIN */}
      <div className="max-w-5xl mx-auto mt-32 w-full px-4">
        {/* TEAM HEADER CARD */}
        <div
          className={`relative w-full bg-white border-l-8 ${teamColors?.text} rounded-xl shadow-md ring-1 ring-gray-200 py-6 mb-10`}
        >
          <div className="flex items-center justify-between w-full px-6 lg:px-12 gap-6">
            {/* LEFT SIDE: Logo + Info */}
            <div className="flex items-center gap-6 min-w-0 flex-grow">
              <img
                src={`/teamLogos/${teamData.school.toLowerCase().replace(/\s+/g, "")}.jpg`}
                alt={`${teamData.school} logo`}
                className="w-20 h-20 object-contain flex-shrink-0"
                onError={(e) => (e.currentTarget.src = "/teamLogos/default.jpg")}
              />

              <div className="flex flex-col min-w-0 leading-tight w-full">
                <h1 className="text-3xl font-extrabold text-gray-900 truncate">
                  {teamData.gender}'s {teamData.sport}
                </h1>

                <h2 className="text-2xl font-bold text-gray-800 break-words">
                  {teamData.school}
                </h2>

                {teamData.teamCode && (
                  <p className="text-lg text-gray-700 font-medium mt-1">
                    Team Code:{" "}
                    <span className={`${teamColors?.text} font-semibold`}>
                      {teamData.teamCode}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT SIDE: Optional record later */}
            {/* Leave blank for now */}
          </div>
        </div>

        {/* --- PLACEHOLDER FOR FUTURE HS SECTIONS --- */}
        <div className="bg-white p-8 rounded-xl shadow-md ring-1 ring-gray-200 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            High School Dashboard (Starter)
          </h2>
          <p className="text-gray-600">
            Build HS-specific sections here: roster, schedule, stats, uploads, etc.
          </p>
        </div>
      </div>
    </div>
  );
}

