'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import LiveStatForm from '../../components/LiveStatForm';
import { teamColorClasses } from '../../teamColors';
import NewGameForm from "../../components/NewGameForm";

export default function Page() {
  const { teamId } = useParams();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [gameId, setGameId] = useState(null);
  const hockeySayings = [
    'Sharpening skates...',
    'Taping sticks...',
    'Warming up the goalie...',
    'Flooding the ice...',
    'Sniping top shelf...', 
    'Lacing up the skates',
    'Making a line change...', 
    'Stacking the pads...',
    'Going bar down...',
    'Backchecking hard...',
    'Blocking a shot...'
  ];
  const [loadingMessage, setLoadingMessage] = useState('');
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * hockeySayings.length);
    setLoadingMessage(hockeySayings[randomIndex]);
  }, []);
  const [teamColors, setTeamColors] = useState(null);
  useEffect(() => {
        const fetchTeamColors = async () => {
          if (!teamId) return;
      
          try {
            const teamRef = doc(db, 'teams', teamId);
            const teamSnap = await getDoc(teamRef);
      
            if (teamSnap.exists()) {
              const team = teamSnap.data();
              const schoolName = team.school?.trim();
              setTeamColors(teamColorClasses[schoolName] || {});
            }
          } catch (error) {
            console.error("Error fetching team colors:", error);
          }
        };
      
        fetchTeamColors();
      }, [teamId]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);

      if (teamSnap.exists()) {
        const team = teamSnap.data();
        if (team.players?.length > 0) {
          const playerDocs = await Promise.all(
            team.players.map(pid => getDoc(doc(db, 'players', pid)))
          );
          const playersData = playerDocs
            .filter(doc => doc.exists())
            .map(doc => ({ id: doc.id, ...doc.data() }));
          setPlayers(playersData);
        }
      }
      setLoading(false);
    };

    fetchPlayers();
  }, [teamId]);

  if (loading) {
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

  return (
    
    <div className="max-w-4xl mx-auto p-6">
        <nav className= {`bg-gradient-to-r ${teamColors.gradient} w-full p-4 shadow-md fixed top-0 left-0 z-50`}>
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
<h1 className="text-3xl font-bold mb-6 text-center">Game Setup</h1>

<NewGameForm teamId={teamId} onGameCreated={setGameId} />

{gameId && (
  <>
    <h2 className="text-2xl font-semibold mt-10 mb-4 text-center">Live Stat Input</h2>
    <LiveStatForm teamId={teamId} players={players} gameId={gameId} />
  </>
)}

    </div>
  );
}