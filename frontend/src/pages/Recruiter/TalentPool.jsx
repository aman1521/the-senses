import { useState, useEffect } from 'react';
import { API } from '../../services/api';
import './TalentPool.css';
import Loader from '../../components/Loader';

const TalentPool = () => {
    const [talents, setTalents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        tier: 'All',
        role: 'All',
        minScore: 80
    });

    useEffect(() => {
        fetchTalent();
    }, [filters]);

    const fetchTalent = async () => {
        setLoading(true);
        try {
            // Mapping frontend filters to backend query params
            // In a real scenario, you'd pass these as query params
            const { data } = await API.get('/api/users/talent-pool');
            if (data.success) {
                let filtered = data.users;

                // Client-side filtering for demo (or move to backend)
                if (filters.tier !== 'All') {
                    filtered = filtered.filter(u => u.rank?.tier === filters.tier);
                }
                if (filters.role !== 'All') {
                    filtered = filtered.filter(u => u.rank?.field === filters.role);
                }
                filtered = filtered.filter(u => (u.stats?.bestScore || 0) >= filters.minScore);

                setTalents(filtered);
            }
        } catch (error) {
            console.error("Failed to fetch talent pool", error);
        } finally {
            setLoading(false);
        }
    };

    const handleHireClick = (userId) => {
        // Prepare for integration with Toptal-like hiring request
        alert(`Request to interview candidate ${userId} sent!`);
    };

    return (
        <div className="talent-pool-container">
            <header className="talent-header">
                <h1>Elite Talent Network</h1>
                <p>Hire the top 1% of cognitive performers.</p>
            </header>

            <div className="filters-bar">
                <select onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
                    <option value="All">All Roles</option>
                    <option value="developer">Developer</option>
                    <option value="designer">Designer</option>
                    <option value="manager">Product Manager</option>
                </select>

                <select onChange={(e) => setFilters({ ...filters, tier: e.target.value })}>
                    <option value="All">All Tiers</option>
                    <option value="Platinum">Top 1% (Platinum)</option>
                    <option value="Gold">Top 5% (Gold)</option>
                    <option value="Silver">Top 10% (Silver)</option>
                </select>

                <div className="score-filter">
                    <span>Min Score: {filters.minScore}</span>
                    <input
                        type="range"
                        min="50"
                        max="99"
                        value={filters.minScore}
                        onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
                    />
                </div>
            </div>

            {loading ? <Loader text="Startups are scouting..." /> : (
                <div className="talent-grid">
                    {talents.map(user => (
                        <div key={user._id} className="talent-card animate-fade-in">
                            <div className="talent-badge">
                                {user.rank?.tier || 'Silver'}
                            </div>
                            <div className="talent-info">
                                <h3>{user.name}</h3>
                                <p className="role">{user.rank?.field || 'Generalist'}</p>
                                <div className="stats-row">
                                    <div className="stat">
                                        <label>Cognitive Score</label>
                                        <span>{user.stats?.bestScore || 0}</span>
                                    </div>
                                    <div className="stat">
                                        <label>Reaction</label>
                                        <span>High</span> {/* Placeholder until we sync reaction stats to user profile */}
                                    </div>
                                </div>
                                <div className="tags">
                                    {user.profile?.badges?.slice(0, 3).map(b => (
                                        <span key={b} className="tag">{b}</span>
                                    ))}
                                </div>
                                <button className="hire-btn" onClick={() => handleHireClick(user._id)}>
                                    View Profile & Hire
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TalentPool;
