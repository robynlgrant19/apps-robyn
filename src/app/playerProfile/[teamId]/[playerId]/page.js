'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Radar, Bar, Line, Pie, Scatter } from 'react-chartjs-2'; 
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement } from 'chart.js';
import { teamColorClasses } from "../../../teamColors";


ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement);

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
  const [cumulativeStats, setCumulativeStats] = useState({ Points: 0, Goals: 0, Assists: 0, '+/-': 0 });
  const [gameStats, setGamesStats] = useState([]);
  const [loading, setLoading] = useState(true);
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
    'Blocking a shot...'
  ];
  const [loadingMessage, setLoadingMessage] = useState('');

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
          console.log("Resolved school:", schoolName);
          console.log("Team colors:", teamColorClasses[schoolName]);
        }
      } catch (error) {
        console.error("Error fetching team colors:", error);
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

        const teamGames = querySnapshot.docs.filter(doc => doc.data().teamId === teamId);


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
        let totalPenaltyTime
      
        const gameStats = [];

        

        teamGames.forEach((doc) => {
          const gameData = doc.data();
          const playerStats = gameData.stats?.filter(stat => stat['Shirt number'] === jerseyNumberString);
          //const position = gameData.stats?.Position;

          //console.log("Game Data:", gameData);
        
          playerStats?.forEach((stat) => {
            
            console.log("Player Stat:", stat);
            totalPoints += stat.Points === "-" ? 0 : Number(stat.Points || 0);
            totalGoals += stat.Goals === "-" ? 0 : Number(stat.Goals || 0);
            totalAssists += stat.Assists === "-" ? 0 : Number(stat.Assists || 0);
            totalPlusMinus += stat['+/-'] === "-" ? 0 : Number(stat['+/-'] || 0);
            totalFaceoffsWon += stat['Faceoffs won'] === "-" ? 0 : Number(stat['Faceoffs won'] || 0);
            totalFaceoffs += stat.Faceoffs === "-" ? 0 : Number(stat.Faceoffs || 0);
            totalShots += stat.Shots === "-" ? 0 : Number(stat.Shots || 0);
            totalShotsOnGoal += stat['Shots on goal'] === "-" ? 0 : Number(stat['Shots on goal'] || 0);
            totalHits += stat.Hits === "-" ? 0 : Number(stat.Hits || 0);
            totalBlockedShots += stat['Blocked shots'] === "-" ? 0 : Number(stat['Blocked shots'] || 0);
            totalPowerPlayShots += stat['Power play shots'] === "-" ? 0 : Number(stat['Power play shots'] || 0);
            totalShortHandedShots += stat['Short-handed shots'] === "-" ? 0 : Number(stat['Short-handed shots'] || 0);
            totalPenaltiesDrawn += stat['Penalties drawn'] === "-" ? 0 : Number(stat['Penalties drawn'] || 0);
            //totalShifts += stat['All shifts'] === "-" ? 0 : Number(stat['All shifts'] || 0);

            const timeOnIceInSeconds = stat['Time on ice'] === "-" ? 0 : convertTimeToSeconds(stat['Time on ice']);
            
            const averageShiftLength = timeOnIceInSeconds/stat['All shifts'];

            const penaltyTimeSeconds = stat['Penalty time'] === "-" || stat['Penalty time'] === "0" || !stat['Penalty time']
              ? 0
              : convertTimeToSeconds(stat['Penalty time']);

              totalPenaltyTime += penaltyTimeSeconds;

            
            
            gameStats.push({ 
              game: gameData.opponent, 
              opponent: gameData.opponent,
              goals: stat.Goals || 0, 
              assists: stat.Assists,
              timeOnIce: timeOnIceInSeconds,
              shots: stat.Shots || 0,
              shotsOnGoal: stat['Shots on goal'],
              position: stat.Position,
              location: gameData.location,
              date: gameData.gameDate,
              shifts: stat['All shifts'],
              shiftLength: averageShiftLength,
              faceoffs: stat.Faceoffs === '-' ? 0 : Number(stat.Faceoffs || 0),
              faceoffsWon: stat['Faceoffs won'] === '-' ? 0 : Number(stat['Faceoffs won'] || 0),
            });
          });
        });
        
        

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
        });
        setGamesStats(gameStats);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('Error fetching cumulative stats:', error);
      }
    };

    if (player) {
      fetchCumulativeStats();
    }
  }, [player]);

  
  
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

  //sort games in chrono order
  gameStats.sort((a,b) => new Date(a.date) - new Date(b.date));

  // Radar chart data
  const radarData = {
    labels: ['Points', 'Goals', 'Assists', '+/-'],
    datasets: [
      {
        label: 'Player Stats',
        data: [
          cumulativeStats.Points,
          cumulativeStats.Goals,
          cumulativeStats.Assists,
          cumulativeStats['+/-']
        ],
        backgroundColor: 'rgba(0, 128, 0, 0.3)',
        borderColor: 'rgba(0, 128, 0, 1)', 
        pointBackgroundColor: 'rgba(0, 128, 0, 0.3)', 
        pointBorderColor: 'rgba(0, 128, 0, 1)',
        pointHoverBackgroundColor: 'rgba(0, 128, 0, 0.3)',
        pointHoverBorderColor: 'rgba(0, 128, 0, 1)',
      }
    ]
  };

  const radarOptions = {
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: Math.max(cumulativeStats.Points, cumulativeStats.Goals, cumulativeStats.Assists, cumulativeStats['+/-']) + 10
      }
    },
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };

  // bar chart for goals and assists per game
  const barDataForPoints = {
    labels: gameStats.map((stat) => {
      const homeOrAway = stat.location === "Away" ? `@ ${stat.opponent}` : `vs ${stat.opponent}`;
      return [homeOrAway, stat.date];
    }),
    datasets: [
      {
        label: 'Goals',
        data: gameStats.map((stat) => Number(stat.goals) || 0),
        backgroundColor: 'rgba(0, 128, 0, 0.3)', 
        borderColor: 'rgba(0, 128, 0, 1)', 
        borderWidth: 1
      },
      {
        label: 'Assists',
        data: gameStats.map((stat) => Number(stat.assists) || 0),
        backgroundColor: 'rgba(144, 238, 144, 0.5)', 
        borderColor: 'rgba(144, 238, 144, 1)', 
        borderWidth: 1
      }
    ]
  };
  

  const barOptionsForPoints = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Game'
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount'
        },
        ticks: {
          stepSize: 1 
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  };
  

  // line chart
  const lineData = {
    labels: gameStats.map((stat) => {
      const homeOrAway = stat.location === "Away" ? `@ ${stat.opponent}` : `vs ${stat.opponent}`;
      return [homeOrAway, stat.date];
    }), 
    datasets: [
      {
        label: 'Time on Ice (minutes)',
        data: gameStats.map((stat) => stat.timeOnIce / 60), 
        fill: false,
        borderColor: 'rgba(34, 197, 94, 1)', 
        tension: 0.1
      },
      {
        label: 'Shifts',
        data: gameStats.map((stat) => stat.shifts), 
        fill: false,
        borderColor: 'rgba(5, 45, 5, 0.73)', 
        tension: 0.1
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Game'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Time (minutes)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };

  // bar chart for average shift length
  const barDataForShiftLength = {
    labels: gameStats.map((stat) => {
      const homeOrAway = stat.location === "Away" ? `@ ${stat.opponent}` : `vs ${stat.opponent}`;
      return [homeOrAway, stat.date];
    }),
    datasets: [
      {
        label: 'Avg Shift Length (in seconds)',
        data: gameStats.map((stat) => stat.shiftLength),
        backgroundColor: 'rgba(0, 128, 0, 0.3)', 
        borderColor: 'rgba(0, 128, 0, 1)', 
        borderWidth: 1
      },
    ]
  };

  const barOptionsForShiftLength = {
    responsive: true,
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Game'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Time (seconds)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };

  //pie chart
  const pieData = {
    labels: ['Faceoffs Won', 'Faceoffs Lost'],
    datasets: [
      {
        label: 'Faceoffs',
        data: [
          cumulativeStats.FaceoffsWon,
          cumulativeStats.Faceoffs - cumulativeStats.FaceoffsWon
        ],
        backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.2)'], // bold green & faint red
        borderColor: ['rgba(22, 163, 74, 1)', 'rgba(239, 68, 68, 0.5)'],     // strong green & soft red
        borderWidth: 2
      }
    ]
  };
  

  //console.log("Game Stats Shots:", gameStats.map((stat) => stat.shots));



  // bar chart for shots vs shots on goal
  const barDataForShots = {
    labels: gameStats.map((stat) => {
      const homeOrAway = stat.location === "Away" ? `@ ${stat.opponent}` : `vs ${stat.opponent}`;
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
        borderWidth: 1
      },
      {
        label: 'Shots on Goal',
        data: gameStats.map((stat) => Number(stat.shotsOnGoal) || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.6)', 
        borderColor: 'rgba(22, 163, 74, 1)', 
        borderWidth: 1
      }
    ]
  };
  

  const barOptionsForShots = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Game'
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Shots'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          footer: (tooltipItems) => {
            const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
            return `Total Shots: ${total}`;
          }
        }
      }
    }
  };
  
  
  
  

  
  //console.log(gameStats[0].position);


  return (
    <div className="min-h-screen bg-gray-50 p-6">
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
      
  
      <div className="max-w-5xl mx-auto mt-20">
      <div className= {`bg-white border-l-8 ${teamColors.border} rounded-xl shadow-lg ring-1 ring-gray-200 p-6 mb-10`}>
  <div className="flex justify-between items-center">
    {/* Left Side: Player Info */}
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-wide uppercase">
        {player.firstName} {player.lastName}
      </h1>
      <div className="text-lg text-gray-600 mt-1">
        {gameStats.length > 0 && (
          gameStats[0].position === 'F' ? 'Forward' :
          gameStats[0].position === 'D' ? 'Defense' :
          'Position not available'
        )}
      </div>
    </div>

    {/* Right Side: Jersey Number */}
    <div className={`text-4xl sm:text-5xl font-impact ${teamColors.text}`}>
      #{player.jerseyNumber}
    </div>
  </div>
</div>

        

       
  <div className="mt-4 grid md:grid-cols-2 gap-6">
  {/* Vertical Stat Summary Card */}
  <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
    <h2 className="text-xl font-semibold text-gray-800">Cumulative Stats</h2>
    <div className="space-y-3">
      <div className="flex justify-between border-b pb-2">
        <span className="text-gray-600 font-medium">Points</span>
        <span className="font-semibold text-gray-900">{cumulativeStats.Points}</span>
      </div>
      <div className="flex justify-between border-b pb-2">
        <span className="text-gray-600 font-medium">Goals</span>
        <span className="font-semibold text-gray-900">{cumulativeStats.Goals}</span>
      </div>
      <div className="flex justify-between border-b pb-2">
        <span className="text-gray-600 font-medium">Assists</span>
        <span className="font-semibold text-gray-900">{cumulativeStats.Assists}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600 font-medium">Plus/Minus</span>
        <span className="font-semibold text-gray-900">{cumulativeStats['+/-']}</span>
      </div>
    </div>
  </div>

  {/* Radar Chart */}
  <div className="bg-white rounded-2xl shadow-md p-6">
    <Radar data={radarData} options={radarOptions} />
  </div>
</div>


<h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">
    Around the Net
    </h2>
      <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold">Goals and Assists per Game</h2>
        <Bar data={barDataForPoints} options={barOptionsForPoints} />
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold">Shots vs Shots on Goal per Game</h2>
        <Bar data={barDataForShots} options={barOptionsForShots} />
      </div>

      <h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">
    Ice Time
    </h2>
      <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold">Ice Time & Total Shifts per Game</h2>
        <Line data={lineData} options={lineOptions} />
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold">Average Shift Length per Game</h2>
        <Bar data={barDataForShiftLength} options={barOptionsForShiftLength} />
      </div>

      
      

{/*
      <div className="mt-6">
  <h2 className="text-xl font-semibold">Shots vs Goals Scatter Plot</h2>
  <div className="w-full h-96">
    <Scatter data={scatterData} options={scatterOptions} />
  </div>
</div>
*/}


<div className="mt-6">
<h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">
    Defensive Statistics
    </h2>
<div className="mt-6 flex gap-6">
  
      <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-4 flex flex-col justify-center items-center">
        <h3 className="text-xl font-semibold text-black">Total Hits</h3>
        <p className={`text-4xl font-bold ${teamColors.text} mt-2`}>{cumulativeStats.Hits}</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-4 flex flex-col justify-center items-center">
        <h3 className="text-xl font-semibold text-black">Total Blocked Shots</h3>
        <p className={`text-4xl font-bold ${teamColors.text} mt-2`}>{cumulativeStats.BlockedShots}</p>
      </div>
    </div>
    </div>

    <div className="mt-6">
    <h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">
    Special Teams
    </h2>
<div className="mt-6 flex gap-6">
  
      <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-4 flex flex-col justify-center items-center">
        <h3 className="text-xl font-semibold text-black">Total Power Play Shots</h3>
        <p className={`text-4xl font-bold ${teamColors.text} mt-2`}>{cumulativeStats.PowerPlayShots}</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-4 flex flex-col justify-center items-center">
        <h3 className="text-xl font-semibold text-black">Total Short Handed Shots</h3>
        <p className={`text-4xl font-bold ${teamColors.text} mt-2`}>{cumulativeStats.ShortHandedShots}</p>
      </div>

      
    </div>
    </div>
    <div className="mt-6">
    <h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">
    Special Teams
    </h2>
<div className="mt-6 flex gap-6">
  
      <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-4 flex flex-col justify-center items-center">
        <h3 className="text-xl font-semibold text-black">Total Penalties Drawn</h3>
        <p className={`text-4xl font-bold ${teamColors.text} mt-2`}>{cumulativeStats.PenaltiesDrawn}</p>
      </div>
      
      <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-4 flex flex-col justify-center items-center">
  <h3 className="text-xl font-semibold text-black">Total Penalty Time</h3>
  <p className={`text-4xl font-bold ${teamColors.text} mt-2`}>{convertSecondsToTime(cumulativeStats.PenaltyTime || 0)}</p>
</div>
      
    </div>
    </div>

    <h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">
    Faceoffs
    </h2>
    <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-2">Faceoffs Won vs Faceoffs Lost</h2>
        <h2 className="text-xl font-bold text-center text-black-600 mb-4">
          Total Faceoffs:
        </h2>
        <h3 className={`text-2xl font-bold text-center ${teamColors.text} mb-4`}>
          {cumulativeStats.Faceoffs}
        </h3>

      <div className="w-80 h-80 mx-auto"> 
        <Pie data={pieData} options={{ maintainAspectRatio: false }} />
      </div>
      </div>
{/*
    <div className="mt-6">
  <h2 className="text-xl font-semibold mb-4">Faceoffs per Game</h2>
  <div className="grid md:grid-cols-2 gap-6">
    {gameStats.map((stat, index) => {
      const data = {
        labels: ['Won', 'Lost'],
        datasets: [
          {
            data: [stat.faceoffsWon, stat.faceoffs - stat.faceoffsWon],
            backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.2)'],
            borderColor: ['rgba(22, 163, 74, 1)', 'rgba(239, 68, 68, 0.5)'],
            borderWidth: 2
          }
        ]
      };

      return (
        <div key={index} className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="text-center font-semibold text-gray-800 mb-2">
            {stat.location === 'Away' ? `@ ${stat.opponent}` : `vs ${stat.opponent}`} — {stat.date}
          </h3>
          <div className="w-64 h-64 mx-auto">
            <Pie data={data} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      );
    })}
  </div>
</div>
*/}

<div className="mt-6">
  <h2 className="text-xl font-semibold mb-4">Faceoffs per Game</h2>

  <div className="mb-4">
    <label className="block text-gray-700 font-medium mb-2">Select a Game:</label>
    <select
      value={selectedGameIndex}
      onChange={(e) => setSelectedGameIndex(Number(e.target.value))}
      className={`w-full md:w-1/2 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus: ${teamColors.ring}`}
    >
      {gameStats.map((stat, index) => (
        <option key={index} value={index}>
          {stat.location === 'Away' ? `@ ${stat.opponent}` : `vs ${stat.opponent}`} — {stat.date}
        </option>
      ))}
    </select>
  </div>

  {gameStats[selectedGameIndex] && (
    <div className="bg-white rounded-2xl shadow-md p-4">
      <h3 className="text-center font-semibold text-gray-800 mb-2">
        {gameStats[selectedGameIndex].location === 'Away'
          ? `@ ${gameStats[selectedGameIndex].opponent}`
          : `vs ${gameStats[selectedGameIndex].opponent}`} — {gameStats[selectedGameIndex].date}
      </h3>
      <div className="w-64 h-64 mx-auto">
        <Pie
          data={{
            labels: ['Won', 'Lost'],
            datasets: [
              {
                data: [
                  gameStats[selectedGameIndex].faceoffsWon,
                  gameStats[selectedGameIndex].faceoffs - gameStats[selectedGameIndex].faceoffsWon,
                ],
                backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.2)'],
                borderColor: ['rgba(22, 163, 74, 1)', 'rgba(239, 68, 68, 0.5)'],
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




