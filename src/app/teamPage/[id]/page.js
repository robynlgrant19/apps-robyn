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
  console.log("TeamPage id:", id);
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
  const playerImages = {
  "Robyn Grant": "/playerPhotos/robyngrant.jpg",
  "Maci Peller": "/playerPhotos/macipeller.JPG",
  "Jamie Steinmetz": "/playerPhotos/jamiesteinmetz.JPG",
  "Jacqueline Martin": "/playerPhotos/jacquelinemartin.JPG",
  "Laura Castronova": "/playerPhotos/lauracastronova.JPG",
  "Emma Lemery": "/playerPhotos/emmalemery.JPG", 
  "Gracie Menicci": "/playerPhotos/graciemenicci.JPG", 
  "Emily Gerrie": "/playerPhotos/emilygerrie.JPG", 
  "Katie Porrello": "/playerPhotos/katieporrello.JPG", 

  };
  const defaultPhoto = "/defaultProfile.png";
  const [showToast, setShowToast] = useState(false);



  
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

  const refreshGames = async () => {
  if (!id) return;

  const gamesQuery = query(collection(db, "games"), where("teamId", "==", id));
  const querySnapshot = await getDocs(gamesQuery);
  const gamesData = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  setGames(gamesData);

  // Optionally recompute record (wins/losses/ties)
  const wins = gamesData.filter((g) => g.teamScore > g.opponentScore).length;
  const losses = gamesData.filter((g) => g.teamScore < g.opponentScore).length;
  const ties = gamesData.filter((g) => g.teamScore === g.opponentScore).length;
  setTeamData((prev) => ({
    ...prev,
    record: { wins, losses, ties },
  }));

  console.log("✅ Games refreshed after upload:", gamesData);
};

  

  
  

  
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

        const wins = gamesData.filter(g=>g.teamScore > g.opponentScore).length;
        const losses = gamesData.filter(g=>g.teamScore < g.opponentScore).length;
        const ties = gamesData.filter(g=>g.teamScore === g.opponentScore).length;
        setTeamData({...team, record: { wins, losses, ties }});
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

{showToast && (
  <div className="fixed top-20 z-50 flex justify-center w-full">
    <div className="bg-emerald-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg animate-fade-in-down">
      ✅ Game added successfully!
    </div>
  </div>
)}

      
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
          <div
  className={`relative w-full bg-white border-l-8 ${teamColors?.text} rounded-xl shadow-md ring-1 ring-gray-200 py-4 mb-8`}
