import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

function AdminDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/overview`, {
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
                // navigate("/dashboard"); 
                setLoading(false);
            });
    }, [navigate]);

    if (loading) return <Loader text="Loading System Data..." />;

    if (!data) return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Restricted Area</h1>
                <p className="text-gray-400 mb-4">Requires Super Admin clearance.</p>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200"
                >
                    Return to Safety
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <div className="text-sm text-red-500 font-bold tracking-widest uppercase mb-1">
                        God Mode
                    </div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">Overview</h1>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                        <div className="text-zinc-400 text-sm mb-2">Total Users</div>
                        <div className="text-3xl font-bold">{data.stats.totalUsers}</div>
                    </div>
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                        <div className="text-zinc-400 text-sm mb-2">Tests Completed</div>
                        <div className="text-3xl font-bold text-indigo-400">{data.stats.totalTests}</div>
                    </div>
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                        <div className="text-zinc-400 text-sm mb-2">Integrity Violations</div>
                        <div className="text-3xl font-bold text-red-500">{data.stats.lowIntegrityCount}</div>
                    </div>
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                        <div className="text-zinc-400 text-sm mb-2">Daily Active</div>
                        <div className="text-3xl font-bold text-green-400">{data.stats.activeToday}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Signups */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4">Recent Users</h3>
                        <div className="space-y-4">
                            {data.recentUsers.map(u => (
                                <div key={u._id} className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                    <div>
                                        <div className="font-bold">{u.name}</div>
                                        <div className="text-xs text-zinc-500">{u.email}</div>
                                    </div>
                                    <div className="text-xs uppercase font-mono text-zinc-400">{u.role}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tier Distribution */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4">Tier Distribution</h3>
                        <div className="space-y-4">
                            {data.tiers.map(t => (
                                <div key={t._id || 'Unknown'} className="flex items-center gap-4">
                                    <div className="w-24 text-sm text-zinc-400">{t._id || 'N/A'}</div>
                                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500"
                                            style={{ width: `${(t.count / data.stats.totalTests) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="w-8 text-right text-sm font-bold">{t.count}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AdminDashboard;
