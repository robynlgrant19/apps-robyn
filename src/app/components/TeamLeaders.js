'use client';

import { useState } from 'react';

const TeamLeaders = ({ teamLeaders }) => {
  const [activeTab, setActiveTab] = useState('points');

  const tabLabels = {
    points: 'Points',
    goals: 'Goals',
    assists: 'Assists',
  };

  const leaders = teamLeaders[activeTab] || [];
  const topPlayer = leaders[0];
  const others = leaders.slice(1);

  return (
    <div className="w-full mt-10">
      {/* Nav Tabs */}
      <div className="flex justify-center space-x-6 border-b border-gray-300 mb-6">
        {Object.entries(tabLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`text-lg tracking-wide font-bold uppercase py-2 transition duration-150 ${
              activeTab === key
                ? 'text-emerald-800 border-b-4 border-emerald-800'
                : 'text-gray-500 hover:text-emerald-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Leaderboard Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Featured Player */}
{topPlayer ? (
  <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-300 flex flex-col justify-between hover:shadow-2xl transition-all duration-300">
    <div>
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

    <div className="mt-6">
      <p className="text-sm text-gray-500 uppercase font-semibold mb-1">
        {tabLabels[activeTab]}
      </p>
      <div className="text-6xl font-black text-emerald-800 leading-none">
        {topPlayer[activeTab]}
      </div>
    </div>
  </div>
) : (
  <div className="text-gray-500 italic">No data for top player.</div>
)}


        {/* Others */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {others.map((player, index) => (
              <div
                key={index}
                className="flex justify-between items-center px-5 py-4 hover:bg-gray-50 transition duration-200"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-400 font-semibold w-8">#{player.jersey ?? '--'}</span>
                  <span className="text-base font-medium text-gray-800 truncate">{player.name}</span>
                </div>
                <span className="text-lg font-bold text-emerald-800">{player[activeTab]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamLeaders;


