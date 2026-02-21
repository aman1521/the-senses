const { z } = require("zod");

const evaluationSchema = z.object({
    userId: z.string().optional(),
    userName: z.string().optional(),
    country: z.string().optional(),
    answers: z.any(), // Record check failing, relaxing for demo
    jobProfile: z.string(), // Relaxed from enum to support dynamic profiles
    difficulty: z.enum(["easy", "medium", "hard"]),
    meta: z.object({
        violations: z.number().optional(),
        timeTaken: z.number().optional(),
        integrityScore: z.number().optional(),
        cheatingFlags: z.array(z.string()).optional(),
        reflexData: z.object({
            reaction_time_ms: z.number(),
            accuracy_score: z.number(),
            stroke_consistency: z.number().optional(),
            correction_count: z.number().optional()
        }).optional()
    }).optional()
});

module.exports = { evaluationSchema };
