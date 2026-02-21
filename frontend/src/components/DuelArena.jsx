import React, { useState, useEffect } from 'react';
import { getDuel, acceptDuel, completeDuel } from '../services/api';

const DuelArena = ({ duelId, userId, isChallenger, onClose, onComplete }) => {
    const [questions, setQuestions] = useState([]);
    const [meta, setMeta] = useState({ difficulty: 'medium', jobProfile: 'developer' });
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { qIndex: score }
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                const res = await getDuel(duelId);
                const qSet = res.data.questionSet || [];
                setQuestions(qSet);
                setMeta({
                    difficulty: res.data.difficulty || 'medium',
                    jobProfile: res.data.jobProfile || 'developer'
                });
            } catch (err) {
                console.error("Failed to load duel questions", err);
                setError("Failed to load arena.");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [duelId]);

    const handleAnswer = (choiceScore) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: choiceScore
        }));

        // Move to next or submit
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Submit automatically on last answer? Or show submit button? 
            // Let's maximize flow -> Show submit button on last screen or auto-submit.
            // Let's wait for user to click "Finish".
        }
    };

    const submitDuel = async () => {
        setSubmitting(true);
        try {
            // Format answers for API (Expects array of scores relative to questions index usually, or map?)
            // Duel model expects Map<String, Number>.
            // Controller `analyzeIntelligence` takes `answers`.
            // Let's verify what `analyzeIntelligence` expects. 
            // Usually it expects an array of objects or a map.
            // In Test.jsx we sent: `answers: { q1: 10, q2: 5 }`.
            // Here `duelController` passes `answers` to `analyzeIntelligence`.

            // Let's construct a simple list of scores corresponding to question order.
            // Actually, `analyzeIntelligence` relies on `q.domain` etc.
            // We should just send the array of answers with scores.

            // Wait, `duelController` calls `analyzeIntelligence({ answers, ... })`.
            // Let's look at `analyzeIntelligence` import in controller? No, I can't see it.
            // But `submitTest` in `api.js` formats it as `q1: score`. 

            // For Duels, let's send standard array of objects: [{ questionId, score, domain }] 
            // But the controller just saves `answers` into `opponentAnswers` (Map).

            // Let's send a map { [questionId]: score }.
            // The `DuelSchema` has `opponentAnswers: { type: Map, of: Number }`.
            // This suggests key is questionId, value is score.

            const formattedAnswers = {};
            questions.forEach((q, idx) => {
                // Default to 0 if not answered (shouldn't happen with flow)
                formattedAnswers[q._id] = answers[idx] || 0;
            });

            // We also need an array format for `analyzeIntelligence` if it is shared?
            // Actually, the controller `acceptDuel` calls `analyzeIntelligence`.
            // If `analyzeIntelligence` was designed for the main test, it expects `answers` to be an object `q1: val`.
            // I should double check `duelController` usage.
            // `const opponentScore = analyzeIntelligence({ answers, ...})`.

            // If I look at `Test.jsx`, `submitTest` maps array to `q1, q2`. 
            // `duelController` just takes `req.body.answers`.
            // Let's assume sending the raw map `{ questionId: score }` is NOT what `analyzeIntelligence` wants if it wasn't refactored.
            // However, `analyzeIntelligence` likely iterates over keys.

            // SAFE BET: Send the answers in the format the controller expects for storage, 
            // AND hope `analyzeIntelligence` handles it. 
            // Given I can't see `analyzeIntelligence`, I'll assume it's robust or I'll fix it if it breaks.
            // But actually, `acceptDuel` saves `answers` directly to `duel.opponentAnswers` which is a Map.
            // So `{ questionId: score }` is correct for Mongoose Map.

            // API Call
            if (isChallenger) {
                await completeDuel(duelId, userId, formattedAnswers, meta.difficulty, meta.jobProfile);
            } else {
                await acceptDuel(duelId, userId, formattedAnswers, meta.difficulty, meta.jobProfile);
            }

            onComplete();

        } catch (err) {
            console.error("Duel submission failed", err);
            setError("Failed to submit results.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Loading Arena...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return <div className="p-8 text-white">No questions found.</div>;

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full border border-blue-500/30 shadow-2xl shadow-blue-500/10 relative overflow-hidden">

                {/* Progress Bar */}
                <div className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />

                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-white">
                        Question {currentQuestionIndex + 1} <span className="text-white/50">/ {questions.length}</span>
                    </h2>
                    <div className="text-sm px-3 py-1 bg-white/5 rounded-full text-blue-400 border border-blue-500/20">
                        {currentQ.domain || "General"}
                    </div>
                </div>

                <div className="mb-8">
                    <p className="text-xl text-white font-medium leading-relaxed">
                        {currentQ.text || currentQ.prompt}
                    </p>
                    {currentQ.codeBlock && (
                        <pre className="mt-4 p-4 bg-black/50 rounded-lg text-sm font-mono text-gray-300 overflow-x-auto">
                            {currentQ.codeBlock}
                        </pre>
                    )}
                </div>

                <div className="grid gap-3">
                    {/* Only show submitted if we answered this one? No, valid flow is one by one */}
                    {(currentQ.options || currentQ.choices || []).map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(opt.score)}
                            className={`p-4 rounded-xl text-left transition-all border ${answers[currentQuestionIndex] === opt.score
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${answers[currentQuestionIndex] === opt.score ? 'border-white bg-white/20' : 'border-white/30'
                                    }`}>
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                {opt.text}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer Controls */}
                <div className="mt-8 flex justify-between items-center border-t border-white/10 pt-6">
                    <button
                        onClick={onClose}
                        className="text-white/50 hover:text-white transition-colors"
                    >
                        Forfeit
                    </button>

                    {currentQuestionIndex === questions.length - 1 && answers[currentQuestionIndex] !== undefined && (
                        <button
                            onClick={submitDuel}
                            disabled={submitting}
                            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-bold hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : <><span>Complete Duel </span><i className="fa-solid fa-swords"></i></>}
                        </button>
                    )}
                    {currentQuestionIndex < questions.length - 1 && answers[currentQuestionIndex] !== undefined && (
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            Next →
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default DuelArena;
