"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { db, storage } from "../firebase";
import { collection, query, where, getDocs, updateDoc, addDoc, doc, getDoc } from "firebase/firestore";
import * as XLSX from "xlsx";

export default function Dropbox({ teamId: propTeamId, onGameUploaded }) {
  const { id: routeTeamId } = useParams();
  const teamId = propTeamId || routeTeamId;

  console.log("✅ Dropbox resolved teamId:", teamId);

  const [file, setFile] = useState(null);
  const [gameDate, setGameDate] = useState("");
  const [opponent, setOpponent] = useState("");
  const [location, setLocation] = useState("Home");
  const [teamScore, setTeamScore] = useState("");
  const [opponentScore, setOpponentScore] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const handleUpload = async () => {
    if (!file || !gameDate || !opponent) {
      setUploadMessage("Please fill out all required fields before uploading.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadMessage("Uploading and processing game...");

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);

          if (!teamId) {
            throw new Error("Missing teamId — cannot save game.");
          }

          // ✅ Create new game document
          const gameRef = collection(db, "games");
          const newGameDocRef = await addDoc(gameRef, {
            gameDate,
            opponent,
            location,
            teamScore,
            opponentScore,
            teamId,
            stats: jsonData,
            createdAt: new Date(),
          });

          console.log("✅ Added game:", newGameDocRef.id);

          // ✅ Update each player's stats
          for (const row of jsonData) {
            const jerseyNumber = row["Shirt number"];
            if (!jerseyNumber) continue;

            const playersRef = collection(db, "players");
            let q = query(
              playersRef,
              where("jerseyNumber", "==", jerseyNumber),
              where("teamId", "==", teamId)
            );
            let querySnapshot = await getDocs(q);

            // Fallback: use teamCode if no match
            if (querySnapshot.empty) {
              const teamRef = doc(db, "teams", teamId);
              const teamSnap = await getDoc(teamRef);
              const teamData = teamSnap.data();

              if (teamData?.teamCode) {
                const fallbackQ = query(
                  playersRef,
                  where("jerseyNumber", "==", jerseyNumber),
                  where("teamCode", "==", teamData.teamCode)
                );
                querySnapshot = await getDocs(fallbackQ);
              }
            }

            if (querySnapshot.empty) {
              console.warn(`Player #${jerseyNumber} not found.`);
              continue;
            }

            const playerDoc = querySnapshot.docs[0];
            const playerRef = playerDoc.ref;

            // Auto-backfill teamId if missing
            if (!playerDoc.data().teamId) {
              await updateDoc(playerRef, { teamId });
              console.log(`Added missing teamId to player #${jerseyNumber}`);
            }

            await updateDoc(playerRef, {
              [`games.${newGameDocRef.id}`]: row,
            });
          }

          setUploadMessage("✅ Game uploaded successfully!");
          setIsUploading(false);
          setFile(null);
          

          // Optionally close modal / refresh
          if (onGameUploaded) onGameUploaded();
        } catch (error) {
          console.error("Error while processing file:", error);
          setUploadMessage("❌ Upload failed. Please try again.");
          setIsUploading(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage("❌ Upload failed. Please try again.");
      setIsUploading(false);
    }
  };


  return (
  <div className="flex flex-col space-y-4 w-full max-w-sm mx-auto">
    {/* Opponent Dropdown */}
    <select
  value={opponent}
  onChange={(e) => setOpponent(e.target.value)}
  className="p-3 border border-gray-300 rounded-md outline-emerald-500 focus:ring-2 focus:ring-emerald-500 text-gray-800 bg-white"
>
  <option value="" disabled>-- Select Opponent --</option>
  <option value="Keene State">Keene State</option>
  <option value="Salem State">Salem State</option>
  <option value="NEC">NEC</option>
  <option value="UMass Boston">UMass Boston</option>
  <option value="Castleton">Castleton</option>
  <option value="USM">USM</option>
  <option value="Norwich">Norwich</option>
  <option value="Salve Regina">Salve Regina</option>
  <option value="Curry College">Curry College</option>
  <option value="Anna Maria">Anna Maria</option>
</select>



    {/* Date Input */}
    <input
      type="date"
      value={gameDate}
      onChange={(e) => setGameDate(e.target.value)}
      className="p-3 border border-gray-300 rounded-md outline-emerald-500 focus:ring-2 focus:ring-emerald-500 text-gray-800"
    />

    {/* Location */}
    <select
      value={location}
      onChange={(e) => setLocation(e.target.value)}
      className="p-3 border border-gray-300 rounded-md outline-emerald-500 focus:ring-2 focus:ring-emerald-500 text-gray-800 bg-white"
    >
      <option value="Home">Home</option>
      <option value="Away">Away</option>
    </select>

    {/* Scores */}
    <div className="flex items-center justify-between space-x-3">
      <input
        type="number"
        placeholder="Your Score"
        value={teamScore}
        onChange={(e) => setTeamScore(Number(e.target.value))}
        className="p-3 border border-gray-300 rounded-md w-1/2 outline-emerald-500 focus:ring-2 focus:ring-emerald-500 text-gray-800"
      />
      <span className="text-xl font-bold text-gray-600">-</span>
      <input
        type="number"
        placeholder="Opponent Score"
        value={opponentScore}
        onChange={(e) => setOpponentScore(Number(e.target.value))}
        className="p-3 border border-gray-300 rounded-md w-1/2 outline-emerald-500 focus:ring-2 focus:ring-emerald-500 text-gray-800"
      />
    </div>

    {/* File Input */}
    <input
      type="file"
      accept=".xlsx, .xls"
      onChange={(e) => setFile(e.target.files[0])}
      className="p-3 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition text-gray-700 cursor-pointer"
    />

    {/* Submit Button */}
    <button
      onClick={handleUpload}
      className="mt-4 bg-emerald-600 text-white font-semibold py-3 rounded-md hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!file || !opponent || !gameDate}
    >
      {isUploading ? "Uploading..." : "Submit Game"}
    </button>

    {/* Status Message */}
    {uploadMessage && (
      <p className="text-center text-sm text-gray-700 mt-2">{uploadMessage}</p>
    )}
  </div>
);
}







