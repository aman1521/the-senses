const mongoose = require("mongoose");

const UserProfileSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, unique: true },

        stats: {
            attempts: { type: Number, default: 0 },
            bestScore: { type: Number, default: 0 },
            avgScore: { type: Number, default: 0 },
            bestNormalized: { type: Number, default: 0 },
            avgTrust: { type: Number, default: 0 },
        },

        badges: [String],

        progression: [
            {
                finalScore: Number,
                normalizedScore: Number,
                trustScore: Number,
                difficulty: String,
                createdAt: Date,
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("UserProfile", UserProfileSchema);
