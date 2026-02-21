import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

import Loader from "../components/Loader";
import { BubbleNode } from "../components/BubbleComponents";

// Mock Bubble Data
const mockBubble = {
    id: 1,
    topic: "The Ethics of AI",
    originPost: { title: "Should AI replace human interviewers?", author: "System", timestamp: new Date() },
    rootNode: {
        id: "root",
        author: "You",
        content: "I believe AI can remove bias, but only if the training data is clean. Otherwise it just amplifies existing prejudices.",
        timestamp: new Date(Date.now() - 3600000),
        upvotes: 12,
        children: [
            {
                id: "c1",
                author: "Analyst_42",
                content: "But how do we define 'clean' data? Isn't all historical hiring data biased?",
                timestamp: new Date(Date.now() - 3000000),
                upvotes: 5,
                children: [
                    {
                        id: "c2",
                        author: "You",
                        content: "That's a fair point. We might need synthetic data generation to create truly neutral benchmarks.",
                        timestamp: new Date(Date.now() - 1800000),
                        upvotes: 8,
                        children: []
                    }
                ]
            }
        ]
    }
};

// Mock Data (will replace with API calls later or pass through props)
const performanceData = [
    { date: 'Week 1', score: 65, attention: 70, reflex: 400 },
    { date: 'Week 2', score: 68, attention: 72, reflex: 380 },
    { date: 'Week 3', score: 75, attention: 68, reflex: 350 },
    { date: 'Week 4', score: 82, attention: 85, reflex: 320 },
];

const radarData = [
    { subject: 'Logic', A: 120, fullMark: 150 },
    { subject: 'Memory', A: 98, fullMark: 150 },
    { subject: 'Attention', A: 86, fullMark: 150 },
    { subject: 'Speed', A: 99, fullMark: 150 },
    { subject: 'Adaptability', A: 85, fullMark: 150 },
    { subject: 'Integrity', A: 140, fullMark: 150 },
];

const timelineEvents = [
    { id: 1, date: "Today, 10:23 AM", type: "system", title: "Assessment Completed", desc: "You performed well in Logic but hesitated in Memory tasks.", insights: ["Try the 'Rapid Recall' drill to improve memory retrieval."] },
    { id: 2, date: "Yesterday, 4:00 PM", type: "reflection", title: "Deep Work Session", desc: "Noted high focus, but felt fatigued after 30 mins." },
    { id: 3, date: "Oct 20, 2023", type: "social", title: "Bubble Discussion: 'AI Ethics'", desc: "You contributed a counter-argument that sparked 4 replies." },
];

function UserDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview"); // overview, growth, timeline, bubbles
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const name = localStorage.getItem("userName");
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchStats = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/dashboard/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && data.stats) {
                    setUser({
                        name: name || "Strategist",
                        role: localStorage.getItem("userProfileType") || "Generalist",
                        score: data.stats.bestScore,
                        rank: data.stats.currentTier?.name || "Observer",
                        rankPercentile: data.stats.percentile || 50,
                        confidence: 85, // Placeholder
                        integrity: "High",
                        streak: data.stats.totalTests > 0 ? 1 : 0, // Placeholder
                        recentGames: data.stats.recentGames || [],
                        averageScore: data.stats.averageScore || 0,
                    });
                } else {
                    throw new Error("Stats not found");
                }
            } catch (error) {
                console.error("Dashboard DB fetch failed", error);
                // Fallback state
                setUser({
                    name: name || "Optimist",
                    role: localStorage.getItem("userProfileType") || "Generalist",
                    score: 0,
                    rank: "Unknown",
                    rankPercentile: 50,
                    confidence: 0,
                    integrity: "Checking...",
                    streak: 0,
                    recentGames: [],
                    averageScore: 0,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [navigate]);

    if (loading) return <Loader text="Loading your diverse profile..." />;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-24">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* 1. Dashboard Header (User Focused) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                            Hello, {user.name}
                        </h1>
                        <p className="text-zinc-400 mt-1">
                            Your cognitive profile is <span className="text-indigo-400 font-bold">evolving</span>.
                            <span className="ml-2 text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                                <i className="fa-solid fa-fire text-orange-500 mr-1"></i> {user.streak} Day Streak
                            </span>
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={() => navigate("/profile-selection")}
                            className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/10"
                        >
                            <i className="fa-solid fa-play mr-2"></i> Start New Assessment
                        </button>
                    </div>
                </div>

                {/* 2. Navigation Tabs */}
                <div className="border-b border-zinc-800 flex gap-8 overflow-x-auto pb-1">
                    <TabButton id="overview" label="Performance Overview" icon="chart-simple" active={activeTab} set={setActiveTab} />
                    <TabButton id="growth" label="Growth & Insights" icon="seedling" active={activeTab} set={setActiveTab} />
                    <TabButton id="timeline" label="Cognitive Timeline" icon="timeline" active={activeTab} set={setActiveTab} />
                    <TabButton id="bubbles" label="Discussions" icon="comments" active={activeTab} set={setActiveTab} />
                </div>

                {/* 3. Content Area */}
                <div className="animate-fade-in min-h-[500px]">
                    {activeTab === "overview" && <OverviewTab user={user} />}
                    {activeTab === "growth" && <GrowthTab />}
                    {activeTab === "timeline" && <TimelineTab />}
                    {activeTab === "bubbles" && <BubblesTab />}
                </div>

            </div>
        </div>
    );
}

