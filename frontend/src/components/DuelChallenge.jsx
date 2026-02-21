import React, { useState, useEffect } from 'react';
import { createDuel, getJobProfiles } from '../services/api';

const DuelChallenge = ({ onClose, onChallengeCreated, userId, initialOpponent }) => {
    const [opponentId, setOpponentId] = useState(initialOpponent || '');
    const [difficulty, setDifficulty] = useState('medium');
    const [jobProfile, setJobProfile] = useState('');
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [profilesLoading, setProfilesLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const res = await getJobProfiles();
                if (res.data.success) {
                    setProfiles(res.data.profiles);
                    // Set default profile if available
                    if (res.data.profiles.length > 0) {
                        setJobProfile(res.data.profiles.find(p => p.id === 'software-engineer')?.id || res.data.profiles[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to load profiles:", err);
                setError("Failed to load job profiles");
            } finally {
                setProfilesLoading(false);
            }
        };
        fetchProfiles();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!opponentId.trim()) {
            setError('Please enter an opponent ID');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await createDuel(userId, opponentId, difficulty, jobProfile);
            onChallengeCreated();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create duel');
        } finally {
            setLoading(false);
        }
    };

    // Group profiles by Category
    const groupedProfiles = profiles.reduce((acc, profile) => {
        const cat = profile.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(profile);
        return acc;
    }, {});

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl shadow-indigo-500/10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span className="text-indigo-500"><i className="fa-solid fa-swords"></i></span>
                        Create Challenge
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/50 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Opponent Input */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Opponent User ID / Username
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-3.5 text-zinc-500"><i className="fa-solid fa-user"></i></span>
                            <input
                                type="text"
                                value={opponentId}
                                onChange={(e) => setOpponentId(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-zinc-600"
                                placeholder="Enter their ID..."
                            />
                        </div>
                    </div>

                    {/* Difficulty Selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Assessment Level
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {['easy', 'medium', 'hard'].map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setDifficulty(level)}
                                    className={`py-2 rounded-lg text-sm font-bold capitalize transition-all border ${difficulty === level
                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                            : 'bg-zinc-800 border-transparent text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Job Profile Selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Skill Domain
                        </label>
                        {profilesLoading ? (
                            <div className="h-12 bg-zinc-800 rounded-lg animate-pulse"></div>
                        ) : (
                            <div className="relative">
                                <span className="absolute left-3 top-3.5 text-zinc-500"><i className="fa-solid fa-briefcase"></i></span>
                                <select
                                    value={jobProfile}
                                    onChange={(e) => setJobProfile(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3 bg-black/40 border border-white/10 rounded-lg text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                >
                                    {Object.entries(groupedProfiles).map(([category, catProfiles]) => (
                                        <optgroup key={category} label={category}>
                                            {catProfiles.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.icon} {p.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                <span className="absolute right-3 top-3.5 text-zinc-500 pointer-events-none">
                                    <i className="fa-solid fa-chevron-down text-xs"></i>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                            <i className="fa-solid fa-circle-exclamation"></i> {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || profilesLoading}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-bold text-white hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                                Sending Challenge...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <i className="fa-regular fa-paper-plane"></i> Send Challenge
                            </span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DuelChallenge;
