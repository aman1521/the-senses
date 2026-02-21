import { useState } from "react";
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';

const CandidateDeepProfile = ({ candidate, onBack }) => {
    const [activeTab, setActiveTab] = useState("overview"); // overview, charts, timeline
    const [timeFilter, setTimeFilter] = useState("30d");

    // Mock Data for Visualization
    const performanceData = [
        { date: 'Week 1', score: 65, attention: 70, reflex: 400 },
        { date: 'Week 2', score: 68, attention: 72, reflex: 380 },
        { date: 'Week 3', score: 75, attention: 68, reflex: 350 },
        { date: 'Week 4', score: 82, attention: 85, reflex: 320 },
    ];

    const timelineEvents = [
        { id: 1, date: "Oct 12, 2023", type: "system", title: "Cognitive Assessment Completed", desc: "Scored in top 10% for adaptability." },
        { id: 2, date: "Oct 15, 2023", type: "reflection", title: "User Reflection", desc: "Felt strong in logic, but distracted during memory tasks." },
        { id: 3, date: "Oct 20, 2023", type: "system", title: "Skill Verification: React", desc: "Achieved Expert status." },
    ];

    const radarData = [
        { subject: 'Logic', A: 120, fullMark: 150 },
        { subject: 'Memory', A: 98, fullMark: 150 },
        { subject: 'Attention', A: 86, fullMark: 150 },
        { subject: 'Speed', A: 99, fullMark: 150 },
        { subject: 'Adaptability', A: 85, fullMark: 150 },
        { subject: 'Integrity', A: 65, fullMark: 150 },
    ];

    return (
        <div className="animate-fade-in space-y-6 text-white">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-full transition">
                    <i className="fa-solid fa-arrow-left text-zinc-400"></i>
                </button>
                <div>
                    <h1 className="text-2xl font-bold">{candidate.name}</h1>
                    <p className="text-zinc-400 text-sm">{candidate.role} • {candidate.score} Score</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${candidate.integrity === 'High' ? 'bg-emerald-900 text-emerald-400' : 'bg-yellow-900 text-yellow-400'}`}>
                        Integrity: {candidate.integrity}
                    </span>
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-bold transition">
                        Invite to Interview
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-zinc-800">
                {['overview', 'charts', 'timeline'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Radar Chart */}
                        <div className="bg-[#1b1f23] border border-zinc-800 rounded-lg p-6 flex flex-col items-center">
                            <h3 className="text-zinc-400 font-bold mb-4">Cognitive Profile</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid stroke="#3f3f46" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                        <Radar name="Candidate" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Strengths & Risks */}
                        <div className="bg-[#1b1f23] border border-zinc-800 rounded-lg p-6 space-y-6">
                            <div>
                                <h3 className="text-emerald-400 font-bold mb-2"><i className="fa-solid fa-check-circle mr-2"></i> Key Strengths</h3>
                                <ul className="space-y-2 text-zinc-300 text-sm">
                                    <li>• High adaptation under pressure</li>
                                    <li>• Consistent reflex stability</li>
                                    <li>• Strong logical reasoning pattern</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-yellow-400 font-bold mb-2"><i className="fa-solid fa-triangle-exclamation mr-2"></i> Risk Indicators</h3>
                                <ul className="space-y-2 text-zinc-300 text-sm">
                                    <li>• Attention drift in long sessions</li>
                                    <li>• Mild hesitation on spatial tasks</li>
                                </ul>
                                <p className="text-xs text-zinc-500 mt-2 italic">* Risk indicators are non-accusatory observations.</p>
                            </div>
                        </div>

                        {/* Metrics Summary */}
                        <div className="space-y-4">
                            <div className="bg-[#1b1f23] border border-zinc-800 rounded-lg p-6">
                                <div className="text-zinc-500 text-xs font-bold uppercase">Growth Trend</div>
                                <div className="text-3xl font-bold text-emerald-400">+12% <span className="text-sm text-zinc-500 font-normal">vs last month</span></div>
                            </div>
                            <div className="bg-[#1b1f23] border border-zinc-800 rounded-lg p-6">
                                <div className="text-zinc-500 text-xs font-bold uppercase">Confidence Index</div>
                                <div className="text-3xl font-bold text-indigo-400">88/100</div>
                            </div>
                            <div className="bg-[#1b1f23] border border-zinc-800 rounded-lg p-6">
                                <div className="text-zinc-500 text-xs font-bold uppercase">Authority Rank</div>
                                <div className="text-3xl font-bold text-white">Top 5%</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'charts' && (
                    <div className="space-y-6">
                        <div className="flex justify-end gap-2 mb-4">
                            {['7d', '30d', '90d'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setTimeFilter(filter)}
                                    className={`px-3 py-1 text-xs font-bold rounded ${timeFilter === filter ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-[#1b1f23] border border-zinc-800 rounded-lg p-6">
                                <h3 className="text-zinc-400 font-bold mb-4">Skill Score Progression</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={performanceData}>
                                            <defs>
                                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                            <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                                            <YAxis stroke="#71717a" fontSize={12} />
                                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} itemStyle={{ color: '#e4e4e7' }} />
                                            <Area type="monotone" dataKey="score" stroke="#818cf8" fillOpacity={1} fill="url(#colorScore)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-[#1b1f23] border border-zinc-800 rounded-lg p-6">
                                <h3 className="text-zinc-400 font-bold mb-4">Attention & Reflex Stability</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={performanceData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                            <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                                            <YAxis yAxisId="left" stroke="#34d399" fontSize={12} />
                                            <YAxis yAxisId="right" stroke="#f472b6" fontSize={12} orientation="right" />
                                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} />
                                            <Legend />
                                            <Line yAxisId="left" type="monotone" dataKey="attention" stroke="#34d399" name="Attention %" />
                                            <Line yAxisId="right" type="monotone" dataKey="reflex" stroke="#f472b6" name="Reflex (ms)" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <div className="bg-[#1b1f23] border border-zinc-800 rounded-lg p-6">
                        <div className="space-y-8 pl-4 border-l-2 border-zinc-800">
                            {timelineEvents.map((event) => (
                                <div key={event.id} className="relative pl-8">
                                    <div className={`absolute -left-[1.3rem] top-0 w-4 h-4 rounded-full border-2 ${event.type === 'reflection' ? 'bg-purple-900 border-purple-500' : 'bg-indigo-900 border-indigo-500'}`}></div>
                                    <span className="text-xs text-zinc-500 font-mono block mb-1">{event.date}</span>
                                    <h4 className={`text-md font-bold ${event.type === 'reflection' ? 'text-purple-400' : 'text-indigo-400'}`}>{event.title}</h4>
                                    <p className="text-sm text-zinc-300 mt-1">{event.desc}</p>
                                    {event.type === 'system' && (
                                        <button className="mt-2 text-xs text-zinc-500 hover:text-white underline">View Session Details</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidateDeepProfile;
