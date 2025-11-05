'use client';

import { useState } from 'react';
import { teamColorClasses } from "../teamColors";

const TeamLeaders = ({ teamLeaders, teamColors = {} }) => {
  const [activeTab, setActiveTab] = useState('points');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const safeColors = {
    text: teamColors.text || "text-gray-800",
    border: teamColors.border || "border-gray-400"
  };

  const tabLabels = {
    points: 'Points',
    goals: 'Goals',
    assists: 'Assists',
  };

  const leaders = teamLeaders[activeTab] || [];
  const topPlayer = selectedPlayer || leaders[0];
  const others = leaders.slice(1);

  // Handle player click / hover
  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
  };

  return (
    <div className="w-full mt-10">
      {/* Nav Tabs */}
      <div className="flex justify-center space-x-6 border-b border-gray-300 mb-6">
        {Object.entries(tabLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              setSelectedPlayer(null); // reset when switching category
            }}
            className={`text-lg tracking-wide font-bold uppercase py-2 transition duration-150 ${
              activeTab === key
                ? `${safeColors.text} border-b-4 ${safeColors.border}`
                : `text-gray-500 hover:${safeColors.text}`
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Leaderboard Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Featured Player Card */}
        {topPlayer ? (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-300 flex flex-col justify-between items-center hover:shadow-2xl transition-all duration-300">
            {/* Profile Photo */}
            <img
              src={`/playerPhotos/${topPlayer.name.replace(/\s+/g, '').toLowerCase()}.jpg`}
              alt={`${topPlayer.name} profile`}
              onError={(e) => (e.currentTarget.src = "/playerPhotos/defaultProfile.png")}
              className="w-32 h-32 object-cover rounded-full border-4 border-gray-200 shadow-md mb-4"
            />

            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-2">
                Top {tabLabels[activeTab]}
              </p>
              <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">
                #{topPlayer.jersey ?? '--'} {topPlayer.name}
              </h2>
              {topPlayer.position && (
                <p className="text-sm text-gray-500 font-medium mt-1">
                  {topPlayer.position}
                </p>
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 uppercase font-semibold mb-1">
                {tabLabels[activeTab]}
              </p>
              <div className={`text-6xl font-black ${safeColors.text} leading-none`}>
                {topPlayer[activeTab]}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 italic">No data for top player.</div>
        )}

        {/* Other Players List */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {others.map((player, index) => {
              const isActive = selectedPlayer?.name === player.name;
              return (
                <div
                  key={index}
                  className={`flex justify-between items-center px-5 py-4 cursor-pointer transition duration-200 ${
                    isActive ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectPlayer(player)}
                  onMouseEnter={() => handleSelectPlayer(player)} // hover also updates
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400 font-semibold w-8">
                      #{player.jersey ?? '--'}
                    </span>
                    <span className={`text-base font-medium truncate ${
                      isActive ? safeColors.text : "text-gray-800"
                    }`}>
                      {player.name}
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${safeColors.text}`}>
                    {player[activeTab]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamLeaders;




