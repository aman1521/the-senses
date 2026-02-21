import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';

const Search = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialQuery = queryParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, users, posts, bubbles

    useEffect(() => {
        if (query) {
            fetchResults();
        } else {
            setLoading(false);
            setResults(null);
        }
        // eslint-disable-next-line
    }, [location.search, activeTab]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/search?q=${encodeURIComponent(query)}&type=${activeTab}`,
                { headers }
            );
            setResults(res.data.data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchResults();
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 mt-4">Search Results</h1>

            <form onSubmit={handleSearch} className="mb-8 flex gap-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Search users, posts, bubbles..."
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                    <i className="fa-solid fa-search mr-2"></i> Search
                </button>
            </form>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 mb-6">
                {['all', 'users', 'posts', 'bubbles'].map((tab) => (
                    <button
                        key={tab}
                        className={`pb-3 capitalize font-medium ${activeTab === tab ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && <div className="text-center py-10 text-gray-400">Loading results...</div>}

            {/* Results */}
            {!loading && results && (
                <div className="space-y-8">
                    {/* Users */}
                    {(activeTab === 'all' || activeTab === 'users') && results.users && results.users.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 text-white/80">Users</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {results.users.map(user => (
                                    <Link to={`/u/${user.username}`} key={user._id} className="bg-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition">
                                        <img src={user.profilePicture || '/default-avatar.png'} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                                        <div>
                                            <div className="font-bold flex items-center gap-2">
                                                {user.name}
                                                {user.verified && <i className="fa-solid fa-check-circle text-blue-400 text-xs"></i>}
                                            </div>
                                            <div className="text-sm text-gray-400">@{user.username}</div>
                                            {user.currentRole && <div className="text-xs text-gray-500 mt-1">{user.currentRole}</div>}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Posts */}
                    {(activeTab === 'all' || activeTab === 'posts') && results.posts && results.posts.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 text-white/80">Posts</h2>
                            <div className="space-y-4">
                                {results.posts.map(post => (
                                    <div key={post._id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <img src={post.author?.profilePicture || '/default-avatar.png'} alt={post.author?.name} className="w-8 h-8 rounded-full object-cover" />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm leading-none">{post.author?.name}</span>
                                                <span className="text-gray-400 text-xs mt-1">@{post.author?.username}</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-200 text-sm whitespace-pre-wrap">{post.content}</p>
                                        {(post.tags && post.tags.length > 0) && (
                                            <div className="mt-3 flex gap-2">
                                                {post.tags.map(tag => <span key={tag} className="text-xs bg-white/10 px-2 py-1 rounded">#{tag}</span>)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bubbles */}
                    {(activeTab === 'all' || activeTab === 'bubbles') && results.bubbles && results.bubbles.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 text-white/80">Thinking Bubbles</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {results.bubbles.map(bubble => (
                                    <div key={bubble._id} className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-xl p-4 transition-transform hover:scale-[1.02] cursor-pointer">
                                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                            <i className="fa-solid fa-comments text-indigo-400"></i>
                                            {bubble.topicLabel}
                                        </h3>
                                        {bubble.description && <p className="text-sm text-gray-300 mb-3 line-clamp-2">{bubble.description}</p>}
                                        <div className="flex gap-4 text-xs text-gray-400 font-medium pt-2 border-t border-white/10">
                                            <span><i className="fa-solid fa-users mr-1"></i>{bubble.participantCount} Participants</span>
                                            <span><i className="fa-solid fa-fire text-orange-400 mr-1"></i>{bubble.trendingScore} Score</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {(!results.users?.length && !results.posts?.length && !results.bubbles?.length) && (
                        <div className="text-center py-20 text-gray-400 bg-white/5 rounded-2xl border border-white/10">
                            <i className="fa-solid fa-search text-4xl mb-4 opacity-50 block"></i>
                            <p className="text-lg">No results found for "{query}"</p>
                            <p className="text-sm mt-2 opacity-70">Try adjusting your keywords or category.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Search;
