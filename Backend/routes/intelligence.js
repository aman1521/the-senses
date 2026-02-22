const express = require("express");
const { createEvaluationContext } = require("../core/EvaluationContext.js");
const { finalizeScores } = require("../core/scorePipeline.js");
const { checkIdempotency } = require("../core/idempotencyGuard.js");
const { enforceInvariants } = require("../core/invariants.js");
const { evaluateProfileIntelligence } = require("../ai-agents/profile-intelligence/index.js");
const { generateUserRank } = require("../ai-agents/ranking/rankService.js");
const { calculateTrustScore } = require("../ai-agents/trust/trustEngine.js");
const { assignBadge } = require("../ai-agents/trust/badgeEngine.js");
const IntelligenceResult = require("../models/IntelligenceResult.js");
const { upsertUserProfile } = require("../ai-agents/profile/profileService.js");
const { evaluationSchema } = require("../validators/evaluationSchema.js");
const { audit } = require("../utils/auditLog.js");
const { saveEvaluationResult } = require("../Services/resultService.js");
const { checkRetakeCooldown, getCooldownStatus } = require("../middleware/retakeCooldown.js");

const TestSession = require("../models/TestSession.js");
const IntegrityEvent = require("../models/IntegrityEvent.js");
const VideoIntro = require("../models/VideoIntro.js");

const router = express.Router();

const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const stream = require('stream');
const { successResponse, errorResponse } = require("../utils/apiResponse.js");
const { calculateArchetype, getInsights } = require("@thesenses/core");

const upload = multer({ storage: multer.memoryStorage() });

const { analyzeVideoIntegrity } = require("../ai-agents/vision/integrityAnalyst");
const { auth } = require("../middleware/auth");

// POST /api/intelligence/video - Upload Video Intro
router.post("/video", auth(false), upload.single('video'), async (req, res, next) => {
    try {
        if (!req.file) {
            return errorResponse(res, "No video file provided", 400);
        }

        console.log("📹 Processing video upload...");

        // Parallel Processing:
        // 1. Upload to Cloudinary (Storage)
        // 2. Analyze with Gemini (Intelligence)

        const uploadPromise = new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "senses_intros", resource_type: "video" },
                (error, result) => result ? resolve(result) : reject(error)
            );
            require('stream').Readable.from(req.file.buffer).pipe(stream);
        });

        const analysisPromise = analyzeVideoIntegrity(req.file.buffer);

        const [uploadResult, aiResult] = await Promise.all([uploadPromise, analysisPromise]);

        // Determine if flagged for review
        const shouldFlag =
            aiResult.deviceDetection?.devicesFound ||
            aiResult.deviceDetection?.highRiskDevice ||
            aiResult.faceConfig === "multiple" ||
            aiResult.suspicionScore >= 50;

        // Calculate integrity score
        let integrityScore = 100;
        if (aiResult.deviceDetection?.devicesFound) integrityScore -= 20;
        if (aiResult.deviceDetection?.highRiskDevice) integrityScore -= 30;
        if (aiResult.faceConfig !== "valid") integrityScore -= 15;
        if (aiResult.audioCheck === "multiple_voices") integrityScore -= 25;
        if (aiResult.environmentCheck?.suspiciousMovement) integrityScore -= 10;
        integrityScore = Math.max(0, integrityScore);

        // Save to DB with full device detection data
        const videoIntro = new VideoIntro({
            sessionId: req.body.sessionId || "temp_" + Date.now(),
            userId: req.body.userId || null,
            videoUrl: uploadResult.secure_url,
            durationSeconds: uploadResult.duration,

            // Face Analysis
            facePresenceRatio: aiResult.faceConfig === "valid" ? 1.0 : (aiResult.faceConfig === "missing" ? 0.0 : 0.5),
            multipleFacesDetected: aiResult.faceConfig === "multiple",

            // Audio Analysis
            audioDetected: aiResult.audioCheck === "clear" || aiResult.audioCheck === "multiple_voices",
            multipleVoicesDetected: aiResult.audioCheck === "multiple_voices",

            // Eye Contact
            eyeContactScore: aiResult.eyeContact || 50,
            lookingAwayFrequency: aiResult.environmentCheck?.lookingAway || "never",

            // Device Detection
            deviceDetection: {
                devicesFound: aiResult.deviceDetection?.devicesFound || false,
                devices: (aiResult.deviceDetection?.devices || []).map(d => ({
                    type: d.type || "unknown",
                    confidence: d.confidence || 50,
                    location: d.location || "unknown",
                    inUse: d.inUse || false
                })),
                deviceCount: aiResult.deviceDetection?.deviceCount || 0,
                highRiskDevice: aiResult.deviceDetection?.highRiskDevice || false
            },

            // Environment
            environmentCheck: {
                backgroundClean: aiResult.environmentCheck?.backgroundClean ?? true,
                lightingAdequate: aiResult.environmentCheck?.lightingAdequate ?? true,
                suspiciousMovement: aiResult.environmentCheck?.suspiciousMovement || false
            },

            // Scores
            suspicionScore: aiResult.suspicionScore || 0,
            integrityScore: integrityScore,

            // Notes & Status
            integrityNotes: aiResult.briefSummary || "No summary available",
            analysisStatus: "completed",
            analyzedAt: new Date(),
            flaggedForReview: shouldFlag
        });

        await videoIntro.save();
        console.log(`📹 Video saved: ${shouldFlag ? '⚠️ FLAGGED' : '✅ Clean'} | Devices: ${aiResult.deviceDetection?.deviceCount || 0}`);

        return successResponse(res, {
            url: uploadResult.secure_url,
            analysis: {
                faceConfig: aiResult.faceConfig,
                suspicionScore: aiResult.suspicionScore,
                integrityScore: integrityScore,
                summary: aiResult.briefSummary,
                deviceDetection: {
                    devicesFound: aiResult.deviceDetection?.devicesFound || false,
                    deviceCount: aiResult.deviceDetection?.deviceCount || 0,
                    highRiskDevice: aiResult.deviceDetection?.highRiskDevice || false,
                    devices: aiResult.deviceDetection?.devices || []
                },
                flaggedForReview: shouldFlag
            }
        });

    } catch (error) {
        console.error("Upload/Analysis Error:", error);
        return errorResponse(res, "Processing failed", 500, error.message);
    }
});

