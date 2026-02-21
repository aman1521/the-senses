import React, { useState, useEffect } from 'react';
import { getAIProfiles, simulateAIBattle, getAIBattleHistory, submitAIBattleVote } from '../services/api';
import AIProfileCard from '../components/AIProfileCard';

const AIBattle = () => {
    const [profiles, setProfiles] = useState([]);
    const [selectedAI1, setSelectedAI1] = useState(null);
    const [selectedAI2, setSelectedAI2] = useState(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [battleResponses, setBattleResponses] = useState(null);
    const [battling, setBattling] = useState(false);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scores, setScores] = useState({ ai1: 50, ai2: 50 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profilesRes, historyRes] = await Promise.all([
                getAIProfiles(),
                getAIBattleHistory(),
            ]);
            setProfiles(profilesRes.data || []);
            setHistory(historyRes.data || []);
        } catch (error) {
            console.error('Failed to fetch AI data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAI1 = (profile) => {
        if (selectedAI2 && selectedAI2._id === profile._id) {
            setSelectedAI2(null);
        }
        setSelectedAI1(profile);
    };

    const handleSelectAI2 = (profile) => {
        if (selectedAI1 && selectedAI1._id === profile._id) {
            setSelectedAI1(null);
        }
        setSelectedAI2(profile);
    };

    const handleBattle = async () => {
        if (!selectedAI1 || !selectedAI2) {
            alert('Please select two AI models to battle');
            return;
        }

        if (!userPrompt.trim()) {
            alert('Please enter a question or prompt');
            return;
        }

        try {
            setBattling(true);
            setBattleResponses(null);

            const response = await simulateAIBattle(selectedAI1._id, selectedAI2._id, userPrompt);

            if (response.data.type === 'interactive') {
                setBattleResponses({
                    ai1: { name: selectedAI1.name, emoji: selectedAI1.emoji, color: selectedAI1.color, response: response.data.responses.ai1Response },
                    ai2: { name: selectedAI2.name, emoji: selectedAI2.emoji, color: selectedAI2.color, response: response.data.responses.ai2Response }
                });
            }
        } catch (error) {
            console.error('Battle failed:', error);
            alert('Battle simulation failed');
        } finally {
            setBattling(false);
        }
    };

    const handleSubmitVote = async (winnerId) => {
        try {
            await submitAIBattleVote(selectedAI1._id, selectedAI2._id, winnerId, scores.ai1, scores.ai2);
            alert('Vote submitted! Stats updated.');

            // Reset
            setBattleResponses(null);
            setUserPrompt('');
            setScores({ ai1: 50, ai2: 50 });

            // Refresh data
            fetchData();
        } catch (error) {
            console.error('Vote submission failed:', error);
            alert('Failed to submit vote');
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-16">
                <h1 className="text-3xl font-bold mb-8 text-center">AI Battle Arena</h1>
                <div className="text-center text-white/50">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">
                    <i className="fa-solid fa-robot"></i> Interactive AI Battle
                </h1>
                <p className="text-white/70">
                    Ask a question, watch AI models compete, then judge who answered better
                </p>
            </div>

            {/* Battle Setup */}
            <div className="mb-12">
                <div className="grid grid-cols-3 gap-6 mb-6">
                    {/* AI 1 Selection */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-center">
                            {selectedAI1 ? `${selectedAI1.emoji} ${selectedAI1.name}` : 'Select AI #1'}
                        </h3>
                        <div className="grid gap-4">
                            {profiles.slice(0, 3).map(profile => (
                                <AIProfileCard
                                    key={profile._id}
                                    profile={profile}
                                    onSelect={handleSelectAI1}
                                    isSelected={selectedAI1?._id === profile._id}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Battle Controls */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-6xl mb-6 text-white/30">VS</div>

                        <textarea
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            placeholder="Ask a question... (e.g., 'Explain quantum computing in simple terms')"
                            className="w-full mb-4 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white outline-none focus:border-blue-500 resize-none h-32"
                        />

                        <button
                            onClick={handleBattle}
                            disabled={!selectedAI1 || !selectedAI2 || !userPrompt.trim() || battling}
                            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full"
                        >
                            {battling ? <><i className="fa-solid fa-swords"></i> Generating...</> : <><i className="fa-solid fa-swords"></i> Start Battle</>}
                        </button>
                    </div>

                    {/* AI 2 Selection */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-center">
                            {selectedAI2 ? `${selectedAI2.emoji} ${selectedAI2.name}` : 'Select AI #2'}
                        </h3>
                        <div className="grid gap-4">
                            {profiles.slice(3, 6).map(profile => (
                                <AIProfileCard
                                    key={profile._id}
                                    profile={profile}
                                    onSelect={handleSelectAI2}
                                    isSelected={selectedAI2?._id === profile._id}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Battle Responses */}
                {battleResponses && (
                    <div className="mt-8 p-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30">
                        <h2 className="text-2xl font-bold mb-6 text-center">Battle Results - You Decide!</h2>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            {/* AI 1 Response */}
                            <div className="p-6 bg-black/30 rounded-xl border border-white/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-3xl">{battleResponses.ai1.emoji}</span>
                                    <div>
                                        <div className="font-bold text-lg" style={{ color: battleResponses.ai1.color }}>
                                            {battleResponses.ai1.name}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-white/90 leading-relaxed mb-4 whitespace-pre-wrap">
                                    {battleResponses.ai1.response}
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="text-sm text-white/70">Your Score:</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={scores.ai1}
                                        onChange={(e) => setScores({ ...scores, ai1: parseInt(e.target.value) })}
                                        className="flex-1"
                                    />
                                    <span className="text-white font-bold w-12">{scores.ai1}</span>
                                </div>
                            </div>

                            {/* AI 2 Response */}
                            <div className="p-6 bg-black/30 rounded-xl border border-white/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-3xl">{battleResponses.ai2.emoji}</span>
                                    <div>
                                        <div className="font-bold text-lg" style={{ color: battleResponses.ai2.color }}>
                                            {battleResponses.ai2.name}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-white/90 leading-relaxed mb-4 whitespace-pre-wrap">
                                    {battleResponses.ai2.response}
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="text-sm text-white/70">Your Score:</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={scores.ai2}
                                        onChange={(e) => setScores({ ...scores, ai2: parseInt(e.target.value) })}
                                        className="flex-1"
                                    />
                                    <span className="text-white font-bold w-12">{scores.ai2}</span>
                                </div>
                            </div>
                        </div>

                        {/* Vote Buttons */}
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => handleSubmitVote(selectedAI1._id)}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
                            >
                                {battleResponses.ai1.emoji} {battleResponses.ai1.name} Wins
                            </button>
                            <button
                                onClick={() => handleSubmitVote(null)}
                                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold transition-colors"
                            >
                                <i className="fa-solid fa-handshake"></i> It's a Draw
                            </button>
                            <button
                                onClick={() => handleSubmitVote(selectedAI2._id)}
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-colors"
                            >
                                {battleResponses.ai2.emoji} {battleResponses.ai2.name} Wins
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Battle History / Leaderboard */}
            <div>
                <h2 className="text-2xl font-bold mb-6"><i className="fa-solid fa-chart-bar"></i> Battle Statistics</h2>
                <div className="bg-white/5 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">
                                    AI Model
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-white/70 uppercase">
                                    Wins
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-white/70 uppercase">
                                    Losses
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-white/70 uppercase">
                                    Win Rate
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-white/70 uppercase">
                                    Avg Score
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((ai, index) => (
                                <tr key={ai.id} className="border-t border-white/10 hover:bg-white/5">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{ai.emoji}</span>
                                            <span className="font-medium" style={{ color: ai.color }}>
                                                {ai.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-green-400 font-semibold">
                                        {ai.wins}
                                    </td>
                                    <td className="px-6 py-4 text-center text-red-400 font-semibold">
                                        {ai.losses}
                                    </td>
                                    <td className="px-6 py-4 text-center text-white font-semibold">
                                        {ai.winRate}%
                                    </td>
                                    <td className="px-6 py-4 text-center text-blue-400 font-semibold">
                                        {ai.avgScore}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AIBattle;
