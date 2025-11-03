'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import TeamLeaders from '../../components/TeamLeaders';
import { Bar, Radar, Line } from 'react-chartjs-2';
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
  Title
} from 'chart.js';
import { teamColorClasses } from "../../teamColors";

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
  Title
);

const convertTimeToSeconds = (timeStr) => {
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return minutes * 60 + seconds;
};

export default function YearStats() {
  const { teamId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teamStats, setTeamStats] = useState({});
  const [teamFaceoffPercentage, setTeamFaceoffPercentage] = useState('0%');
  const [teamLeaders, setTeamLeaders] = useState({ points: [], goals: [], assists: [] });
  const [averageShiftData, setAverageShiftData] = useState([]);
  const [averageIceTimeData, setAverageIceTimeData] = useState([]);
  const [shiftPositionFilter, setShiftPositionFilter] = useState('All');
  const [iceTimePositionFilter, setIceTimePositionFilter] = useState('All');
  const [averageShotsData, setAverageShotsData] = useState([]);
  const [shotsPositionFilter, setShotsPositionFilter] = useState('All');
  const [plusMinusChartData, setPlusMinusChartData] = useState([]);
  const [plusMinusPositionFilter, setPlusMinusPositionFilter] = useState('All');
  const [shotsPerGameData, setShotsPerGameData] = useState([]);
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
  const [teamColors, setTeamColors] = useState(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * hockeySayings.length);
    setLoadingMessage(hockeySayings[randomIndex]);
  }, []);

  useEffect(() => {
    const fetchTeamColors = async () => {
      if (!teamId) return;
  
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);
  
      if (teamSnap.exists()) {
        const team = teamSnap.data();
        const school = team.school?.trim();
        setTeamColors(teamColorClasses[school] || {});
      }
    };
  
    fetchTeamColors();
  }, [teamId]);
  

  
  

  useEffect(() => {
    const fetchAllGameStats = async () => {
      if (!teamId) return;

    
      const gamesQuery = query(collection(db, 'games'), where('teamId', '==', teamId));
      const querySnapshot = await getDocs(gamesQuery);
      const games = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Games loaded for record test:", games);


      
      const recordGames = querySnapshot.docs.map(d => d.data());
      let wins = 0, losses = 0, ties = 0;

      recordGames.forEach(g => {
        const teamScore = Number(g.teamScore);
        const opponentScore = Number(g.opponentScore);
        if (teamScore > opponentScore) wins++;
        else if (teamScore < opponentScore) losses++;
        else if (teamScore === opponentScore) ties++;
      });

//       recordGames.forEach(g => {
//   console.log("Checking game:", g.teamScore, g.opponentScore, typeof g.teamScore);
// });


      // Save record to state
      setTeamStats(prev => ({ ...prev, wins, losses, ties }));
      


      const gameShotsData = games.map(game => {
        const totalShots = (game.stats || []).reduce((sum, stat) => {
          const shots = stat.Shots === '-' ? 0 : Number(stat.Shots || 0);
          return sum + shots;
        }, 0);
      
        const opponent = game.opponent || 'Unknown';
        const gameDate = game.gameDate || 'Unknown Date';
      
        const location = game.location?.toLowerCase(); // safely get string, lowercase just in case
        const prefix = location === 'home' ? 'vs' : '@';
        const gameLabel = `${prefix} ${opponent}\n${gameDate}`;






      
        return {
          label: gameLabel,
          value: totalShots
        };
      });

      const sortedGameShotsData = gameShotsData.sort((a, b) => {
        const dateA = new Date(a.label.split('\n')[1]); // grab the date part after \n
        const dateB = new Date(b.label.split('\n')[1]);
        return dateA - dateB;
      });
      
      setShotsPerGameData(gameShotsData);
      

      const cumulativeStats = {
        Points: 0, Goals: 0, Assists: 0, '+/-': 0,
        FaceoffsWon: 0, Faceoffs: 0,
        Shots: 0, ShotsOnGoal: 0, Hits: 0, BlockedShots: 0,
        PowerPlayShots: 0, ShortHandedShots: 0, PenaltiesDrawn: 0
      };

      const playersMap = {};

      

      games.forEach(game => {
        const stats = game.stats || [];
        const playersSeenThisGame = new Set();

        stats.forEach(stat => {
          for (let key in cumulativeStats) {
            const dbKey = key === 'FaceoffsWon' ? 'Faceoffs won' : key === 'ShotsOnGoal' ? 'Shots on goal' : key === 'BlockedShots' ? 'Blocked shots' : key === 'PowerPlayShots' ? 'Power play shots' : key === 'ShortHandedShots' ? 'Short-handed shots' : key === 'PenaltiesDrawn' ? 'Penalties drawn' : key;
            const val = stat[dbKey] === '-' ? 0 : Number(stat[dbKey] || 0);
            cumulativeStats[key] += val;
          }

          const name = stat.Player?.trim();
          if (!name) return;

          if (!playersMap[name]) {
            playersMap[name] = {
              name,
              jersey: stat['Shirt number'],
              position: stat.Position || 'Unknown',
              goals: 0,
              assists: 0,
              points: 0,
              totalTime: 0,
              totalShifts: 0,
              gamesPlayed: 0
            };
          }

          if (!playersSeenThisGame.has(name)) {
            playersMap[name].gamesPlayed += 1;
            playersSeenThisGame.add(name);
          }

          const goals = stat.Goals === '-' ? 0 : Number(stat.Goals || 0);
          const assists = stat.Assists === '-' ? 0 : Number(stat.Assists || 0);
          playersMap[name].goals += goals;
          playersMap[name].assists += assists;
          playersMap[name].points += goals + assists;

          const timeOnIce = stat['Time on ice'];
          const shifts = stat['All shifts'];

          const plusMinus = stat['+/-'] === '-' ? 0 : Number(stat['+/-'] || 0);
          playersMap[name]['+/-'] = (playersMap[name]['+/-'] || 0) + plusMinus;


          if (timeOnIce && timeOnIce !== '-' && shifts && shifts !== '-') {
            playersMap[name].totalTime += convertTimeToSeconds(timeOnIce);
            playersMap[name].totalShifts += Number(shifts);
          }
        });
      });

      const faceoffPct = cumulativeStats.Faceoffs > 0
        ? ((cumulativeStats.FaceoffsWon / cumulativeStats.Faceoffs) * 100).toFixed(1) + '%'
        : '0%';

      const playersArray = Object.values(playersMap);

      const topPoints = [...playersArray].sort((a, b) => b.points - a.points).slice(0, 10);
      const topGoals = [...playersArray].sort((a, b) => b.goals - a.goals).slice(0, 10);
      const topAssists = [...playersArray].sort((a, b) => b.assists - a.assists).slice(0, 10);

      const shiftPlayers = playersArray
  .filter(p => shiftPositionFilter === 'All' || p.position === shiftPositionFilter)
  .sort((a, b) => a.jersey - b.jersey);

const iceTimePlayers = playersArray
  .filter(p => iceTimePositionFilter === 'All' || p.position === iceTimePositionFilter)
  .sort((a, b) => a.jersey - b.jersey);


  const avgShiftData = shiftPlayers.map(p => ({
    label: `#${p.jersey}`,
    value: p.totalShifts > 0 ? Math.round(p.totalTime / p.totalShifts) : 0
  }));
  
  const avgIceTimeData = iceTimePlayers.map(p => ({
    label: `#${p.jersey}`,
    value: p.gamesPlayed > 0 ? Number(((p.totalTime / 60) / p.gamesPlayed).toFixed(2)) : 0
  }));
  
  const filteredForShots = playersArray
  .filter(p => shotsPositionFilter === 'All' || p.position === shotsPositionFilter)
  .sort((a, b) => a.jersey - b.jersey);

const avgShotsData = filteredForShots.map(p => {
  let totalShots = 0;

  games.forEach(game => {
    const stat = game.stats?.find(s => s.Player?.trim() === p.name);
    const shots = stat?.Shots === '-' ? 0 : Number(stat?.Shots || 0);
    totalShots += shots;
  });

  return {
    label: `#${p.jersey}`,
    value: p.gamesPlayed > 0 ? Number((totalShots / p.gamesPlayed).toFixed(2)) : 0
  };
}
);

const filteredForPlusMinus = playersArray
  .filter(p => plusMinusPositionFilter === 'All' || p.position === plusMinusPositionFilter)
  .filter(p => typeof p['+/-'] === 'number')
  .sort((a, b) => (a.jersey ?? 0) - (b.jersey ?? 0))
  .map(p => ({
    label: `#${p.jersey}`,
    value: p['+/-']
  }));

setPlusMinusChartData(filteredForPlusMinus);







      setAverageShotsData(avgShotsData);
      


      setTeamStats(prev => ({
        ...prev,
        ...cumulativeStats,  // keep existing wins/losses/ties
      }));
      setTeamFaceoffPercentage(faceoffPct);
      setTeamLeaders({ points: topPoints, goals: topGoals, assists: topAssists });
      setAverageShiftData(avgShiftData);
      setAverageIceTimeData(avgIceTimeData);
      setTimeout(() => {
        setLoading(false);
      }, 1000);

    };

    fetchAllGameStats();
  }, [teamId, shiftPositionFilter, iceTimePositionFilter, shotsPositionFilter, plusMinusPositionFilter]);

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
  
  

  const radarData = {
    labels: ['Shots', 'Shots on Goal', 'Power Play Shots', 'Short-Handed Shots', 'Blocked Shots'],
    datasets: [{
      label: 'Shooting & Defense Profile',
      data: [
        teamStats.Shots,
        teamStats.ShotsOnGoal,
        teamStats.PowerPlayShots,
        teamStats.ShortHandedShots,
        teamStats.BlockedShots
      ],
      backgroundColor: 'rgba(0, 128, 0, 0.3)',
        borderColor: 'rgba(0, 128, 0, 1)', 
        pointBackgroundColor: 'rgba(0, 128, 0, 0.3)', 
        pointBorderColor: 'rgba(0, 128, 0, 1)',
        pointHoverBackgroundColor: 'rgba(0, 128, 0, 0.3)',
        pointHoverBorderColor: 'rgba(0, 128, 0, 1)',
    }]
  };

  const barDataShiftLength = {
    labels: averageShiftData.map(p => p.label),
    datasets: [{
      label: 'Avg Shift Length (seconds)',
      data: averageShiftData.map(p => p.value),
      backgroundColor: 'rgba(0, 128, 0, 0.3)',
      borderColor: 'rgba(0, 128, 0, 1)',
      borderWidth: 1
    }]
  };

  const barDataIceTime = {
    labels: averageIceTimeData.map(p => p.label),
    datasets: [{
      label: 'Avg Ice Time (minutes)',
      data: averageIceTimeData.map(p => p.value),
      backgroundColor: 'rgba(0, 128, 0, 0.3)',
      borderColor: 'rgba(0, 128, 0, 1)',
      borderWidth: 1
    }]
  };

  const barDataAvgShots = {
    labels: averageShotsData.map(p => p.label),
    datasets: [{
      label: 'Avg Shots/Game',
      data: averageShotsData.map(p => p.value),
      backgroundColor: 'rgba(0, 128, 0, 0.3)',
      borderColor: 'rgba(0, 128, 0, 1)',
      borderWidth: 1
    }]
  };

  const barDataPlusMinus = {
    labels: plusMinusChartData.map(p => p.label),
    datasets: [{
      label: 'Plus/Minus',
      data: plusMinusChartData.map(p => p.value),
      backgroundColor: 'rgba(0, 128, 0, 0.3)',
      borderColor: 'rgba(0, 128, 0, 1)',
      borderWidth: 1
    }]
  };

  const lineDataShotsPerGame = {
    labels: shotsPerGameData.map(game => game.label),
    datasets: [{
      label: 'Shots Per Game',
      data: shotsPerGameData.map(game => game.value),
      fill: false,
      borderColor: 'rgba(0, 128, 0, 1)',
      backgroundColor: 'rgba(0, 128, 0, 0.3)',
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };
  
  
  
  
  

  
  

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
<div className={`bg-white border-l-8 ${teamColors.border} rounded-xl shadow-lg ring-1 ring-gray-200 p-6 mb-10 mt-20`}>
<h2 className="text-3xl font-semibold">Season Stats</h2>
             
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            <div className="bg-white rounded-2xl shadow-md p-6 space-y-4 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Cumulative Stats</h2>
        <div className="flex justify-between border-b pb-2">
        <span className="text-gray-600 font-medium">Record</span>
        <span className={`font-semibold ${teamColors.text}`}>
          {teamStats.wins ?? 0}-{teamStats.losses ?? 0}-{teamStats.ties ?? 0}
        </span>
      </div>


        <div className="space-y-3">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600 font-medium">Points</span>
            <span className="font-semibold text-gray-900">{teamStats.Points}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600 font-medium">Goals</span>
            <span className="font-semibold text-gray-900">{teamStats.Goals}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600 font-medium">Assists</span>
            <span className="font-semibold text-gray-900">{teamStats.Assists}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600 font-medium">Plus/Minus</span>
            <span className="font-semibold text-gray-900">{teamStats['+/-']}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 font-medium">Shots</span>
            <span className="font-semibold text-gray-900">{teamStats.Shots}</span>
          </div>
        </div>
      </div>      
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold text-center mb-4">Shooting & Defense Radar</h2>
          <Radar data={radarData} />
        </div>
      </div>
      

      

      <h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2">
    Team Leaders
  </h2>
      <TeamLeaders teamLeaders={teamLeaders} teamColors={teamColors}/>

      <div className="mt-10 px-6">
  <div className="overflow-x-auto rounded-lg shadow border border-gray-300">
    <table className="min-w-full bg-white text-sm text-left">
      <thead className="bg-gray-100 sticky top-0 z-10">
        <tr>
          <th className={`px-6 py-4 font-semibold text-gray-700 cursor-pointer hover: ${teamColors.text}`}>#</th>
          <th className={`px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:${teamColors.text}`}>Player</th>
          <th className= {`px-6 py-4 font-semibold text-gray-700 text-center cursor-pointer hover:${teamColors.text}`}>G</th>
          <th className= {`px-6 py-4 font-semibold text-gray-700 text-center cursor-pointer hover:${teamColors.text}`}>A</th>
          <th className= {`px-6 py-4 font-semibold text-gray-700 text-center cursor-pointer hover: ${teamColors.text}`}>PTS</th>
        </tr>
      </thead>
      <tbody>
        {teamLeaders.points.map((player, index) => (
          <tr
            key={index}
            className={` ${teamColors.hoverBg} border-b border-gray-200 transition duration-150`}
          >
            <td className="px-6 py-4 text-gray-800 font-medium">#{player.jersey ?? '--'}</td>
            <td className="px-6 py-4 text-gray-900 font-semibold">{player.name}</td>
            <td className="px-6 py-4 text-center text-gray-700">{player.goals ?? 0}</td>
            <td className="px-6 py-4 text-center text-gray-700">{player.assists ?? 0}</td>
            <td className={`px-6 py-4 text-center font-bold ${teamColors.text}`}>{player.points ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

<h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">Ice Time</h2>

      <div className="bg-white p-6 rounded-xl shadow mb-12 text-center mt-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Average Shift Length Per Player</h2>
          <select
  value={shiftPositionFilter}
  onChange={(e) => setShiftPositionFilter(e.target.value)}
  className="border rounded px-3 py-1 text-sm"
>
  <option value="All">All</option>
  <option value="F">Forwards</option>
  <option value="D">Defensemen</option>
</select>
        </div>
        <Bar data={barDataShiftLength} options={{
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      title: { display: true, text: 'Player' }
    },
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Seconds' }
    }
  }
}}
 />
      </div>

      <div className="bg-white p-6 rounded-xl shadow mb-12 text-center">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Average Ice Time Per Player</h2>
          <select
  value={iceTimePositionFilter}
  onChange={(e) => setIceTimePositionFilter(e.target.value)}
  className="border rounded px-3 py-1 text-sm"
>
  <option value="All">All</option>
  <option value="F">Forwards</option>
  <option value="D">Defensemen</option>
</select>
        </div>
        <Bar data={barDataIceTime} options={{
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      title: { display: true, text: 'Player' }
    },
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Minutes' }
    }
  }
}}
 />
      </div>

      <div className="bg-white p-6 rounded-xl shadow mb-12">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold">Plus/Minus</h2>
    <select
      value={plusMinusPositionFilter}
      onChange={(e) => setPlusMinusPositionFilter(e.target.value)}
      className="border rounded px-3 py-1 text-sm"
    >
      <option value="All">All</option>
      <option value="F">Forwards</option>
      <option value="D">Defensemen</option>
    </select>
  </div>
  <Bar
    data={barDataPlusMinus}
    options={{
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          beginAtZero: true,
          min: Math.min(...plusMinusChartData.map(p => p.value)) - 1,
          max: Math.max(...plusMinusChartData.map(p => p.value)) + 1,
          stepSize: 1,
          title: { display: true, text: 'Plus/Minus' },
          ticks: {
            stepSize: 1,
            callback: (value) => `${value > 0 ? '+' : ''}${value}`
          },
          grid: {
            color: (ctx) => ctx.tick.value === 0 ? '#000' : '#e5e7eb',
            lineWidth: (ctx) => ctx.tick.value === 0 ? 2 : 1
          }
        },
        y: {
          title: { display: true, text: 'Player' }
        }
      }
    }}
    
  />
