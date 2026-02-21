"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/apiClient"; // Assuming you have an API client
import Link from "next/link";

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        const fetchStats = async () => {
            try {
                // Using standard fetch or your API client wrapper
                // Replace with your actual API call method if different
                const token = localStorage.getItem("token"); // Or however you store it
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.success) {
                    setStats(data.stats);
                }
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [isAuthenticated, router]);

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
                        onClick={() => router.push("/profile-selection")}
                        className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-transform active:scale-95"
                    >
                        Take New Assessment +
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        label="Current Tier"
                        value={stats.currentTier}
                        icon="🏆"
                        color="text-yellow-400"
                    />
                    <StatCard
                        label="Best Score"
                        value={stats.bestScore}
                        subtext="Top 5% Global"
                        icon="💎"
                        color="text-indigo-400"
                    />
                    <StatCard
                        label="Average Score"
                        value={stats.averageScore}
                        icon="📊"
                        color="text-emerald-400"
                    />
                    <StatCard
                        label="Tests Taken"
                        value={stats.totalTests}
                        icon="📝"
                        color="text-purple-400"
                    />
                </div>

                {/* Recent Activity Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Recent Tests List */}
                    <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Recent Activity</h3>
                            <Link href="/dashboard/history" className="text-sm text-indigo-400 hover:text-indigo-300">
                                View Full History →
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {stats.recentGames.length > 0 ? (
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
                        <h3 className="text-xl font-bold mb-4">Your Profile</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-black/40 rounded-xl">
                                <div className="text-sm text-zinc-400">Primary Role</div>
                                <div className="font-semibold">{localStorage.getItem('selectedProfile') ? JSON.parse(localStorage.getItem('selectedProfile')).name : 'Not set'}</div>
                            </div>

                            <div className="p-4 bg-black/40 rounded-xl">
                                <div className="text-sm text-zinc-400">Next Milestone</div>
                                <div className="font-semibold">Elite Mind (Score 85+)</div>
                                <div className="w-full bg-zinc-800 h-2 rounded-full mt-2">
                                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '70%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-components for cleaner file
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

    return (
        <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl hover:bg-black/60 transition-colors">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">
                    🧠
                </div>
                <div>
                    <div className="font-semibold text-white">{game.profile} Assessment</div>
                    <div className="text-xs text-zinc-500">{formatDate(game.date)}</div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xl font-bold text-indigo-400">{game.score}</div>
                <div className="text-xs text-zinc-500">{game.tier}</div>
            </div>
        </div>
    );
}
