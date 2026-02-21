import React, { useState } from 'react';
import { fetchProfileIntelligence } from '../services/api';

const ProfileAI = () => {
    const [name, setName] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setLoading(true);
            const response = await fetchProfileIntelligence(name);
            setResult(response.data);
        } catch (error) {
            console.error('Failed to fetch intelligence:', error);
            setResult({ error: 'Failed to fetch profile intelligence' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-16">
            <h1 className="text-3xl font-bold mb-8 text-center">
                <i className="fa-solid fa-brain"></i> Profile Intelligence
            </h1>

            <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter name to analyze..."
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-500 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Analyzing...' : 'Analyze'}
                    </button>
                </div>
            </form>

            {result && (
                <div className="bg-white/5 rounded-xl p-6">
                    <pre className="text-white/90 whitespace-pre-wrap">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default ProfileAI;

