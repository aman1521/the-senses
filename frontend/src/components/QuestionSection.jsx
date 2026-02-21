import React from 'react';

/**
 * Modular component for handling text-based question sections (Skill, Psychology)
 * Handles rendering the prompt, options, and dispatching the answer.
 */
const QuestionSection = ({
    stageTitle,
    question,
    questionIndex,
    totalQuestions,
    onAnswer,
    integrityScore,
    aiToolRisk,
    timer
}) => {
    if (!question) return <div className="p-8 text-center text-zinc-500 animate-pulse">Loading content...</div>;

    const options = question.choices || question.options || [];

    return (
        <div className="test-card animate-fade-in">
            {/* Header / Status Bar */}
            <div className="stage-indicator mb-4 flex justify-between items-center">
                <span>{stageTitle} - Question {questionIndex + 1}/{totalQuestions}</span>
            </div>

            <div className="test-header">
                <div className="timer-badge">
                    <i className="fa-solid fa-stopwatch"></i> {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </div>

                <div className="timer-badge" style={{ color: integrityScore < 70 ? 'red' : 'gold' }}>
                    <i className="fa-solid fa-shield-halved"></i> Integrity: {integrityScore}%
                </div>

                {/* AI Tool Risk Indicator */}
                {aiToolRisk !== 'low' && (
                    <div className="timer-badge" style={{
                        color: aiToolRisk === 'critical' ? '#ff4444' : aiToolRisk === 'high' ? '#ff8800' : '#ffcc00',
                        background: 'rgba(255,0,0,0.1)',
                        animation: 'pulse 1.5s infinite'
                    }}>
                        <i className="fa-solid fa-robot"></i> AI Tool: {aiToolRisk.toUpperCase()}
                    </div>
                )}
            </div>

            {/* Question Content */}
            <h3 className="question-text text-xl md:text-2xl font-medium text-white mb-8 leading-relaxed">
                {question.prompt || question.question}
            </h3>

            {/* Options Grid */}
            <div className={`options-grid ${options.length > 4 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                {options.map((opt, i) => (
                    <button
                        key={i}
                        className="option-button p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-400 text-left transition-all duration-200 group flex items-start gap-3"
                        onClick={() => onAnswer(opt)}
                    >
                        <span className="opt-letter w-8 h-8 rounded bg-black/30 flex items-center justify-center text-zinc-400 group-hover:text-white font-mono text-sm shrink-0">
                            {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-zinc-200 group-hover:text-white font-medium">
                            {opt.text || opt}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuestionSection;
