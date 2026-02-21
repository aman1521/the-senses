"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function ProfileSelectionPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [profiles, setProfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions-ai/profiles`);
            const data = await response.json();

            if (data.success) {
                setProfiles(data.profiles);
            }
        } catch (error) {
            console.error("Failed to fetch profiles:", error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ["All", ...new Set(profiles.map(p => p.category))];

    const filteredProfiles = selectedCategory === "All"
        ? profiles
        : profiles.filter(p => p.category === selectedCategory);

    const handleStartTest = () => {
        if (!selectedProfile) return;

        setStarting(true);
        // Store selected profile in localStorage
        localStorage.setItem("selectedProfile", JSON.stringify(selectedProfile));

        // Navigate to test page
        router.push("/test");
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

    return (
        <div className="min-h-screen bg-black text-white py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Select Your Profile
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                        Choose your professional profile to get questions tailored to your field.
                        Each profile has unique, AI-generated questions designed for your domain.
                    </p>
                </div>

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
                            className={`text-left p-6 rounded-xl border-2 transition-all ${selectedProfile?.id === profile.id
                                    ? "border-indigo-500 bg-indigo-500/10"
                                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="text-4xl">{profile.icon}</div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-1">{profile.name}</h3>
                                    <p className="text-sm text-zinc-400 mb-3">{profile.description}</p>
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
                                                +{profile.skills.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Selected Profile Info */}
                {selectedProfile && (
                    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl p-6 mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="text-5xl">{selectedProfile.icon}</div>
                            <div>
                                <h2 className="text-2xl font-bold">{selectedProfile.name}</h2>
                                <p className="text-zinc-400">{selectedProfile.description}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <h4 className="text-sm font-semibold text-zinc-400 mb-2">Key Skills Assessed:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProfile.skills.map((skill, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Start Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleStartTest}
                        disabled={!selectedProfile || starting}
                        className={`px-12 py-4 rounded-xl font-bold text-lg transition-all ${selectedProfile && !starting
                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"
                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            }`}
                    >
                        {starting ? "Starting Test..." : selectedProfile ? `Start Test as ${selectedProfile.name}` : "Select a Profile to Continue"}
                    </button>
                </div>

                {/* Info */}
                <div className="mt-12 text-center text-zinc-500 text-sm">
                    <p>🤖 Questions are AI-generated and unique to each profile</p>
                    <p className="mt-1">⏱️ Test duration: 5 minutes | 30 questions</p>
                </div>
            </div>
        </div>
    );
}
