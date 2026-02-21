import React, { useState } from 'react';

const LeaderboardFilters = ({ onFilterChange }) => {
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState('');
    const [minTrustScore, setMinTrustScore] = useState(0);

    const badges = [
        { value: '', label: 'All Badges' },
        { value: 'diamond', label: 'Diamond', icon: 'fa-gem' },
        { value: 'platinum', label: 'Platinum', icon: 'fa-medal' },
        { value: 'gold', label: 'Gold', icon: 'fa-medal' },
        { value: 'silver', label: 'Silver', icon: 'fa-medal' },
        { value: 'bronze', label: 'Bronze', icon: 'fa-award' },
        { value: 'starter', label: 'Starter', icon: 'fa-seedling' },
    ];

    const handleVerifiedChange = (e) => {
        const checked = e.target.checked;
        setVerifiedOnly(checked);
        onFilterChange({ verifiedOnly: checked, badge: selectedBadge, minTrustScore });
    };

    const handleBadgeChange = (e) => {
        const value = e.target.value;
        setSelectedBadge(value);
        onFilterChange({ verifiedOnly, badge: value, minTrustScore });
    };

    const handleTrustScoreChange = (e) => {
        const value = Number(e.target.value);
        setMinTrustScore(value);
        onFilterChange({ verifiedOnly, badge: selectedBadge, minTrustScore: value });
    };

    return (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-white/5 rounded-xl mb-6">
            {/* Verified Only Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={handleVerifiedChange}
                    className="w-4 h-4 accent-blue-500"
                />
                <span className="text-sm text-white/80"><i className="fa-solid fa-check"></i> Verified Only</span>
            </label>

            {/* Badge Filter Dropdown */}
            <select
                value={selectedBadge}
                onChange={handleBadgeChange}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm outline-none focus:border-blue-500"
            >
                {badges.map((badge) => (
                    <option key={badge.value} value={badge.value} className="bg-gray-900">
                        {badge.label}
                    </option>
                ))}
            </select>

            {/* Trust Score Range */}
            <div className="flex items-center gap-3">
                <label className="text-sm text-white/70">Min Trust:</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={minTrustScore}
                    onChange={handleTrustScoreChange}
                    className="w-32 accent-blue-500"
                />
                <span className="text-sm text-white/90 font-medium w-12">{minTrustScore}%</span>
            </div>

            {/* Reset Filters */}
            {(verifiedOnly || selectedBadge || minTrustScore > 0) && (
                <button
                    onClick={() => {
                        setVerifiedOnly(false);
                        setSelectedBadge('');
                        setMinTrustScore(0);
                        onFilterChange({ verifiedOnly: false, badge: '', minTrustScore: 0 });
                    }}
                    className="ml-auto px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                    Reset Filters
                </button>
            )}
        </div>
    );
};

export default LeaderboardFilters;