// --- Sub-Components ---

const TabButton = ({ id, label, icon, active, set }) => (
    <button
        onClick={() => set(id)}
        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${active === id ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
            }`}
    >
        <i className={`fa-solid fa-${icon}`}></i> {label}
    </button>
);

const OverviewTab = ({ user }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Stats & Radar */}
            <div className="lg:col-span-2 space-y-6">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Global Rank"
                        value={`Top ${user.rankPercentile}%`}
                        subtext={user.rank}
                        color="text-emerald-400"
                        icon="earth-americas"
                    />
                    <StatCard
                        label="Confidence Index"
                        value={`${user.confidence}/100`}
                        subtext="Stable & Rising"
                        color="text-indigo-400"
                        icon="shield-halved"
                    />
                    <StatCard
                        label="Skill Score"
                        value={user.score}
                        subtext="+12 this week"
                        color="text-purple-400"
                        icon="brain"
                    />
                </div>

                {/* Radar Chart Section */}
                <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Skill Balance</h3>
                        <span className="text-xs text-zinc-500">Based on last 5 sessions</span>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#333" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                <Radar name="You" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} />
                                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Right Column: Feedback & Actions */}
            <div className="space-y-6">
                {/* Daily Tip Card */}
                <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded border border-indigo-500/30 flex items-center">
                                <i className="fa-solid fa-lightbulb mr-2"></i> COACHING TIP
                            </span>
                        </div>
                        <h3 className="font-bold text-white mb-2">Improve Focus Stability</h3>
                        <p className="text-sm text-zinc-300 mb-4">
                            Your performance dips slightly after 20 minutes. Try breaking your complex problem-solving into 10-minute sprints.
                        </p>
                        <button className="w-full py-2 bg-zinc-900 hover:bg-black border border-zinc-700 rounded text-xs font-bold text-zinc-300 transition-colors">
                            View Focus Drills
                        </button>
                    </div>
                    <i className="fa-solid fa-lightbulb absolute -right-2 -bottom-4 text-9xl text-indigo-500/5 rotate-12"></i>
                </div>

                {/* Weakness/Strength analysis */}
                <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase mb-4">Analysis</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-white"><i className="fa-solid fa-check text-emerald-500 mr-2"></i>Logic & Reasoning</span>
                                <span className="text-emerald-500">Strong</span>
                            </div>
                            <div className="w-full bg-zinc-900 h-1.5 rounded-full"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '85%' }}></div></div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-white"><i className="fa-solid fa-bolt text-indigo-500 mr-2"></i>Reflex Speed</span>
                                <span className="text-indigo-500">Good</span>
                            </div>
                            <div className="w-full bg-zinc-900 h-1.5 rounded-full"><div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '70%' }}></div></div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-white"><i className="fa-solid fa-triangle-exclamation text-orange-500 mr-2"></i>Memory Recall</span>
                                <span className="text-orange-500">Needs Focus</span>
                            </div>
                            <div className="w-full bg-zinc-900 h-1.5 rounded-full"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '45%' }}></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GrowthTab = () => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Chart */}
                <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-1">Skill Velocity</h3>
                    <p className="text-xs text-zinc-500 mb-6">Your improvement rate over the last 30 days.</p>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                <XAxis dataKey="date" stroke="#555" fontSize={12} />
                                <YAxis stroke="#555" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                                <Area type="monotone" dataKey="score" stroke="#818cf8" fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Attention Stability */}
                <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-1">Attention Consistency</h3>
                    <p className="text-xs text-zinc-500 mb-6">How stable your focus is during complex tasks.</p>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                <XAxis dataKey="date" stroke="#555" fontSize={12} />
                                <YAxis stroke="#555" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                                <Line type="monotone" dataKey="attention" stroke="#34d399" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Personal Insights Grid */}
            <h3 className="text-xl font-bold mt-8 mb-4">Personal Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InsightCard
                    title="Time Pressure"
                    desc="You perform 15% better when a visible timer is running. You thrive on urgency."
                    type="strength"
                />
                <InsightCard
                    title="Ambiguity Tolerance"
                    desc="You hesitate significantly on questions with 'None of the above' options."
                    type="neutral"
                />
                <InsightCard
                    title="Context Switching"
                    desc="Frequent tab switching in your last session reduced your confidence score by 12 points."
                    type="warning"
                />
            </div>
        </div>
    );
};

const TimelineTab = () => (
    <div className="max-w-3xl mx-auto">
        <div className="bg-[#111] border border-zinc-800 rounded-xl p-8">
            <h3 className="text-xl font-bold mb-6">Cognitive Journal</h3>
            <div className="space-y-8 pl-4 border-l-2 border-zinc-800">
                {timelineEvents.map((event) => (
                    <div key={event.id} className="relative pl-8 group">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[1.3rem] top-1 w-4 h-4 rounded-full border-2 bg-[#111] transition-all group-hover:scale-125 ${event.type === 'reflection' ? 'border-purple-500' :
                            event.type === 'social' ? 'border-green-500' : 'border-indigo-500'
                            }`}></div>

                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs text-zinc-500 font-mono uppercase tracking-wide">{event.date}</span>
                            <span className={`text-xs px-2 py-0.5 rounded border ${event.type === 'reflection' ? 'border-purple-900 text-purple-400 bg-purple-900/10' :
                                event.type === 'social' ? 'border-green-900 text-green-400 bg-green-900/10' : 'border-indigo-900 text-indigo-400 bg-indigo-900/10'
                                }`}>
                                {event.type}
                            </span>
                        </div>

                        <h4 className="text-lg font-bold text-white mb-2">{event.title}</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-3">{event.desc}</p>

                        {event.insights && (
                            <div className="bg-zinc-900/50 p-3 rounded border border-zinc-800 mt-2">
                                <p className="text-xs text-zinc-300 font-medium">
                                    <i className="fa-solid fa-arrow-right text-indigo-500 mr-2"></i>
                                    {event.insights[0]}
                                </p>
                            </div>
                        )}

                        {event.type === 'system' && (
                            <button className="mt-4 text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                                <i className="fa-regular fa-pen-to-square"></i> Add Reflection
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const BubblesTab = () => {
    const [view, setView] = useState("list"); // list, detail

    if (view === "detail") {
        return (
            <div className="animate-fade-in">
                <button
                    onClick={() => setView("list")}
                    className="mb-6 text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-bold"
                >
                    <i className="fa-solid fa-arrow-left"></i> Back to History
                </button>

                <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
                    <div className="mb-8 pb-6 border-b border-zinc-800">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-indigo-400 font-bold uppercase text-xs tracking-wider mb-2">
                                    <i className="fa-solid fa-comments"></i> Post Bubble: {mockBubble.topic}
                                </h3>
                                <h1 className="text-2xl font-bold text-white mb-2">{mockBubble.originPost.title}</h1>
                            </div>
                            <span className="bg-indigo-900/30 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded text-xs font-bold">
                                Active Discussion
                            </span>
                        </div>
                    </div>

                    {/* Render the Tree with Reflection Mode Enabled */}
                    <BubbleNode node={mockBubble.rootNode} bubbleId={mockBubble.id} enableReflection={true} />
                </div>
            </div>
        );
    }

    return (
        <div className="text-center py-20 bg-[#111] border border-zinc-800 rounded-xl">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600 text-2xl">
                <i className="fa-solid fa-comments"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Discussion History</h3>
            <p className="text-zinc-500 max-w-sm mx-auto mb-6">
                Review your arguments and see how others responded to your thoughts.
            </p>
            <div className="flex justify-center flex-col items-center gap-4">
                <button
                    onClick={() => setView("detail")}
                    className="px-6 py-2 border border-zinc-700 hover:bg-zinc-800 rounded text-sm font-bold transition-colors w-64"
                >
                    <i className="fa-solid fa-folder-open mr-2"></i> Browse Recent: AI Ethics
                </button>
            </div>
        </div>
    );
};

// --- Small Helper Components ---

const StatCard = ({ label, value, subtext, color, icon }) => (
    <div className="bg-[#111] border border-zinc-800 p-5 rounded-xl flex items-center gap-4 hover:border-zinc-700 transition-colors">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl bg-zinc-900 ${color}`}>
            <i className={`fa-solid fa-${icon}`}></i>
        </div>
        <div>
            <div className="text-xs text-zinc-500 font-bold uppercase">{label}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-zinc-400 mt-0.5">{subtext}</div>
        </div>
    </div>
);

const InsightCard = ({ title, desc, type }) => {
    const colors = {
        strength: "border-emerald-900/50 bg-emerald-900/10 text-emerald-400",
        neutral: "border-zinc-800 bg-zinc-900/50 text-indigo-400",
        warning: "border-orange-900/50 bg-orange-900/10 text-orange-400"
    };

    return (
        <div className={`p-5 rounded-xl border ${colors[type]}`}>
            <h4 className="font-bold text-white mb-2 text-sm">{title}</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
        </div>
    );
};

export default UserDashboard;
