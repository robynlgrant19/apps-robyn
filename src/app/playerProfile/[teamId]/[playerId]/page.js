'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function PlayerProfile() {
  const { teamId, playerId } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('teamId:', teamId);
    console.log('playerId:', playerId);
    if (!playerId) return;

    const fetchPlayer = async () => {
      try {
        // Assuming 'players' is a top-level collection
        const playerRef = doc(db, `players`, playerId);
        const playerSnap = await getDoc(playerRef);
        
        if (playerSnap.exists()) {
          setPlayer(playerSnap.data());
        } else {
          console.log('Player not found');
        }
      } catch (error) {
        console.error('Error fetching player data:', error);
      }
      setLoading(false);
    };

    fetchPlayer();
  }, [teamId, playerId]);

  if (loading) return <p>Loading...</p>;
  if (!player) return <p>Player not found</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold text-gray-900">{player.firstName} {player.lastName}</h1>
      <p className="text-gray-600">Jersey #: {player.jerseyNumber}</p>
    </div>
  );
}
