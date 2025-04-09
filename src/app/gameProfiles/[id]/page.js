'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Radar, Bar, Line, Pie, Scatter } from 'react-chartjs-2'; 
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement);

const convertTimeToSeconds = (timeStr) => {
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return minutes * 60 + seconds; 
};

export default function TeamProfile() {
  const { id } = useParams(); //gameId
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
        
        const playerStatsCollection = gameData.stats || [];
        const gameStatsArray = [];

        playerStatsCollection.forEach((stat) => {
          // sum up stats
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
            goals: stat.Goals || 0, 
            assists: stat.Assists,
            timeOnIce: timeOnIceInSeconds,
            shifts: stat['All shifts'],
            shiftLength: averageShiftLength,
          });
        });

        setTeamStats(teamStats);
        setGameStats(gameStatsArray);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching team stats:', error);
        setLoading(false);
      }
    };

    fetchTeamStats();
  }, [id]);

  if (loading) return <h2 className="text-3xl text-center font-semibold text-gray-800 mt-4">Loading team statistics...</h2>;

  return (
    <div className="team-profile">
      <h2 className="text-3xl text-center font-semibold text-gray-800 mt-4">Cumulative Team Stats</h2>
      <div className="stats">
        <p>Points: {teamStats.Points}</p>
        <p>Goals: {teamStats.Goals}</p>
        <p>Assists: {teamStats.Assists}</p>
        <p>+/-: {teamStats['+/-']}</p>
        <p>Faceoffs Won: {teamStats.FaceoffsWon}</p>
        <p>Faceoffs: {teamStats.Faceoffs}</p>
        <p>Shots: {teamStats.Shots}</p>
        <p>Shots on Goal: {teamStats.ShotsOnGoal}</p>
        <p>Hits: {teamStats.Hits}</p>
        <p>Blocked Shots: {teamStats.BlockedShots}</p>
        <p>Power Play Shots: {teamStats.PowerPlayShots}</p>
        <p>Short Handed Shots: {teamStats.ShortHandedShots}</p>
        <p>Penalties Drawn: {teamStats.PenaltiesDrawn}</p>
      </div>
      
      {/* Bar Chart displaying individual stats */}
      <div className="chart">
        <h3 className="text-2xl text-center font-semibold text-gray-800 mt-6">Individual Stats Comparison</h3>
        <Bar
          data={{
            labels: ['Goals', 'Assists', 'Shots', 'Hits', 'Faceoffs'],
            datasets: [{
              label: 'Team Stats',
              data: [
                teamStats.Goals, 
                teamStats.Assists, 
                teamStats.Shots, 
                teamStats.Hits, 
                teamStats.FaceoffsWon
              ],
              backgroundColor: '#4CAF50',
            }],
          }}
          options={{ responsive: true }}
        />
      </div>

      {/* Radar Chart for Goals, Assists, +/-, and Points */}
      <div className="chart mt-8">
        <h3 className="text-2xl text-center font-semibold text-gray-800">Radar Chart: Goals, Assists, +/-, and Points</h3>
        <Radar
          data={{
            labels: ['Goals', 'Assists', '+/-', 'Points'],
            datasets: [{
              label: 'Team Performance',
              data: [
                teamStats.Goals, 
                teamStats.Assists, 
                teamStats['+/-'], 
                teamStats.Points
              ],
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            }],
          }}
          options={{
            responsive: true,
            scale: {
              ticks: {
                beginAtZero: true,
                max: Math.max(teamStats.Goals, teamStats.Assists, teamStats['+/-'], teamStats.Points) + 1,
              },
            },
          }}
        />
      </div>
    </div>
  );
}



















