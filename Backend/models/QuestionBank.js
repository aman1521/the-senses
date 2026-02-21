// models/QuestionBank.js
// Question Bank Model for AI-Generated Questions
// Phase 2.5: Dynamic Question System

const mongoose = require("mongoose");

const QuestionBankSchema = new mongoose.Schema(
    {
        // Profile association
        profileId: {
            type: String,
            required: true,
            index: true,
        },
        profileName: {
            type: String,
            required: true,
        },

        // Question content
        question: {
            type: String,
            required: true,
        },
        options: {
            type: [String],
            required: true,
            validate: {
                validator: function (v) {
                    return v.length === 4;
                },
                message: "Question must have exactly 4 options"
            }
        },
        correctAnswer: {
            type: Number,
            required: true,
            min: 0,
            max: 3,
        },

        // Metadata
        topic: {
            type: String,
            required: true,
        },
        questionType: {
            type: String,
            enum: ["standard", "case_study", "audio", "visual", "failure_analysis", "cross_industry"],
            default: "standard"
        },
        // For Case Studies / Scenarios (The story text)
        contextData: {
            type: String,
            default: ""
        },
        // For Audio/Visual questions
        media: {
            type: { type: String, enum: ["image", "audio", "video", "none"], default: "none" },
            url: { type: String, default: "" }
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium",
        },
        explanation: {
            type: String,
            default: "",
        },

        // NEW PHASE 0: Question Classification
        // Intent: What the question aims to test
        intent: {
            type: String,
            enum: [
                'problem_solving',     // Practical problem-solving scenarios
                'knowledge_recall',    // Domain knowledge & facts
                'analytical_thinking', // Analysis & evaluation
                'decision_making',     // Trade-offs & judgment calls
                'pattern_recognition', // Logic & sequence detection
                'application'          // Applying concepts to new situations
            ],
            default: 'knowledge_recall'
        },
        // Cognitive Type: Which cognitive skill is being tested
        cognitiveType: {
            type: String,
            enum: [
                'fluid',        // Novel problem solving, adaptability
                'crystallized', // Learned knowledge, expertise
                'spatial',      // Visual-spatial reasoning
                'verbal',       // Language, communication
                'logical',      // Deductive reasoning
                'numerical'     // Quantitative analysis
            ],
            default: 'crystallized'
        },

        // AI tracking
        aiGenerated: {
            type: Boolean,
            default: true,
        },
        generatedAt: {
            type: Date,
            default: Date.now,
        },

        // Usage tracking
        usageCount: {
            type: Number,
            default: 0,
        },
        lastUsed: {
            type: Date,
        },

        // Quality metrics
        averageTimeToAnswer: {
            type: Number, // in seconds
        },
        correctAnswerRate: {
            type: Number, // percentage
        },

        // Status
        active: {
            type: Boolean,
            default: true,
        },
        flagged: {
            type: Boolean,
            default: false,
        },
        flagReason: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
QuestionBankSchema.index({ profileId: 1, difficulty: 1, active: 1 });
QuestionBankSchema.index({ topic: 1, difficulty: 1 });
QuestionBankSchema.index({ usageCount: 1 });
QuestionBankSchema.index({ generatedAt: -1 });

// Methods
QuestionBankSchema.methods.incrementUsage = function () {
    this.usageCount += 1;
    this.lastUsed = new Date();
    return this.save();
};

QuestionBankSchema.methods.updateQualityMetrics = function (timeToAnswer, wasCorrect) {
    // Update average time
    if (this.averageTimeToAnswer) {
        this.averageTimeToAnswer = (this.averageTimeToAnswer + timeToAnswer) / 2;
    } else {
        this.averageTimeToAnswer = timeToAnswer;
    }

    // Update correct answer rate
    if (this.correctAnswerRate !== undefined) {
        const totalAnswers = this.usageCount;
        const correctAnswers = (this.correctAnswerRate / 100) * totalAnswers;
        const newCorrectAnswers = correctAnswers + (wasCorrect ? 1 : 0);
        this.correctAnswerRate = (newCorrectAnswers / (totalAnswers + 1)) * 100;
    } else {
        this.correctAnswerRate = wasCorrect ? 100 : 0;
    }

    return this.save();
};

// Static methods
QuestionBankSchema.statics.getQuestionsByProfile = function (profileId, difficulty, limit = 30) {
    return this.find({
        profileId,
        difficulty,
        active: true,
        flagged: false,
    })
        .limit(limit)
        .sort({ usageCount: 1 }) // Prioritize less-used questions
        .exec();
};

QuestionBankSchema.statics.getRandomQuestions = function (profileId, difficulty, count = 30, excludeIds = []) {
    return this.aggregate([
        {
            $match: {
                profileId,
                difficulty,
                active: true,
                flagged: false,
                _id: { $nin: excludeIds.map(id => new mongoose.Types.ObjectId(id)) }
            }
        },
        { $sample: { size: count } }
    ]);
};

QuestionBankSchema.statics.getQuestionsByTopic = function (profileId, topic, limit = 10) {
    return this.find({
        profileId,
        topic,
        active: true,
        flagged: false,
    })
        .limit(limit)
        .exec();
};

module.exports = mongoose.model("QuestionBank", QuestionBankSchema);
