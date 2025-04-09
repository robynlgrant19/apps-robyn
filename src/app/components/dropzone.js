import { storage, db } from "../firebase"; 
//import { ref, uploadBytes } from "firebase/storage"; 
import { collection, query, where, getDocs, updateDoc, addDoc } from "firebase/firestore";
import * as XLSX from "xlsx"; 
import { useState } from "react";

export default function Dropbox({ teamId }) {
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

      console.log("Game stats uploaded for Game:", opponent, "on", gameDate);

      
      for (const row of jsonData) {
        const jerseyNumber = row["Shirt number"];
        if (!jerseyNumber) {
          console.warn("Skipping row without jersey number:", row);
          continue;
        }

        
        const playersRef = collection(db, "players");
        const q = query(playersRef, where("jerseyNumber", "==", jerseyNumber));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.warn(`Player with jersey #${jerseyNumber} not found in Firestore`);
          continue;
        }

        
        const playerDoc = querySnapshot.docs[0];
        const playerRef = playerDoc.ref;

        await updateDoc(playerRef, {
          [`games.${newGameDocRef.id}`]: row, 
        });

        console.log(`Updated stats for Player #${jerseyNumber}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <input 
        type="text" 
        placeholder="Opponent" 
        value={opponent} 
        onChange={(e) => setOpponent(e.target.value)} 
        className="mb-2 p-2 border border-gray-300 rounde outline-emerald-500"
      />
      <input 
        type="date" 
        value={gameDate} 
        onChange={(e) => setGameDate(e.target.value)} 
        className="mb-4 p-2 border border-gray-300 rounded outline-emerald-500"
      />
      <div className="gap-2">
      <select 
        value={location} 
        onChange={(e) => setLocation(e.target.value)} 
        className="mb-4 p-2 border border-gray-300 rounded outline-emerald-500">
        <option value="Home">Home</option>
        <option value="Away">Away</option>
      </select>
      </div>

      <div className="mb-4 p-2 border border-gray-300 rounded inline-flex items-center gap-2 w-80 outline-emerald-500">
        <input 
          type="number" 
          placeholder="Your Score" 
          value={teamScore} 
          onChange={(e) => setTeamScore(Number(e.target.value))} 
          className="p-2 w-32 border border-gray-300 rounded text-xs outline-emerald-500"
        />
        <span className="text-xl">-</span>
        <input 
          type="number" 
          placeholder="Opponent Score" 
          value={opponentScore} 
          onChange={(e) => setOpponentScore(Number(e.target.value))} 
          className="p-2 w-32 border border-gray-300 rounded text-xs outline-emerald-500"
        />
      </div>

      <input 
        type="file" 
        onChange={handleUpload} 
        className="p-2 border border-gray-300 rounded"
      />
    </div>
  );
}







