import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getPublicProfile, getMyProfile, getUserPosts, getUserActivity, addCertification, deleteCertification } from '../services/api';
import UserAvatar from '../components/UserAvatar';
import FeedItem from '../components/FeedItem';

const ProfilePage = () => {
    const { username } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // State
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Check if user is viewing their own profile
    const currentUsername = localStorage.getItem("userName")?.toLowerCase().replace(/\s+/g, '');
    const isOwnProfile = username === 'me' || username === currentUsername;

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
        fetchData();
    }, [username, searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let fetchedUser = null;

            if (username === 'me') {
                const res = await getMyProfile();
                // getMyProfile returns the user object directly (legacy controller)
                fetchedUser = res.data;
            } else {
                const res = await getPublicProfile(username);
                if (res.data?.success) {
                    fetchedUser = res.data.user;
                }
            }

            if (fetchedUser) {
                setUser(fetchedUser);

                // Use the real username for subsequent calls
                const targetUsername = fetchedUser.username;

                // Fetch posts if tab requires
                if (activeTab === 'posts' || activeTab === 'overview') {
                    try {
                        const postsRes = await getUserPosts(targetUsername);
                        if (postsRes.data?.success) setPosts(postsRes.data.posts);
                    } catch (e) { console.warn("Posts load error", e); }
                }

                // Fetch activity if tab requires
                if (activeTab === 'activity') {
                    try {
                        const actRes = await getUserActivity(targetUsername);
                        if (actRes.data?.success) setActivity(actRes.data.activity);
                    } catch (e) { console.warn("Activity load error", e); }
                }
            } else {
                setError("Profile not found");
            }

        } catch (err) {
            console.error(err);
            setError("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    const handleMessage = () => {
        navigate(`/messages?to=${user._id}&name=${encodeURIComponent(user.name)}&pic=${encodeURIComponent(user.profilePicture || '')}`);
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono tracking-widest text-xs uppercase animate-pulse">Initializing Neural Link...</div>;
    if (error || !user) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-mono">{error || "User not found"}</div>;

    return (
        <div className="min-h-screen bg-neutral-950 text-white pt-24 pb-12 px-6">
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: IDENTITY MATRIX (Fixed on large screens) */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                    <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-none relative overflow-hidden group hover:border-white/20 transition-colors">
                        {/* Technical Corners */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/50"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/50"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50"></div>

                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-6 group-hover:scale-105 transition-transform duration-500">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl"></div>
                                <UserAvatar name={user.name} size={140} className="relative z-10 border-2 border-white/10 bg-black" />
                                {user.verified && (
                                    <div className="absolute bottom-1 right-1 bg-white text-black text-[10px] w-6 h-6 flex items-center justify-center rounded-full border-2 border-black z-20" title="Verified Type">
                                        <i className="fa-solid fa-check"></i>
                                    </div>
                                )}
                            </div>

                            <h1 className="text-2xl font-bold uppercase tracking-widest text-white mb-2 font-mono">{user.name}</h1>
                            <div className="text-xs text-indigo-400 uppercase tracking-widest mb-6 font-mono border border-indigo-500/30 px-3 py-1 rounded bg-indigo-500/5">
                                {user.profileType || 'Unclassified'}
                            </div>

                            <p className="text-sm text-zinc-400 leading-relaxed mb-6 font-light max-w-xs mx-auto">
                                {user.profileHeadline || user.profession || "Digital Thinker traversing the cognitive plane."}
                            </p>

                            <div className="w-full grid grid-cols-2 gap-px bg-white/10 border border-white/10 mb-6">
                                <div className="bg-[#0a0a0a] p-3">
                                    <div className="text-[10px] uppercase text-zinc-500 mb-1">Rank</div>
                                    <div className="text-lg font-bold font-mono">#{user.globalRank || '---'}</div>
                                </div>
                                <div className="bg-[#0a0a0a] p-3">
                                    <div className="text-[10px] uppercase text-zinc-500 mb-1">Score</div>
                                    <div className="text-lg font-bold font-mono text-green-400">98.2</div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full">
                                {isOwnProfile ? (
                                    <button onClick={() => navigate('/settings')} className="w-full py-2 bg-white text-black font-bold text-xs uppercase hover:bg-zinc-200 transition-colors tracking-wider">
                                        Edit Signal
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2 bg-white text-black font-bold text-xs uppercase hover:bg-zinc-200 transition-colors tracking-wider">
                                            Connect
                                        </button>
                                        <button onClick={handleMessage} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase transition-colors tracking-wider">
                                            Message
                                        </button>
                                    </div>
                                )}
                                <button className="w-full py-2 border border-white/20 text-white font-bold text-xs uppercase hover:bg-white/5 transition-colors tracking-wider">
                                    View Raw Data
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Meta Data Box */}
                    <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-none h-fit">
                        <h3 className="text-xs font-mono uppercase text-zinc-500 mb-4 border-b border-white/5 pb-2">User Telemetry</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex justify-between">
                                <span className="text-zinc-600">Location</span>
                                <span className="text-zinc-300">{user.location || 'Unknown'}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-zinc-600">Joined</span>
                                <span className="text-zinc-300">Oct 2025</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-zinc-600">Connections</span>
                                <span className="text-zinc-300">842 Nodes</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* RIGHT COLUMN: DATA STREAM */}
                <div className="lg:col-span-8 xl:col-span-9">

                    {/* Navigation Bar */}
                    <nav className="flex items-center gap-6 border-b border-white/10 mb-8 overflow-x-auto no-scrollbar">
                        {['overview', 'posts', 'certifications', 'activity', 'ranking', 'companies'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`pb-3 text-xs font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === tab
                                    ? 'text-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-indigo-500'
                                    : 'text-zinc-600 hover:text-zinc-400'
                                    }`}
                            >
                                / {tab}
                            </button>
                        ))}
                    </nav>

                    {/* Content Views */}
                    <div className="animate-fade-in-up">
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                {/* Bio Section */}
                                <div>
                                    <h2 className="text-lg font-mono uppercase text-zinc-500 mb-4 tracking-wider">Before::Analysis</h2>
                                    <p className="text-lg text-zinc-300 leading-relaxed font-light whitespace-pre-wrap border-l-2 border-indigo-500 pl-6">
                                        {user.bio || "Subject has not provided a bio description."}
                                    </p>
                                </div>

                                {/* Experience Grid */}
                                <div>
                                    <h2 className="text-lg font-mono uppercase text-zinc-500 mb-6 tracking-wider">Work_History::Log</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(user.workHistory || []).map((job, i) => (
                                            <div key={i} className="bg-[#0a0a0a] border border-white/10 p-5 hover:border-indigo-500/50 transition-colors group">
                                                <div className="text-indigo-400 text-xs font-mono mb-2">{job.dates}</div>
                                                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{job.title}</h3>
                                                <div className="text-sm text-zinc-400 mb-4">{job.company}</div>
                                                <p className="text-sm text-zinc-500">
                                                    {job.description}
                                                </p>
                                            </div>
                                        ))}
                                        {(user.workHistory || []).length === 0 && (
                                            <div className="col-span-2 border border-dashed border-white/10 p-8 text-center text-zinc-600 font-mono text-sm">
                                                NO EXPERIENCE DATA LOGGED
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Skills */}
                                <div>
                                    <h2 className="text-lg font-mono uppercase text-zinc-500 mb-4 tracking-wider">Skill_Matrix</h2>
                                    <div className="flex flex-wrap gap-x-2 gap-y-2">
                                        {(user.skills || []).map((skill, i) => (
                                            <div key={i} className="px-4 py-2 border border-white/10 bg-[#0a0a0a] text-xs font-mono uppercase text-zinc-300 tracking-wider">
                                                {skill}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'posts' && (
                            <div className="grid grid-cols-1 gap-6 max-w-3xl">
                                {posts.map(post => <FeedItem key={post._id} post={post} />)}
                                {posts.length === 0 && <div className="text-zinc-600 font-mono text-center py-10">No transmission logs found.</div>}
                            </div>
                        )}

                        {activeTab === 'certifications' && (
                            <CertificationsTab user={user} isOwnProfile={isOwnProfile} refresh={fetchData} />
                        )}

                        {/* Other tabs function similarly to previous impl but styled differently */}
                        {activeTab === 'ranking' && <RankingTab user={user} />}
                        {activeTab === 'companies' && <CompaniesTab />}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-Components ---

const RankingTab = ({ user }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0a0a0a] border border-white/10 p-6">
            <h3 className="font-mono text-xs text-zinc-500 uppercase mb-4">Global_Standing</h3>
            <div className="flex items-end justify-between">
                <span className="text-4xl font-bold text-white font-mono">#{user.globalRank || '---'}</span>
                <span className="text-xs text-green-400 font-mono mb-2">+12 pos / week</span>
            </div>
            <div className="h-32 mt-6 flex items-end gap-1 opacity-50">
                {[40, 60, 45, 70, 80, 75, 90, 85, 95, 100].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className="w-full bg-indigo-600/50"></div>
                ))}
            </div>
        </div>
    </div>
);

