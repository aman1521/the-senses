import React from 'react';

const DuelResults = ({ duel, onClose }) => {
    const challengerWon = duel.winner && String(duel.winner) === String(duel.challenger._id);
    const opponentWon = duel.winner && String(duel.winner) === String(duel.opponent._id);
    const isDraw = !duel.winner;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold"><i className="fa-solid fa-trophy"></i> Duel Results</h2>
                    <button
                        onClick={onClose}
                        className="text-white/50 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Winner Announcement */}
                <div className="text-center mb-8 p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
                    {isDraw ? (
                        <div className="text-2xl font-bold text-yellow-400">
                            <i className="fa-solid fa-handshake"></i> It's a Draw!
                        </div>
                    ) : (
                        <div className="text-2xl font-bold text-yellow-400">
                            <i className="fa-solid fa-trophy"></i> {challengerWon ? duel.challenger.name : duel.opponent.name} Wins!
                        </div>
                    )}
                </div>

                {/* Score Comparison */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Challenger Column */}
                    <div className="text-center">
                        <div className="text-lg font-semibold mb-4 text-white">
                            {duel.challenger.name}
                        </div>
                        <div className="space-y-3">
                            <div className="p-3 bg-white/5 rounded-lg">
                                <div className="text-xs text-white/50 mb-1">Base Score</div>
                                <div className="text-xl font-bold text-blue-400">
                                    {duel.challengerScore}
                                </div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                                <div className="text-xs text-white/50 mb-1">Trust Boost</div>
                                <div className="text-sm font-semibold text-green-400">
                                    {((duel.challengerTrustWeight - 1) * 100).toFixed(0)}%
                                </div>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                                <div className="text-xs text-white/50 mb-1">Final Score</div>
                                <div className="text-2xl font-bold text-blue-300">
                                    {duel.finalChallengerScore}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* VS Divider */}
                    <div className="flex items-center justify-center">
                        <div className="text-4xl font-bold text-white/20">VS</div>
                    </div>

                    {/* Opponent Column */}
                    <div className="text-center">
                        <div className="text-lg font-semibold mb-4 text-white">
                            {duel.opponent.name}
                        </div>
                        <div className="space-y-3">
                            <div className="p-3 bg-white/5 rounded-lg">
                                <div className="text-xs text-white/50 mb-1">Base Score</div>
                                <div className="text-xl font-bold text-purple-400">
                                    {duel.opponentScore}
                                </div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                                <div className="text-xs text-white/50 mb-1">Trust Boost</div>
                                <div className="text-sm font-semibold text-green-400">
                                    {((duel.opponentTrustWeight - 1) * 100).toFixed(0)}%
                                </div>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                                <div className="text-xs text-white/50 mb-1">Final Score</div>
                                <div className="text-2xl font-bold text-purple-300">
                                    {duel.finalOpponentScore}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trust System Explanation */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl"><i className="fa-solid fa-circle-info"></i></div>
                        <div className="text-sm text-white/70">
                            <strong className="text-white">Trust Weighting:</strong> Players with higher trust scores receive score boosts.
                            This rewards consistent, genuine performance and prevents easy-mode farming.
                        </div>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default DuelResults;
