import React from 'react';

const AIProfileCard = ({ profile, onSelect, isSelected }) => {
    const { name, emoji, color, capabilities, avgScore, totalBattles, battlesWon } = profile;

    const winRate = totalBattles > 0 ? ((battlesWon / totalBattles) * 100).toFixed(1) : 0;

    return (
        <div
            onClick={() => onSelect(profile)}
            className={`bg-white/5 rounded-xl p-6 cursor-pointer transition-all hover:scale-105 ${isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-900' : ''
                }`}
            style={{ ringColor: isSelected ? color : 'transparent' }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{emoji}</span>
                <div className="flex-1">
                    <h3 className="font-bold text-lg" style={{ color }}>
                        {name}
                    </h3>
                    <p className="text-xs text-white/50">{profile.description}</p>
                </div>
                {isSelected && (
                    <div className="text-2xl"><i className="fa-solid fa-check"></i></div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-xs text-white/50">Avg Score</div>
                    <div className="text-lg font-bold" style={{ color }}>
                        {avgScore}
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-xs text-white/50">Win Rate</div>
                    <div className="text-lg font-bold text-green-400">
                        {winRate}%
                    </div>
                </div>
            </div>

            {/* Capabilities */}
            <div className="space-y-2">
                {Object.entries(capabilities).slice(0, 3).map(([key, value]) => (
                    <div key={key}>
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-white/70 capitalize">{key}</span>
                            <span className="text-white/90">{value}</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${value}%`,
                                    backgroundColor: color,
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AIProfileCard;
