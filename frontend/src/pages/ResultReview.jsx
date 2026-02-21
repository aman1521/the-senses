import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getReviewResult } from "../services/api";

export default function ResultReview() {
    const { sessionId } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const { data } = await getReviewResult(sessionId);
                if (data.success) {
                    setResult(data.result);
                } else {
                    setError("Failed to load result.");
                }
            } catch (err) {
                console.error(err);
                setError("Error loading result.");
            } finally {
                setLoading(false);
            }
        };

        if (sessionId) fetchResult();
    }, [sessionId]);

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
    if (error) return <div className="min-h-screen bg-black text-white flex items-center justify-center text-red-500">{error}</div>;

    const { testDetail, finalScore, badge } = result;

    // Calculate stats if missing
    const questions = testDetail?.questions || [];
    const correctCount = questions.filter(q => q.isCorrect).length;
    const totalQuestions = questions.length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center border-b border-zinc-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                            Test Review
                        </h1>
                        <p className="text-zinc-500 mt-1">Session ID: <span className="font-mono text-zinc-400">{sessionId}</span></p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold">{finalScore} <span className="text-lg text-zinc-500 font-normal">/ 100</span></div>
                        <div className={`text-sm font-bold uppercase tracking-wider ${badge === 'Gold' ? 'text-yellow-400' : 'text-zinc-400'}`}>
                            {badge} Tier
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center">
                        <div className="text-zinc-400 text-xs uppercase mb-1">Accuracy</div>
                        <div className="text-2xl font-bold text-white">{accuracy}%</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center">
                        <div className="text-zinc-400 text-xs uppercase mb-1">Correct Answers</div>
                        <div className="text-2xl font-bold text-green-400">{correctCount}</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center">
                        <div className="text-zinc-400 text-xs uppercase mb-1">Incorrect</div>
                        <div className="text-2xl font-bold text-red-400">{totalQuestions - correctCount}</div>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                    {questions.map((q, idx) => (
                        <div key={idx} className={`p-6 rounded-xl border ${q.isCorrect ? 'border-green-900/30 bg-green-900/10' : 'border-red-900/30 bg-red-900/10'}`}>
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${q.isCorrect ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-zinc-200 mb-4">{q.questionText}</h3>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {/* User Answer */}
                                        <div className={`p-3 rounded-lg border ${q.isCorrect ? 'border-green-500/20 bg-green-500/10' : 'border-red-500/20 bg-red-500/10'}`}>
                                            <div className="text-xs text-zinc-500 uppercase mb-1">Your Answer</div>
                                            <div className={q.isCorrect ? 'text-green-400' : 'text-red-400'}>
                                                {String(q.userAnswer)}
                                            </div>
                                        </div>

                                        {/* Correct Answer (Show if wrong) */}
                                        {!q.isCorrect && (
                                            <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                                                <div className="text-xs text-zinc-500 uppercase mb-1">Correct Answer</div>
                                                <div className="text-indigo-300">
                                                    {String(q.correctAnswer)}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Time Spent */}
                                    <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600">
                                        <i className="fa-regular fa-clock"></i>
                                        <span>Time spent: {(q.timeSpent / 1000).toFixed(1)}s</span>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))}

                    {questions.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                            No detailed question history available for this test.
                        </div>
                    )}
                </div>

                <div className="flex justify-center pt-8">
                    <Link to="/dashboard" className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-full transition-colors">
                        Back to Dashboard
                    </Link>
                </div>

            </div>
        </div>
    );
}
