'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Radar, Bar, Pie } from 'react-chartjs-2'; 
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
  ArcElement
} from 'chart.js';
import TeamLeaders from '../../components/TeamLeaders';

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

const convertTimeToMinutes = (timeStr) => {
  const [minutes, seconds] = timeStr.split(":").map(Number);
  return minutes + (seconds / 60); 
};



export default function TeamProfile() {
  const [teamStats, setTeamStats] = useState({
    Points: 0,
    Goals: 0,
    Assists: 0,
    '+/-': 0,
    FaceoffsWon: 0,
    Faceoffs: 0,
    Shots: 0,
    ShotsOnGoal: 0,
    Hits: 0,
    BlockedShots: 0,
    PowerPlayShots: 0,
    ShortHandedShots: 0,
    PenaltiesDrawn: 0
  });
  const [gameStats, setGameStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = useParams();
  const [teamFaceoffPercentage, setTeamFaceoffPercentage] = useState('0%');
  const [teamLeaders, setTeamLeaders] = useState({
    points: [],
    goals: [],
    assists: []
  });
  const [gameInfo, setGameInfo] = useState(null);
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

  

  
  
  //const [selectedPosition, setSelectedPosition] = useState('All');
  const [positionFilterShift, setPositionFilterShift] = useState('All');
  const [positionFilterIceTime, setPositionFilterIceTime] = useState('All');
  const [positionFilterShots, setPositionFilterShots] = useState('All');
  const [positionFilterPlusMinus, setPositionFilterPlusMinus] = useState('All');

  
  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        if (!id) return;
  
        const gameRef = doc(db, 'games', id);
        const gameSnap = await getDoc(gameRef);
  
        if (!gameSnap.exists()) {
          console.log('Game not found');
          setLoading(false);
          return;
        }
  
        const gameData = gameSnap.data();
        console.log(gameData);
        setGameInfo(gameData);

        const playerStatsCollection = gameData.stats || [];

        if (playerStatsCollection.length === 0) {
          // No player data – fallback to LiveStatForm values
          setTeamStats({
            Points: 0,
            Goals: 0,
            Assists: 0,
            '+/-': 0,
            FaceoffsWon: 0,
            Faceoffs: 0,
            Shots: gameData.shots ?? 0,
            ShotsOnGoal: 0,
            Hits: 0,
            BlockedShots: 0,
            PowerPlayShots: 0,
            ShortHandedShots: 0,
            PenaltiesDrawn: 0
          });
          setGameStats([]); // No player-level stats
          setGameInfo(gameData);
          setLoading(false);
          return;
        }
  
        const teamStats = {
          Points: 0,
          Goals: 0,
          Assists: 0,
          '+/-': 0,
          FaceoffsWon: 0,
          Faceoffs: 0,
          Shots: 0,
          ShotsOnGoal: 0,
          Hits: 0,
          BlockedShots: 0,
          PowerPlayShots: 0,
          ShortHandedShots: 0,
          PenaltiesDrawn: 0
        };
  
        const gameStatsArray = [];
        const playersMap = {};
  
        playerStatsCollection.forEach((stat) => {
          console.log('stats', stat);
          console.log("Shirt num: ", stat['Shirt number']);
          
          teamStats.Points += stat.Points === "-" ? 0 : Number(stat.Points || 0);
          teamStats.Goals += stat.Goals === "-" ? 0 : Number(stat.Goals || 0);
          teamStats.Assists += stat.Assists === "-" ? 0 : Number(stat.Assists || 0);
          teamStats['+/-'] += stat['+/-'] === "-" ? 0 : Number(stat['+/-'] || 0);
          teamStats.FaceoffsWon += stat['Faceoffs won'] === "-" ? 0 : Number(stat['Faceoffs won'] || 0);
          teamStats.Faceoffs += stat.Faceoffs === "-" ? 0 : Number(stat.Faceoffs || 0);
          teamStats.Shots += stat.Shots === "-" ? 0 : Number(stat.Shots || 0);
          teamStats.ShotsOnGoal += stat['Shots on goal'] === "-" ? 0 : Number(stat['Shots on goal'] || 0);
          teamStats.Hits += stat.Hits === "-" ? 0 : Number(stat.Hits || 0);
          teamStats.BlockedShots += stat['Blocked shots'] === "-" ? 0 : Number(stat['Blocked shots'] || 0);
          teamStats.PowerPlayShots += stat['Power play shots'] === "-" ? 0 : Number(stat['Power play shots'] || 0);
          teamStats.ShortHandedShots += stat['Short-handed shots'] === "-" ? 0 : Number(stat['Short-handed shots'] || 0);
          teamStats.PenaltiesDrawn += stat['Penalties drawn'] === "-" ? 0 : Number(stat['Penalties drawn'] || 0);
  
          
          const timeOnIceInSeconds = stat['Time on ice'] === "-" ? 0 : convertTimeToSeconds(stat['Time on ice']);
          const averageShiftLength = timeOnIceInSeconds / (stat['All shifts'] || 1);
  
          gameStatsArray.push({
            player: stat['Shirt number'],
            name: stat.Player,
            goals: stat.Goals || 0,
            assists: stat.Assists,
            timeOnIce: timeOnIceInSeconds,
            shifts: stat['All shifts'],
            shiftLength: averageShiftLength,
            faceoffsWon: stat['Faceoffs won'] === "-" ? 0 : Number(stat['Faceoffs won'] || 0),
            faceoffs: stat.Faceoffs === "-" ? 0 : Number(stat.Faceoffs || 0),
            iceTime: convertTimeToMinutes(stat['Time on ice']),
            faceoffPercentage: stat['Faceoffs won, %'],
            shots: stat.Shots === "-" ? 0 : Number(stat.Shots || 0),
            plusMinus: stat['+/-'] === "-" ? 0 : Number(stat['+/-'] || 0),
            position: stat.Position || 'Unknown',
            shifts: stat['All shifts'],
            shotsOnGoal: stat['Shots on goal'] === "-" ? 0 : Number(stat['Shots on goal'] || 0),
          });

          
  
          
          const name = stat.Player?.trim();
          if (!name) return;
  
          if (!playersMap[name]) {
            playersMap[name] = {
              name,
              jersey: stat['Shirt number'],
              goals: 0,
              assists: 0,
              points: 0,
            };
          }
  
          const goals = stat.Goals === '-' || stat.Goals === undefined ? 0 : Number(stat.Goals);
          const assists = stat.Assists === '-' || stat.Assists === undefined ? 0 : Number(stat.Assists);
          playersMap[name].goals += goals;
          playersMap[name].assists += assists;
          playersMap[name].points += goals + assists;
        });
  
        const calculatedFaceoffPct =
          teamStats.Faceoffs > 0
            ? ((teamStats.FaceoffsWon / teamStats.Faceoffs) * 100).toFixed(1) + '%'
            : '0%';
  
       
        const playersArray = Object.values(playersMap);
        const topPoints = [...playersArray].sort((a, b) => b.points - a.points).slice(0, 10);
        const topGoals = [...playersArray].sort((a, b) => b.goals - a.goals).slice(0, 10);
        const topAssists = [...playersArray].sort((a, b) => b.assists - a.assists).slice(0, 10);
  
        
        console.log('Top Points:', topPoints);
        console.log('Top Goals:', topGoals);
        console.log('Top Assists:', topAssists);
        
  
        
        setTeamStats(teamStats);
        setGameStats(gameStatsArray);
        setTeamFaceoffPercentage(calculatedFaceoffPct);
        setTeamLeaders({
          points: topPoints,
          goals: topGoals,
          assists: topAssists,
        });
        setTimeout(() => {
          setLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('Error fetching team stats:', error);
        
      }
    };
  
    fetchTeamStats();
  }, [id]);
  
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
    labels: ['Goals', 'Assists', '+/-', 'Points'],
    datasets: [{
      label: 'Team Performance',
      data: [
        teamStats.Goals, 
        teamStats.Assists, 
        teamStats['+/-'], 
        teamStats.Points
      ],
        backgroundColor: 'rgba(0, 128, 0, 0.3)',
        borderColor: 'rgba(0, 128, 0, 1)', 
        pointBackgroundColor: 'rgba(0, 128, 0, 0.3)', 
        pointBorderColor: 'rgba(0, 128, 0, 1)',
        pointHoverBackgroundColor: 'rgba(0, 128, 0, 0.3)',
        pointHoverBorderColor: 'rgba(0, 128, 0, 1)',
        
    }],
  };

  const radarOptions = {
    responsive: true,
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: Math.max(teamStats.Goals, teamStats.Assists, teamStats['+/-'], teamStats.Points) + 5
      }
    }
  };
  const filterByPosition = (data, position) =>
    position === 'All' ? data : data.filter(stat => stat.position === position);

  const sortByPlayer = (data) => [...data].sort((a, b) => a.player - b.player);

  const filteredStatsShift = filterByPosition(gameStats, positionFilterShift);
  const filteredStatsIceTime = filterByPosition(gameStats, positionFilterIceTime);
  const filteredStatsShots = filterByPosition(gameStats, positionFilterShots);
  const filteredStatsPlusMinus = filterByPosition(gameStats, positionFilterPlusMinus);
  


  const sortedGameStats = sortByPlayer(gameStats);
  const sortedGameStatsShift = sortByPlayer(filteredStatsShift);
  const sortedGameStatsIceTime = sortByPlayer(filteredStatsIceTime);
  const sortedGameStatsShots = sortByPlayer(filteredStatsShots);
  const sortedGameStatsPlusMinus = sortByPlayer(filteredStatsPlusMinus);
  const filteredStatsShifts = filterByPosition(gameStats, positionFilterShift);
  const sortedGameStatsShifts = sortByPlayer(filteredStatsShifts);



