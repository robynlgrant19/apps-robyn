import { useState } from "react";
import Link from "next/link";

function CalendarView({ games }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (0 = January)

  const gamesByDate = {};
  games.forEach(game => {
    gamesByDate[game.gameDate] = gamesByDate[game.gameDate] || [];
    gamesByDate[game.gameDate].push(game);
  });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks = [];
  let days = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
    if (days.length === 7) {
      weeks.push(days);
      days = [];
    }
  }
  if (days.length > 0) {
    weeks.push(days);
  }

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="overflow-x-auto">
      {/* Month and Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
        >
          ◀
        </button>
        <h2 className="text-xl font-semibold text-gray-800">
          {monthNames[month]} {year}
        </h2>
        <button
          onClick={handleNextMonth}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
        >
          ▶
        </button>
      </div>

      {/* Calendar Table */}
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <th key={day} className="border-b p-2 text-center font-semibold">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, i) => (
            <tr key={i}>
              {week.map((day, idx) => (
                <td key={idx} className="h-24 w-24 border p-1 align-top">
                  {day && (
  <div className="flex flex-col text-xs">
    <span className="font-bold">{day}</span>
    <div className="flex flex-col gap-1 mt-1">
      {gamesByDate[`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`]?.map(game => {
        const isWin = game.teamScore > game.opponentScore;
        const isLoss = game.teamScore < game.opponentScore;
        const color = isWin
          ? 'bg-emerald-600'
          : isLoss
          ? 'bg-red-500'
          : 'bg-gray-400';

        return (
          <Link
            key={game.id}
            href={`/gameProfiles/${game.id}`}
            className={`text-white ${color} rounded-full px-2 py-1 text-[10px] truncate hover:opacity-90 transition`}
            title={`${game.location === 'Away' ? '@' : 'vs'} ${game.opponent}`}
          >
            {game.opponent.length > 10 ? game.opponent.slice(0, 10) + '…' : game.opponent}
          </Link>
        );
      })}
    </div>
  </div>
)}

                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CalendarView;