// Import frame analysis function
const { analyzeFrameForDevices, analyzeMultipleFrames } = require("../ai-agents/vision/integrityAnalyst");

// POST /api/intelligence/analyze-frame - Analyze a single frame for device detection (continuous monitoring)
router.post("/analyze-frame", upload.single('frame'), async (req, res, next) => {
    try {
        if (!req.file) {
            return errorResponse(res, "No frame provided", 400);
        }

        const { sessionId, timestamp, questionNumber } = req.body;

        // Analyze the frame
        const analysis = await analyzeFrameForDevices(req.file.buffer, req.file.mimetype || "image/jpeg");

        // Log if suspicious
        if (!analysis.clean) {
            console.log(`🚨 Frame Alert [Session: ${sessionId}] [Q${questionNumber}]: ${analysis.flagReason}`);

            // Save to IntegrityEvent if high risk
            if (analysis.riskLevel === "high" || analysis.riskLevel === "medium") {
                const IntegrityEvent = require("../models/IntegrityEvent");
                await IntegrityEvent.create({
                    sessionId: sessionId || "unknown",
                    stage: "skill",
                    eventType: analysis.devicesFound.includes("other_person") ? "multiple_faces" :
                        analysis.devicesFound.includes("phone") ? "phone_detected" :
                            analysis.devicesFound.includes("tablet") ? "tablet_detected" :
                                analysis.devicesFound.includes("earbuds") ? "earbuds_detected" :
                                    analysis.devicesFound.length > 0 ? "dev_tools" : "looking_away",
                    severity: analysis.riskLevel,
                    details: JSON.stringify({
                        devices: analysis.devicesFound,
                        reason: analysis.flagReason,
                        questionNumber,
                        timestamp
                    })
                });
            }
        }

        const integrityPenalty = analysis.riskLevel === "high" ? 15 :
            analysis.riskLevel === "medium" ? 5 : 0;

        // Persist integrity event if risk was detected
        if (!analysis.clean && req.body.sessionId) {
            try {
                await IntegrityEvent.create({
                    sessionId: req.body.sessionId,
                    stage: 'video',
                    eventType: analysis.devicesFound?.length ? 'device_detected' : 'looking_away',
                    severity: analysis.riskLevel,
                    details: JSON.stringify({
                        flagReason: analysis.flagReason,
                        devicesFound: analysis.devicesFound,
                        faceVisible: analysis.faceVisible,
                        integrityPenalty
                    })
                });
            } catch (dbErr) {
                console.error("Failed to persist frame integrity event:", dbErr.message);
            }
        }

        return successResponse(res, {
            analysis: {
                clean: analysis.clean,
                devicesFound: analysis.devicesFound,
                lookingAtScreen: analysis.lookingAtScreen,
                faceVisible: analysis.faceVisible,
                riskLevel: analysis.riskLevel,
                flagReason: analysis.flagReason
            },
            integrityPenalty
        });

    } catch (error) {
        console.error("Frame Analysis Error:", error);
        return errorResponse(res, "Analysis failed", 500, error.message);
    }
});

