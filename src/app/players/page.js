"use client";

import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";  

function Player() {
  const [players, setPlayers] = useState([]);

  const ref = collection(db, "players");

  useEffect(() => {
    const unsubscribe = onSnapshot(ref, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data());
      });
      setPlayers(items);
    });

    return () => unsubscribe(); 
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-5">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Players</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player) => (
          <div key={player.number} className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold text-gray-700">
              #{player.number}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">{player.first_name} {player.last_name}</h2>
            <p className="text-gray-600">Year: <span className="font-medium">{player.year}</span></p>
            <p className="text-gray-600">Position: <span className="font-medium">{player.position}</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Player;
