"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";


export default function TeamPage() {
  const { id } = useParams(); 
  const router = useRouter();
  const [teamData, setTeamData] = useState(null);
  const [players, setPlayers] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!id) return;

      console.log("fetching id: ", id)

      
      const teamRef = doc(db, "teams", id);
      const teamSnap = await getDoc(teamRef);
      
      if (teamSnap.exists()) {
        const team = teamSnap.data();
        console.log("Team data: ", team);
        setTeamData(team);

        
        if (team.players && team.players.length > 0) {
          const playerPromises = team.players.map(async (playerId) => {
            const playerRef = doc(db, "players", playerId);
            const playerSnap = await getDoc(playerRef);

            
            return playerSnap.exists() ? { id: playerSnap.id, ...playerSnap.data() } : null;
          });

          const playersData = (await Promise.all(playerPromises)).filter(p => p !== null);
          setPlayers(playersData);
        }
      }

      setLoading(false);
    };

    fetchTeamData();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
     
     <button 
        className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4 hover:bg-blue-600"
        onClick={() => router.push(`/pages/homeCoach`)}
      >
        Back to Coach Home
      </button>
      

      {loading ? (
        <p className="text-gray-500">Loading team data...</p>
      ) : teamData ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800">{teamData.sport} - {teamData.school}</h1>
          <p className="text-gray-600">Gender: {teamData.gender}</p>
          <p className="text-gray-600">Team Code: {teamData.teamCode}</p>

          
          <h2 className="text-xl text-gray-800 font-semibold mt-6">Players</h2>
          {players.length > 0 ? (
          <ul className="mt-2 space-y-2">
          {players.map(player => (
            <li key={player.id} className="bg-gray-50 p-3 rounded-md shadow-sm">
              <Link href={`/playerProfile/${id}/${player.id}`}>
                <h3 className="font-medium text-gray-800 cursor-pointer hover:underline">{player.firstName} #{player.jerseyNumber}</h3>
              </Link>
            </li>
          ))}
        </ul>
) : (
  <p className="text-gray-500">No players found for this team.</p>
)}

        </div>
      ) : (
        <p className="text-red-500">Team not found.</p>
      )}
      
    </div>
  );
}





