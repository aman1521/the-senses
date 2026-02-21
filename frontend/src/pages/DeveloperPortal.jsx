import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const SCOPES = ['read:profile', 'read:results', 'read:analytics', 'write:profile', 'admin'];

const DeveloperPortal = () => {
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newToken, setNewToken] = useState(null); // shown once after creation
    const [form, setForm] = useState({ name: '', scopes: ['read:profile', 'read:results'], expiresInDays: '' });
    const [showForm, setShowForm] = useState(false);
    const [revoking, setRevoking] = useState(null);
    const [copied, setCopied] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => { fetchTokens(); }, []);

    const fetchTokens = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BACKEND}/api/v1/developer/tokens`, { headers });
            setTokens(res.data.tokens || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await axios.post(`${BACKEND}/api/v1/developer/tokens`, {
                name: form.name,
                scopes: form.scopes,
                expiresInDays: form.expiresInDays ? Number(form.expiresInDays) : undefined
            }, { headers });
            setNewToken(res.data.token);
            setShowForm(false);
            setForm({ name: '', scopes: ['read:profile', 'read:results'], expiresInDays: '' });
            fetchTokens();
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to create token');
        } finally {
            setCreating(false);
        }
    };

    const handleRevoke = async (tokenId) => {
        if (!window.confirm('Revoke this token? This cannot be undone.')) return;
        setRevoking(tokenId);
        try {
            await axios.delete(`${BACKEND}/api/v1/developer/tokens/${tokenId}`, { headers });
            setTokens(prev => prev.map(t => t._id === tokenId ? { ...t, isActive: false } : t));
        } catch (e) {
            alert('Failed to revoke token');
        } finally {
            setRevoking(null);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleScope = (scope) => {
        setForm(f => ({
            ...f,
            scopes: f.scopes.includes(scope)
                ? f.scopes.filter(s => s !== scope)
                : [...f.scopes, scope]
        }));
    };

    return (
        <div className="min-h-screen bg-black text-white pt-24 px-4 md:px-8">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-xl">
                            <i className="fa-solid fa-code"></i>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Developer Portal</h1>
                            <p className="text-zinc-400 text-sm">Integrate The Senses into your application</p>
                        </div>
                    </div>
                </div>

                {/* API Docs Quick Reference */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                        { method: 'GET', path: '/api/v1/developer/me', scope: 'read:profile', desc: 'Your profile' },
                        { method: 'GET', path: '/api/v1/developer/results', scope: 'read:results', desc: 'Intelligence results' },
                        { method: 'GET', path: '/api/v1/analytics/candidate/:id', scope: 'read:analytics', desc: 'Deep analytics' },
                    ].map(ep => (
                        <div key={ep.path} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-indigo-500/40 transition">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">{ep.method}</span>
                                <code className="text-xs text-zinc-300 break-all">{ep.path}</code>
                            </div>
                            <p className="text-xs text-zinc-500 mb-2">{ep.desc}</p>
                            <span className="text-[10px] bg-indigo-900/30 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">{ep.scope}</span>
                        </div>
                    ))}
                </div>

                {/* Usage Example */}
                <div className="bg-zinc-950 border border-white/10 rounded-xl p-5 mb-8 font-mono text-sm overflow-x-auto">
                    <div className="text-zinc-500 mb-2 text-xs">Example request</div>
                    <pre className="text-emerald-400">{`curl -H "Authorization: Bearer sk_live_your_token" \\
     ${BACKEND}/api/v1/developer/me`}
                    </pre>
                </div>

                {/* New Token Reveal Modal */}
                {newToken && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-zinc-950 border border-indigo-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                                    <i className="fa-solid fa-check"></i>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Token Created!</h3>
                                    <p className="text-xs text-red-400">⚠️ Copy this now. It won't be shown again.</p>
                                </div>
                            </div>
                            <div className="bg-black border border-white/10 rounded-xl p-4 mb-4 flex items-center gap-3">
                                <code className="text-emerald-400 text-xs break-all flex-1">{newToken.rawToken}</code>
                                <button
                                    onClick={() => copyToClipboard(newToken.rawToken)}
                                    className="text-zinc-400 hover:text-white transition shrink-0"
                                >
                                    <i className={`fa-solid ${copied ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                                </button>
                            </div>
                            <div className="flex gap-2 text-xs text-zinc-500 mb-6">
                                <span><i className="fa-solid fa-tag mr-1"></i>{newToken.name}</span>
                                <span>•</span>
                                <span><i className="fa-solid fa-shield mr-1"></i>{newToken.scopes.join(', ')}</span>
                            </div>
                            <button onClick={() => setNewToken(null)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-sm transition">
                                I've saved it — Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Tokens List */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-lg">API Tokens</h2>
                            <p className="text-xs text-zinc-500">{tokens.filter(t => t.isActive).length}/5 active tokens</p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-bold transition flex items-center gap-2"
                        >
                            <i className="fa-solid fa-plus"></i> New Token
                        </button>
                    </div>

                    {/* Create Form */}
                    {showForm && (
                        <form onSubmit={handleCreate} className="p-6 border-b border-white/10 bg-black/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs text-zinc-400 mb-1 block">Token Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. My App Integration"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-400 mb-1 block">Expires in Days (leave blank = never)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 90"
                                        value={form.expiresInDays}
                                        onChange={e => setForm({ ...form, expiresInDays: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                                        min={1}
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="text-xs text-zinc-400 mb-2 block">Scopes</label>
                                <div className="flex flex-wrap gap-2">
                                    {SCOPES.map(scope => (
                                        <button
                                            key={scope}
                                            type="button"
                                            onClick={() => toggleScope(scope)}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${form.scopes.includes(scope) ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-zinc-400 hover:border-zinc-500'}`}
                                        >
                                            {scope}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={creating || form.scopes.length === 0}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg text-sm font-bold transition"
                                >
                                    {creating ? 'Creating...' : 'Create Token'}
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-white/10 rounded-lg text-sm text-zinc-400 hover:text-white transition">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Token Rows */}
                    {loading ? (
                        <div className="p-8 text-center text-zinc-500"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Loading tokens...</div>
                    ) : tokens.length === 0 ? (
                        <div className="p-12 text-center">
                            <i className="fa-solid fa-key text-4xl text-zinc-700 mb-4 block"></i>
                            <p className="text-zinc-500">No tokens yet. Create one to integrate The Senses API.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {tokens.map(t => (
                                <div key={t._id} className={`px-6 py-4 flex items-center justify-between gap-4 transition ${t.isActive ? '' : 'opacity-40'}`}>
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${t.isActive ? 'bg-emerald-400' : 'bg-zinc-600'}`}></div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-sm truncate">{t.name}</div>
                                            <div className="text-xs text-zinc-500 flex gap-3 mt-0.5 flex-wrap">
                                                <span><i className="fa-solid fa-shield mr-1"></i>{t.scopes.join(', ')}</span>
                                                {t.lastUsedAt && <span>Used {new Date(t.lastUsedAt).toLocaleDateString()}</span>}
                                                {t.expiresAt && <span className="text-amber-500">Expires {new Date(t.expiresAt).toLocaleDateString()}</span>}
                                                {!t.expiresAt && <span>Never expires</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs text-zinc-600 hidden md:block">{t.usageCount || 0} uses</span>
                                        {t.isActive && (
                                            <button
                                                onClick={() => handleRevoke(t._id)}
                                                disabled={revoking === t._id}
                                                className="text-xs text-red-400 hover:text-red-300 transition border border-red-900/50 px-3 py-1 rounded-lg"
                                            >
                                                {revoking === t._id ? 'Revoking...' : 'Revoke'}
                                            </button>
                                        )}
                                        {!t.isActive && <span className="text-xs text-zinc-600 border border-zinc-700 px-3 py-1 rounded-lg">Revoked</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeveloperPortal;
