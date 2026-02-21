import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { BubbleTree } from "../components/BubbleComponents";

function PublicProfile() {
    const { username } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("performance"); // performance, thinking

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || ""}/api/profile/u/${username}`)
            .then((res) => {
                if (!res.ok) throw new Error("Profile not found");
                return res.json();
            })
            .then((d) => {
                setData(d);
                setLoading(false);
            })
            .catch((e) => {
                console.error(e);
                setLoading(false);
            });
    }, [username]);

    if (loading) return <Loader text="Loading Profile..." />;

    if (!data) return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
                <button onClick={() => navigate("/")} className="text-indigo-400 hover:text-white underline">Return Home</button>
            </div>
        </div>
    );

    const { user, stats, badges } = data;

    // Mock Bubble Data for Demo
    const mockBubbles = [
        {
            id: 'b1',
            topic: "AI Ethics in Recruitment",
            originPost: { title: "Is AI-based hiring fair?", author: user.name, timestamp: Date.now() - 86400000 },
            rootNode: {
                id: 'n1',
                author: user.name,
                content: "I believe cognitive metrics are fairer than resumes because they ignore background bias.",
                timestamp: Date.now() - 86400000,
                upvotes: 12,
                children: [
                    {
                        id: 'n2',
                        author: "Sarah J.",
                        content: "But what about anxiety affecting test scores?",
                        timestamp: Date.now() - 80000000,
                        upvotes: 5,
                        children: [
                            {
                                id: 'n3',
                                author: user.name,
                                content: "That's why the 'Confidence' metric exists—to adjust for hesitation versus incompetence.",
                                timestamp: Date.now() - 75000000,
                                upvotes: 8,
                                children: []
                            }
                        ]
                    }
                ]
            }
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-6 pt-24">
            <div className="max-w-4xl mx-auto">

                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold p-1">
                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-bold mb-1 flex items-center justify-center md:justify-start gap-2">
                            {user.name}
                            {user.tier === 'Outlier' && <span title="Outlier Status"><i className="fa-solid fa-star"></i></span>}
                        </h1>
                        <div className="text-zinc-400 mb-4">@{user.username || 'user'} • {user.role}</div>

                        <div className="flex gap-4 justify-center md:justify-start">
                            <div className="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
                                <div className="text-xs text-zinc-500 uppercase">Best Score</div>
                                <div className="text-xl font-bold text-indigo-400">{user.bestScore}</div>
                            </div>
                            <div className="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
                                <div className="text-xs text-zinc-500 uppercase">Tier</div>
                                <div className="text-xl font-bold text-white">{user.tier || 'Analyst'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-zinc-800 mb-8">
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'performance' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-white'}`}
                    >
                        Performance
                    </button>
                    <button
                        onClick={() => setActiveTab('thinking')}
                        className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'thinking' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-white'}`}
                    >
                        Public Thinking
                    </button>
                </div>

                {activeTab === 'performance' ? (
                    <div className="animate-fade-in">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
                                <h3 className="text-lg font-bold mb-4 border-b border-zinc-800 pb-2">Cognitive Stats</h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-zinc-400">Logic & Reasoning</span>
                                            <span>{stats?.logic || 75}%</span>
                                        </div>
                                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${stats?.logic || 75}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-zinc-400">Pattern Recognition</span>
                                            <span>{stats?.pattern || 60}%</span>
                                        </div>
                                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500" style={{ width: `${stats?.pattern || 60}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
                                <h3 className="text-lg font-bold mb-4 border-b border-zinc-800 pb-2">Achievements</h3>
                                <div className="flex flex-wrap gap-3">
                                    {badges && badges.length > 0 ? badges.map((b, i) => (
                                        <span key={i} className="px-3 py-1 bg-yellow-900/20 text-yellow-500 border border-yellow-700/50 rounded-full text-sm">
                                            {b}
                                        </span>
                                    )) : (
                                        <span className="text-zinc-500 italic">No badges earned yet.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-8 border-t border-zinc-900">
                            <button
                                onClick={() => navigate(`/duel?opponentId=${user.id}`)}
                                className="px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
                            >
                                Challenge {user.name} <i className="fa-solid fa-swords"></i>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        {mockBubbles.map(bubble => (
                            <BubbleTree key={bubble.id} bubble={bubble} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}

export default PublicProfile;
