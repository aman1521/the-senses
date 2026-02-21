import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getUserDuels, createDuel } from '../services/api';
import DuelChallenge from '../components/DuelChallenge';
import DuelResults from '../components/DuelResults';
import DuelArena from '../components/DuelArena';

const Duel = () => {
    const [duels, setDuels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showChallengeForm, setShowChallengeForm] = useState(false);
    const [selectedDuel, setSelectedDuel] = useState(null); // For results
    const [activeDuel, setActiveDuel] = useState(null); // For playing

    // Real user ID from auth
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");

    const [searchParams] = useSearchParams();
    const initialOpponent = searchParams.get("opponentId");

    useEffect(() => {
        if (initialOpponent) {
            setShowChallengeForm(true);
        }
        fetchDuels();
    }, [initialOpponent]);

    const fetchDuels = async () => {
        try {
            setLoading(true);
            const response = await getUserDuels(userId);
            setDuels(response.data || []);
        } catch (error) {
            console.error('Failed to fetch duels:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChallengeCreated = () => {
        setShowChallengeForm(false);
        fetchDuels();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return '#10b981';
            case 'accepted':
                return '#3b82f6';
            case 'pending':
                return '#f59e0b';
            case 'expired':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getStatusLabel = (status) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-6 py-16">
                <h1 className="text-3xl font-bold mb-8 text-center">Duels Arena</h1>
                <div className="text-center text-white/50">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold"><i className="fa-solid fa-swords"></i> Duels Arena</h1>
                <button
                    onClick={() => setShowChallengeForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                    + New Challenge
                </button>
            </div>

            {showChallengeForm && (
                <DuelChallenge
                    onClose={() => setShowChallengeForm(false)}
                    onChallengeCreated={handleChallengeCreated}
                    userId={userId}
                    initialOpponent={initialOpponent}
                />
            )}

            {selectedDuel && (
                <DuelResults
                    duel={selectedDuel}
                    onClose={() => setSelectedDuel(null)}
                />
            )}

            {activeDuel && (
                <DuelArena
                    duelId={activeDuel._id}
                    userId={userId}
                    isChallenger={activeDuel.challenger._id === userId}
                    onClose={() => setActiveDuel(null)}
                    onComplete={() => {
                        setActiveDuel(null);
                        fetchDuels();
                    }}
                />
            )}

            <div className="grid gap-4">
                {duels.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-xl">
                        <p className="text-white/50 mb-4">No duels yet</p>
                        <p className="text-white/70 text-sm">Challenge someone to start battling!</p>
                    </div>
                ) : (
                    duels.map((duel) => (
                        <div
                            key={duel._id}
                            className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => duel.status === 'completed' && setSelectedDuel(duel)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    {/* Challenger */}
                                    <div className="text-center">
                                        <div className="text-sm text-white/50 mb-1">Challenger</div>
                                        <div className="font-semibold text-white">{duel.challenger.name}</div>
                                        {duel.finalChallengerScore !== undefined && (
                                            <div className="text-blue-400 font-bold mt-1">
                                                {duel.finalChallengerScore}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-2xl text-white/30">VS</div>

                                    {/* Opponent */}
                                    <div className="text-center">
                                        <div className="text-sm text-white/50 mb-1">Opponent</div>
                                        <div className="font-semibold text-white">{duel.opponent.name}</div>
                                        {duel.finalOpponentScore !== undefined && (
                                            <div className="text-purple-400 font-bold mt-1">
                                                {duel.finalOpponentScore}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Action Button */}
                                    {duel.status === 'pending' && duel.opponent._id === userId && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDuel(duel);
                                            }}
                                            className="ml-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold shadow-lg shadow-green-500/20"
                                        >
                                            Accept Challenge
                                        </button>
                                    )}

                                    {duel.status === 'accepted' && duel.challenger._id === userId && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDuel(duel);
                                            }}
                                            className="ml-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20"
                                        >
                                            Enter Arena
                                        </button>
                                    )}

                                    {/* Status Badge */}
                                    <div
                                        className="px-4 py-2 rounded-lg font-medium text-sm"
                                        style={{
                                            backgroundColor: `${getStatusColor(duel.status)}20`,
                                            color: getStatusColor(duel.status),
                                        }}
                                    >
                                        {getStatusLabel(duel.status)}
                                    </div>

                                    {/* Winner Badge */}
                                    {duel.winner && (
                                        <div className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg font-medium text-sm">
                                            <i className="fa-solid fa-trophy"></i> {duel.winner === duel.challenger._id ? duel.challenger.name : duel.opponent.name} Wins!
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Trust Weight Info */}
                            {duel.status === 'completed' && (
                                <div className="mt-4 pt-4 border-t border-white/10 flex gap-6 text-sm text-white/60">
                                    <div>
                                        Challenger Trust: <span className="text-white/90">{((duel.challengerTrustWeight - 1) * 100).toFixed(0)}% boost</span>
                                    </div>
                                    <div>
                                        Opponent Trust: <span className="text-white/90">{((duel.opponentTrustWeight - 1) * 100).toFixed(0)}% boost</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Duel;
