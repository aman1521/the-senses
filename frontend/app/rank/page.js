"use client";

import { useEffect, useState } from "react";
import { fetchGlobalRankings } from "@/lib/api";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import LeaderboardFilters from "@/components/LeaderboardFilters";

export default function RankPage() {
  const router = useRouter();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const session = getSession();
    setLoading(true);

    fetchGlobalRankings(filters)
      .then((data) => {
        // data is now an array from getGlobalLeaderboard
        const rankingsData = Array.isArray(data) ? data : (data.rankings || []);
        setRankings(rankingsData);

        // Calculate statistics
        if (rankingsData.length > 0) {
          const scores = rankingsData.map(r => r.percentile || r.globalPercentile || 0);
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          const topScore = Math.max(...scores);

          setStats({
            totalUsers: rankingsData.length, // accurate for this page/filter
            averagePercentile: Math.round(avgScore),
            topPercentile: topScore,
          });

          // Find current user's rank if they have a result
          if (session?.user?.id) {
            const userEntryIndex = rankingsData.findIndex(r => r._id === session.user.id);

            if (userEntryIndex !== -1) {
              const userEntry = rankingsData[userEntryIndex];
              setUserRank({
                position: userEntryIndex + 1,
                percentile: userEntry.percentile,
                tier: userEntry.badge?.tier || 'N/A',
                betterThan: userEntry.percentile
              });
            } else if (session?.result?.rank) {
              // Fallback to session data if not in top list
              const userPercentile = session.result.rank.globalPercentile;
              const userPosition = rankingsData.findIndex(r =>
                (r.percentile || r.globalPercentile) <= userPercentile
              ) + 1;

              setUserRank({
                position: userPosition || rankingsData.length + 1,
                percentile: userPercentile,
                tier: session.result.rank.tier,
                betterThan: userPercentile,
              });
            }
          }
        } else {
          setStats({ totalUsers: 0, averagePercentile: 0, topPercentile: 0 });
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch rankings:", err);
        setLoading(false);
      });
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-white">Loading global intelligence rankings…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Global Intelligence Rankings
          </h1>
          <p className="text-zinc-400">
            Based on AI-evaluated cognitive performance and thinking profiles
          </p>
        </header>

        {/* Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="text-zinc-400 text-sm mb-1">Total Participants</div>
              <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="text-zinc-400 text-sm mb-1">Average Percentile</div>
              <div className="text-3xl font-bold text-indigo-400">{stats.averagePercentile}%</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="text-zinc-400 text-sm mb-1">Top Percentile</div>
              <div className="text-3xl font-bold text-purple-400">{stats.topPercentile}%</div>
            </div>
          </div>
        )}

        {/* User's Personal Rank (if available) */}
        {userRank && (
          <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl p-6 border border-indigo-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-300 mb-1">Your Ranking</div>
                <div className="text-2xl font-bold text-white">
                  #{userRank.position} · {userRank.tier}
                </div>
                <div className="text-indigo-300 mt-2">
                  You scored better than <span className="font-bold">{userRank.betterThan}%</span> of all participants
                </div>
              </div>
              <div className="text-5xl">{userRank.percentile >= 90 ? '🏆' : userRank.percentile >= 75 ? '⭐' : '📊'}</div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <section className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white mb-4">Top Performers</h2>
            <LeaderboardFilters onFilterChange={handleFilterChange} />
          </div>

          {rankings.length === 0 && (
            <p className="p-8 text-center text-zinc-500">No rankings available yet.</p>
          )}

          <div className="divide-y divide-zinc-800">
            {rankings.map((user, index) => (
              <div
                key={index}
                className="p-4 hover:bg-zinc-800/50 transition-colors flex items-center gap-4"
              >
                {/* Rank Position */}
                <div className="flex-shrink-0 w-12 text-center">
                  <span className={`text-2xl font-bold ${index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-orange-400' :
                        'text-zinc-500'
                    }`}>
                    #{index + 1}
                  </span>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <strong className="text-white">{user.name || user.thinkingStyle || 'Anonymous'}</strong>
                    {user.trust?.isVerified && (
                      <i className="fa-solid fa-check-circle text-blue-400" title="Verified Human"></i>
                    )}
                    <span
                      className="px-2 py-0.5 text-xs rounded-full"
                      style={{
                        backgroundColor: user.badge?.color ? `${user.badge.color}20` : 'rgba(99, 102, 241, 0.2)',
                        color: user.badge?.color || '#a5b4fc'
                      }}
                    >
                      {user.badge?.tier || user.tier || 'Starter'}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-400">
                    {user.jobProfile || user.field || 'General Intelligence'}
                  </div>
                </div>

                {/* Percentile */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-400">
                    {user.percentile || user.globalPercentile}%
                  </div>
                  <div className="text-xs text-zinc-500">percentile</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => router.push("/test")}
            className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
          >
            Take the Test →
          </button>
        </div>
      </div>
    </main>
  );
}
