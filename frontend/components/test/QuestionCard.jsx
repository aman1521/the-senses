export default function QuestionCard({ question, questionNumber, totalQuestions, isAnswered, onAnswer }) {
    return (
        <div className={`bg-zinc-900 p-6 rounded-xl border-2 transition-all ${isAnswered ? 'border-indigo-500/50' : 'border-zinc-800'}`}>
            {/* Question Header */}
            <div className="flex justify-between items-center mb-3">
                <span className="text-zinc-400 text-sm font-medium">
                    Question {questionNumber} of {totalQuestions}
                </span>
                {isAnswered && (
                    <span className="text-indigo-400 text-xs font-semibold flex items-center gap-1">
                        ✓ Answered
                    </span>
                )}
            </div>

            {/* Question Text */}
            <h3 className="text-lg font-semibold mb-4 text-white">
                {question.text}
            </h3>

            {/* Answer Options */}
            <div className="space-y-2">
                {question.options.map((opt) => (
                    <button
                        key={opt}
                        onClick={() => onAnswer(opt)}
                        className="w-full text-left p-3 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors text-white"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}
