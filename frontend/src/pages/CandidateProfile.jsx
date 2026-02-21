import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CandidateProfile = () => {
    const { candidateId } = useParams();
    const navigate = useNavigate();

    const [candidate, setCandidate] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [thinking, setThinking] = useState([]);
    const [breakdown, setBreakdown] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (candidateId) {
            fetchCandidateData();
        }
    }, [candidateId]);

    const fetchCandidateData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [overviewRes, thinkingRes, breakdownRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL || ''}/api/v1/company-dashboard/candidates/${candidateId}`, config),
                axios.get(`${import.meta.env.VITE_API_URL || ''}/api/v1/company-dashboard/candidates/${candidateId}/thinking`, config),
                axios.get(`${import.meta.env.VITE_API_URL || ''}/api/v1/company-dashboard/candidates/${candidateId}/performance`, config)
            ]);

            setCandidate(overviewRes.data.candidate);
            setPerformance(overviewRes.data.performance);
            setThinking(thinkingRes.data.thinking);
            setBreakdown(breakdownRes.data.breakdown);
        } catch (error) {
            console.error('Failed to fetch candidate data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-white text-xl">Loading candidate data...</div>
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-white text-xl">Candidate not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="text-zinc-400 hover:text-white mb-4 flex items-center gap-2"
                >
                    <i className="fa-solid fa-arrow-left"></i> Back
                </button>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{candidate.name}</h1>
                            <p className="text-zinc-400">@{candidate.username}</p>
                            <div className="flex items-center gap-4 mt-4">
                                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg text-sm font-semibold">
                                    {candidate.profileType}
                                </span>
                                <span className="text-zinc-500 text-sm">
                                    Member since {new Date(candidate.memberSince).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Performance Score */}
                        <div className="text-right">
                            <div className="text-5xl font-bold text-blue-400 mb-2">
                                {performance.currentScore}
                            </div>
                            <div className="text-zinc-400 text-sm">Current Score</div>
                            <div className={`mt-2 px-3 py-1 rounded-lg text-xs font-bold ${performance.confidenceLevel === 'high' ? 'bg-green-600/20 text-green-400' :
                                    performance.confidenceLevel === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                                        'bg-red-600/20 text-red-400'
                                }`}>
                                {performance.confidenceLevel.toUpperCase()} CONFIDENCE
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex gap-2 border-b border-zinc-800">
                    {['overview', 'performance', 'thinking'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-semibold transition-colors ${activeTab === tab
                                    ? 'border-b-2 border-blue-500 text-white'
                                    : 'text-zinc-500 hover:text-white'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto">
                {activeTab === 'overview' && (
                    <OverviewTab performance={performance} />
                )}

                {activeTab === 'performance' && (
                    <PerformanceTab breakdown={breakdown} />
                )}

                {activeTab === 'thinking' && (
                    <ThinkingTab thinking={thinking} />
                )}
            </div>
        </div>
    );
};

// Overview Tab Component
const OverviewTab = ({ performance }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
            icon="fa-chart-line"
            label="Tests Taken"
            value={performance.testsTaken}
            color="blue"
        />
        <MetricCard
            icon="fa-shield-halved"
            label="Integrity"
            value={`${(performance.integrityMultiplier * 100).toFixed(0)}%`}
            color="green"
        />
        <MetricCard
            icon="fa-sync"
            label="Consistency"
            value={performance.consistency.toUpperCase()}
            color="purple"
        />
        <MetricCard
            icon="fa-arrow-trend-up"
            label="Growth"
            value={`${performance.growth > 0 ? '+' : ''}${performance.growth.toFixed(1)}%`}
            color={performance.growth > 0 ? 'green' : 'red'}
        />

        {/* Score History Chart */}
        <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <i className="fa-solid fa-chart-area text-blue-400"></i>
                Score History
            </h3>
            <div className="h-64 flex items-end gap-2">
                {performance.scoreHistory.map((point, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                            className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-500"
                            style={{ height: `${(point.score / 1000) * 100}%` }}
                            title={`Score: ${point.score}`}
                        ></div>
                        <span className="text-xs text-zinc-500 mt-2">
                            {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Performance Tab Component
const PerformanceTab = ({ breakdown }) => {
    if (!breakdown) return <div>No performance data available</div>;

    return (
        <div className="space-y-6">
            {/* Cognitive Breakdown */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-brain text-purple-400"></i>
                    Cognitive Performance
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ScoreBar label="Skill" score={breakdown.cognitive.skillScore} max={1000} />
                    <ScoreBar label="Psychology" score={breakdown.cognitive.psychScore} max={1000} />
                    <ScoreBar label="Reflex" score={breakdown.cognitive.reflexScore} max={100} />
                    <ScoreBar label="Memory" score={breakdown.cognitive.memoryScore} max={1000} />
                </div>
            </div>

            {/* Behavioral Signals */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-user-shield text-green-400"></i>
                    Behavioral Integrity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-800 p-4 rounded-lg">
                        <div className="text-zinc-400 text-sm mb-1">Cheat Risk</div>
                        <div className={`text-2xl font-bold ${breakdown.behavioral.cheatRisk === 'low' ? 'text-green-400' :
                                breakdown.behavioral.cheatRisk === 'medium' ? 'text-yellow-400' :
                                    'text-red-400'
                            }`}>
                            {breakdown.behavioral.cheatRisk.toUpperCase()}
                        </div>
                    </div>
                    <div className="bg-zinc-800 p-4 rounded-lg">
                        <div className="text-zinc-400 text-sm mb-1">Focus Loss Events</div>
                        <div className="text-2xl font-bold">{breakdown.behavioral.focusLoss}</div>
                    </div>
                    <div className="bg-zinc-800 p-4 rounded-lg">
                        <div className="text-zinc-400 text-sm mb-1">Paste Events</div>
                        <div className="text-2xl font-bold">{breakdown.behavioral.pasteEvents}</div>
                    </div>
                </div>
            </div>

            {/* Verification Status */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-certificate text-blue-400"></i>
                    Verification Status
                </h3>
                <div className="flex gap-6">
                    <VerificationBadge
                        icon="fa-video"
                        label="Video Verified"
                        verified={breakdown.reliability.videoVerified}
                    />
                    <VerificationBadge
                        icon="fa-microphone"
                        label="Audio Verified"
                        verified={breakdown.reliability.audioVerified}
                    />
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-mobile-screen text-zinc-400"></i>
                        <span className="text-zinc-300">
                            {breakdown.reliability.deviceAnomalies} Device Anomalies
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Thinking Tab Component (NO ENGAGEMENT METRICS)
const ThinkingTab = ({ thinking }) => {
    if (!thinking || thinking.length === 0) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                <i className="fa-solid fa-comments text-zinc-700 text-5xl mb-4"></i>
                <p className="text-zinc-400">No public thinking contributions yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 mb-6">
                <p className="text-blue-300 text-sm flex items-center gap-2">
                    <i className="fa-solid fa-info-circle"></i>
                    <span>Engagement metrics (likes, comments) are excluded from company view to maintain hiring integrity.</span>
                </p>
            </div>

            {thinking.map((bubble, idx) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-comment-dots text-purple-400"></i>
                        {bubble.topic}
                    </h4>

                    <div className="space-y-4">
                        {bubble.contributions.map((contribution, cIdx) => (
                            <div key={cIdx} className="bg-zinc-800 p-4 rounded-lg">
                                {contribution.quotedContext && (
                                    <div className="mb-3 pl-4 border-l-2 border-zinc-700 text-zinc-500 text-sm italic">
                                        "{contribution.quotedContext.substring(0, 100)}..."
                                    </div>
                                )}
                                <p className="text-zinc-200 mb-2">{contribution.content}</p>
                                <span className="text-zinc-500 text-xs">
                                    {new Date(contribution.date).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Helper Components
const MetricCard = ({ icon, label, value, color }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className={`text-${color}-400 mb-2`}>
            <i className={`fa-solid ${icon} text-2xl`}></i>
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-zinc-400 text-sm">{label}</div>
    </div>
);

const ScoreBar = ({ label, score, max }) => (
    <div>
        <div className="flex justify-between mb-2">
            <span className="text-zinc-400 text-sm">{label}</span>
            <span className="text-white font-bold">{score}</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all"
                style={{ width: `${(score / max) * 100}%` }}
            ></div>
        </div>
    </div>
);

const VerificationBadge = ({ icon, label, verified }) => (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${verified ? 'bg-green-600/20 text-green-400' : 'bg-zinc-800 text-zinc-500'
        }`}>
        <i className={`fa-solid ${icon}`}></i>
        <span>{label}</span>
        {verified && <i className="fa-solid fa-check ml-2"></i>}
    </div>
);

export default CandidateProfile;
