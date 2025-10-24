'use client';

import { useEffect, useState } from 'react';
import { collection, addDoc, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { teamColorClasses } from '../teamColors';

export default function LiveStatForm({ teamId, players, gameId = null, onClose }) {
  const [gameInfo, setGameInfo] = useState({
    opponent: '',
    location: 'Home',
    gameDate: new Date().toISOString().split('T')[0],
  });

  const [teamColors, setTeamColors] = useState(null);
  
  const [teamName, setTeamName] = useState('');


  const handleSubmit = async () => {
    try {
      if (gameId) {
        // Edit mode
        const gameRef = doc(db, 'games', gameId);
        await updateDoc(gameRef, {
          ...gameInfo,
          updatedAt: Timestamp.now(),
        });
        alert('Game updated!');
      } else {
        // New game
        const docRef = await addDoc(collection(db, 'games'), {
          teamId,
          ...gameInfo,
          stats: [],
          createdAt: Timestamp.now(),
        });
        alert('Game info submitted!');
  
        if (onGameCreated) onGameCreated(docRef.id); 
      }
  
      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving game info:', error);
      alert('There was an error saving the game info.');
    }
  };
  

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
          setTeamName(schoolName);
        }
      } catch (error) {
        console.error('Error fetching team colors:', error);
      }
    };

    fetchTeamColors();
  }, [teamId]);

  useEffect(() => {
    const fetchExistingGame = async () => {
      if (!gameId) return;
  
      try {
        const gameRef = doc(db, 'games', gameId);
        const gameSnap = await getDoc(gameRef);
        if (gameSnap.exists()) {
          const data = gameSnap.data();
          setGameInfo({
            opponent: data.opponent || '',
            location: data.location || 'Home',
            gameDate: data.gameDate || new Date().toISOString().split('T')[0],
          });
          
        }
      } catch (error) {
        console.error('Error fetching game for editing:', error);
      }
    };
  
    fetchExistingGame();
  }, [gameId]);
  


  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Enter Game Info</h2>

      <div className="mb-4">
        <input
        type="text"
        placeholder="Opponent"
        value={gameInfo.opponent}
        onChange={e => setGameInfo({ ...gameInfo, opponent: e.target.value })}
        className="w-full text-md px-4 py-3 rounded-md bg-white border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition mb-4"
        />

        <input
          type="date"
          value={gameInfo.gameDate}
          onChange={e => setGameInfo({ ...gameInfo, gameDate: e.target.value })}
          className="w-full text-md px-4 py-3 rounded-md bg-white border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition mb-4"
        />
        <select
          value={gameInfo.location}
          onChange={e => setGameInfo({ ...gameInfo, location: e.target.value })}
          className="w-full text-md px-4 py-3 rounded-md bg-white border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition mb-4"
        >
          <option value="Home">Home</option>
          <option value="Away">Away</option>
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 mb-6 justify-center">

 

  
</div>





      <button
        onClick={handleSubmit}
        className={`${teamColors?.bg || 'bg-emerald-600'} text-white px-6 py-3 rounded w-full font-semibold`}
      >
        Save Game Info
      </button>
    </div>
  );
}