const barData = {
  labels: sortedGameStatsShift.map(stat => `#${stat.player}`),
  datasets: [{
    label: 'Avg Shift Length (seconds)',
    data: sortedGameStatsShift.map(stat => Math.round(stat.shiftLength)),
    backgroundColor: 'rgba(0, 128, 0, 0.3)',
    borderColor: 'rgba(0, 128, 0, 1)',
    borderWidth: 1,
  }]
};

const barOptions = {
  responsive: true,
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Time (seconds)' }
    },
    x: { title: { display: true, text: 'Player' } }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `${context.parsed.y} sec`
      }
    }
  }
};

const barDataIceTime = {
  labels: sortedGameStatsIceTime.map(stat => `#${stat.player}`),
  datasets: [{
    label: 'Ice Time (Minutes)',
    data: sortedGameStatsIceTime.map(stat => stat.iceTime),
    backgroundColor: 'rgba(0, 128, 0, 0.3)',
    borderColor: 'rgba(0, 128, 0, 1)',
    borderWidth: 1,
  }]
};

const barOptionsIceTime = {
  responsive: true,
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Time (Minutes)' }
    },
    x: { title: { display: true, text: 'Player' } }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `${context.parsed.y.toFixed(2)} min`
      }
    }
  }
};

const pieData = {
  labels: ['Faceoffs Won', 'Faceoffs Lost'],
  datasets: [{
    label: 'Faceoffs',
    data: [teamStats.FaceoffsWon, teamStats.Faceoffs - teamStats.FaceoffsWon],
    backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.2)'], // bold green & faint red
    borderColor: ['rgba(22, 163, 74, 1)', 'rgba(239, 68, 68, 0.5)'], // strong green & light red
    borderWidth: 2
  }]
};


