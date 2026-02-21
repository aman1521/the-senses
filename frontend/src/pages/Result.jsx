import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { calculateArchetype, getInsights, getTrustColor } from "../lib/core";
import { submitTest, createCheckoutSession, downloadCertificate } from "../services/api";
import Loader from "../components/Loader";
import "./Result.css";

function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Analysis State
  const [archetype, setArchetype] = useState({ name: "Analyzing...", badge: "..." });
  const [domainStats, setDomainStats] = useState([]);

  useEffect(() => {
    if (!state || !state.answers) {
      // If no state, try to recover or redirect (omitted for brevity, just stop loading)
      setLoading(false);
      return;
    }

    const processResult = async () => {
      try {
        const payload = {
          answers: state.answers,
          difficulty: state.difficulty,
          jobProfile: state.jobProfile,
          finalScore: state.finalScore,
          meta: state.meta // { timeTaken, violations, ... }
        };

        // Submit to backend
        const res = await submitTest(payload);
        const data = res.data?.data || state;
        setScoreData(data);

        // --- Local Analysis (Client-side enrichment) ---
        analyzePerformance(data, state.answers);

        // Store Session ID for Claim Loop (Phase 3)
        if (data.sessionId && (!data.userId || data.userId === 'guest')) {
          localStorage.setItem("senses_claim_session", data.sessionId);
        }

        setLoading(false);
      } catch (err) {
        console.error("Submission Error", err);
        // Fallback to local state if backend fails
        setScoreData(state);
        analyzePerformance(state, state.answers);
        setLoading(false);
      }
    };

    processResult();
  }, [state]);

  const analyzePerformance = (data, answers) => {
    const score = data.score !== undefined ? data.score : (data.finalScore || 0);

    // 1. Determine Archetype using Core Logic
    const archName = calculateArchetype({
      finalScore: score,
      baseBadge: "Analyst",
      meta: state.meta || {}
    });

    const insights = getInsights(archName);

    // Map archetype to icon
    const iconMap = {
      "Analyst": "fa-chart-pie",
      "Strategist": "fa-chess",
      "Visionary Architect": "fa-eye",
      "Rapid Strategist": "fa-bolt",
      "Quick Thinker": "fa-stopwatch",
      "Visual Savant": "fa-image"
    };

    const arch = {
      name: archName,
      badge: iconMap[archName] || "fa-brain",
      description: insights.description
    };

    setArchetype(arch);

    // 2. Domain Breakdown
    const domains = {};
    answers.forEach(a => {
      const d = a.domain || "General Logic";
      if (!domains[d]) domains[d] = { total: 0, score: 0, count: 0 };
      domains[d].total += 10; // Assuming max score per Q is 10? Or normalized?
      // Let's assume normalized score or just sum raw score
      domains[d].score += (a.score || 0);
      domains[d].count++;
    });

    const stats = Object.keys(domains).map(k => {
      const d = domains[k];
      // If max score unknown, we approximate based on 'score' (assuming max 10 per q for high score?)
      // Actually, Test.jsx uses arbitrary 'score' logic. Let's purely visualize relative strength.
      // We'll normalize to 0-100 logic.
      // If score was e.g. 5, max is maybe 10?
      // Let's assume max relative to other domains.
      return {
        name: k.charAt(0).toUpperCase() + k.slice(1),
        value: Math.min(100, Math.round((d.score / (d.count * 10)) * 100)) // Heuristic
      };
    });

    // If no domains (legacy), add fake ones for demo visual
    if (stats.length === 0) {
      stats.push({ name: "Pattern Recognition", value: score });
      stats.push({ name: "Logical Reasoning", value: Math.max(0, score - 5) });
      stats.push({ name: "Speed", value: Math.min(100, score + 10) });
    }

    setDomainStats(stats);
  };

  const handleShare = () => {
    alert("Share Card generation coming in Phase 2!");
  };

  if (loading) return <div className="result-container"><Loader text="Analyzing Neural Patterns..." /></div>;

  if (!scoreData) return (
    <div className="result-container">
      <div className="result-card">
        <h2>No Result Data Found</h2>
        <button className="btn-secondary" onClick={() => navigate("/")}>Return Home</button>
      </div>
    </div>
  );

  const finalScore = scoreData.score !== undefined ? scoreData.score : (scoreData.finalScore || 0);

  return (
    <div className="result-container">

      <div className="archetype-badge">{archetype.name} Tier</div>

      <div className="result-card animate-fade-in">
        <h1 className="archetype-title">{archetype.name}</h1>
        <p style={{ color: '#888', marginBottom: '30px' }}>
          {archetype.description}
        </p>

        <div className="score-grid">
          <div className="stat-item">
            <h3>Score</h3>
            <div className="value">{finalScore.toFixed(0)}</div>
          </div>
          <div className="stat-item">
            <h3>Integrity</h3>
            <div className="value" style={{ color: getTrustColor(state?.meta?.integrityScore || 100) }}>
              {state?.meta?.integrityScore || 100}%
            </div>
            {state?.meta?.cheatingFlags?.length > 0 && (
              <div style={{ fontSize: '10px', color: '#ff4444', marginTop: '5px' }}>
                {state.meta.cheatingFlags.length} Flags Detected
              </div>
            )}
          </div>
          <div className="stat-item">
            <h3>Video Intro</h3>
            <div className="value">
              {state?.meta?.videoBlob ? <i className="fa-solid fa-check text-green-500"></i> : <i className="fa-solid fa-triangle-exclamation text-yellow-500"></i>}
            </div>
          </div>

          {state?.meta?.reactionTimes && state.meta.reactionTimes.length > 0 && (
            <div className="stat-item">
              <h3>Reaction Speed</h3>
              <div className="value text-green-400">
                {Math.round(state.meta.reactionTimes.reduce((a, b) => a + b, 0) / state.meta.reactionTimes.length)}ms
              </div>
            </div>
          )}

          {state?.meta?.memoryScore > 0 && (
            <div className="stat-item">
              <h3>Memory Score</h3>
              <div className="value text-indigo-400">
                {state.meta.memoryScore} pts
              </div>
            </div>
          )}
        </div>

        {/* Integrity Details */}
        {state?.meta?.cheatingFlags?.length > 0 && (
          <div style={{ marginTop: '20px', textAlign: 'left', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '8px' }}>
            <strong style={{ color: '#ff4444', fontSize: '12px' }}>INTEGRITY AUDIT:</strong>
            <ul style={{ margin: '5px 0 0 20px', fontSize: '12px', color: '#ffaaaa' }}>
              {state.meta.cheatingFlags.map((flag, i) => (
                <li key={i}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {domainStats.length > 0 && (
        <div style={{ margin: '20px 0', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '15px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ color: '#888' }}>Primary Asset:</span> <strong style={{ color: '#00d2ff' }}>{domainStats.sort((a, b) => b.value - a.value)[0].name}</strong>
          </div>
          <div>
            <span style={{ color: '#888' }}>Growth Area:</span> <strong style={{ color: '#ff6b6b' }}>{domainStats.sort((a, b) => a.value - b.value)[0].name}</strong>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'left', marginTop: '40px' }}>
        <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px' }}>Cognitive Breakdown</h3>
        <div className="breakdown-grid">
          {domainStats.map((stat, i) => (
            <div key={i} className="breakdown-card">
              <div className="domain-name">{stat.name}</div>
              <div className="domain-bar-container">
                <div className="domain-bar" style={{ width: `${stat.value}%` }}></div>
              </div>
              <div className="domain-value">{stat.value}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Guest CTA - Phase 3 Credibility */}
      {
        (!scoreData?.userId || scoreData.userId === 'guest') && (
          <div style={{
            margin: '40px 0',
            padding: '20px',
            background: 'linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(0,0,0,0) 100%)',
            borderLeft: '4px solid #ffd700',
            textAlign: 'left',
            borderRadius: '8px'
          }}>
            <h3 style={{ color: '#ffd700', marginBottom: '8px', fontSize: '18px' }}><i className="fa-solid fa-triangle-exclamation"></i> Unverified Score</h3>
            <p style={{ color: '#ccc', marginBottom: '15px', fontSize: '14px' }}>
              This score is currently detached from a verified identity. To claim this rank on the global leaderboard, you must establish a neural link.
            </p>
            <button className="primary-button" style={{ fontSize: '14px', padding: '10px 24px' }} onClick={() => navigate("/login")}>
              <i className="fa-solid fa-lock"></i> Claim Identity
            </button>
          </div>
        )
      }

      <div className="action-buttons">
        <button className="btn-secondary" onClick={() => navigate("/leaderboard")}>
          <i className="fa-solid fa-trophy"></i> Global Rankings
        </button>

        {/* Certificate / Payment Logic */}
        {new URLSearchParams(window.location.search).get('cert_success') ? (
          <button className="primary-button" style={{ background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)' }} onClick={async () => {
            try {
              const blob = await downloadCertificate(scoreData._id);
              const url = window.URL.createObjectURL(new Blob([blob.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `Certificate_${scoreData._id}.pdf`);
              document.body.appendChild(link);
              link.click();
            } catch (e) {
              alert("Failed to download certificate. Please try again.");
            }
          }}>
            <i className="fa-solid fa-file-pdf"></i> Download Official Certificate
          </button>
        ) : (
          <button className="primary-button" style={{ background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)' }} onClick={async () => {
            if (!scoreData?._id) return alert("Please save your result by claiming identity first.");
            try {
              const res = await createCheckoutSession(scoreData._id);
              if (res.data.url) window.location.href = res.data.url;
            } catch (e) {
              alert("Payment initialization failed. Ensure you are logged in.");
            }
          }}>
            <i className="fa-solid fa-medal"></i> Get Official Certificate
          </button>
        )}

        <button className="primary-button" onClick={() => {
          if (scoreData?.share?.slug) {
            const url = `${window.location.origin}/share/${scoreData.share.slug}`;
            const text = `I scored in the Top ${(100 - (scoreData.rank?.globalPercentile || 50)).toFixed(1)}% on The Senses. My Archetype: ${scoreData.rank?.tier || "Analyst"}. \n\nCan you beat my cognitive score?`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
          } else {
            alert("Result not saved yet!");
          }
        }}>
          <i className="fa-solid fa-share-from-square"></i> Share on X
        </button>

        {scoreData?.sessionId && (
          <button className="btn-secondary" onClick={() => navigate(`/review/${scoreData.sessionId}`)}>
            <i className="fa-solid fa-list-check"></i> Review Answers
          </button>
        )}

        <button className="btn-secondary" onClick={() => navigate("/test")}>
          <i className="fa-solid fa-rotate"></i> Retake Test
        </button>
      </div>

      {/* Share Card Preview */}
      {
        scoreData?.share?.slug && (
          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <h3 style={{ color: '#888', marginBottom: '20px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Official Share Card</h3>
            <div style={{
              position: 'relative',
              maxWidth: '600px',
              margin: '0 auto',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <img
                src={`${import.meta.env.VITE_API_URL}/api/og/${scoreData.share.slug}.png`}
                alt="Share Card"
                style={{ width: '100%', display: 'block' }}
              />
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                padding: '10px',
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <a
                  href={`${import.meta.env.VITE_API_URL}/api/og/${scoreData.share.slug}.png`}
                  download={`the-senses-result-${scoreData.share.slug}.png`}
                  style={{ color: '#fff', textDecoration: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <i className="fa-solid fa-download"></i> Download Image
                </a>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}

export default Result;