// POST /api/intelligence/analyze-batch - Analyze multiple frames at once (end of test)
router.post("/analyze-batch", upload.array('frames', 10), async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return errorResponse(res, "No frames provided", 400);
        }

        const frames = req.files.map((file, index) => ({
            buffer: file.buffer,
            mimeType: file.mimetype || "image/jpeg",
            timestamp: Date.now() - (req.files.length - index) * 30000 // Approximate timestamps
        }));

        const analysis = await analyzeMultipleFrames(frames);

        return successResponse(res, { analysis });

    } catch (error) {
        console.error("Batch Analysis Error:", error);
        return errorResponse(res, "Batch analysis failed", 500, error.message);
    }
});

// Import audio analysis functions
const { quickVoiceCheck, analyzeAudioIntegrity } = require("../ai-agents/audio/voiceAnalyst");

// POST /api/intelligence/analyze-audio - Analyze audio for voice anomalies
router.post("/analyze-audio", upload.single('audio'), async (req, res, next) => {
    try {
        if (!req.file) {
            return errorResponse(res, "No audio provided", 400);
        }

        const { sessionId, questionNumber, isQuickCheck } = req.body;
        const mimeType = req.file.mimetype || "audio/webm";

        let analysis;

        if (isQuickCheck === 'true') {
            // Quick 5-second check for continuous monitoring
            analysis = await quickVoiceCheck(req.file.buffer, mimeType);
        } else {
            // Full audio analysis
            analysis = await analyzeAudioIntegrity(req.file.buffer, mimeType);
        }

        // Log if suspicious
        if ((analysis.riskLevel && analysis.riskLevel !== "low") ||
            (analysis.suspiciousActivity && analysis.suspiciousActivity !== "none")) {
            console.log(`🎤 Audio Alert [Session: ${sessionId}] [Q${questionNumber}]: ${analysis.flagReason || analysis.reason}`);

            // Save to IntegrityEvent
            const IntegrityEvent = require("../models/IntegrityEvent");
            await IntegrityEvent.create({
                sessionId: sessionId || "unknown",
                stage: "skill",
                eventType: analysis.voiceCount > 1 ? "multiple_voices" : "background_noise",
                severity: analysis.riskLevel || (analysis.integrityPenalty > 10 ? "high" : "medium"),
                details: JSON.stringify({
                    voiceCount: analysis.voiceCount,
                    anomalies: analysis.anomalies,
                    reason: analysis.flagReason || analysis.reason,
                    questionNumber
                })
            });
        }

        return successResponse(res, {
            analysis: {
                voiceCount: analysis.voiceCount,
                clean: analysis.clean ?? (analysis.riskLevel === "low"),
                riskLevel: analysis.riskLevel || (analysis.clean ? "low" : "medium"),
                suspiciousActivity: analysis.suspiciousActivity ||
                    (analysis.anomalies?.coachingDetected ? "coaching" :
                        analysis.anomalies?.backgroundConversation ? "multiple_voices" : "none"),
                integrityPenalty: analysis.integrityPenalty ||
                    (analysis.riskScore ? Math.floor(analysis.riskScore / 5) : 0),
                reason: analysis.flagReason || analysis.reason || analysis.summary
            }
        });

    } catch (error) {
        console.error("Audio Analysis Error:", error);
        return errorResponse(res, "Audio analysis failed", 500, error.message);
    }
});

// Import AI Tool Detection
const { getSession: getAIDetectionSession } = require("../ai-agents/detection/aiToolDetector");

