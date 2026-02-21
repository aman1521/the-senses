import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getJobProfiles } from "../services/api";

export default function ProfileSelection() {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getJobProfiles();
            const data = response.data;

            if (data.success && Array.isArray(data.profiles)) {
                setProfiles(data.profiles);
            } else {
                throw new Error("Invalid data format received");
            }
        } catch (err) {
            console.error("Failed to fetch profiles:", err);
            setError("Could not load profiles. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    // Smart Profile Recognition Logic
    const userProfileType = localStorage.getItem("userProfileType");

    // Map legacy registration values to new Profile IDs
    const legacyMap = {
        "developer": "software-engineer",
        "designer": "ux-ui-designer",
        "marketer": "marketing-manager",
        "founder": "entrepreneur"
    };

    // Find the user's profile in the loaded list
    const recommendedProfile = profiles.find(p =>
        p.id === userProfileType || p.id === legacyMap[userProfileType]
    );

    const categories = ["All", ...new Set(profiles.map(p => p.category))];

    const filteredProfiles = selectedCategory === "All"
        ? profiles
        : profiles.filter(p => p.category === selectedCategory);

    const handleStartTest = (profileOverride = null) => {
        const targetProfile = profileOverride || selectedProfile;
        if (!targetProfile) return;

        setStarting(true);
        localStorage.setItem("selectedProfile", JSON.stringify(targetProfile));
        navigate("/test");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500 mx-auto"></div>
                    <p className="text-white text-xl">Loading profiles...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md px-6">
                    <div className="text-6xl"><i className="fa-solid fa-triangle-exclamation"></i></div>
                    <h2 className="text-2xl font-bold text-white">Connection Error</h2>
                    <p className="text-zinc-400">{error}</p>
                    <button
                        onClick={fetchProfiles}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold transition-all"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Select Your Profile
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                        Choose your professional profile to generate a tailored assessment.
                    </p>
                </div>

                {/* 🚀 SMART QUICK START SECTION */}
                {recommendedProfile && (
                    <div className="mb-12 animate-fade-in-up">
                        <div className="bg-gradient-to-r from-zinc-900 to-black border border-indigo-500/50 rounded-2xl p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-20"><i className={`fa-solid ${recommendedProfile.icon}`}></i></div>

                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-4 border border-indigo-500/30">
                                    <i className="fa-solid fa-sparkles"></i> YOUR PROFILE DETECTED
                                </div>
                                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                    Continue as {recommendedProfile.name}
                                </h2>
                                <p className="text-zinc-400 max-w-xl mb-6">
                                    We have customized an assessment for your role. Start immediately without manual setup.
                                </p>

                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => handleStartTest(recommendedProfile)}
                                        className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-indigo-50 hover:text-indigo-900 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2"
                                    >
                                        <span><i className="fa-solid fa-rocket"></i></span> Start {recommendedProfile.name} Test
                                    </button>
                                    <button
                                        onClick={() => {
                                            const element = document.getElementById('all-profiles');
                                            element?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="px-6 py-3 bg-transparent border border-zinc-700 hover:border-white rounded-full font-medium transition-colors text-zinc-300"
                                    >
                                        Explore Other Roles
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div id="all-profiles" className="border-t border-zinc-800 pt-10">
                    <h3 className="text-xl font-bold mb-6 text-zinc-500">All Available Profiles</h3>

                    {/* Category Filter */}
                    <div className="mb-8 flex flex-wrap gap-3 justify-center">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-2 rounded-full font-medium transition-all ${selectedCategory === category
                                    ? "bg-indigo-600 text-white"
                                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Profile Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {filteredProfiles.map(profile => (
                            <button
                                key={profile.id}
                                onClick={() => setSelectedProfile(profile)}
                                className={`text-left p-6 rounded-xl border-2 transition-all group hover:scale-[1.02] ${selectedProfile?.id === profile.id
                                    ? "border-indigo-500 bg-indigo-500/10"
                                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl group-hover:scale-110 transition-transform"><i className={`fa-solid ${profile.icon}`}></i></div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold mb-1 group-hover:text-indigo-400 transition-colors">{profile.name}</h3>
                                        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{profile.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills.slice(0, 3).map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {profile.skills.length > 3 && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">
                                                    +{profile.skills.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Selected Profile Info (Bottom Bar) */}
                    {selectedProfile && (
                        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-indigo-500/30 p-4 z-50 animate-slide-up shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl animate-bounce-subtle"><i className={`fa-solid ${selectedProfile.icon}`}></i></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{selectedProfile.name}</h3>
                                        <p className="text-sm text-indigo-400">Ready to start assessment?</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleStartTest(null)}
                                    disabled={starting}
                                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/20 transform hover:-translate-y-1"
                                >
                                    {starting ? (
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                                            Initializing...
                                        </span>
                                    ) : "Start Assessment →"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
