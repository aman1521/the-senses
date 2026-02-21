import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import CompanyReputation from "./Company/CompanyReputation";
import CandidateDeepProfile from "../components/CandidateDeepProfile";

function CompanyDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [roleFilter, setRoleFilter] = useState("All");
    const [scoreFilter, setScoreFilter] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        fetch(`${import.meta.env.VITE_API_URL || ""}/api/company/team`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => {
                if (res.status === 403) throw new Error("Access Denied");
                return res.json();
            })
            .then(d => {
                if (d.success) setData(d);
                else console.error(d.message);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, [navigate]);

    if (loading) return <Loader text="Loading Dashboard..." />;

    // Remove strict Company Admin block. Show restricted "Public" view instead.
    const isCompanyAdmin = data?.role === 'admin' || data?.role === 'owner';

    // If loading, show loader
    if (loading) return <Loader text="Loading Company Network..." />;

    // If no data (e.g. not logged in or API error), we might still want to show something?
    // But for now, let's assume the API returns 403 only if strictly denied.
    // We should modify the API or handle the 403 gracefully in the UI.

    // Actually, let's render a "Public/Candidate View" if data is missing or user is not admin
    if (!data || !isCompanyAdmin) {
        // Create mock data for non-admins to browse "Companies"
        const publicViewData = {
            companyName: "Global Network",
            stats: { totalMembers: 1240, averageScore: 89, highPerformers: 320 },
            members: [] // Hidden
        };

        return (
            <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-24">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-[#1b1f23] border border-zinc-800 rounded-lg p-12 text-center">
                        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-500 text-3xl">
                            <i className="fa-solid fa-building"></i>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-4">Corporate Network</h1>
                        <p className="text-zinc-400 max-w-lg mx-auto mb-8">
                            Access to specific company dashboards is restricted to authorized credentials.
                            However, you can browse public job listings and company reputations.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => navigate("/")} className="px-6 py-2 border border-zinc-600 rounded hover:bg-zinc-800 transition text-sm font-bold">
                                Return Home
                            </button>
                            <button className="px-6 py-2 bg-white text-black rounded hover:bg-zinc-200 transition text-sm font-bold">
                                Browse Companies
                            </button>
                        </div>
                    </div>
                    {/* Placeholder for Company List */}
                    <div className="mt-12">
                        <h3 className="text-xl font-bold mb-6">Top Rated Organizations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-[#111] border border-zinc-800 p-6 rounded-xl hover:border-zinc-600 transition cursor-pointer">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-white/5 rounded flex items-center justify-center">
                                            <i className="fa-solid fa-building-columns"></i>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">Neural Corp {i}</h4>
                                            <div className="text-xs text-zinc-500">AI Research • San Francisco</div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-zinc-400 mb-4">Leading the frontier in cognitive architecture and neural interfaces.</p>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] bg-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">Hiring</span>
                                        <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-500/30">98% Match</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-24">
            <div className="max-w-7xl mx-auto">

                {/* 1. Top Header (LinkedIn Style) */}
                <div className="bg-[#1b1f23] border border-zinc-800 rounded-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl font-bold">
                                {data.companyName.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{data.companyName}</h1>
                                <p className="text-zinc-400 text-sm">Corporate Admin Portal • {data.stats.totalMembers} Members</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate("/talent")}
                                className="px-4 py-2 bg-white text-black font-bold rounded hover:bg-zinc-200 transition"
                            >
                                <i className="fa-solid fa-seedling mr-2"></i> Find Talent
                            </button>
                            <button className="px-4 py-2 border border-zinc-600 text-zinc-300 font-bold rounded hover:bg-zinc-800 transition">
                                Settings
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 mt-8 border-b border-zinc-700">
                        <TabButton id="overview" label="Overview" icon="chart-pie" active={activeTab} set={setActiveTab} />
                        <TabButton id="pipeline" label="Talent Pipeline" icon="users-viewfinder" active={activeTab} set={setActiveTab} />
                        <TabButton id="reputation" label="Reputation" icon="building-columns" active={activeTab} set={setActiveTab} />

                    </div>
                </div>

                {/* 2. Content Area */}
                <div className="animate-fade-in">
                    {selectedCandidate ? (
                        <CandidateDeepProfile
                            candidate={selectedCandidate}
                            onBack={() => setSelectedCandidate(null)}
                        />
                    ) : (
                        <>
                            {activeTab === "overview" && <OverviewTab
                                data={data}
                                onSelectCandidate={setSelectedCandidate}
                                roleFilter={roleFilter}
                                setRoleFilter={setRoleFilter}
                                scoreFilter={scoreFilter}
                                setScoreFilter={setScoreFilter}
                            />}
                            {activeTab === "pipeline" && <PipelineTab />}
                            {activeTab === "reputation" && <CompanyReputation />}

                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

const TabButton = ({ id, label, icon, active, set }) => (
    <button
        onClick={() => set(id)}
        className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${active === id ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
            }`}
    >
        <i className={`fa-solid fa-${icon}`}></i> {label}
    </button>
);

const OverviewTab = ({ data, onSelectCandidate, roleFilter, setRoleFilter, scoreFilter, setScoreFilter }) => {
    const filteredMembers = data.members.filter(m => {
        return (roleFilter === "All" || m.role === roleFilter) && (m.score >= scoreFilter);
    });

    const uniqueRoles = ["All", ...new Set(data.members.map(m => m.role))];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Avg Cognitive Score" value={data.stats.averageScore} color="text-indigo-400" />
                <StatCard label="Elite Performers" value={data.stats.highPerformers} color="text-emerald-400" />
                <StatCard label="Pending Invites" value="0" color="text-zinc-400" />
            </div>

            <div className="bg-[#1b1f23] border border-zinc-800 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-lg">Team Roster</h3>

                    {/* Filters */}
                    <div className="flex gap-4">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                        >
                            {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                        <select
                            value={scoreFilter}
                            onChange={(e) => setScoreFilter(Number(e.target.value))}
                            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                        >
                            <option value={0}>All Scores</option>
                            <option value={80}>80+ (Elite)</option>
                            <option value={90}>90+ (Top 1%)</option>
                        </select>
                    </div>

                    <div className="hidden md:block">
                        <button className="text-xs text-indigo-400 hover:underline">Manage Team</button>
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-black/30 text-zinc-500 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Member</th>
                            <th className="px-6 py-3">Score</th>
                            <th className="px-6 py-3">Integrity</th>
                            <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {filteredMembers.map((m) => (
                            <tr key={m.id} className="hover:bg-white/5 transition">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white">{m.name}</div>
                                    <div className="text-xs text-zinc-500">{m.role}</div>
                                </td>
                                <td className="px-6 py-4 font-mono font-bold text-white">{m.score}</td>
                                <td className="px-6 py-4 text-xs text-zinc-400">{m.integrity}</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => onSelectCandidate(m)}
                                        className="text-indigo-400 text-xs hover:text-white"
                                    >
                                        Profile
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredMembers.length === 0 && <div className="p-8 text-center text-zinc-500">No members match filters.</div>}
            </div>
        </div>
    );
};

const PipelineTab = () => (
    <div className="bg-[#1b1f23] border border-zinc-800 rounded-lg p-12 text-center">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-500 text-2xl">
            <i className="fa-solid fa-users-viewfinder"></i>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Talent Pipeline Active</h3>
        <p className="text-zinc-400 max-w-md mx-auto mb-6">
            Track candidates you've shortlisted from the global talent pool.
        </p>
        <button className="px-6 py-2 bg-indigo-600 rounded text-white font-bold">Browse Talent Pool</button>
    </div>
);

const StatCard = ({ label, value, color }) => (
    <div className="p-6 bg-[#1b1f23] border border-zinc-800 rounded-lg">
        <div className="text-zinc-500 text-xs font-bold uppercase mb-1">{label}</div>
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
);

export default CompanyDashboard;