// POST /api/intelligence/log-tab-switch - Log tab switch events for AI tool detection
router.post("/log-tab-switch", async (req, res, next) => {
    try {
        const { sessionId, type, questionNumber, timestamp } = req.body;

        if (!sessionId || !type) {
            return errorResponse(res, "Missing sessionId or type", 400);
        }

        const session = getAIDetectionSession(sessionId);
        session.logTabSwitch({
            type, // 'leave' or 'return'
            questionNumber,
            timestamp: timestamp || Date.now()
        });

        // Get current suspicion level
        const analysis = session.getAnalysis();

        // Log if suspicious
        if (analysis.riskLevel !== 'low') {
            console.log(`🤖 AI Tool Alert [Session: ${sessionId}]: ${analysis.riskLevel} risk | Score: ${analysis.suspicionScore}`);

            // Save to IntegrityEvent if high risk
            if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
                const IntegrityEvent = require("../models/IntegrityEvent");
                await IntegrityEvent.create({
                    sessionId,
                    stage: "skill",
                    eventType: "tab_switch",
                    severity: analysis.riskLevel === 'critical' ? 'critical' : 'high',
                    details: JSON.stringify({
                        suspicionScore: analysis.suspicionScore,
                        metrics: analysis.metrics,
                        latestFlags: analysis.flags.slice(-3)
                    })
                });
            }
        }

        return successResponse(res, {
            currentRisk: analysis.riskLevel,
            suspicionScore: analysis.suspicionScore,
            integrityPenalty: analysis.integrityPenalty
        });

    } catch (error) {
        console.error("Tab Switch Log Error:", error);
        return errorResponse(res, "Failed to log tab switch", 500, error.message);
    }
});

// POST /api/intelligence/log-paste - Log paste events
router.post("/log-paste", async (req, res, next) => {
    try {
        const { sessionId, questionNumber, textLength, timestamp } = req.body;

        if (!sessionId) {
            return errorResponse(res, "Missing sessionId", 400);
        }

        const session = getAIDetectionSession(sessionId);
        session.logPasteEvent({
            questionNumber,
            textLength: textLength || 0,
            timestamp: timestamp || Date.now()
        });

        const analysis = session.getAnalysis();

        return successResponse(res, {
            currentRisk: analysis.riskLevel,
            suspicionScore: analysis.suspicionScore,
            integrityPenalty: analysis.integrityPenalty
        });

    } catch (error) {
        console.error("Paste Log Error:", error);
        return errorResponse(res, "Failed to log paste", 500, error.message);
    }
});

// POST /api/intelligence/log-answer - Log answer timing
router.post("/log-answer", async (req, res, next) => {
    try {
        const { sessionId, questionNumber, timeOnQuestion, timestamp } = req.body;

        if (!sessionId) {
            return errorResponse(res, "Missing sessionId", 400);
        }

        const session = getAIDetectionSession(sessionId);
        session.logAnswer({
            questionNumber,
            timeOnQuestion,
            timestamp: timestamp || Date.now()
        });

        const analysis = session.getAnalysis();

        return successResponse(res, {
            currentRisk: analysis.riskLevel,
            suspicionScore: analysis.suspicionScore,
            likelyAiUsage: analysis.likelyAiToolUsage
        });

    } catch (error) {
        console.error("Answer Log Error:", error);
        return errorResponse(res, "Failed to log answer", 500, error.message);
    }
});

// GET /api/intelligence/ai-detection/:sessionId - Get AI tool detection analysis
router.get("/ai-detection/:sessionId", async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        const session = getAIDetectionSession(sessionId);
        const analysis = session.getAnalysis();

        return successResponse(res, { analysis });

    } catch (error) {
        console.error("AI Detection Analysis Error:", error);
        return errorResponse(res, "Failed to get analysis", 500, error.message);
    }
});

// GET /api/intelligence/cooldown/:userId - Check retake cooldown status
router.get("/cooldown/:userId", getCooldownStatus);

