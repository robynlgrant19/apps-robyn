"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../firebase";
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import Dropbox from "../../components/dropzone";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement);

export default function TeamPage() {
  const { id } = useParams();
  const router = useRouter();
  const [teamData, setTeamData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);


  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!id) return;

      const teamRef = doc(db, "teams", id);
      const teamSnap = await getDoc(teamRef);

      if (teamSnap.exists()) {
        const team = teamSnap.data();
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

        const gamesQuery = query(
          collection(db, "games"), 
          where("teamId", "==", id)
        );
        const querySnapshot = await getDocs(gamesQuery);
        const gamesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGames(gamesData);
      }

      setLoading(false);
    };

    fetchTeamData();
  }, [id]);

  

  // Toggle Modal
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Delete Team
  const deleteTeam = async () => {
    try {
      // Delete associated players (optional, depending on your setup)
      const teamRef = doc(db, "teams", id);
      await deleteDoc(teamRef);

      // Redirect to the home page or any other appropriate page after deletion
      router.push("/pages/homeCoach");
    } catch (error) {
      console.error("Error deleting team: ", error);
    }
  };

  // Toggle Delete Confirmation Modal
  const toggleDeleteModal = () => {
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  
  return (

    
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      {/* Back Button */}
      <button
        className="text-emerald-600 text-2xl font-impact rounded-md mb-6 hover:text-emerald-800 transition"
        onClick={() => router.push(`/pages/homeCoach`)}
      >
        ⬅
      </button>

      {loading ? (
        <p className="text-gray-500 text-lg font-medium">Loading team data...</p>
      ) : teamData ? (
        <div className="bg-white p-8 rounded-xl shadow-xl">
          <h1 className="text-3xl font-impact text-gray-800">{teamData.gender}'s {teamData.sport} - {teamData.school}</h1>
          <p className="text-xl text-gray-600 mt-4">Team Code: {teamData.teamCode}</p>



          
          <section className="mt-8">
            <h2 className="text-2xl font-impact text-gray-800 mb-4">Players</h2>

            {/* Forwards Section */}
            <p className="text-lg font-semibold text-gray-700">Forwards</p>
            {players.filter(player => {
              let position = "Unknown";
              games.forEach(game => {
                if (game.stats && Array.isArray(game.stats)) {
                  const playerStat = game.stats.find(stat => stat["Shirt number"] === player.jerseyNumber);
                  if (playerStat && playerStat.Position === 'F') {
                    position = 'F';
                  }
                }
              });
              return position === 'F';
            }).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
                {players.filter(player => {
                  let position = "Unknown";
                  games.forEach(game => {
                    if (game.stats && Array.isArray(game.stats)) {
                      const playerStat = game.stats.find(stat => stat["Shirt number"] === player.jerseyNumber);
                      if (playerStat && playerStat.Position === 'F') {
                        position = 'F';
                      }
                    }
                  });
                  return position === 'F';
                }).map(player => {
                  return (
                    <Link key={player.id} href={`/playerProfile/${id}/${player.id}`}>
                      <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col space-y-2">
                            <h3 className="font-semibold text-lg text-gray-800">{player.firstName} {player.lastName}</h3>
                            <p className="text-sm text-gray-600">Position: Forward</p>
                          </div>
                          <div className="text-right text-3xl font-impact text-emerald-800">
                            #{player.jerseyNumber}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No forwards found for this team.</p>
            )}

            {/* Defense Section */}
            <p className="text-lg font-semibold text-gray-700 mt-6">Defense</p>
            {players.filter(player => {
              let position = "Unknown";
              games.forEach(game => {
                if (game.stats && Array.isArray(game.stats)) {
                  const playerStat = game.stats.find(stat => stat["Shirt number"] === player.jerseyNumber);
                  if (playerStat && playerStat.Position === 'D') {
                    position = 'D';
                  }
                }
              });
              return position === 'D';
            }).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
                {players.filter(player => {
                  let position = "Unknown";
                  games.forEach(game => {
                    if (game.stats && Array.isArray(game.stats)) {
                      const playerStat = game.stats.find(stat => stat["Shirt number"] === player.jerseyNumber);
                      if (playerStat && playerStat.Position === 'D') {
                        position = 'D';
                      }
                    }
                  });
                  return position === 'D';
                }).map(player => {
                  return (
                    <Link key={player.id} href={`/playerProfile/${id}/${player.id}`}>
                      <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col space-y-2">
                            <h3 className="font-semibold text-lg text-gray-800">{player.firstName} {player.lastName}</h3>
                            <p className="text-sm text-gray-600">Position: Defense</p>
                          </div>
                          <div className="text-right text-3xl font-impact text-emerald-800">
                            #{player.jerseyNumber}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No defense players found for this team.</p>
            )}
          </section>








          <section className="mt-8">
  <h2 className="text-2xl font-impact text-gray-800 mb-4">Games</h2>
  {games.length > 0 ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mt-6">
      {games
        .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate))
        .map(game => {
          let result = '';
          let resultClass = 'text-gray-500'; // Default for Tie
          if (game.teamScore > game.opponentScore) {
            result = 'Win';
            resultClass = 'text-emerald-800'; // Green for Win
          } else if (game.teamScore < game.opponentScore) {
            result = 'Loss';
            resultClass = 'text-red-500'; // Red for Loss
          } else if (game.teamScore === game.opponentScore) {
            result = 'Tie';
            resultClass = 'text-gray-500'; // Gray for Tie
          }

          return (
            <Link key={game.id} href={`/gameProfiles/${game.id}`}>
              <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer relative">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg">
                      <span className="font-impact text-emerald-800">
                        {game.location === "Away" ? `@  ` : `vs `}
                      </span>
                      <span className="text-xl font-semibold text-gray-900 ml-2">
                        {game.opponent}
                      </span>
                    </h3>
                    <div className="flex items-center ml-auto">
                      
                    <div className={`text-3xl font-impact ${resultClass} ml-auto p-2 rounded-md`}>
                      {game.teamScore} - {game.opponentScore}
                    </div>
                    
                    
                     </div>
                  </div>
                  <p className="text-sm">{game.gameDate} </p>

                  {/*}
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-semibold text-xl ${resultClass}`}>{result}</span>
                  </div>*/}
                </div>
              </div>
            </Link>
          );
        })}
    </div>
  ) : (
    <p className="text-gray-500">No games found for this team.</p>
  )}
</section>













          {/* Add Game Button */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleModal}
              className="bg-emerald-500 text-white px-6 py-3 rounded-md hover:bg-emerald-600 transition-all duration-200 shadow-md transform hover:scale-105"
            >
              Add New Game
            </button>
          </div>

          {/* Delete Team Button */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleDeleteModal}
              className="text-red-600 text-sm hover:text-red-700 transition-all duration-200"
            >
              Delete Team
            </button>
          </div>
        </div>
      ) : (
        <p className="text-red-500 text-xl">Team not found.</p>
      )}

      {/* Modal */}
{isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
    <div className="bg-white p-8 rounded-lg shadow-lg w-96 max-w-full transform transition-all duration-300 scale-95 hover:scale-100">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Upload New Game</h3>
      <Dropbox teamId={id} />
      <button
        onClick={toggleModal}
        className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl focus:outline-none"
      >
        ✖
      </button>
      <button
        onClick={toggleModal}
        className="mt-6 bg-emerald-600 text-white px-6 py-3 rounded-md hover:bg-emerald-700 transition-all duration-200 w-full text-lg font-semibold"
      >
        Enter
      </button>
    </div>
  </div>
)}

{/* Delete Confirmation Modal */}
{isDeleteModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
    <div className="bg-white p-8 rounded-lg shadow-lg w-96 max-w-full transform transition-all duration-300 scale-95 hover:scale-100">
      <h3 className="text-2xl text-center font-semibold text-gray-800 mb-6">Are you sure you want to delete this team?</h3>
      <div className="flex justify-between gap-4">
        <button
          onClick={deleteTeam}
          className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-all duration-200 w-full text-lg font-semibold"
        >
          Yes
        </button>
        <button
          onClick={toggleDeleteModal}
          className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 transition-all duration-200 w-full text-lg font-semibold"
        >
          No thanks
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}











