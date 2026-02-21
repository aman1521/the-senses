import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getReviewResult } from "../services/api";
import Loader from "../components/Loader";
import "./ReviewAnswers.css";

function ReviewAnswers() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const res = await getReviewResult(sessionId);
                setResult(res.data.result);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch review:", err);
                setError("Failed to load test review. This session may not exist.");
                setLoading(false);
            }
        };

        fetchReview();
    }, [sessionId]);

    if (loading) return <div className="review-container"><Loader text="Loading Your Test Review..." /></div>;

    if (error) return (
        <div className="review-container">
            <div className="error-card">
                <h2>{error}</h2>
                <button className="btn-secondary" onClick={() => navigate("/")}>Return Home</button>
            </div>
        </div>
    );

    if (!result || !result.testDetail || !result.testDetail.questions || result.testDetail.questions.length === 0) {
        return (
            <div className="review-container">
                <div className="error-card">
                    <h2>No detailed answers available for this test</h2>
                    <p style={{ color: '#888', marginTop: '10px' }}>
                        This might be an older test taken before the detailed answer tracking feature was implemented.
                    </p>
                    <button className="btn-secondary" onClick={() => navigate("/")}>Return Home</button>
                </div>
            </div>
        );
    }

    const { testDetail, finalScore, rank, profile } = result;
    const { questions, totalQuestions, correctCount, completionTime } = testDetail;

    const accuracyPercentage = totalQuestions > 0 ? ((correctCount / totalQuestions) * 100).toFixed(1) : 0;

    return (
        <div className="review-container">
            <div className="review-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <i className="fa-solid fa-arrow-left"></i> Back to Results
                </button>

                <div className="review-title-section">
                    <h1><i className="fa-solid fa-list-check"></i> Test Review</h1>
                    <p className="review-subtitle">Session ID: {sessionId}</p>
                </div>

                <div className="review-summary-grid">
                    <div className="summary-stat">
                        <div className="stat-label">Final Score</div>
                        <div className="stat-value text-blue">{finalScore?.toFixed(0) || 0}</div>
                    </div>
                    <div className="summary-stat">
                        <div className="stat-label">Accuracy</div>
                        <div className="stat-value text-green">{accuracyPercentage}%</div>
                    </div>
                    <div className="summary-stat">
                        <div className="stat-label">Correct Answers</div>
                        <div className="stat-value text-purple">{correctCount}/{totalQuestions}</div>
                    </div>
                    <div className="summary-stat">
                        <div className="stat-label">Time Taken</div>
                        <div className="stat-value text-orange">{Math.floor(completionTime / 60)}:{String(completionTime % 60).padStart(2, '0')}</div>
                    </div>
                </div>

                {rank && (
                    <div className="tier-badge">
                        <i className="fa-solid fa-trophy"></i> {rank.tier} - Top {(100 - rank.globalPercentile).toFixed(1)}%
                    </div>
                )}
            </div>

            <div className="questions-list">
                {questions.map((q, index) => (
                    <div key={index} className={`question-card ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                        <div className="question-header">
                            <div className="question-number">Question {index + 1}</div>
                            <div className={`correctness-badge ${q.isCorrect ? 'badge-correct' : 'badge-incorrect'}`}>
                                {q.isCorrect ? (
                                    <><i className="fa-solid fa-check"></i> Correct</>
                                ) : (
                                    <><i className="fa-solid fa-xmark"></i> Incorrect</>
                                )}
                            </div>
                            {q.topic && <div className="question-topic"><i className="fa-solid fa-tag"></i> {q.topic}</div>}
                        </div>

                        <div className="question-text">
                            {q.questionText}
                        </div>

                        <div className="answer-section">
                            <div className="answer-row">
                                <span className="answer-label">Your Answer:</span>
                                <span className={`answer-value ${q.isCorrect ? 'text-green' : 'text-red'}`}>
                                    {typeof q.userAnswer === 'number' ? `Option ${q.userAnswer + 1}` : q.userAnswer}
                                </span>
                            </div>

                            {!q.isCorrect && q.correctAnswer !== undefined && (
                                <div className="answer-row">
                                    <span className="answer-label">Correct Answer:</span>
                                    <span className="answer-value text-green">
                                        {typeof q.correctAnswer === 'number' ? `Option ${q.correctAnswer + 1}` : q.correctAnswer}
                                    </span>
                                </div>
                            )}

                            {q.timeSpent > 0 && (
                                <div className="answer-row">
                                    <span className="answer-label">Time Spent:</span>
                                    <span className="answer-value text-blue">{q.timeSpent}s</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="review-footer">
                <button className="btn-primary" onClick={() => navigate("/test")}>
                    <i className="fa-solid fa-rotate"></i> Retake Test
                </button>
                <button className="btn-secondary" onClick={() => navigate("/dashboard")}>
                    <i className="fa-solid fa-chart-line"></i> View Dashboard
                </button>
            </div>
        </div>
    );
}

export default ReviewAnswers;
