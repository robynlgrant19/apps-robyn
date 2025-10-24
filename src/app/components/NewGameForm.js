'use client';
import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase';

export default function NewGameForm({ teamId, onGameCreated }) {
  const [opponent, setOpponent] = useState('');
  const [location, setLocation] = useState('Home');
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!opponent || !gameDate || !location) {
      alert('Please fill in all fields');
      return;
    }
    console.log('db is', db?.constructor?.name); // should log "Firestore"
    try {
      setLoading(true);
      

      const docRef = await addDoc(collection(db, 'games'), {
        teamId,
        opponent,
        location,
        gameDate,
        stats: [],
        createdAt: Timestamp.now(),
      });
      setLoading(false);
      if (onGameCreated) onGameCreated(docRef.id);
    } catch (err) {
      console.error('Error creating game:', err);
      setLoading(false);
      alert('Error creating game');
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <h2 className="text-xl font-semibold mb-4">Enter Game Info</h2>

      <input
        type="text"
        placeholder="Opponent"
        value={opponent}
        onChange={(e) => setOpponent(e.target.value)}
        className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
      />

      <input
        type="date"
        value={gameDate}
        onChange={(e) => setGameDate(e.target.value)}
        className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
      />

      <select
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
      >
        <option value="Home">Home</option>
        <option value="Away">Away</option>
      </select>

      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded"
      >
        {loading ? 'Creating...' : 'Start Game'}
      </button>
    </div>
  );
}
