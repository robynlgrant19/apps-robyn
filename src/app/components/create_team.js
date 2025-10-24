"use client";

import React, { useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export default function CreateTeam({ onClose, onTeamCreated }) {
  const [teamGender, setTeamGender] = useState("");
  const [teamSport, setTeamSport] = useState("");
  const [teamSchool, setTeamSchool] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [error, setError] = useState(null);

  //genertaing a team code 
  const generateCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const handleCreateTeam = async () => {
    const newCode = generateCode(); 
    setTeamCode(newCode);
  
    try {
      const user = auth.currentUser;
      
      
      // Create team in Firestore
      await addDoc(collection(db, "teams"), {
        gender: teamGender,
        sport: teamSport,
        school: teamSchool,
        coachId: user.uid,
        players: [],
        teamCode: newCode,
      });
  
      // Clear form
      setTeamGender(""); 
      setTeamSport("");
      setTeamSchool("");
  
      // Call parent callback to refresh teams list
      if (onTeamCreated) {
        await onTeamCreated();
      }
  
      onClose(); // Close the modal
    } catch (err) {
      setError(`Failed to create team: ${err.message}`);
      console.error(err);
    }
  };
  

  return (
    <div>
      <select
        value={teamSport}
        onChange={(e) => setTeamSport(e.target.value)}
        className="w-full p-2 border rounded-md mb-3 focus:border-emerald-500 focus:outline-none"
      >
        <option value="" disabled>Select a sport</option>
        <option value="Soccer">Soccer</option>
        <option value="Basketball">Basketball</option>
        <option value="Football">Football</option>
        <option value="Baseball">Baseball</option>
        <option value="Ice Hockey">Ice Hockey</option>
        <option value="Tennis">Tennis</option>
        <option value="Volleyball">Volleyball</option>
        <option value="Track & Field">Track & Field</option>
        <option value="Swimming">Swimming</option>
        <option value="Field Hockey">Field Hockey</option>
        <option value="Wrestling">Wrestling</option>
        <option value="Golf">Golf</option>
        <option value="Lacrosse">Lacrosse</option>
        <option value="Gymnastics">Gymnastics</option>
        <option value="Rugby">Rugby</option>
      </select>

      <select
        value={teamGender}
        onChange={(e) => setTeamGender(e.target.value)}
        className="w-full p-2 border rounded-md mb-3 focus:border-emerald-500 focus:outline-none"
      >
        <option value="" disabled>Gender</option>
        <option value="Men">Men</option>
        <option value="Women">Women</option>
        <option value="Women and Men">Women and Men</option>
      </select>

      <input
        type="text"
        placeholder="Enter school"
        value={teamSchool}
        onChange={(e) => setTeamSchool(e.target.value)}
        className="w-full p-2 border rounded-md mb-3 focus:border-emerald-500 focus:outline-none"
      />

      <button
        onClick={handleCreateTeam}
        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
      >
        Save Team
      </button>

    </div>
  );
}




      