const barDataShotsStacked = {
  labels: sortedGameStatsShots.map(stat => `#${stat.player}`),
  datasets: [
    {
      label: 'Missed Shots',
      data: sortedGameStatsShots.map(stat => {
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
      data: sortedGameStatsShots.map(stat => Number(stat.shotsOnGoal) || 0),
      backgroundColor: 'rgba(34, 197, 94, 0.6)',
      borderColor: 'rgba(22, 163, 74, 1)',
      borderWidth: 1
    }
  ]
};

const barOptionsShotsStacked = {
  responsive: true,
  scales: {
    x: {
      stacked: true,
      title: {
        display: true,
        text: 'Player'
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



const barDataPlusMinus = {
  labels: sortedGameStatsPlusMinus.map(stat => `#${stat.player}`),
  datasets: [{
    label: 'Plus/Minus',
    data: sortedGameStatsPlusMinus.map(stat => Number(stat.plusMinus) || 0),
    backgroundColor: sortedGameStatsPlusMinus.map(stat => {
      const val = Number(stat.plusMinus);
      if (val > 0) return 'rgba(0, 100, 0, 0.7)';
      if (val < 0) return 'rgba(95, 159, 95, 0.6)';
      return 'rgba(128, 128, 128, 0.4)';
    }),
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
  }]
};

const barOptionsPlusMinus = {
  indexAxis: 'y',
  responsive: true,
  scales: {
    x: {
      beginAtZero: true,
      min: Math.min(...sortedGameStatsPlusMinus.map(stat => Number(stat.plusMinus))) - 1,
      max: Math.max(...sortedGameStatsPlusMinus.map(stat => Number(stat.plusMinus))) + 1,
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
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => {
          const val = context.parsed.x;
          return `${val > 0 ? '+' : ''}${val} Plus/Minus`;
        }
      }
    }
  }
};



const generateBarData = (data, statKey) => ({
  labels: data.map(stat => `#${stat.player}`),
  datasets: [{
    label: statKey,
    data: data.map(stat => Math.round(stat[statKey])),
    backgroundColor: 'rgba(0, 128, 0, 0.3)',
    borderColor: 'rgba(0, 128, 0, 1)',
    borderWidth: 1,
  }]
});

const barDataShifts = {
  labels: sortedGameStatsShifts.map(stat => `#${stat.player}`),
  datasets: [{
    label: 'Number of Shifts',
    data: sortedGameStatsShifts.map(stat => Number(stat.shifts) || 0),
    backgroundColor: 'rgba(0, 128, 0, 0.3)',
    borderColor: 'rgba(0, 128, 0, 1)',
    borderWidth: 1
  }]
};

const barOptionsShifts = {
  responsive: true,
  scales: {
    x: {
      title: { display: true, text: 'Player' },
      ticks: {
        autoSkip: false,
        maxRotation: 0,
        minRotation: 0
      }
    },
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Shifts' },
      ticks: {
        precision: 0,
        stepSize: 1
      }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `${context.parsed.y} shifts`
      }
    }
  }
};


return (
  <div className="min-h-screen bg-gray-50 p-6">
    
    <nav className="bg-gradient-to-r from-emerald-900 to-emerald-500 w-full p-4 shadow-md fixed top-0 left-0 z-50">
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
{gameInfo && (
  <div className="bg-white border-l-8 border-emerald-800 rounded-xl shadow-lg ring-1 ring-gray-200 p-6 mb-10">
    <div className="flex items-center justify-between mb-2">
      {/* LEFT: Opponent Logo + Name */}
      <div className="flex items-center gap-4">
        

        {/* Opponent Info */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {gameInfo.location === 'Away' ? '@' : 'vs'} {gameInfo.opponent}
        </h2>
        <img
          src={`/teamLogos/${gameInfo.opponent?.toLowerCase().replace(/\s+/g, '')}.jpg`}
          alt={`${gameInfo.opponent} logo`}
          onError={(e) => (e.currentTarget.src = '/teamLogos/default.jpg')}
          className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
        />
      </div>

      {/* RIGHT: Score */}
      <p className="text-3xl sm:text-4xl font-impact text-emerald-800">
        {gameInfo.teamScore} - {gameInfo.opponentScore}
      </p>
    </div>

    {/* Optional: Game Date (uncomment if desired) */}
    {/* <p className="text-gray-600 text-md mt-2">{gameInfo.gameDate}</p> */}
  </div>
)}

{/*
<div className="flex justify-end mb-4">
  <button
    onClick={() => router.push(`/manualEntry/${gameInfo.teamId}/edit/${id}`)}
    className="px-4 py-2 bg-emerald-700 text-white rounded hover:bg-emerald-800 transition"
  >
    ✏️ Edit Game Info
  </button>
</div>*/}

      <div className="mt-4 grid md:grid-cols-2 gap-6">
        {/* summary */}
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-4 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Cumulative Stats</h2>
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

      {/* radar chart */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <Radar data={radarData} options={radarOptions} />
      </div>
    </div>

{/* leaders */}
<div className="mt-12 px-6">
  <h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2">
    Team Leaders
  </h2>



    <TeamLeaders teamLeaders={teamLeaders} />
</div>


<div className="mt-10 px-6">
  <div className="overflow-x-auto rounded-lg shadow border border-gray-300">
    <table className="min-w-full bg-white text-sm text-left">
      <thead className="bg-gray-100 sticky top-0 z-10">
        <tr>
          <th className="px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:text-emerald-600">#</th>
          <th className="px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:text-emerald-600">Player</th>
          <th className="px-6 py-4 font-semibold text-gray-700 text-center cursor-pointer hover:text-emerald-600">G</th>
          <th className="px-6 py-4 font-semibold text-gray-700 text-center cursor-pointer hover:text-emerald-600">A</th>
          <th className="px-6 py-4 font-semibold text-gray-700 text-center cursor-pointer hover:text-emerald-600">PTS</th>
        </tr>
      </thead>
      <tbody>
        {teamLeaders.points.map((player, index) => (
          <tr
            key={index}
            className="hover:bg-emerald-50 border-b border-gray-200 transition duration-150"
          >
            <td className="px-6 py-4 text-gray-800 font-medium">#{player.jersey ?? '--'}</td>
            <td className="px-6 py-4 text-gray-900 font-semibold">{player.name}</td>
            <td className="px-6 py-4 text-center text-gray-700">{player.goals ?? 0}</td>
            <td className="px-6 py-4 text-center text-gray-700">{player.assists ?? 0}</td>
            <td className="px-6 py-4 text-center font-bold text-emerald-600">{player.points ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

<h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">
    Around the Net
    </h2>

    {/* shots bar chart */}
    <div className="col-span-2 bg-white rounded-2xl shadow-md p-6 mt-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Shots</h3>
        <select
          value={positionFilterShots}
          onChange={(e) => setPositionFilterShots(e.target.value)}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="All">All</option>
          <option value="F">Forwards</option>
          <option value="D">Defensemen</option>
        </select>
      </div>
      <Bar data={barDataShotsStacked} options={barOptionsShotsStacked} />
    </div>

    {/* plus/minus chart */}
    <div className="col-span-2 bg-white rounded-2xl shadow-md p-6 mt-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Plus/Minus</h3>
        <select
          value={positionFilterPlusMinus}
          onChange={(e) => setPositionFilterPlusMinus(e.target.value)}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="All">All</option>
          <option value="F">Forwards</option>
          <option value="D">Defensemen</option>
        </select>
      </div>
      <Bar data={barDataPlusMinus} options={barOptionsPlusMinus} />
    </div>
  
   
<h2 className="text-2xl font-extrabold text-black mb-8 tracking-tight border-b border-gray-700 pb-2 mt-6">Ice Time</h2>

    {/* avg shift length bar chart */}
    <div className="col-span-2 bg-white rounded-2xl shadow-md p-6 mt-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Average Shift Length Per Player</h3>
        <select
          value={positionFilterShift}
          onChange={(e) => setPositionFilterShift(e.target.value)}
          className="border rounded px-3 py-1 text-sm focus:border-emerald-500"
        >
          <option value="All">All</option>
          <option value="F">Forwards</option>
          <option value="D">Defensemen</option>
        </select>
      </div>
      <Bar data={generateBarData(sortedGameStatsShift, 'shiftLength')} options={barOptions} />

    </div>

    {/* ice time bar */}
    <div className="col-span-2 bg-white rounded-2xl shadow-md p-6 mt-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Ice Time Per Player</h3>
        <select
          value={positionFilterIceTime}
          onChange={(e) => setPositionFilterIceTime(e.target.value)}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="All">All</option>
          <option value="F">Forwards</option>
          <option value="D">Defensemen</option>
        </select>
      </div>
      <Bar data={barDataIceTime} options={barOptionsIceTime} />
    </div>

    {/* number of shifts bar */}
<div className="col-span-2 bg-white rounded-2xl shadow-md p-6 mt-6 border border-gray-200">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-xl font-semibold text-gray-800">Number of Shifts Per Player</h3>
    <select
      value={positionFilterShift}
      onChange={(e) => setPositionFilterShift(e.target.value)}
      className="border rounded px-3 py-1 text-sm"
    >
      <option value="All">All</option>
      <option value="F">Forwards</option>
      <option value="D">Defensemen</option>
    </select>
  </div>
  <Bar data={barDataShifts} options={barOptionsShifts} />
</div>



    

    {/* face-offs */}
    <div className="bg-white rounded-2xl shadow-md p-6 mt-6 border border-gray-200">
      <h2 className="text-xl font-bold text-center text-black-600 mb-2">Total Faceoffs: {teamStats.Faceoffs}</h2>
      <h2 className="flex justify-center text-sm text-gray-600 mb-2">Win Pct: {teamFaceoffPercentage}</h2>
      <div className="w-80 h-80 mx-auto">
        <Pie data={pieData} options={{ maintainAspectRatio: false }} />
      </div>
    </div>

    {/* face-off pie charts */}
<div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
  {sortedGameStats
    .filter(stat => stat.faceoffs > 0)
    .sort((a, b) => b.faceoffs - a.faceoffs)
    .map(stat => {
      const faceoffsLost = stat.faceoffs - stat.faceoffsWon;
      const playerFaceoffData = {
        labels: ['Won', 'Lost'],
        datasets: [{
          label: `#${stat.player} Faceoffs`,
          data: [stat.faceoffsWon, faceoffsLost],
          backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.2)'], // bold green, soft red
          borderColor: ['rgba(22, 163, 74, 1)', 'rgba(239, 68, 68, 0.5)'],
          borderWidth: 2
        }],
      };
      

      return (
        <div key={stat.player} className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition-all duration-200 border border-gray-200">
          <h3 className="text-emerald-700 font-bold text-center mb-1 text-lg">#{stat.player} {stat.name}</h3>
          <div className="flex justify-center text-sm text-gray-600 mb-2">
            <div className="mr-4">
              <span className="font-medium">Total:</span> {stat.faceoffs}
            </div>
            <div className="mr-4">
              <span className="font-medium">Won:</span> {stat.faceoffsWon}
            </div>
            <div>
              <span className="font-medium">Pct:</span> {stat.faceoffPercentage}
            </div>
          </div>

          <div className="w-56 h-56 mx-auto">
            <Pie data={playerFaceoffData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
      );
    })}
</div>

</div>
  </div>
);
}






















