import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/api';
import TrustBadge from '../components/TrustBadge';
import UserAvatar from '../components/UserAvatar';
import LeaderboardFilters from '../components/LeaderboardFilters';
import { useNavigate } from 'react-router-dom';
import "./Leaderboard.css";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('global');
  const [additionalFilters, setAdditionalFilters] = useState({});

  // Stats (Mocked or verified from backend if available later)
  const [stats, setStats] = useState({
    avgScore: 68,
    topScore: 99,
    totalCompetitors: 1420
  });

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, additionalFilters]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      // Pass activeTab as jobProfile (except global)
      const filters = {
        jobProfile: activeTab,
        ...additionalFilters
      };

      const response = await getLeaderboard(filters);
      setUsers(response.data || []);

      // Update stats based on fetched data if possible
      if (response.data && response.data.length > 0) {
        setStats(prev => ({
          ...prev,
          topScore: Math.max(...response.data.map(u => u.score || 0)),
          totalCompetitors: response.data.length + 1200 // Mock huge number for "Feel"
        }));
      }

    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'global', label: 'Global Rank' },
    { id: 'developer', label: 'Engineers' },
    { id: 'founder', label: 'Founders' },
    { id: 'designer', label: 'Designers' },
    { id: 'marketer', label: 'Marketers' },
  ];

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1 className="leaderboard-title">Global Rankings</h1>
        <p className="leaderboard-subtitle">Where the world's sharpest minds compete.</p>
      </div>

      <div className="vs-avg-section">
        <div className="stat-box">
          <div>
            <div className="stat-label">Average Score</div>
            <div className="stat-value">{stats.avgScore}</div>
          </div>
          <div style={{ color: '#666', fontSize: '12px', maxWidth: '100px', textAlign: 'right' }}>
            Most people fail to pass 70.
          </div>
        </div>
        <div className="stat-box" style={{ borderColor: 'rgba(255, 215, 0, 0.3)', background: 'rgba(255, 215, 0, 0.05)' }}>
          <div>
            <div className="stat-label" style={{ color: '#ffd700' }}>Top Score</div>
            <div className="stat-value" style={{ color: '#ffd700' }}>{stats.topScore}</div>
          </div>
          <div style={{ color: '#ffd700', fontSize: '24px' }}>
            <i className="fa-solid fa-trophy"></i>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="filters-container mb-6">
        <LeaderboardFilters onFilterChange={setAdditionalFilters} />
      </div>

      <div className="leaderboard-table">
        <div className="table-header">
          <div>Rank</div>
          <div>User</div>
          <div style={{ textAlign: 'center' }}>Trust</div>
          <div style={{ textAlign: 'right' }}>Score</div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading rankings...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No competitors found in this category yet.</div>
        ) : (
          users.map((user, index) => (
            <div key={user._id || index} className="table-row">
              <div className={`rank-cell rank-${index + 1}`}>#{index + 1}</div>
              <div className="user-cell">
                <UserAvatar name={user.name || "Anonymous"} url={user.avatarUrl} size={40} className="mr-3" />
                <div>
                  <div className="user-name">{user.name || "Anonymous User"}</div>
                  <div className="category-cell">{user.jobProfile || "General"}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {/* We reuse the TrustBadge but ensure it fits via container scaling if needed */}
                <div style={{ transform: 'scale(0.8)' }}>
                  <TrustBadge trust={{
                    score: user.trustScore || user.trust || 50,
                    isVerified: (user.trustScore || 0) >= 80
                  }} />
                </div>
              </div>
              <div className="score-cell" style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '15px' }}>
                <span>{user.score || 0}</span>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/duel?opponentId=${user._id}`);
                  }}
                >
                  <i className="fa-solid fa-swords"></i> Duel
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
