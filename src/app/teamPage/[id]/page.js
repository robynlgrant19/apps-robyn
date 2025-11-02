"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../firebase";
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import Dropbox from "../../components/dropzone";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement } from 'chart.js';
//import AuthDetails from "../../components/auth/authDetails";
import CalendarView from "../../components/calendarView";
import { teamColorClasses } from "../../teamColors";




ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement);

export default function TeamPage() {
  const { id } = useParams();
  const [teamData, setTeamData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [teamColors, setTeamColors] = useState(null);
  const [hasHudl, setHasHudl] = useState(true);
  const [activeTab, setActiveTab] = useState("home");


  
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * hockeySayings.length);
    setMessage(hockeySayings[randomIndex]);
  }, []);

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
        setTeamColors(teamColorClasses[team.school] || {});

        console.log("Team School:", team.school);
        console.log("Colors found:", teamColorClasses[team.school]);
        console.log("Team data:", team);

        setHasHudl(team.hasHudl ?? true);

        if (team.players && team.players.length > 0) {
  const playerPromises = team.players.map(async (playerId) => {
    const playerRef = doc(db, "players", playerId);
    const playerSnap = await getDoc(playerRef);
    return playerSnap.exists() ? { id: playerSnap.id, ...playerSnap.data() } : null;
  });

  const playersData = (await Promise.all(playerPromises)).filter(p => p !== null);
  setPlayers(playersData);
  console.log("Fetched players (from team array):", id, playersData);
} else {
  const playersQuery = query(
    collection(db, "players"),
    where("teamId", "==", id)
  );
  const playersSnap = await getDocs(playersQuery);
  const playersData = playersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  setPlayers(playersData);
  console.log("Fetched players (by teamId):", id, playersData);
}



        const gamesQuery = query(
          collection(db, "games"), 
          where("teamId", "==", id)
        );
        const querySnapshot = await getDocs(gamesQuery);
        const gamesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGames(gamesData);
      }

      setTimeout(() => {
        setLoading(false);
      }, 1000);
      
    };

    fetchTeamData();
  }, [id]);

  

  
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  
  const deleteTeam = async () => {
    try {
      
      const teamRef = doc(db, "teams", id);
      await deleteDoc(teamRef);

      
      router.push("/pages/homeCoach");
    } catch (error) {
      console.error("Error deleting team: ", error);
    }
  };


  const toggleDeleteModal = () => {
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <nav className={`w-full p-4 shadow-md fixed top-0 left-0 z-50 ${teamColors?.gradient}`}>
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
      
      <div className="max-w-6xl mx-auto mt-40">
  
        
        
  
      {loading ? (
  <div className="flex flex-col items-center justify-center h-screen text-gray-800">
    <img
  src="/puck.png"
  alt="Loading..."
  className="w-16 h-16 mb-6 object-contain animate-spin"
/>
<h2 className="text-2xl font-semibold">{message}</h2>

  </div>
) : teamData ? (


          <>
            {/* Team Header */}
            <div className={`bg-white border-l-8 ${teamColors?.text} rounded-xl shadow-lg ring-1 ring-gray-200 p-6 mb-10`}>
              <h1 className="text-3xl  font-extrabold text-gray-900 tracking-wide">
                {teamData.gender}'s {teamData.sport} - {teamData.school}
              </h1>
              <p className="text-lg sm:text-xl text-gray-700 mt-3 font-medium">
                Team Code: <span className={`${teamColors?.text} font-semibold`}>{teamData.teamCode}</span>
              </p>
            </div>

           {/* Top Menu Bar */}
<div className="flex justify-center space-x-10 border-b border-gray-200 mb-10">
  {[
    { key: "home", label: "Home" },
    { key: "addGame", label: "Add Game" },
    { key: "yearOverview", label: "Year Overview" },
  ].map((tab) => (
    <button
      key={tab.key}
      onClick={() => setActiveTab(tab.key)}
      className={`
        relative text-lg font-bold uppercase tracking-wide pb-2 transition-all duration-200
        ${activeTab === tab.key ? `${teamColors?.text}` : "text-gray-500 hover:text-gray-700"}
      `}
    >
      {tab.label}
      <span
        className={`
          absolute bottom-0 left-0 w-full h-[3px] rounded-full transition-all duration-200
          ${activeTab === tab.key ? `${teamColors?.bg}` : "bg-transparent"}
        `}
      ></span>
    </button>
  ))}
</div>



  
           {/* --- Active Tab Content --- */}
{activeTab === "home" && (
  <>
    {/* Players Section */}
    <section className="mb-12">
      <div className={`bg-white border-l-8 ${teamColors?.text} rounded-xl shadow-lg ring-1 ring-gray-200 p-6 mb-10`}>
        <h2 className={`text-3xl font-extrabold tracking-wide uppercase text-gray-900 mb-6 border-b-4 ${teamColors?.border} inline-block pb-2 shadow-sm`}>
          Players
        </h2>

        {/* Forwards */}
        <div className="mb-10">
          <p className="text-lg font-semibold text-gray-700 mb-4">Forwards</p>
          {renderPlayersByPosition('F')}
        </div>

        {/* Defense */}
        <div>
          <p className="text-lg font-semibold text-gray-700 mb-4">Defense</p>
          {renderPlayersByPosition('D')}
        </div>
      </div>
    </section>

    {/* Games Section */}
    <section className="mb-12">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-l-md ${
            viewMode === 'list' ? `${teamColors?.bg} text-white` : 'bg-gray-200 text-gray-700'
          } ${teamColors?.hoverBg} transition`}
        >
          List View
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`px-4 py-2 rounded-r-md ${
            viewMode === 'calendar' ? `${teamColors?.bg} text-white` : 'bg-gray-200 text-gray-700'
          } ${teamColors?.hoverBg} transition`}
        >
          Calendar View
        </button>
      </div>

      <div className={`bg-white border-l-8 ${teamColors?.text} rounded-xl shadow-lg ring-1 ring-gray-200 p-6 mb-10`}>
        <h2 className={`text-3xl font-extrabold tracking-wide uppercase text-gray-900 mb-6 border-b-4 ${teamColors?.border} inline-block pb-2 shadow-sm`}>
          Games
        </h2>

        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {games
              .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate))
              .map((game) => {
                const isWin = game.teamScore > game.opponentScore;
                const isLoss = game.teamScore < game.opponentScore;
                const resultClass = isWin
                  ? 'text-emerald-800'
                  : isLoss
                  ? 'text-red-500'
                  : 'text-gray-500';

                return (
                  <Link key={game.id} href={`/gameProfiles/${game.id}`}>
                    <div className="bg-gray-50 p-5 rounded-xl shadow hover:shadow-lg transition cursor-pointer">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {game.location === 'Away' ? '@' : 'vs'} {game.opponent}
                        </h3>
                        <span className={`text-xl font-impact ${resultClass}`}>
                          {game.teamScore} - {game.opponentScore}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{game.gameDate}</p>
                    </div>
                  </Link>
                );
              })}
          </div>
        ) : (
          <CalendarView games={games} />
        )}
      </div>
      <div className="flex flex-col items-center gap-4 mb-12">

        {/* Delete Button below */}
        <button
          onClick={toggleDeleteModal}
          className="mt-2 text-red-600 text-sm hover:text-red-700 transition"
        >
          Delete Team
        </button>
      </div>
    </section>
  </>
)}

{activeTab === "addGame" && (
  <div className="bg-white rounded-xl shadow-lg ring-1 ring-gray-200 p-8 text-center">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload or Enter Game Stats</h2>
    {hasHudl ? (
      <Dropbox />
    ) : (
      <button
        onClick={() => router.push(`/manualEntry/${id}`)}
        className={`mt-6 ${teamColors?.bg} text-white px-6 py-3 rounded-md ${teamColors?.hoverBg} w-full font-semibold`}
      >
        Enter Live Stats
      </button>
    )}
  </div>
)}

{activeTab === "yearOverview" && (
  <div className="bg-white rounded-xl shadow-lg ring-1 ring-gray-200 p-8 text-center">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Year Overview</h2>
    <p className="text-gray-600 mb-4">Here you can display team-wide season stats, charts, and summaries.</p>
    <button
      onClick={() => router.push(`/yearStats/${id}`)}
      className={`mt-6 ${teamColors?.bg} text-white px-6 py-3 rounded-md ${teamColors?.hoverBg} w-full font-semibold`}
    >
      Open Full Year Overview
    </button>
  </div>
)}

  
            {/* Upload Game Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                <div className="relative bg-white p-8 rounded-lg shadow-lg w-96 max-w-full">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Upload New Game</h3>
                  
                  {/* dropbox or live stat */}
                  
                                  {hasHudl ? (
                  <button
                        onClick={toggleModal}
                        className="..."
                  >
                        
                        <Dropbox />
                  </button>
                    ) : (
                  <button
                    onClick={() => router.push(`/manualEntry/${id}`)}
                    className={`mt-6 ${teamColors?.bg} text-white px-6 py-3 rounded-md ${teamColors?.hoverBg} w-full font-semibold`}
                  >
                    Enter Live Stats
                  </button>
                )}


                  <button
                    onClick={toggleModal}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl"
                  >
                    ✖
                  </button>
                  {/*<button
                    onClick={toggleModal}
                    className={`mt-6 ${teamColors?.bg} text-white px-6 py-3 rounded-md ${teamColors?.hoverBg} w-full font-semibold`}
                  >
                    Enter
                  </button>*/}
                </div>
              </div>
            )}
  
            {/* Delete Modal */}
            {isDeleteModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                <div className="bg-white p-8 rounded-lg shadow-lg w-96 max-w-full">
                  <h3 className="text-2xl text-center font-semibold text-gray-800 mb-6">
                    Are you sure you want to delete this team?
                  </h3>
                  <div className="flex gap-4">
                    <button
                      onClick={deleteTeam}
                      className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 w-full font-semibold"
                    >
                      Yes
                    </button>
                    <button
                      onClick={toggleDeleteModal}
                      className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 w-full font-semibold"
                    >
                      No thanks
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-red-500 text-center text-xl">Team not found.</p>
        )}
      </div>
    </div>
  );
  
  
  function renderPlayersByPosition(position) {
    
    const filtered = players.filter(player => {
  if (!player.position) return false;
  const pos = player.position.toUpperCase();
  if (position === 'F') return pos.startsWith('F'); 
  if (position === 'D') return pos.startsWith('D'); 
  return false;
});


    
    if (filtered.length === 0) {
      return (
        <p className="text-gray-500">
          No {position === 'F' ? 'forwards' : 'defense'} found.
        </p>
      );
    }
  
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filtered.map(player => (
          <Link key={player.id} href={`/playerProfile/${id}/${player.id}`}>
            <div className="bg-gray-50 p-5 rounded-xl shadow hover:shadow-lg transition cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {player.firstName} {player.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Position: {position === 'F' ? 'Forward' : 'Defense'}
                  </p>
                </div>
                <span className={`text-3xl font-impact ${teamColors?.text}`}>
                  #{player.jerseyNumber}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }
  
}