// POST /api/intelligence/evaluate - Main test evaluation with retake cooldown
router.post("/evaluate", auth(false), checkRetakeCooldown, async (req, res, next) => {
    try {
        /** 🔒 Validate input */
        const parsed = evaluationSchema.safeParse(req.body);
        if (!parsed.success) {
            audit("EVALUATION_VALIDATION_FAILED", {
                errors: parsed.error.errors,
                ip: req.ip,
            });
            return errorResponse(res, "Invalid input", 400, parsed.error.errors);
        }

        /** 1️⃣ Create context */
        const ctx = createEvaluationContext({
            user: req.user || { _id: req.body.userId, name: req.body.userName, country: req.body.country },
            answers: req.body.answers,
            jobProfile: req.body.jobProfile,
            difficulty: req.body.difficulty,
            meta: req.body.meta // { violations, timeTaken, reflexData }
        });

        // Add Reflex Metrics if available
        if (req.body.meta?.reflexData) {
            const { processReflexMetrics } = require("../Services/behavioralAnalysisService");
            ctx.results.reflexMetrics = processReflexMetrics(req.body.meta.reflexData);
        }

        // Add Vision Score if available (from Haptic Shadow / Motor Intelligence test)
        if (req.body.meta?.visionScore != null) {
            ctx.results.visionScore = req.body.meta.visionScore;
        }

        /** 2️⃣ Idempotency guard */
        const { existing, hash } = await checkIdempotency(ctx);
        if (existing) {
            return successResponse(res, existing, "Reused existing evaluation", 200, { reused: true });
        }

        // Guard: Prevent double AI calls
        if (ctx.meta.aiCalled) {
            throw new Error("AI already used for this evaluation");
        }
        ctx.meta.aiCalled = true;

        /** 3️⃣ AI evaluation */
        const aiResult = await evaluateProfileIntelligence({
            rawAnswers: ctx.test.answers,
            detailedAnswers: req.body.detailedAnswers, // Added for backend grading
            jobProfile: ctx.test.jobProfile,
            difficulty: ctx.test.difficulty,
        });

        ctx.results.ruleScore = aiResult.ruleScore;
        ctx.results.aiScore = aiResult.aiScore;
        ctx.results.finalScore = aiResult.finalScore || aiResult.score;

        const { generateBehavioralReport } = require("../Services/behavioralAnalysisService");

        // --- 3.5 Behavioral Analysis ---
        const behavioralReport = await generateBehavioralReport(req.body.sessionId);

        ctx.results.behaviorAnalysis = {
            focusLossRate: behavioralReport.focus_loss_rate,
            integrityMultiplier: behavioralReport.integrity_multiplier,
            confidenceLevel: behavioralReport.confidence_level,
            cheatRisk: behavioralReport.cheat_risk,
            avgResponseLatency: behavioralReport.avg_response_latency,
            latencyVariance: behavioralReport.latency_variance,
            pasteFrequency: behavioralReport.paste_frequency,
            idleAnomalies: behavioralReport.idle_anomalies
        };

        // Apply Integrity Multiplier to Final Score (Confidence Adjustment)
        // If confidence is low, the score is weighted down to prevent leaderboard dominance by potential cheaters
        if (behavioralReport.integrity_multiplier < 1.0) {
            console.log(`📉 Adjusting score for ${ctx.userId} by ${behavioralReport.integrity_multiplier} due to behavioral signals.`);
            ctx.results.finalScore = Math.round(ctx.results.finalScore * behavioralReport.integrity_multiplier);
        }

        /** 4️⃣ Finalize scores (single source of truth) */
        finalizeScores(ctx);

        /** 5️⃣ Ranking */
        const rankData = await generateUserRank({
            userId: ctx.userId,
            country: ctx.country,
            finalScore: ctx.results.finalScore,
            difficulty: ctx.test.difficulty,
            jobProfile: ctx.test.jobProfile,
        });

        ctx.results.percentile = rankData.percentile;

        /** 6️⃣ Trust score */
        ctx.results.trustScore = calculateTrustScore({
            attempts: rankData.attempts || 1,
            difficultyHistory: rankData.difficultyHistory || [ctx.test.difficulty],
            scoreHistory: rankData.scoreHistory || [ctx.results.normalizedScore],
            timeGaps: rankData.timeGaps || [],
            violations: ctx.test.violations || 0
        });

        /** 7️⃣ Badge */
        ctx.results.badge = assignBadge({
            percentile: ctx.results.percentile,
            attempts: rankData.attempts || 1,
            trustScore: ctx.results.trustScore,
        });

        /** 8️⃣ Enforce invariants */
        enforceInvariants(ctx);

        /** 9️⃣ Build profile insights */
        // Calculate Cognitive Archetype
        const archetype = calculateArchetype({
            finalScore: ctx.results.finalScore,
            baseBadge: rankData.badge?.name || ctx.results.badge,
            meta: req.body.meta
        });

        const archetypeInsights = getInsights(archetype);

        const profile = {
            thinkingStyle: archetype,
            strengths: archetypeInsights.strengths,
            cognitiveBiases: archetypeInsights.biases,
            summary: archetypeInsights.description,
        };

        const insights = {
            headline: `${profile.thinkingStyle} - Top ${100 - ctx.results.percentile}%`,
            summary: profile.summary,
        };

        /** 🔟 Save complete result with slug */
        const savedResult = await saveEvaluationResult({
            sessionId: req.body.sessionId || `session-${Date.now()}`,
            userId: ctx.userId,
            country: ctx.country,
            finalScore: ctx.results.finalScore,
            normalizedScore: ctx.results.normalizedScore,
            difficulty: ctx.test.difficulty,
            trustScore: ctx.results.trustScore,
            badge: ctx.results.badge,
            testHash: hash,
            profile,
            rank: {
                tier: rankData.badge?.name || ctx.results.badge,
                globalPercentile: ctx.results.percentile,
                globalRank: rankData.globalRank || 1,
                countryRank: rankData.countryRank || 1,
                field: ctx.test.jobProfile,
            },
            insights,
            testDetail: {
                questions: Array.isArray(req.body.detailedAnswers) ? req.body.detailedAnswers : [], // Expect frontend to send detailed log now
                totalQuestions: ctx.test.answers ? Object.keys(ctx.test.answers).length : 0,
                correctCount: Math.round(ctx.results.ruleScore / 10), // Approx if direct count unavailable
                completionTime: req.body.meta?.timeTaken || 0
            },
            behaviorAnalysis: ctx.results.behaviorAnalysis || {},
            reflexMetrics: ctx.results.reflexMetrics,
            meta: req.body.meta
        });

        /** 1️⃣1️⃣ Update user profile */
        await upsertUserProfile({
            userId: ctx.userId,
            finalScore: ctx.results.finalScore,
            normalizedScore: ctx.results.normalizedScore,
            trustScore: ctx.results.trustScore,
            difficulty: ctx.test.difficulty,
            badge: ctx.results.badge,
        });

        // Update User Model (Central Identity) with Retake Loop Data
        const User = require("../models/User");
        if (ctx.userId) {
            await User.findByIdAndUpdate(ctx.userId, {
                lastTestDate: new Date(),
                $push: {
                    history: {
                        resultId: savedResult._id,
                        score: ctx.results.finalScore,
                        profileType: ctx.test.jobProfile,
                        date: new Date()
                    }
                },
                // Update seasonal/best scores if applicable
                $max: { bestScoreEver: ctx.results.finalScore }
            });
        }

        // --- 1️⃣3️⃣ Save Detailed Test Session (New Schema) ---
        const testSession = new TestSession({
            sessionId: savedResult.sessionId,
            userId: ctx.userId,
            status: 'completed',
            overallScore: ctx.results.finalScore,
            integrityScore: req.body.meta?.integrityScore || 100, // Use client Integrity if valid
            jobProfileId: ctx.test.jobProfile,
            difficulty: ctx.test.difficulty,
            cheatingFlags: req.body.meta?.cheatingFlags || []
        });
        await testSession.save();

        // --- Save Detailed Attempt Records per question (powers dimension leaderboard) ---
        if (Array.isArray(req.body.detailedAnswers) && req.body.detailedAnswers.length > 0 && ctx.userId) {
            const Attempt = require("../models/Attempt");
            const sessionId = req.body.sessionId || `session-${Date.now()}`;
            const attemptDocs = req.body.detailedAnswers.map(qa => ({
                user: ctx.userId,
                question: qa.questionId,
                sessionId,
                answerText: qa.userAnswer?.toString?.() || '',
                isCorrect: qa.isCorrect || false,
                timeSpentMs: qa.timeSpent || 0,
                score: qa.isCorrect ? 100 : 0,
                rubric: {
                    bins: {
                        logic: qa.isCorrect ? 75 : 25,
                        creativity: qa.topic === 'creative' ? (qa.isCorrect ? 80 : 30) : 0,
                        empathy: qa.topic === 'emotional' ? (qa.isCorrect ? 80 : 30) : 0,
                        systemsThinking: qa.topic === 'systems' ? (qa.isCorrect ? 80 : 30) : 0,
                        communication: qa.topic === 'communication' ? (qa.isCorrect ? 80 : 30) : 0,
                    },
                    reasoning: qa.isCorrect ? 'Correct answer' : 'Incorrect answer',
                    maxScore: 100,
                },
                aiGraded: false,
                integritySignals: {
                    tabSwitches: req.body.meta?.violations || 0,
                    pasteEvents: 0,
                    suspiciouslyFast: (qa.timeSpent || 0) < 2000
                },
                profileSnapshot: { jobProfile: ctx.test.jobProfile, difficulty: ctx.test.difficulty }
            }));
            try {
                await Attempt.insertMany(attemptDocs, { ordered: false });
                console.log(`✅ Saved ${attemptDocs.length} Attempt records for session ${sessionId}`);
            } catch (attemptErr) {
                console.error('⚠️ Warning: Failed to save Attempt records:', attemptErr.message);
                // Non-fatal — don't fail the whole evaluation
            }
        }

        // Save Integrity Events if provided
        if (req.body.meta?.cheatingFlags && Array.isArray(req.body.meta.cheatingFlags)) {
            const events = req.body.meta.cheatingFlags.map(flag => ({
                sessionId: savedResult.sessionId,
                stage: 'skill', // Defaulting for flat list, ideally frontend separates
                eventType: flag.includes("Tab") ? 'tab_switch' : 'looking_away',
                severity: 'medium'
            }));
            if (events.length > 0) await IntegrityEvent.insertMany(events);
        }

        /** 1️⃣2️⃣ Respond */
        audit("INTELLIGENCE_EVALUATED", {
            userId: ctx.userId,
            score: ctx.results.finalScore,
            slug: savedResult.share.slug,
            trustScore: ctx.results.trustScore,
            badge: ctx.results.badge,
            difficulty: ctx.test.difficulty,
        });

        return successResponse(res, {
            result: {
                // Score data
                sessionId: savedResult.sessionId, // Critical for account claiming
                score: ctx.results.finalScore,
                normalized: ctx.results.normalizedScore,
                percentile: ctx.results.percentile,
                trust: ctx.results.trustScore,
                badge: ctx.results.badge,

                // Profile data (for result page)
                profile: {
                    thinkingStyle: savedResult.profile.thinkingStyle,
                    strengths: savedResult.profile.strengths,
                    cognitiveBiases: savedResult.profile.cognitiveBiases,
                    summary: savedResult.profile.summary,
                },

                // Rank data (for result page)
                rank: {
                    tier: savedResult.rank.tier,
                    globalPercentile: savedResult.rank.globalPercentile,
                    globalRank: savedResult.rank.globalRank,
                    field: savedResult.rank.field,
                },

                // Share data with SLUG (for sharing)
                share: {
                    slug: savedResult.share.slug,
                    headline: savedResult.share.headline,
                    url: `/share/${savedResult.share.slug}`,
                },
            },
        });

    } catch (err) {
        audit("INTELLIGENCE_EVALUATION_ERROR", {
            error: err.message,
            stack: err.stack,
        });
        console.error(err);
        return errorResponse(res, err.message, 500);
    }
});

// GET /api/intelligence/result/:slug - Fetch result by slug for share pages
router.get("/result/:slug", async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { getResultBySlug } = require("../Services/resultService.js");

        const result = await getResultBySlug(slug);
        if (!result) {
            return errorResponse(res, "Result not found", 404);
        }

        return successResponse(res, {
            result: {
                profile: result.profile,
                rank: result.rank,
                share: result.share,
                score: result.finalScore,
                normalized: result.normalizedScore,
                percentile: result.rank.globalPercentile,
            },
        });
    } catch (error) {
        next(error);
    }
});


// GET /api/intelligence/review/:sessionId - Fetch full result for user review (including detailed Q&A)
router.get("/review/:sessionId", async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { getResultBySessionId } = require("../Services/resultService.js");

        const result = await getResultBySessionId(sessionId);
        if (!result) {
            return errorResponse(res, "Result not found", 404);
        }

        return successResponse(res, {
            result: {
                ...result.toObject(),
                testDetail: result.testDetail // Ensure this is explicitly included if toObject doesn't
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
