'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../../../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Radar, Bar, Line, Pie, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
} from 'chart.js';
import { teamColorClasses } from '../../../../teamColors';
import { redirect } from 'next/navigation';


ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement
);

const convertTimeToSeconds = (timeStr) => {
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return minutes * 60 + seconds;
};

const convertSecondsToTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function PlayerProfile() {
  const { teamId, playerId } = useParams();
  const [player, setPlayer] = useState(null);
  const [cumulativeStats, setCumulativeStats] = useState({
    Points: 0,
    Goals: 0,
    Assists: 0,
    '+/-': 0,
  });
  const [gameStats, setGamesStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);
  const router = useRouter();
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [teamColors, setTeamColors] = useState(null);

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
    'Blocking a shot...',
  ];
  const [loadingMessage, setLoadingMessage] = useState('');
  const [teamType, setTeamType] = useState(null);

  const playerImages = {
    'Robyn Grant': '/playerPhotos/robyngrant.jpg',
    'Maci Peller': '/playerPhotos/macipeller.JPG',
    'Jamie Steinmetz': '/playerPhotos/jamiesteinmetz.JPG',
    'Jacqueline Martin': '/playerPhotos/jacquelinemartin.JPG',
    'Laura Castronova': '/playerPhotos/lauracastronova.JPG',
    'Emma Lemery': '/playerPhotos/emmalemery.JPG',
    'Gracie Menicci': '/playerPhotos/graciemenicci.JPG',
    'Emily Gerrie': '/playerPhotos/emilygerrie.JPG',
    'Katie Porrello': '/playerPhotos/katieporrello.JPG',
    'Caeli Reed': '/playerPhotos/caelireed.JPG',
    'Morgan Cunningham': '/playerPhotos/morgancunningham.JPG',
    'Adriana Dooley': '/playerPhotos/adrianadooley.JPG',
    'Mylee Serkis': '/playerPhotos/myleeserkis.JPG',
    'Teagan Wilson': '/playerPhotos/teaganwilson.JPG',
    'Alanna Hoag': '/playerPhotos/alannahoag.JPG',
    'Cera Luciani': '/playerPhotos/ceraluciani.JPG',
    'Madelynn Wiggins': '/playerPhotos/madelynnwiggins.JPG',
    'Erika Johnson': '/playerPhotos/erikajohnson.JPG',
    'Amelia Spencer': '/playerPhotos/ameliaspencer.JPG',
    'Sophia Cuozzo': '/playerPhotos/sophiacuozzo.JPG',
    'Grace Bonnell': '/playerPhotos/gracebonnell.JPG',
    'Juliet Rutigliano': '/playerPhotos/julietrutigliano.JPG',
    'Olivia Robbins': '/playerPhotos/oliviarobbins.JPG',
    'Annabel Prochilo': '/playerPhotos/annabelprochilo.JPG',
    'Lisi Palmer': '/playerPhotos/lisipalmer.JPG',
    'Jorja Moore': '/playerPhotos/jorjamoore.JPG',
    'Karlee Lehner': '/playerPhotos/karleelehner.JPG',
    'Claire Delaney Deis': '/playerPhotos/clairedelaneydeis.JPG',
    'Lilli Warnock': '/playerPhotos/lilliwarnock.JPG',
  };

  
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * hockeySayings.length);
    setLoadingMessage(hockeySayings[randomIndex]);
  }, []);

  useEffect(() => {
    if (!playerId) return;

    const fetchPlayer = async () => {
      try {
        const playerRef = doc(db, 'players', playerId);
        const playerSnap = await getDoc(playerRef);

        if (playerSnap.exists()) {
          setPlayer(playerSnap.data());
        } else {
          console.log('Player not found');
        }
      } catch (error) {
        console.error('Error fetching player data:', error);
      }
    };

    fetchPlayer();
  }, [playerId]);

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
          console.log('Resolved school:', schoolName);
          console.log('Team colors:', teamColorClasses[schoolName]);
        }
      } catch (error) {
        console.error('Error fetching team colors:', error);
      }
    };

    fetchTeamColors();
  }, [teamId]);

  useEffect(() => {
    const fetchCumulativeStats = async () => {
      try {
        if (!player || !player.jerseyNumber) return;

        const jerseyNumberString = String(player.jerseyNumber);
        const gamesRef = collection(db, 'games');
        const querySnapshot = await getDocs(gamesRef);

        const teamGames = querySnapshot.docs.filter(
          (doc) => doc.data().teamId === teamId
        );

        let totalPoints = 0;
        let totalGoals = 0;
        let totalAssists = 0;
        let totalPlusMinus = 0;
        let totalFaceoffsWon = 0;
        let totalFaceoffs = 0;
        let totalShots = 0;
        let totalShotsOnGoal = 0;
        let totalHits = 0;
        let totalBlockedShots = 0;
        let totalPowerPlayShots = 0;
        let totalShortHandedShots = 0;
        let totalPenaltiesDrawn = 0;
        let totalPenaltyTime = 0;
        let gamesPlayed = 0;

        const gameStats = [];

        teamGames.forEach((docSnap) => {
          const gameData = docSnap.data();
          const playerStats = gameData.stats?.filter(
            (stat) => stat['Shirt number'] === jerseyNumberString
          );

          if (playerStats && playerStats.length > 0) {
            gamesPlayed += 1;
          }

          playerStats?.forEach((stat) => {
            console.log('Player Stat:', stat);

            const pointsVal =
              stat.Points === '-' ? 0 : Number(stat.Points || 0);
            const goalsVal =
              stat.Goals === '-' ? 0 : Number(stat.Goals || 0);
            const assistsVal =
              stat.Assists === '-' ? 0 : Number(stat.Assists || 0);
            const plusMinusVal =
              stat['+/-'] === '-' ? 0 : Number(stat['+/-'] || 0);
            const faceoffsWonVal =
              stat['Faceoffs won'] === '-' ? 0 : Number(stat['Faceoffs won'] || 0);
            const faceoffsVal =
              stat.Faceoffs === '-' ? 0 : Number(stat.Faceoffs || 0);
            const shotsVal =
              stat.Shots === '-' ? 0 : Number(stat.Shots || 0);
            const shotsOnGoalVal =
              stat['Shots on goal'] === '-'
                ? 0
                : Number(stat['Shots on goal'] || 0);
            const hitsVal =
              stat.Hits === '-' ? 0 : Number(stat.Hits || 0);
            const blockedShotsVal =
              stat['Blocked shots'] === '-'
                ? 0
                : Number(stat['Blocked shots'] || 0);
            const ppShotsVal =
              stat['Power play shots'] === '-'
                ? 0
                : Number(stat['Power play shots'] || 0);
            const shShotsVal =
              stat['Short-handed shots'] === '-'
                ? 0
                : Number(stat['Short-handed shots'] || 0);
            const pensDrawnVal =
              stat['Penalties drawn'] === '-'
                ? 0
                : Number(stat['Penalties drawn'] || 0);
            const shiftsVal =
              stat['All shifts'] === '-' ? 0 : Number(stat['All shifts'] || 0);

            totalPoints += pointsVal;
            totalGoals += goalsVal;
            totalAssists += assistsVal;
            totalPlusMinus += plusMinusVal;
            totalFaceoffsWon += faceoffsWonVal;
            totalFaceoffs += faceoffsVal;
            totalShots += shotsVal;
            totalShotsOnGoal += shotsOnGoalVal;
            totalHits += hitsVal;
            totalBlockedShots += blockedShotsVal;
            totalPowerPlayShots += ppShotsVal;
            totalShortHandedShots += shShotsVal;
            totalPenaltiesDrawn += pensDrawnVal;

            const timeOnIceInSeconds =
              stat['Time on ice'] === '-'
                ? 0
                : convertTimeToSeconds(stat['Time on ice']);

            const averageShiftLength =
              shiftsVal > 0 ? timeOnIceInSeconds / shiftsVal : 0;

            const penaltyTimeSeconds =
              stat['Penalty time'] === '-' ||
              stat['Penalty time'] === '0' ||
              !stat['Penalty time']
                ? 0
                : convertTimeToSeconds(stat['Penalty time']);

            totalPenaltyTime += penaltyTimeSeconds;

            gameStats.push({
              game: gameData.opponent,
              opponent: gameData.opponent,
              goals: goalsVal,
              assists: assistsVal,
              timeOnIce: timeOnIceInSeconds,
              shots: shotsVal,
              shotsOnGoal: shotsOnGoalVal,
              position: stat.Position,
              location: gameData.location,
              date: gameData.gameDate,
              shifts: shiftsVal,
              shiftLength: averageShiftLength,
              faceoffs: faceoffsVal,
              faceoffsWon: faceoffsWonVal,
            });
          });
        });

        const goalPercentage =
          totalShots > 0 ? ((totalGoals / totalShots) * 100).toFixed(1) : 0;

        setCumulativeStats({
          Points: totalPoints,
          Goals: totalGoals,
          Assists: totalAssists,
          '+/-': totalPlusMinus,
          FaceoffsWon: totalFaceoffsWon,
          Faceoffs: totalFaceoffs,
          Shots: totalShots,
          ShotsOnGoal: totalShotsOnGoal,
          Hits: totalHits,
          BlockedShots: totalBlockedShots,
          PowerPlayShots: totalPowerPlayShots,
          ShortHandedShots: totalShortHandedShots,
          PenaltiesDrawn: totalPenaltiesDrawn,
          PenaltyTime: totalPenaltyTime,
          GamesPlayed: gamesPlayed,
          GoalPercentage: goalPercentage,
        });

        setGamesStats(gameStats);
        setChartsReady(false);

        // keep your 1s loading spinner, then enable charts
        setTimeout(() => {
          setLoading(false);
          setChartsReady(true);
        }, 1000);
      } catch (error) {
        console.error('Error fetching cumulative stats:', error);
      }
    };

    if (player) {
      fetchCumulativeStats();
    }
  }, [player, teamId]);

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

  if (!player) return <p>Player not found</p>;

  // sort games in chrono order
  gameStats.sort((a, b) => new Date(a.date) - new Date(b.date));

  // line chart (ice time + shifts)
  const lineData = {
    labels: gameStats.map((stat) => {
      const homeOrAway =
        stat.location === 'Away' ? `@ ${stat.opponent}` : `vs ${stat.opponent}`;
      return [homeOrAway, stat.date];
    }),
    datasets: [
      {
        label: 'Time on Ice (minutes)',
        data: gameStats.map((stat) => stat.timeOnIce / 60),
        fill: false,
        borderColor: 'rgba(34, 197, 94, 1)',
        tension: 0.1,
      },
      {
        label: 'Shifts',
        data: gameStats.map((stat) => stat.shifts),
        fill: false,
        borderColor: 'rgba(5, 45, 5, 0.73)',
        tension: 0.1,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Game',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Time (minutes)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  // bar chart for avg shift length
  const barDataForShiftLength = {
    labels: gameStats.map((stat) => {
      const homeOrAway =
        stat.location === 'Away' ? `@ ${stat.opponent}` : `vs ${stat.opponent}`;
      return [homeOrAway, stat.date];
    }),
    datasets: [
      {
        label: 'Avg Shift Length (in seconds)',
        data: gameStats.map((stat) => stat.shiftLength),
        backgroundColor: 'rgba(0, 128, 0, 0.3)',
        borderColor: 'rgba(0, 128, 0, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barOptionsForShiftLength = {
    responsive: true,
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Game',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Time (seconds)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  // pie chart for total faceoffs
  const pieData = {
    labels: ['Faceoffs Won', 'Faceoffs Lost'],
    datasets: [
      {
        label: 'Faceoffs',
        data: [
          cumulativeStats.FaceoffsWon,
          cumulativeStats.Faceoffs - cumulativeStats.FaceoffsWon,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',
          'rgba(239, 68, 68, 0.2)',
        ],
        borderColor: ['rgba(22, 163, 74, 1)', 'rgba(239, 68, 68, 0.5)'],
        borderWidth: 2,
      },
    ],
  };

  // bar chart for shots vs shots on goal
  const barDataForShots = {
    labels: gameStats.map((stat) => {
      const homeOrAway =
        stat.location === 'Away' ? `@ ${stat.opponent}` : `vs ${stat.opponent}`;
      return [homeOrAway, stat.date];
    }),
    datasets: [
      {
        label: 'Missed Shots',
        data: gameStats.map((stat) => {
          const shots = Number(stat.shots) || 0;
          const sog = Number(stat.shotsOnGoal) || 0;
          return Math.max(shots - sog, 0);
        }),
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgba(239, 68, 68, 0.5)',
        borderWidth: 1,
      },
      {
        label: 'Shots on Goal',
        data: gameStats.map((stat) => Number(stat.shotsOnGoal) || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(22, 163, 74, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barOptionsForShots = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Game',
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Shots',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          footer: (tooltipItems) => {
            const total = tooltipItems.reduce(
              (sum, item) => sum + item.parsed.y,
              0
            );
            return `Total Shots: ${total}`;
          },
        },
      },
    },
  };

  // --- Player image path logic ---
  const fullName = `${player.firstName} ${player.lastName}`;
  const defaultPhoto = '/playerPhotos/defaultProfile.png';
  const manualPhoto = playerImages?.[fullName];
  const fallbackPhoto =
    `/playerPhotos/${player.firstName}${player.lastName}`.toLowerCase() + '.JPG';
  const imagePath = manualPhoto || fallbackPhoto || defaultPhoto;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* NAVBAR */}
      <nav
        className={`w-full p-4 shadow-md fixed top-0 left-0 z-50 ${teamColors?.gradient}`}
      >
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

      {/* PAGE CONTENT */}
      <div className="max-w-5xl mx-auto mt-24">
        {/* PLAYER HEADER CARD */}
        <div
          className={`bg-white border-l-8 ${teamColors?.border} rounded-xl shadow-lg ring-1 ring-gray-200 p-6 mb-10`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-10">
            {/* LEFT: PHOTO + INFO */}
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-gray-200 shadow-md">
                <img
                  src={imagePath}
                  alt={`${player.firstName} ${player.lastName}`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultPhoto;
                  }}
                  className="w-full h-full object-cover object-top bg-gray-100"
                />
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-wide uppercase leading-snug">
                  {player.firstName} {player.lastName}
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 mt-1 font-medium">
                  {player?.position
                    ? player.position === 'F'
                      ? 'Forward'
                      : player.position === 'D'
                      ? 'Defense'
                      : player.position === 'G'
                      ? 'Goalie'
                      : player.position
                    : 'Position not available'}
                </p>
              </div>
            </div>

            {/* RIGHT: JERSEY */}
            <div className={`text-5xl sm:text-6xl font-impact ${teamColors?.text}`}>
              #{player.jerseyNumber}
            </div>
          </div>
        </div>

        {/* PLAYER SUMMARY CARD */}
        <div className="mt-6">
          <div className="bg-gradient-to-b from-gray-50 to-white rounded-3xl shadow-md border border-gray-200 p-10">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
                Season Summary
              </h2>
              <p className="text-gray-500 text-sm">
                Overview of {player.firstName}&apos;s performance so far
              </p>
            </div>

            {/* Top row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center hover:shadow-md hover:-translate-y-1 transition">
                <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-2">
                  Games Played
                </p>
                <p className="text-5xl font-extrabold text-emerald-700">
                  {cumulativeStats?.GamesPlayed ?? 0}
                </p>
              </div>
              <div className="bg-emerald-100 border border-emerald-200 rounded-2xl p-8 text-center hover:shadow-md hover:-translate-y-1 transition">
                <p className="text-sm font-medium text-emerald-800 uppercase tracking-wide mb-2">
                  Points
                </p>
                <p className="text-5xl font-extrabold text-emerald-800">
                  {cumulativeStats?.Points ?? 0}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center hover:shadow-md hover:-translate-y-1 transition">
                <p className="text-sm font-medium text-green-700 uppercase tracking-wide mb-2">
                  Goals
                </p>
                <p className="text-5xl font-extrabold text-green-700">
                  {cumulativeStats?.Goals ?? 0}
                </p>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-8 text-center hover:shadow-md hover:-translate-y-1 transition">
                <p className="text-sm font-medium text-teal-700 uppercase tracking-wide mb-2">
                  Assists
                </p>
                <p className="text-5xl font-extrabold text-teal-700">
                  {cumulativeStats?.Assists ?? 0}
                </p>
              </div>
              <div className="bg-lime-50 border border-lime-200 rounded-2xl p-8 text-center hover:shadow-md hover:-translate-y-1 transition">
                <p className="text-sm font-medium text-lime-700 uppercase tracking-wide mb-2">
                  Plus / Minus
                </p>
                <p className="text-5xl font-extrabold text-lime-700">
                  {cumulativeStats['+/-'] ?? 0}
                </p>
              </div>
            </div>

            {/* Second row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              <div className="bg-gray-100 border border-gray-200 rounded-2xl p-8 text-center hover:shadow-md hover:-translate-y-1 transition">
                <p className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-2">
                  Shots on Goal
                </p>
                <p className="text-5xl font-extrabold text-gray-800">
                  {cumulativeStats?.ShotsOnGoal ?? 0}
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center hover:shadow-md hover:-translate-y-1 transition">
                <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-2">
                  Hits
                </p>
                <p className="text-5xl font-extrabold text-emerald-700">
                  {cumulativeStats?.Hits ?? 0}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center hover:shadow-md hover:-translate-y-1 transition">
                <p className="text-sm font-medium text-green-700 uppercase tracking-wide mb-2">
                  Blocked Shots
                </p>
                <p className="text-5xl font-extrabold text-green-700">
                  {cumulativeStats?.BlockedShots ?? 0}
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center hover:shadow-md hover:-translate-y-1 transition">
                <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-2">
                  Goal %
                </p>
                <p className="text-5xl font-extrabold text-emerald-700">
                  {cumulativeStats?.GoalPercentage ?? 0}%
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {cumulativeStats.Goals} goals on {cumulativeStats.Shots} shots
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AROUND THE NET */}
        <h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">
          Around the Net
        </h2>
        <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
          {/* GAME-BY-GAME PRODUCTION SECTION (SCROLLABLE) */}
          <h2 className="text-xl font-semibold mb-4">
            Game-by-Game Production
          </h2>

          <div className="overflow-x-auto scroll-smooth w-full pb-4">
            <div className="flex flex-col gap-8 min-w-max">
              {/* MINI SPARKLINE */}
              {chartsReady && gameStats.length > 0 && (
                <div
                  className="bg-white border border-gray-200 shadow-md rounded-xl p-4 h-32"
                  style={{ width: `${gameStats.length * 150}px` }} // ~25 games
                >
                  <Line
                    data={{
                      labels: gameStats.map((_, i) => i + 1),
                      datasets: [
                        {
                          data: gameStats.map(
                            (s) => Number(s.goals) + Number(s.assists)
                          ),
                          borderColor: 'rgba(16, 185, 129, 1)',
                          backgroundColor: 'rgba(16, 185, 129, 0.18)',
                          tension: 0.35,
                          borderWidth: 2,
                          pointRadius: 3,
                          pointHoverRadius: 5,
                          fill: true,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { display: false },
                        y: { display: false, beginAtZero: true },
                      },
                    }}
                  />
                </div>
              )}

              {/* TIMELINE + CARDS */}
              <div className="relative flex gap-10 items-start">
                {/* timeline line */}
                <div className="absolute top-10 left-0 right-0 h-[3px] bg-gray-300"></div>

                {gameStats.map((stat, idx) => {
                  const goals = Number(stat.goals) || 0;
                  const assists = Number(stat.assists) || 0;
                  const points = goals + assists;

                  const bgScale =
                    points === 0
                      ? 'bg-gray-100'
                      : points === 1
                      ? 'bg-emerald-50'
                      : points === 2
                      ? 'bg-emerald-100'
                      : 'bg-emerald-200';

                  return (
                    <div
                      key={idx}
                      className="relative flex flex-col items-center w-32"
                    >
                      {/* timeline dot */}
                      <div className="w-4 h-4 rounded-full bg-gray-700 border-2 border-white shadow absolute top-7"></div>

                      {/* GAME # */}
                      <p className="text-xs text-gray-600 font-medium mt-10 mb-2">
                        Game {idx + 1}
                      </p>

                      {/* GAME CARD */}
                      <div
                        className={`w-32 h-48 rounded-2xl border border-gray-200 shadow-md 
                          flex flex-col items-center justify-between p-3 text-center 
                          hover:shadow-xl transition-all duration-200 hover:-translate-y-1
                          ${bgScale}`}
                      >
                        {/* POINTS NUMBER */}
                        <div>
                          <p className="text-3xl font-extrabold text-gray-900 leading-none">
                            {points}
                          </p>
                          <p className="text-[11px] uppercase tracking-wide text-gray-600">
                            {points === 1 ? 'Point' : 'Points'}
                          </p>
                        </div>

                        {/* G / A BADGES */}
                        <div className="flex flex-wrap gap-1 justify-center">
                          {Array.from({ length: goals }).map((_, i) => (
                           <span
                            key={`g-${i}`}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-green-700 text-white font-bold shadow-sm"
                          >
                            G
                          </span>
                          ))}

                          {Array.from({ length: assists }).map((_, i) => (
                            <span
                              key={`a-${i}`}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-green-300 text-green-900 font-bold shadow-sm"
                            >
                              A
                            </span>
                          ))}

                          {points === 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-300 text-gray-700 font-medium shadow-sm">
                              No Points
                            </span>
                          )}
                        </div>

                        {/* Opponent + Date */}
                        <div className="text-center">
                          <p className="text-xs font-semibold text-gray-800 leading-tight">
                            {stat.location === 'Away' ? '@ ' : 'vs '}
                            {stat.opponent}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {stat.date}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SHOTS CHART */}
        <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold">
            Shots vs Shots on Goal per Game
          </h2>
          <Bar data={barDataForShots} options={barOptionsForShots} />
        </div>

        {/* GOAL EFFICIENCY */}
        <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">
            Goal Efficiency (Goal %)
          </h2>

          <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
            <div className="w-52 h-52 relative">
              <Pie
                data={{
                  labels: ['Goals', 'Misses'],
                  datasets: [
                    {
                      data: [
                        cumulativeStats.Goals,
                        Math.max(
                          cumulativeStats.Shots - cumulativeStats.Goals,
                          0
                        ),
                      ],
                      backgroundColor: [
                        'rgba(16, 185, 129, 0.9)',
                        'rgba(229, 231, 235, 0.6)',
                      ],
                      borderWidth: 0,
                      cutout: '70%',
                    },
                  ],
                }}
                options={{
                  plugins: { legend: { display: false } },
                  maintainAspectRatio: false,
                }}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-extrabold text-emerald-700">
                  {cumulativeStats.GoalPercentage}%
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Goal Rate
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <p className="text-5xl font-extrabold text-emerald-700 mb-2">
                {cumulativeStats.GoalPercentage}%
              </p>
              <p className="text-gray-600 text-lg font-medium">
                Shooting Efficiency
              </p>
              <p className="text-gray-500 mt-2">
                {cumulativeStats.Goals} goals on {cumulativeStats.Shots} shots
              </p>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-4 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${cumulativeStats.GoalPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* ICE TIME */}
        <h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">
          Ice Time
        </h2>

        <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold">
            Ice Time &amp; Total Shifts per Game
          </h2>
          <Line data={lineData} options={lineOptions} />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold">Average Shift Length per Game</h2>
          <Bar data={barDataForShiftLength} options={barOptionsForShiftLength} />
        </div>

        {/* DEFENSIVE STATS */}
        <div className="mt-6">
          <h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">
            Defensive Statistics
          </h2>
          <div className="mt-6 flex gap-6">
            <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-4 flex flex-col justify-center items-center">
              <h3 className="text-xl font-semibold text-black">Total Hits</h3>
              <p className={`text-4xl font-bold ${teamColors?.text} mt-2`}>
                {cumulativeStats.Hits}
              </p>
            </div>
            <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-4 flex flex-col justify-center items-center">
              <h3 className="text-xl font-semibold text-black">
                Total Blocked Shots
              </h3>
              <p className={`text-4xl font-bold ${teamColors?.text} mt-2`}>
                {cumulativeStats.BlockedShots}
              </p>
            </div>
          </div>
        </div>

        {/* SPECIAL TEAMS */}
        <div className="mt-6">
          <h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">
            Special Teams
          </h2>
          <div className="mt-6 flex gap-6">
            <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-4 flex flex-col justify-center items-center">
              <h3 className="text-xl font-semibold text-black">
                Total Power Play Shots
              </h3>
              <p className={`text-4xl font-bold ${teamColors?.text} mt-2`}>
                {cumulativeStats.PowerPlayShots}
              </p>
            </div>
            <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-4 flex flex-col justify-center items-center">
              <h3 className="text-xl font-semibold text-black">
                Total Short Handed Shots
              </h3>
              <p className={`text-4xl font-bold ${teamColors?.text} mt-2`}>
                {cumulativeStats.ShortHandedShots}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">
            Special Teams
          </h2>
          <div className="mt-6 flex gap-6">
            <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-4 flex flex-col justify-center items-center">
              <h3 className="text-xl font-semibold text-black">
                Total Penalties Drawn
              </h3>
              <p className={`text-4xl font-bold ${teamColors?.text} mt-2`}>
                {cumulativeStats.PenaltiesDrawn}
              </p>
            </div>
            <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-4 flex flex-col justify-center items-center">
              <h3 className="text-xl font-semibold text-black">
                Total Penalty Time
              </h3>
              <p className={`text-4xl font-bold ${teamColors?.text} mt-2`}>
                {convertSecondsToTime(cumulativeStats.PenaltyTime || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* FACEOFFS */}
        <h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">
          Faceoffs
        </h2>

        <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold text-center text-black mb-1">
            Total Faceoffs:
          </h2>
          <h3
            className={`text-2xl font-bold text-center ${teamColors?.text} mb-6`}
          >
            {cumulativeStats.Faceoffs ?? 0}
          </h3>

          <div className="w-80 h-80 mx-auto flex flex-col items-center">
            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
          </div>

          <div className="mt-6 text-center">
            {(() => {
              const won = cumulativeStats.FaceoffsWon ?? 0;
              const total = cumulativeStats.Faceoffs ?? 0;
              const winPct =
                total > 0 ? ((won / total) * 100).toFixed(1) : 0;
              return (
                <p className="text-3xl font-extrabold text-emerald-700">
                  {winPct}% Win Rate
                </p>
              );
            })()}
          </div>
        </div>

        {/* Faceoffs per game selector */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Faceoffs per Game</h2>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Select a Game:
            </label>
            <select
              value={selectedGameIndex}
              onChange={(e) => setSelectedGameIndex(Number(e.target.value))}
              className={`w-full md:w-1/2 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 ${teamColors?.ring}`}
            >
              {gameStats.map((stat, index) => (
                <option key={index} value={index}>
                  {stat.location === 'Away'
                    ? `@ ${stat.opponent}`
                    : `vs ${stat.opponent}`}{' '}
                  — {stat.date}
                </option>
              ))}
            </select>
          </div>

          {gameStats[selectedGameIndex] && (
            <div className="bg-white rounded-2xl shadow-md p-4">
              <h3 className="text-center font-semibold text-gray-800 mb-2">
                {gameStats[selectedGameIndex].location === 'Away'
                  ? `@ ${gameStats[selectedGameIndex].opponent}`
                  : `vs ${gameStats[selectedGameIndex].opponent}`}{' '}
                — {gameStats[selectedGameIndex].date}
              </h3>
              <div className="w-64 h-64 mx-auto">
                <Pie
                  data={{
                    labels: ['Won', 'Lost'],
                    datasets: [
                      {
                        data: [
                          gameStats[selectedGameIndex].faceoffsWon,
                          gameStats[selectedGameIndex].faceoffs -
                            gameStats[selectedGameIndex].faceoffsWon,
                        ],
                        backgroundColor: [
                          'rgba(34, 197, 94, 0.6)',
                          'rgba(239, 68, 68, 0.2)',
                        ],
                        borderColor: [
                          'rgba(22, 163, 74, 1)',
                          'rgba(239, 68, 68, 0.5)',
                        ],
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}





