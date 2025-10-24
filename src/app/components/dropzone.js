import { storage, db } from "../firebase"; 
//import { ref, uploadBytes } from "firebase/storage"; 
import { collection, query, where, getDocs, updateDoc, addDoc } from "firebase/firestore";
import * as XLSX from "xlsx"; 
import { useState } from "react";

export default function Dropbox({ teamId, onGameUploaded }) {
  const [gameDate, setGameDate] = useState(""); 
  const [opponent, setOpponent] = useState(""); 
  const [location, setLocation] = useState("Home");
  const [teamScore, setTeamScore] = useState("");
  const [opponentScore, setOpponentScore] = useState("");

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !gameDate || !opponent) {
      console.warn("Please provide both a game name and date before uploading stats.");
      return;
    }

    //console.log("File uploaded:", file.name);
    //console.log("Game Date:", gameDate);
    //console.log("Opponent:", opponent);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      console.log("Parsed Excel Data:", jsonData);

      
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

      

      
      for (const row of jsonData) {
  const jerseyNumber = row["Shirt number"];
  if (!jerseyNumber) {
    console.warn("Skipping row without jersey number:", row);
    continue;
  }

  const playersRef = collection(db, "players");

  // Step 1 – main query
  let q = query(
    playersRef,
    where("jerseyNumber", "==", jerseyNumber),
    where("teamId", "==", teamId)
  );
  let querySnapshot = await getDocs(q);

  // Step 3 – fallback if empty
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
    console.warn(`Player with jersey #${jerseyNumber} not found.`);
    continue;
  }

  const playerDoc = querySnapshot.docs[0];
  const playerRef = playerDoc.ref;

  // ✅ Step 4 – auto-backfill teamId if missing
  if (!playerDoc.data().teamId) {
    await updateDoc(playerRef, { teamId });
    console.log(`Added missing teamId to player #${jerseyNumber}`);
  }

  // Now update their stats
  await updateDoc(playerRef, {
    [`games.${newGameDocRef.id}`]: row,
  });

  console.log(`✅ Updated stats for Player #${jerseyNumber}`);
}


    };
    reader.readAsArrayBuffer(file);
  };

  return (
  <div className="flex flex-col space-y-4 w-full max-w-sm mx-auto">
    <input 
      type="text" 
      placeholder="Opponent" 
      value={opponent} 
      onChange={(e) => setOpponent(e.target.value)} 
      className="p-3 border border-gray-300 rounded-md outline-emerald-500 focus:ring-2 focus:ring-emerald-500 text-gray-800"
    />

    <input 
      type="date" 
      value={gameDate} 
      onChange={(e) => setGameDate(e.target.value)} 
      className="p-3 border border-gray-300 rounded-md outline-emerald-500 focus:ring-2 focus:ring-emerald-500 text-gray-800"
    />

    <select 
      value={location} 
      onChange={(e) => setLocation(e.target.value)} 
      className="p-3 border border-gray-300 rounded-md outline-emerald-500 focus:ring-2 focus:ring-emerald-500 text-gray-800"
    >
      <option value="Home">Home</option>
      <option value="Away">Away</option>
    </select>

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

    <input 
      type="file" 
      onChange={handleUpload} 
      className="p-3 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition text-gray-700 cursor-pointer"
    />
  </div>
);

}