const CompaniesTab = () => (
    <div className="border border-white/10 bg-[#0a0a0a] p-12 text-center">
        <h3 className="font-mono text-zinc-500 uppercase tracking-widest text-sm mb-2">Corporation_Link</h3>
        <p className="text-zinc-600">No active corporate links detected for this entity.</p>
    </div>
);

const CertificationsTab = ({ user, isOwnProfile, refresh }) => {
    const [isAdding, setIsAdding] = useState(false);
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-mono uppercase text-zinc-500 tracking-wider">Certifications::Verified</h2>
                {isOwnProfile && (
                    <button onClick={() => setIsAdding(true)} className="text-xs font-mono uppercase text-indigo-400 border border-indigo-500/30 px-3 py-1 hover:bg-indigo-900/20 transition-colors">
                        + Add Cert
                    </button>
                )}
            </div>
            <div className="grid gap-4">
                {(user.certifications || []).map((cert, i) => (
                    <div key={i} className="flex gap-4 p-4 border border-white/10 bg-[#0a0a0a] hover:border-white/20 transition-colors">
                        <div className="w-10 h-10 border border-white/10 flex items-center justify-center text-zinc-500">
                            <i className="fa-solid fa-certificate"></i>
                        </div>
                        <div>
                            <div className="text-white font-bold text-sm tracking-wide">{cert.title}</div>
                            <div className="text-zinc-500 text-xs font-mono mt-1">{cert.organization} | {new Date(cert.issueDate).toLocaleDateString()}</div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Add Certification Modal Logic (Same as before but restyled) */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="bg-[#111] border border-white/20 p-8 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                        <h3 className="text-xl font-mono uppercase text-white mb-6 tracking-widest border-b border-white/10 pb-4">New_Entry::Certification</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            await addCertification({
                                title: formData.get('title'),
                                organization: formData.get('organization'),
                                issueDate: formData.get('issueDate'),
                                credentialUrl: formData.get('credentialUrl'),
                                description: formData.get('description')
                            });
                            refresh();
                            setIsAdding(false);
                        }} className="space-y-4">
                            <input name="title" required className="w-full bg-black border border-white/10 p-3 text-white font-mono text-sm focus:border-indigo-500 outline-none" placeholder="CERT_NAME" />
                            <input name="organization" required className="w-full bg-black border border-white/10 p-3 text-white font-mono text-sm focus:border-indigo-500 outline-none" placeholder="ISSUER_ORG" />
                            <div className="grid grid-cols-2 gap-4">
                                <input name="issueDate" type="date" className="w-full bg-black border border-white/10 p-3 text-white font-mono text-sm focus:border-indigo-500 outline-none" />
                                <input name="credentialUrl" type="url" className="w-full bg-black border border-white/10 p-3 text-white font-mono text-sm focus:border-indigo-500 outline-none" placeholder="URL::LINK" />
                            </div>
                            <div className="flex justify-end gap-4 mt-6">
                                <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 border border-white/10 text-zinc-500 hover:text-white hover:border-white/50 font-mono text-xs uppercase">Abort</button>
                                <button type="submit" className="px-6 py-2 bg-white text-black font-mono text-xs uppercase font-bold hover:bg-zinc-200">Commit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProfilePage;