</div>


      <div className="bg-white p-6 rounded-xl shadow mb-12 text-center">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold">Average Shots Per Game</h2>
    <select
      value={shotsPositionFilter}
      onChange={(e) => setShotsPositionFilter(e.target.value)}
      className="border rounded px-3 py-1 text-sm"
    >
      <option value="All">All</option>
      <option value="F">Forwards</option>
      <option value="D">Defensemen</option>
    </select>
  </div>
  <Bar
    data={barDataAvgShots}
    options={{
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          title: { display: true, text: 'Player' }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Shots Per Game' }
        }
      }
    }}
    
  />
</div>

<div className="bg-white p-6 rounded-xl shadow mb-12">
  <h2 className="text-xl font-semibold mb-4">Shots Per Game</h2>
  <div className="overflow-x-auto">
    <div style={{minWidth: '800px'}}>
  <Line
    data={lineDataShotsPerGame}
    options={{
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `Shots: ${context.parsed.y}`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Game' },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            callback: function (val, index) {
              return lineDataShotsPerGame.labels[index];
            }
          }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Total Shots' }
        }
      }
    }}
    
  />
 </div>
 </div>

 <div className="bg-white p-6 rounded-xl shadow mb-12 text-center mt-2">
        <h2 className="text-xl font-semibold mb-2">Faceoff %</h2>
        <p className={`text-3xl font-bold ${teamColors.text}`}>{teamFaceoffPercentage}</p>
      </div>


</div>

    </div>
    </div>
    
  );
}

