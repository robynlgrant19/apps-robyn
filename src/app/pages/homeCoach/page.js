"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import AuthDetails from "../../components/auth/authDetails";
import Modal from "../../components/modal";
import CreateTeam from "../../components/create_team";
import Link from "next/link";

export default function CoachHome() {
  const [coachData, setCoachData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamCodeInput, setTeamCodeInput] = useState("");
  const [teams, setTeams] = useState([]);
  const [user, setUser] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const fetchCoachData = async (user) => {
    if (!user) return;

    const coachRef = doc(db, "coaches", user.uid);
    const coachSnap = await getDoc(coachRef);

    if (coachSnap.exists()) {
      setCoachData(coachSnap.data());
    }
  };

  useEffect(() => {
    let unsubscribeTeams = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchCoachData(currentUser);

        
        const teamsRef = collection(db, "teams");

        const headCoachQuery = query(teamsRef, where("coachId", "==", currentUser.uid));
        const assistantCoachQuery = query(teamsRef, where("assistantCoachId", "array-contains", currentUser.uid));

        const headCoachUnsub = onSnapshot(headCoachQuery, (headSnapshot) => {
          const headTeams = headSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const assistantCoachUnsub = onSnapshot(assistantCoachQuery, (assistantSnapshot) => {
            const assistantTeams = assistantSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            const combinedTeams = [...headTeams, ...assistantTeams];
            setTeams(combinedTeams);
          });

          unsubscribeTeams = () => {
            headCoachUnsub();
            assistantCoachUnsub();
          };
        });
      } else {
        setUser(null);
        setCoachData(null);
        setTeams([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeTeams();
    };
  }, []);

  const handleJoinTeam = async () => {
    if (!teamCodeInput.trim()) return;

    const q = query(collection(db, "teams"), where("teamCode", "==", teamCodeInput.trim()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const teamDoc = querySnapshot.docs[0];

      await updateDoc(doc(db, "teams", teamDoc.id), {
        assistantCoachId: arrayUnion(user.uid),
      });

      setIsJoinModalOpen(false);
      setTeamCodeInput("");
    } else {
      alert("Invalid team code. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <nav className="bg-gradient-to-r from-emerald-900 to-emerald-500 w-full p-4 shadow-md fixed top-0 left-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-white text-2xl font-semibold">RG PERFORMANCE</h1>
          <AuthDetails />
        </div>
      </nav>

      

      <div className="flex-grow pt-20 w-full">
        <div className="max-w-4xl w-full bg-white shadow-lg rounded-xl p-8 my-8 mx-auto">
          {loading ? (
            <div className="text-center text-gray-500">Loading coach data...</div>
          ) : coachData ? (
            <div className="text-center space-y-4">
              <div className="flex flex-col items-center">
                <h2 className="text-3xl font-semibold text-gray-800">
                  Hello Coach, {coachData.firstName} {coachData.lastName}
                </h2>
                {coachData.approved ? (
                  <p className="text-emerald-600">Your account is approved!</p>
                ) : (
                  <p className="text-red-600">Your account is awaiting approval.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">No coach data found.</div>
          )}
        </div>

        <div className="max-w-4xl w-full bg-white shadow-lg rounded-xl p-8 my-8 mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Teams</h2>
          {teams.length > 0 ? (
            <ul className="space-y-4">
              {teams.map((team) => (
                <Link key={team.id} href={`/teamPage/${team.id}`} passHref>
                  <li className="bg-gray-100 p-6 rounded-lg shadow-md hover:bg-gray-200 transition-all cursor-pointer">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {team.gender}'s {team.sport}
                    </h3>
                    <p className="text-gray-600">{team.school}</p>
                    <p className="text-gray-500">Team Code: {team.teamCode}</p>
                  </li>
                </Link>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">You haven't created any teams yet.</p>
          )}
        </div>

        {coachData?.approved && (
          <div className="flex flex-col items-center w-full mt-8 space-y-4">
            <button
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg shadow-lg hover:bg-emerald-700 transition"
              onClick={() => setIsModalOpen(true)}
            >
              Create a Team
            </button>
            <button
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg shadow-lg hover:bg-emerald-700 transition"
              onClick={() => setIsJoinModalOpen(true)}
            >
              Join a Team as Assistant Coach
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)}>
        <div className="p-4 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Join a Team</h2>
          <input
            type="text"
            placeholder="Enter Team Code"
            value={teamCodeInput}
            onChange={(e) => setTeamCodeInput(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg outline-emerald-500"
          />
          <button
            onClick={handleJoinTeam}
            className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
          >
            Join Team
          </button>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CreateTeam
          onClose={() => setIsModalOpen(false)}
          onTeamCreated={() => {
            
          }}
        />
      </Modal>
    </div>
  );
}