>
  <div className="flex items-center justify-between w-full px-6 lg:px-12 gap-6">
    
    {/* LEFT SIDE: Logo + Info */}
    <div className="flex items-center gap-6 min-w-0 flex-grow">
      {/* Logo */}
      <img
        src={`/teamLogos/${teamData.school.toLowerCase().replace(/\s+/g, '')}.jpg`}
        alt={`${teamData.school} logo`}
        className="w-24 h-24 object-contain flex-shrink-0"
        onError={(e) => (e.currentTarget.src = '/teamLogos/default.jpg')}
      />

      {/* Info */}
      <div className="flex flex-col min-w-0 leading-tight w-full">
        <h1 className="text-3xl font-extrabold text-gray-900 truncate">
          {teamData.gender}'s {teamData.sport}
        </h1>

        <h2 className="text-2xl font-bold text-gray-800 break-words">
          {teamData.school}
        </h2>

        <p className="text-lg text-gray-700 font-medium mt-1">
          Team Code:{' '}
          <span className={`${teamColors?.text} font-semibold`}>
            {teamData.teamCode}
          </span>
        </p>
      </div>
    </div>

    {/* RIGHT SIDE: Record */}
    {teamData.record && (
      <div className="text-right flex-shrink-0">
        <p className="text-5xl font-impact text-gray-900 leading-none">
          <span className={`${teamColors?.text}`}>
            {teamData.record.wins}-{teamData.record.losses}-{teamData.record.ties}
          </span>
        </p>
      </div>
    )}
  </div>
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
  {/* View Mode Buttons */}
  <div className="flex justify-end mb-4">
    <button
      onClick={() => setViewMode("list")}
      className={`px-4 py-2 rounded-l-md ${
        viewMode === "list"
          ? `${teamColors?.bg} text-white`
          : "bg-gray-200 text-gray-700"
      } ${teamColors?.hoverBg} transition`}
    >
      List View
    </button>
    <button
      onClick={() => setViewMode("calendar")}
      className={`px-4 py-2 rounded-r-md ${
        viewMode === "calendar"
          ? `${teamColors?.bg} text-white`
          : "bg-gray-200 text-gray-700"
      } ${teamColors?.hoverBg} transition`}
    >
      Calendar View
    </button>
  </div>

  {/* Games Section */}
  <div
    className={`bg-white border-l-8 ${teamColors?.text} rounded-xl shadow-lg ring-1 ring-gray-200 p-6 mb-10`}
  >
    <h2
      className={`text-3xl font-extrabold tracking-wide uppercase text-gray-900 mb-6 border-b-4 ${teamColors?.border} inline-block pb-2 shadow-sm`}
    >
      Games
    </h2>

    {viewMode === "list" ? (
      (() => {
        // Group games by month/year
        const sortedGames = [...games].sort(
          (a, b) => new Date(a.gameDate) - new Date(b.gameDate)
        );
        const grouped = sortedGames.reduce((acc, game) => {
          const date = new Date(game.gameDate);
          const monthYear = date.toLocaleString("default", {
            month: "long",
            year: "numeric",
          });
          if (!acc[monthYear]) acc[monthYear] = [];
          acc[monthYear].push(game);
          return acc;
        }, {});

        return Object.entries(grouped).map(([month, monthGames]) => (
          <div key={month} className="mb-10">
            {/* --- Month Title --- */}
            <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-1">
              {month}
            </h3>

            <div className="space-y-4">
              {monthGames.map((game) => {
                const isWin = game.teamScore > game.opponentScore;
                const isLoss = game.teamScore < game.opponentScore;
                const isTie = game.teamScore === game.opponentScore;

                const resultColor = isWin
                  ? "text-emerald-700"
                  : isLoss
                  ? "text-red-600"
                  : "text-gray-600";

                const resultLabel = isWin ? "W," : isLoss ? "L," : "T,";

                const logoPath = `/teamLogos/${game.opponent
                  ?.toLowerCase()
                  .replace(/\s+/g, "")}.jpg`;

                return (
                  <Link key={game.id} href={`/gameProfiles/${game.id}`}>
                    <div className="bg-white flex items-center justify-between rounded-xl shadow-sm border border-gray-200 p-4 transition hover:shadow-md hover:bg-gray-100 cursor-pointer">
                      {/* LEFT: Opponent Logo + Date */}
                      <div className="flex items-center w-1/3">
                        <img
                          src={logoPath}
                          alt={`${game.opponent} logo`}
                          onError={(e) =>
                            (e.currentTarget.src = "/teamLogos/default.jpg")
                          }
                          className="w-12 h-12 sm:w-14 sm:h-14 object-contain mr-3"
                        />
                        <div>
                          <p className="text-sm text-gray-500">
                            {new Date(
                              game.gameDate
                            ).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(game.gameDate).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* CENTER: Opponent Info */}
                      <div className="flex-1 text-center">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {game.location === "Away" ? "@" : "vs"}{" "}
                          {game.opponent}
                        </h3>
                      </div>

                      {/* RIGHT: Result */}
                      <div className="text-right w-1/4">
                        <p
                          className={`font-impact text-lg sm:text-xl ${resultColor}`}
                        >
                          <span className="font-bold mr-1">{resultLabel}</span>
                          {game.teamScore}-{game.opponentScore}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ));
      })()
    ) : (
      <CalendarView games={games} />
    )}
  </div>

{/*

  <div className="flex flex-col items-center gap-4 mb-12">
    <button
      onClick={toggleDeleteModal}
      className="mt-2 text-red-600 text-sm hover:text-red-700 transition"
    >
      Delete Team
    </button>
  </div>
*/}
</section>









  </>
)}

{activeTab === "addGame" && (
  <div className="bg-white rounded-xl shadow-lg ring-1 ring-gray-200 p-8 text-center">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload or Enter Game Stats</h2>
    {hasHudl ? (
      <Dropbox
  teamId={teamData?.id || id}
  onGameUploaded={() => {
    refreshGames();
    setShowToast(true);      // ✅ show toast
    setTimeout(() => setShowToast(false), 3000);
    setActiveTab("home");    // optional — switch back to home
  }}
/>

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
      <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        Upload New Game
      </h3>

      {/* ✅ Upload Form */}
      {hasHudl ? (
        <Dropbox
  teamId={teamData?.id || id}
  onGameUploaded={() => {
    refreshGames();
    setShowToast(true);      // ✅ show toast
    setIsModalOpen(false);   // close modal
    setTimeout(() => setShowToast(false), 3000); // hide toast after 3s
  }}
/>




      ) : (
        <button
          onClick={() => router.push(`/manualEntry/${id}`)}
          className={`mt-6 ${teamColors?.bg} text-white px-6 py-3 rounded-md ${teamColors?.hoverBg} w-full font-semibold`}
        >
          Enter Live Stats
        </button>
      )}

      {/* Close Button */}
      <button
        onClick={toggleModal}
        className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl"
      >
        ✖
      </button>
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
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 p-4">
    {filtered.map((player) => {
      // build name and check if it’s in the manual map
      const fullName = `${player.firstName} ${player.lastName}`;
      const defaultPhoto = "/playerPhotos/defaultProfile.png";
      const manualPhoto = playerImages[fullName]; // e.g. “Robyn Grant”: “/playerPhotos/robyngrant.jpg”

      // if no manual photo, try the auto-generated file (e.g. /playerPhotos/robyngrant.jpg)
      const fallbackPhoto = `/playerPhotos/${player.firstName}${player.lastName}`.toLowerCase() + ".jpg";

      // prioritize manual → fallback → default
      const imagePath = manualPhoto || fallbackPhoto;

      return (
        <Link key={player.id} href={`/playerProfile/${id}/${player.id}`}>
          <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 hover:border-emerald-400">
            <div className="relative">
              {/* Player Photo */}
              <img
                src={imagePath}
                alt={`${player.firstName} ${player.lastName}`}
                onError={(e) => {
                  // if local image not found, fallback to default
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultPhoto;
                }}
                className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105 bg-gray-100"
              />

              {/* Jersey Number Overlay */}
              <div className="absolute bottom-3 right-3 bg-emerald-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                #{player.jerseyNumber}
              </div>
            </div>

            {/* Player Info */}
            <div className="p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
                {player.firstName} {player.lastName}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {position === "F" ? "Forward" : "Defense"}
              </p>
            </div>
          </div>
        </Link>
      );
    })}
  </div>
);



  }
  
}











