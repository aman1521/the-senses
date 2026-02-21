import { useState, useEffect } from 'react';
import { API } from '../../services/api';
import './Reputation.css';
import Loader from '../../components/Loader';

const CompanyReputation = () => {
    const [reputation, setReputation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/api/company/reputation')
            .then(res => {
                if (res.data.success) setReputation(res.data.reputation);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    if (loading) return <Loader text="Calculating Reputation..." />;
    if (!reputation) return <div className="p-8 text-center text-gray-500">Reputation Analysis Pending.</div>;

    const { scores, signature, outcomes } = reputation;

    return (
        <div className="rep-container">
            {/* 1. Header Card */}
            <div className="rep-header relative overflow-hidden p-8 rounded-2xl border border-zinc-800 bg-zinc-900 mb-8">
                <div className="absolute top-0 right-0 p-4 opacity-50">
                    <i className="fa-solid fa-building-columns text-8xl text-zinc-800"></i>
                </div>

                <div className="relative z-10">
                    <div className="text-zinc-400 text-sm tracking-widest uppercase mb-2">Company Reputation Engine</div>
                    <div className="flex items-end gap-6">
                        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            {scores.reputation}
                        </h1>
                        <div className="text-xl mb-4 text-zinc-300 font-mono">
                            / 100
                        </div>
                        <div className="mb-3 px-3 py-1 bg-green-900/30 text-green-400 border border-green-800 rounded text-xs font-bold uppercase">
                            Strong Signal
                        </div>
                    </div>
                </div>

                {/* Score Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <ScoreMetric label="Thinking Bar" value={scores.thinkingBar} max={10} icon="brain" />
                    <ScoreMetric label="Talent Outcome" value={scores.talentOutcome} max={100} icon="users-viewfinder" />
                    <ScoreMetric label="Decision Quality" value={scores.decisionQuality} max={100} icon="scale-balanced" />
                    <ScoreMetric label="Legitimacy" value={scores.legitimacy} max={100} icon="shield-halved" />
                </div>
            </div>

            {/* 2. Thinking Signature */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-fingerprint text-indigo-500"></i> Thinking Signature
                    </h3>
                    <div className="text-3xl font-bold text-white mb-2">{signature.archetype}</div>
                    <p className="text-zinc-400 text-sm mb-6">
                        This company rewards verified thinking patterns aligned with complex system design and rapid iteration.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {signature.dominantDimensions?.map(d => (
                            <span key={d} className="px-3 py-1 bg-indigo-900/30 border border-indigo-700 text-indigo-300 rounded-full text-sm">
                                {d}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 3. Talent Reality */}
                <div className="panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-chart-line text-emerald-500"></i> Talent Reality
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 p-4 rounded-lg">
                            <div className="text-zinc-500 text-xs uppercase">Avg Sense Index</div>
                            <div className="text-2xl font-bold text-white">{outcomes.avgSenseIndexHired}</div>
                        </div>
                        <div className="bg-black/40 p-4 rounded-lg">
                            <div className="text-zinc-500 text-xs uppercase">Retention Signal</div>
                            <div className="text-2xl font-bold text-emerald-400">{outcomes.retentionSignal}</div>
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-zinc-500">
                        * Based on verified outcome data from {reputation.agentLogs?.length || 0} signals.
                    </div>
                </div>
            </div>

            {/* Philosophy Footer */}
            <div className="text-center text-zinc-600 text-sm mt-12 max-w-2xl mx-auto">
                "The Senses does not help companies look smart. It shows whether they actually are."
            </div>
        </div>
    );
};

const ScoreMetric = ({ label, value, max, icon }) => (
    <div className="bg-black/20 p-4 rounded-lg border border-zinc-800/50">
        <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase mb-1">
            <i className={`fa-solid fa-${icon}`}></i> {label}
        </div>
        <div className="text-xl font-bold text-white">
            {value} <span className="text-zinc-600 text-sm">/ {max}</span>
        </div>
    </div>
);

export default CompanyReputation;
