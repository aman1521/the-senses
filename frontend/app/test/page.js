"use client";

import { useEffect, useState } from "react";
import { startTest, submitTest } from "@/services/testService";
import { useTestStore } from "@/store/testStore";
import QuestionCard from "@/components/test/QuestionCard";
import Timer from "@/components/test/Timer";
import useTimer from "@/hooks/useTimer";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

export default function TestPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [loadingQuestions, setLoadingQuestions] = useState(true);

    const {
        questions,
        answers,
        setQuestions,
        answerQuestion,
    } = useTestStore();

    const submit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await submitTest(answers);
            router.push("/result");
        } catch (error) {
            console.error("Submission failed", error);
            setIsSubmitting(false);
        }
    };

    const timeLeft = useTimer(300, submit); // 5 min test

    useEffect(() => {
        // Get selected profile from localStorage
        const storedProfile = localStorage.getItem("selectedProfile");

        if (!storedProfile) {
            // No profile selected, redirect to profile selection
            router.push("/profile-selection");
            return;
        }

        const profile = JSON.parse(storedProfile);
        setSelectedProfile(profile);

        // Tab-switch detection (Cheating guard)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.warn("Tab switch detected!");
                // Optionally: Reduce trust score or auto-submit
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Load AI-generated questions for the selected profile
        const loadQuestions = async () => {
            try {
                setLoadingQuestions(true);
                console.log(`🤖 Generating questions for ${profile.name}...`);

                const res = await startTest(profile.id, "medium");

                if (res.data && res.data.questions) {
                    setQuestions(res.data.questions);
                    console.log(`✅ Loaded ${res.data.questions.length} AI-generated questions`);
                } else {
                    console.error("No questions in response:", res);
                }
            } catch (error) {
                console.error("Failed to load questions:", error);
                // Could show error message to user here
            } finally {
                setLoadingQuestions(false);
            }
        };

        loadQuestions();

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [router, setQuestions]);

    if (!questions.length || loadingQuestions) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500 mx-auto"></div>

                    {selectedProfile && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <div className="text-5xl mb-3">{selectedProfile.icon}</div>
                            <h2 className="text-2xl font-bold text-white mb-2">{selectedProfile.name}</h2>
                            <p className="text-zinc-400 text-sm mb-4">{selectedProfile.description}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <p className="text-white text-xl font-semibold">
                            {loadingQuestions ? "🤖 Generating AI Questions..." : "Preparing your test..."}
                        </p>
                        <p className="text-zinc-400 text-sm">
                            {selectedProfile
                                ? `Creating unique questions for ${selectedProfile.name}`
                                : "Loading questions and initializing integrity guard"
                            }
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate progress metrics
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = questions.length;
    const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    return (
        <AuthGuard>
            <div className={`max-w-3xl mx-auto p-6 space-y-6 ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}>
                {/* Header with Timer and Integrity Guard */}
                <div className="flex justify-between items-center">
                    <Timer timeLeft={timeLeft} />
                    <div className="text-zinc-400 text-sm">Integrity Guard Active 🔒</div>
                </div>

                {/* Progress Indicator */}
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-white font-semibold">
                            Progress: {answeredCount} of {totalQuestions} answered
                        </div>
                        <div className="text-zinc-400 text-sm">
                            {Math.round(progressPercentage)}% complete
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Questions */}
                {questions.map((q, index) => (
                    <QuestionCard
                        key={q.id}
                        question={q}
                        questionNumber={index + 1}
                        totalQuestions={totalQuestions}
                        isAnswered={!!answers[q.id]}
                        onAnswer={(val) =>
                            !isSubmitting && answerQuestion(q.id, val)
                        }
                    />
                ))}

                <button
                    onClick={submit}
                    disabled={isSubmitting}
                    className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Submitting..." : "Submit Test"}
                </button>
            </div>
        </AuthGuard>
    );
}
