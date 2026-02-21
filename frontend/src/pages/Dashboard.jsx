import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCareerAdvice } from "../services/api";

// Sub-components moved here for single-file simplicity
function StatCard({ label, value, subtext, icon, color }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <span className="text-zinc-400 text-sm font-medium">{label}</span>
                <span className={`text-2xl ${color}`}>{icon}</span>
            </div>
            <div className="text-3xl font-bold text-white">{value}</div>
            {subtext && <div className="text-xs text-zinc-500 mt-1">{subtext}</div>}
        </div>
    );
}

function ActivityItem({ game }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric'
        });
    };

    const content = (
        <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl hover:bg-black/60 transition-colors border border-transparent hover:border-zinc-800 cursor-pointer">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg relative">
                    <i className="fa-solid fa-brain"></i>
                    {game.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border border-black" title="Verified Integrity">
                            <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                    )}
                </div>
                <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                        {game.profile} Assessment
                    </div>
                    <div className="text-xs text-zinc-500">{formatDate(game.date)}</div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xl font-bold text-indigo-400">{game.score}</div>
                <div className="text-xs text-zinc-500 flex justify-end items-center gap-1">
                    {game.verified ? <span className="text-green-500 font-bold">Verified</span> : <span className="text-red-900">Unverified</span>}
                </div>
            </div>
        </div>
    );

    if (game.sessionId) {
        return (
            <Link to={`/review/${game.sessionId}`} className="block">
                {content}
            </Link>
        );
    }
    return content;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState({ name: "", token: "" });
    const [stats, setStats] = useState(null);
    const [careerAdvice, setCareerAdvice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const name = localStorage.getItem("userName");

        if (!token) {
            navigate("/login");
            return;
        }

        setUser({ name, token });

        const fetchStats = async () => {
            try {
                // Fetch stats from backend
                // Fallback demo data if fetch fails (while setting up)
                const mockStats = {
                    totalTests: 0,
                    averageScore: 0,
                    bestScore: 0,
                    currentTier: "Newcomer",
                    recentGames: [] // Empty
                };

                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard/stats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setStats(data.stats);
                    } else {
                        setStats(mockStats);
                    }
                } else {
                    console.error("Failed to fetch dashboard stats, using empty state");
                    setStats(mockStats);
                }

                // Fetch Career Advice in parallel (non-blocking for main stats)
                try {
                    const adviceRes = await getCareerAdvice();
                    if (adviceRes.data && adviceRes.data.success) {
                        setCareerAdvice(adviceRes.data.suggestedRole);
                    }
                } catch (err) {
                    console.log("Career advice fetch failed silently", err);
                }

            } catch (error) {
                console.error("Failed to load dashboard stats", error);
                const mockStats = {
                    totalTests: 0,
                    averageScore: 0,
                    bestScore: 0,
                    currentTier: "Error Loading",
                    recentGames: []
                };
                setStats(mockStats);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                            User Dashboard
                        </h1>
                        <p className="text-zinc-400 mt-2">Welcome back, {user?.name || "Strategist"}</p>
                    </div>

                    <button
                        onClick={() => navigate("/profile-selection")}
                        className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-transform active:scale-95"
                    >
                        Take New Assessment +
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        label="Current Tier"
                        value={
                            stats.currentTier?.name ? (
                                <span className="flex items-center gap-2" style={{ color: stats.currentTier.color }}>
                                    <span>{stats.currentTier.emoji}</span>
                                    <span>{stats.currentTier.name}</span>
                                </span>
                            ) : "Observer"
                        }
                        subtext={stats.currentTier?.description || "Beginner"}
                        icon={<i className="fa-solid fa-trophy"></i>}
                        color="text-yellow-400"
                    />
                    <StatCard
                        label="Best Score"
                        value={stats.bestScore}
                        subtext="Global Best"
                        icon={<i className="fa-solid fa-gem"></i>}
                        color="text-indigo-400"
                    />
                    <StatCard
                        label="Average Score"
                        value={stats.averageScore}
                        icon={<i className="fa-solid fa-chart-bar"></i>}
                        color="text-emerald-400"
                    />
                    <StatCard
                        label="Tests Taken"
                        value={stats.totalTests}
                        icon={<i className="fa-solid fa-clipboard-check"></i>}
                        color="text-purple-400"
                    />
                </div>

                {/* Recent Activity Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Recent Tests List */}
                    <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Recent Activity</h3>
                        </div>

                        <div className="space-y-4">
                            {stats.recentGames && stats.recentGames.length > 0 ? (
                                stats.recentGames.map((game) => (
                                    <ActivityItem key={game.id} game={game} />
                                ))
                            ) : (
                                <div className="text-center py-10 text-zinc-500">
                                    No tests taken yet. Start your journey!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Profile Info / Ads / Tips */}
                    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Your Identity</h3>
                            <button className="text-xs text-indigo-400 hover:text-indigo-300">Edit</button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-black/40 rounded-xl border border-zinc-800">
                                <div className="text-sm text-zinc-400">Professional Role</div>
                                <div className="font-bold text-lg text-white capitalize">
                                    {localStorage.getItem('userProfileType') || JSON.parse(localStorage.getItem('selectedProfile') || '{}').name || 'Generalist'}
                                </div>
                            </div>

                            <div className="p-4 bg-black/40 rounded-xl border border-zinc-800">
                                <div className="text-sm text-zinc-400">Next Milestone</div>
                                <div className="font-semibold text-white">Elite Mind (Score 850+)</div>
                                <div className="w-full bg-zinc-800 h-2 rounded-full mt-2">
                                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '70%' }}></div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-800">
                                <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
                                    View Full Assessment History
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* AI Career Insight Card */}
                    <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                            <i className="fa-solid fa-wand-magic-sparkles text-8xl text-purple-400"></i>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-lg border border-purple-500/30">
                                    <i className="fa-solid fa-robot"></i>
                                    AI INSIGHT
                                </span>
                            </div>

                            <h3 className="text-zinc-400 text-sm font-medium mb-1">Recommended Career Path</h3>
                            <div className="text-2xl font-bold text-white mb-3 leading-tight">
                                {careerAdvice || "Analyze your skills..."}
                            </div>

                            <p className="text-zinc-400 text-xs leading-relaxed">
                                Our AI analyzed your specific strengths and cognitive patterns to suggest this optimal role.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
