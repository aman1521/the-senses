import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import '../styles/UserProfile.css';

const UserProfile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchProfile();
    }, [username]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const endpoint = username
                ? `/api/v1/user-profiles/public/${username}`
                : '/api/v1/user-profiles/me';

            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
                headers: username ? {} : { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });

            setProfile(response.data.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-error">
                <h2>Profile Not Found</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/')}>Go Home</button>
            </div>
        );
    }

    // Prepare radar chart data
    const radarData = profile.thinkingMetrics?.strengthRadarData
        ? [
            { skill: 'Problem Solving', value: profile.thinkingMetrics.strengthRadarData.problemSolvingSpeed },
            { skill: 'Analytical', value: profile.thinkingMetrics.strengthRadarData.analyticalDepth },
            { skill: 'Creativity', value: profile.thinkingMetrics.strengthRadarData.creativityIndex },
            { skill: 'Logical', value: profile.thinkingMetrics.strengthRadarData.logicalReasoning },
            { skill: 'Critical', value: profile.thinkingMetrics.strengthRadarData.criticalThinking },
            { skill: 'Pattern', value: profile.thinkingMetrics.strengthRadarData.patternRecognition },
        ]
        : [];

    // Prepare score progression data
    const progressionData = profile.scoreProgression?.map((entry) => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: entry.score,
        verified: entry.antiCheatVerified,
    })) || [];

    const renderProfileHeader = () => (
        <div className="profile-header">
            <div className="profile-header-background"></div>
            <div className="profile-header-content">
                <div className="profile-avatar-section">
                    <img
                        src={profile.profilePicture || '/default-avatar.png'}
                        alt={profile.name}
                        className="profile-avatar"
                    />
                    {profile.verified && (
                        <span className="verified-badge" title="AI Verified">
                            <i className="fas fa-check-circle"></i>
                        </span>
                    )}
                </div>

                <div className="profile-header-info">
                    <div className="profile-name-section">
                        <h1>{profile.name}</h1>
                        <p className="profile-username">@{profile.username}</p>
                    </div>

                    <div className="profile-meta">
                        {profile.profession && (
                            <span className="profession-tag">
                                <i className="fas fa-briefcase"></i> {profile.profession}
                            </span>
                        )}
                        {profile.country && (
                            <span className="location-tag">
                                <i className="fas fa-map-marker-alt"></i> {profile.country}
                            </span>
                        )}
                        {profile.yearsOfExperience > 0 && (
                            <span className="experience-tag">
                                <i className="fas fa-calendar-alt"></i> {profile.yearsOfExperience} years
                            </span>
                        )}
                    </div>
                </div>

                <div className="profile-score-card">
                    <div className="global-score">
                        <div className="score-value">{profile.globalThinkingScore || 0}</div>
                        <div className="score-label">Global Thinking Score</div>
                    </div>

                    {profile.globalRank && (
                        <div className="global-rank-info">
                            <div className="rank-badge">
                                <i className="fas fa-trophy"></i> Rank #{profile.globalRank}
                            </div>
                            {profile.globalRankPercentile && (
                                <div className="percentile-badge">
                                    Top {100 - profile.globalRankPercentile}%
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderAboutSection = () => (
        <div className="profile-section about-section">
            <h2>
                <i className="fas fa-user-circle"></i> About
            </h2>
            {profile.bio && <p className="bio-text">{profile.bio}</p>}

            {profile.skills && profile.skills.length > 0 && (
                <div className="skills-container">
                    <h3>Skills</h3>
                    <div className="skills-tags">
                        {profile.skills.map((skill, index) => (
                            <span key={index} className="skill-tag">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="experience-info">
                <div className="info-item">
                    <span className="info-label">Experience Level:</span>
                    <span className="info-value">{profile.experienceLevel || 'Not specified'}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Years of Experience:</span>
                    <span className="info-value">{profile.yearsOfExperience || 0} years</span>
                </div>
            </div>
        </div>
    );

    const renderThinkingMetrics = () => (
        <div className="profile-section thinking-metrics-section">
            <h2>
                <i className="fas fa-brain"></i> Thinking Metrics
            </h2>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon">
                        <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="metric-value">{profile.thinkingMetrics?.overallCognitiveScore || 0}</div>
                    <div className="metric-label">Overall Cognitive Score</div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">
                        <i className="fas fa-bolt"></i>
                    </div>
                    <div className="metric-value">{profile.thinkingMetrics?.strengthRadarData?.problemSolvingSpeed || 0}%</div>
                    <div className="metric-label">Problem Solving Speed</div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">
                        <i className="fas fa-microscope"></i>
                    </div>
                    <div className="metric-value">{profile.thinkingMetrics?.strengthRadarData?.analyticalDepth || 0}%</div>
                    <div className="metric-label">Analytical Depth</div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">
                        <i className="fas fa-lightbulb"></i>
                    </div>
                    <div className="metric-value">{profile.thinkingMetrics?.strengthRadarData?.creativityIndex || 0}%</div>
                    <div className="metric-label">Creativity Index</div>
                </div>
            </div>

            {radarData.length > 0 && (
                <div className="radar-chart-container">
                    <h3>Strength Radar</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#444" />
                            <PolarAngleAxis dataKey="skill" stroke="#888" />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#666" />
                            <Radar
                                name="Thinking Strengths"
                                dataKey="value"
                                stroke="#6366f1"
                                fill="#6366f1"
                                fillOpacity={0.6}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );

    const renderTestHistory = () => (
        <div className="profile-section test-history-section">
            <h2>
                <i className="fas fa-clock"></i> Test History
            </h2>

            <div className="history-stats">
                <div className="stat-box">
                    <i className="fas fa-clipboard-check"></i>
                    <div className="stat-value">{profile.activity?.testsCompleted || 0}</div>
                    <div className="stat-label">Tests Completed</div>
                </div>
                <div className="stat-box">
                    <i className="fas fa-trophy"></i>
                    <div className="stat-value">{profile.globalThinkingScore || 0}</div>
                    <div className="stat-label">Current Score</div>
                </div>
                <div className="stat-box">
                    <i className="fas fa-shield-alt"></i>
                    <div className="stat-value">
                        {profile.scoreProgression?.filter((s) => s.antiCheatVerified).length || 0}
                    </div>
                    <div className="stat-label">Verified Tests</div>
                </div>
            </div>

            {progressionData.length > 0 && (
                <div className="progression-chart-container">
                    <h3>Score Progression</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={progressionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="date" stroke="#888" />
                            <YAxis stroke="#888" domain={[0, 1000]} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#6366f1"
                                strokeWidth={3}
                                dot={{ fill: '#6366f1', r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );

    const renderAchievements = () => (
        <div className="profile-section achievements-section">
            <h2>
                <i className="fas fa-medal"></i> Achievements
            </h2>

            {profile.achievements?.badges && profile.achievements.badges.length > 0 && (
                <div className="badges-container">
                    <h3>Badges Earned</h3>
                    <div className="badges-grid">
                        {profile.achievements.badges.map((badge, index) => (
                            <div key={index} className="badge-card" title={badge.description}>
                                <div className="badge-icon">{badge.icon}</div>
                                <div className="badge-name">{badge.name}</div>
                                <div className="badge-date">
                                    {new Date(badge.earnedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {profile.achievements?.rankMilestones && profile.achievements.rankMilestones.length > 0 && (
                <div className="milestones-container">
                    <h3>Rank Milestones</h3>
                    <div className="milestones-list">
                        {profile.achievements.rankMilestones.map((milestone, index) => (
                            <div key={index} className="milestone-item">
                                <i className="fas fa-trophy milestone-icon"></i>
                                <div className="milestone-info">
                                    <div className="milestone-title">{milestone.title}</div>
                                    <div className="milestone-date">
                                        {new Date(milestone.achievedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderHiringSection = () => {
        if (!profile.openToHiring) return null;

        return (
            <div className="profile-section hiring-section">
                <h2>
                    <i className="fas fa-handshake"></i> Open to Opportunities
                </h2>
                <div className="hiring-status-card">
                    <div className="status-badge active">
                        <i className="fas fa-check-circle"></i> Open to Hiring
                    </div>

                    {profile.hiringLinks && (
                        <div className="hiring-links">
                            {profile.hiringLinks.portfolio && (
                                <a
                                    href={profile.hiringLinks.portfolio}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hiring-link"
                                >
                                    <i className="fas fa-folder"></i> Portfolio
                                </a>
                            )}
                            {profile.hiringLinks.linkedin && (
                                <a
                                    href={profile.hiringLinks.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hiring-link"
                                >
                                    <i className="fab fa-linkedin"></i> LinkedIn
                                </a>
                            )}
                            {profile.hiringLinks.github && (
                                <a
                                    href={profile.hiringLinks.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hiring-link"
                                >
                                    <i className="fab fa-github"></i> GitHub
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="user-profile-page">
            {renderProfileHeader()}

            <div className="profile-content">
                <div className="profile-tabs">
                    <button
                        className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <i className="fas fa-home"></i> Overview
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('metrics')}
                    >
                        <i className="fas fa-chart-bar"></i> Metrics
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <i className="fas fa-history"></i> History
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
                        onClick={() => setActiveTab('achievements')}
                    >
                        <i className="fas fa-award"></i> Achievements
                    </button>
                </div>

                <div className="profile-body">
                    {activeTab === 'overview' && (
                        <>
                            {renderAboutSection()}
                            {renderHiringSection()}
                        </>
                    )}
                    {activeTab === 'metrics' && renderThinkingMetrics()}
                    {activeTab === 'history' && renderTestHistory()}
                    {activeTab === 'achievements' && renderAchievements()}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
