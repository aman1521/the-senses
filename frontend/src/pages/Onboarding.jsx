import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../services/api";

export default function Onboarding() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        jobProfile: "",
        bio: "",
        skills: "",
        experienceYears: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Send split skills as string, backend handles basic CSV parsing but better to check
            const payload = {
                ...formData,
                profileType: formData.jobProfile, // Map to backend field
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s), // Convert to array
                yearsOfExperience: Number(formData.experienceYears)
            };

            // Remove experienceYears ( frontend key ) to avoid confusion, though strict controllers will ignore it.
            delete payload.experienceYears;

            const { data } = await API.put("/api/v1/profile", payload);

            if (data.success) {
                const role = localStorage.getItem("userRole");
                if (role === 'company_admin' || role === 'admin') {
                    navigate("/company");
                } else {
                    navigate("/dashboard");
                }
            }
        } catch (err) {
            console.error(err);
            setError("Failed to create portfolio. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-lg bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl shadow-indigo-500/10">

                <div className="mb-8 text-center">
                    <div className="mx-auto w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 text-indigo-400 text-xl border border-indigo-500/30">
                        <i className="fa-solid fa-briefcase"></i>
                    </div>
                    <h1 className="text-2xl font-bold">Build Your Portfolio</h1>
                    <p className="text-zinc-400 text-sm mt-2">
                        Tell us about your professional identity to calibrate "The Senses".
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Job Role */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Primary Job Role</label>
                        <input
                            type="text"
                            name="jobProfile"
                            value={formData.jobProfile}
                            onChange={handleChange}
                            placeholder="e.g. Senior Frontend Developer"
                            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                            required
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Professional Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Brief summary of your experience..."
                            rows="3"
                            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none resize-none"
                            required
                        />
                    </div>

                    {/* Skills */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Top Skills (Comma Separated)</label>
                        <input
                            type="text"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            placeholder="React, Node.js, Design Systems, ..."
                            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                            required
                        />
                    </div>

                    {/* Experience Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Years Exp.</label>
                            <input
                                type="number"
                                name="experienceYears"
                                value={formData.experienceYears}
                                onChange={handleChange}
                                min="0"
                                max="50"
                                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 transition-all outline-none"
                            />
                        </div>
                        {/* Placeholder for other stats/links if needed later */}
                        <div className="flex items-end">
                            <div className="text-xs text-zinc-600 mb-4 px-2 italic">
                                This helps adjust difficulty.
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <span className="animate-pulse">Saving Profile...</span>
                        ) : (
                            <>
                                Complete Profile <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                            </>
                        )}
                    </button>
                </form>

            </div>
        </div>
    );
}
