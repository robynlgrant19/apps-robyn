'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Radar, Bar, Line, Pie, Scatter } from 'react-chartjs-2'; 
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement);

const convertTimeToSeconds = (timeStr) => {
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return minutes * 60 + seconds; 
};

export default function PlayerProfile() {
  const { teamId, playerId } = useParams();
  const [player, setPlayer] = useState(null);
  const [cumulativeStats, setCumulativeStats] = useState({ Points: 0, Goals: 0, Assists: 0, '+/-': 0 });
  const [gameStats, setGamesStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    const fetchCumulativeStats = async () => {
      try {
        if (!player || !player.jerseyNumber) return;

        const jerseyNumberString = String(player.jerseyNumber);
        const gamesRef = collection(db, 'games');
        const querySnapshot = await getDocs(gamesRef);

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
      
        const gameStats = [];

        querySnapshot.forEach((doc) => {
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
          PenaltiesDrawn: totalPenaltiesDrawn
        });
        setGamesStats(gameStats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cumulative stats:', error);
      }
    };

    if (player) {
      fetchCumulativeStats();
    }
  }, [player]);

  if (loading) return <h2 className="text-3xl text-center font-semibold text-gray-800 mt-4">You have no statistics yet!</h2>;
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
        backgroundColor: 'rgba(34, 197, 94, 0.2)', 
        borderColor: 'rgba(34, 197, 94, 1)', 
        pointBackgroundColor: 'rgba(34, 197, 94, 1)', 
        pointBorderColor: 'rgba(34, 197, 94, 1)', 
        pointHoverBackgroundColor: 'rgba(34, 197, 94, 0.5)',
        pointHoverBorderColor: 'rgba(34, 197, 94, 1)'
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
        data: gameStats.map((stat) => stat.goals),
        backgroundColor: 'rgba(0, 128, 0, 0.3)', 
        borderColor: 'rgba(0, 128, 0, 1)', 
        borderWidth: 1
      },
      {
        label: 'Assists',
        data: gameStats.map((stat) => stat.assists),
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
        beginAtZero: true
      },
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        position: 'top'
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
        beginAtZero: true
      },
      y: {
        beginAtZero: true
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
        beginAtZero: true
      },
      y: {
        beginAtZero: true
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
          cumulativeStats.Faceoffs - cumulativeStats.FaceoffsWon // Calculate Faceoffs Lost
        ],
        backgroundColor: ['rgba(0, 128, 0, 0.3)', 'rgba(144, 238, 144, 0.5)'], // Change color for lost faceoffs
        borderColor: ['rgba(0, 128, 0, 1)', 'rgba(144, 238, 144, 1)'],
        borderWidth: 3
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
        label: 'Shots',
        data: gameStats.map((stat) => stat.shots),
        backgroundColor: 'rgba(0, 128, 0, 0.3)', 
        borderColor: 'rgba(0, 128, 0, 1)', 
        borderWidth: 1
      },
      {
        label: 'Shots on Goal',
        data: gameStats.map((stat) => stat.shotsOnGoal),
        backgroundColor: 'rgba(144, 238, 144, 0.5)', 
        borderColor: 'rgba(144, 238, 144, 1)', 
        borderWidth: 1
      }
      
      
    ]
  };

  const barOptionsForShots = {
    responsive: true,
    scales: {
      x: {
        beginAtZero: true
      },
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };

  const scatterData = {
    labels: gameStats.map((stat) => stat.game),
    datasets: [
      {
        label: 'Shots vs Goals',
        data: gameStats.map((stat, index) => ({
          x: stat.shots,
          y: stat.goals === '-' ? 0 : stat.goals
        })),
        backgroundColor: 'rgba(144, 238, 144, 0.5)', 
        borderColor: 'rgba(144, 238, 144, 1)',
        borderWidth: 1,
        pointRadius: 5,
      }
    ]
  };

  
  const scatterOptions = {
    responsive: true,
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Shots'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Goals'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };
  

  
  //console.log(gameStats[0].position);


  return (

    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back Button */}
      {/*<button 
        className="text-green-600 px-6 py-3 text-3xl rounded-md mb-6 hover-green-900"
        onClick={() => router.push(`/pages/homePlayer`)}
      >
        ⬅
      </button>
      */}
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md">
  <h1 className="text-2xl font-impact text-gray-900">
    {player.firstName} {player.lastName}
  </h1>
  <p className="text-gray-600">#{player.jerseyNumber}</p>
  <div className="text-gray-600">
    {gameStats.length > 0 && (
      gameStats[0].position === 'F' ? 'Forward' : 
      gameStats[0].position === 'D' ? 'Defense' : 
      'Position not available'
    )}
  </div>


  
      <div className="mt-4 flex gap-6">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Cumulative Stats</h2>
          <table className="w-full mt-4 bg-green-100 border rounded-lg shadow-md">
            <thead>
              <tr className="bg-green-500 text-white rounded-t-lg">
                <th className="p-3 text-left">Points</th>
                <th className="p-3 text-left">Goals</th>
                <th className="p-3 text-left">Assists</th>
                <th className="p-3 text-left">Plus/Minus</th>
              </tr>
            </thead>
            <tbody>
              <tr className="odd:bg-green-50 even:bg-green-200">
                <td className="p-3">{cumulativeStats.Points}</td>
                <td className="p-3">{cumulativeStats.Goals}</td>
                <td className="p-3">{cumulativeStats.Assists}</td>
                <td className="p-3">{cumulativeStats['+/-']}</td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <div className="flex-1">
          
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>

      
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Goals and Assists per Game</h2>
        <Bar data={barDataForPoints} options={barOptionsForPoints} />
      </div>

      
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Ice Time & Total Shifts per Game</h2>
        <Line data={lineData} options={lineOptions} />
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Average Shift Length per Game</h2>
        <Bar data={barDataForShiftLength} options={barOptionsForShiftLength} />
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Faceoffs Won vs Faceoffs Lost</h2>
        <h2 className="text-xl font-bold text-center text-black-600 mb-4">
  Total Faceoffs:
</h2>
<h3 className="text-2xl font-bold text-center text-green-600 mb-4">
  {cumulativeStats.Faceoffs}
</h3>

      <div className="w-80 h-80 mx-auto"> 
        <Pie data={pieData} options={{ maintainAspectRatio: false }} />
      </div>
      </div>

      
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Shots vs Shots on Goal per Game</h2>
        <Bar data={barDataForShots} options={barOptionsForShots} />
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
<h2 className="text-xl font-semibold">Defensive Statistics</h2>
<div className="mt-6 flex gap-6">
  
      <div className="flex-1 bg-green-100 p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
        <h3 className="text-xl font-semibold text-black">Total Hits</h3>
        <p className="text-4xl font-bold text-green-600 mt-2">{cumulativeStats.Hits}</p>
      </div>

      <div className="flex-1 bg-green-100 p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
        <h3 className="text-xl font-semibold text-black">Total Blocked Shots</h3>
        <p className="text-4xl font-bold text-green-600 mt-2">{cumulativeStats.BlockedShots}</p>
      </div>
    </div>
    </div>

    <div className="mt-6">
<h2 className="text-xl font-semibold">Special Teams</h2>
<div className="mt-6 flex gap-6">
  
      <div className="flex-1 bg-green-100 p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
        <h3 className="text-xl font-semibold text-black">Total Power Play Shots</h3>
        <p className="text-4xl font-bold text-green-600 mt-2">{cumulativeStats.PowerPlayShots}</p>
      </div>

      <div className="flex-1 bg-green-100 p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
        <h3 className="text-xl font-semibold text-black">Total Short Handed Shots</h3>
        <p className="text-4xl font-bold text-green-600 mt-2">{cumulativeStats.ShortHandedShots}</p>
      </div>

      
    </div>
    </div>

    <div className="mt-6">
<h2 className="text-xl font-semibold">Penalties</h2>
<div className="mt-6 flex gap-6">
  
      <div className="flex-1 bg-green-100 p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
        <h3 className="text-xl font-semibold text-black">Total Penalties Drawn</h3>
        <p className="text-4xl font-bold text-green-600 mt-2">{cumulativeStats.PenaltiesDrawn}</p>
      </div>
      {/*
      <div className="flex-1 bg-green-100 p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
        <h3 className="text-xl font-semibold text-black">Shift Length</h3>
        <p className="text-4xl font-bold text-green-600 mt-2">{stat.shiftLength}</p>
      </div>
      */}
    </div>
    </div>
  
      
    </div>
    
    </div>
  );
}




