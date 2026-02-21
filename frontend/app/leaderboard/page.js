"use client";

import { useEffect, useState } from "react";
import { getLeaderboard } from "@/services/rankService";
import AuthGuard from "@/components/auth/AuthGuard";

export default function LeaderboardPage() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLeaderboard().then((res) => {
            setPlayers(res.data || []);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-8 text-white text-center">Loading players…</div>;

    return (
        <AuthGuard>
            <div className="max-w-3xl mx-auto p-6 space-y-6">
                <h1 className="text-3xl font-bold text-white">Global Leaderboard</h1>

                <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-800 text-zinc-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">Rank</th>
                                <th className="px-6 py-3">Player</th>
                                <th className="px-6 py-3">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {players.map((p, i) => (
                                <tr key={p._id || i} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">#{i + 1}</td>
                                    <td className="px-6 py-4 text-white">{p.name || "Unknown"}</td>
                                    <td className="px-6 py-4 text-indigo-400 font-bold">{p.score || p.bestScoreEver || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {players.length === 0 && (
                        <div className="p-8 text-center text-zinc-500">No players found yet.</div>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}
