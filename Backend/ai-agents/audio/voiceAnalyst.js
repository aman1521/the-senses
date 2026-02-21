// ai-agents/audio/voiceAnalyst.js
// Voice Analysis for Integrity Detection
// Detects multiple voices, coaching, and background audio anomalies

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes audio for integrity violations
 * Detects: multiple voices, coaching, dictation, background conversations
 * @param {Buffer} audioBuffer - Raw audio buffer (WAV or WebM)
 * @param {string} mimeType - Audio MIME type
 * @returns {Promise<Object>} - Analysis result
 */
async function analyzeAudioIntegrity(audioBuffer, mimeType = "audio/webm") {
    try {
        // Validate MIME type
        const supportedMimeTypes = ['audio/webm', 'audio/mp4', 'audio/wav'];
        if (!supportedMimeTypes.includes(mimeType)) {
            console.warn(`⚠️ Unsupported MIME type: ${mimeType}. Defaulting to audio/webm`);
            mimeType = 'audio/webm';
        }

        console.log("🎤 Starting Audio Integrity Analysis...");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Convert buffer to base64
        const base64Audio = audioBuffer.toString('base64');

        const prompt = `
            You are an AI Proctor analyzing audio from a cognitive test.
            Analyze this audio clip for cheating indicators.
            
            CRITICAL DETECTION TARGETS:
            1. Multiple voices - Is there more than one person speaking?
            2. Coaching - Is someone dictating answers or helping?
            3. AI voice - Does any voice sound computer-generated (TTS)?
            4. Phone/Speaker sounds - Audio from another device?
            5. Whispering - Quiet side conversations?
            6. Reading aloud - Someone reading questions/answers from another source?
            
            Return JSON only (no markdown):
            {
               "voiceCount": number (0 = silence, 1 = single person, 2+ = multiple),
               "primaryVoice": {
                  "detected": true | false,
                  "gender": "male" | "female" | "unknown",
                  "confidence": 0-100
               },
               "additionalVoices": [
                  {
                     "type": "human" | "ai_generated" | "phone_speaker",
                     "gender": "male" | "female" | "unknown",
                     "volumeLevel": "whisper" | "normal" | "loud",
                     "isCoaching": true | false
                  }
               ],
               "anomalies": {
                  "coachingDetected": true | false,
                  "dictationDetected": true | false,
                  "backgroundConversation": true | false,
                  "deviceAudio": true | false,
                  "unusualSilence": true | false
               },
               "riskLevel": "low" | "medium" | "high" | "critical",
               "riskScore": 0-100,
               "summary": "Brief description of what was heard",
               "flagReason": "Reason for flag if risky, else null"
            }
            
            BE STRICT: If you hear ANY indication of another person or coaching, flag it.
        `;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Audio
                }
            },
            { text: prompt }
        ]);

        const responseText = result.response.text();
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(cleanedJson);
        console.log(`🎤 Audio Analysis: ${parsed.riskLevel} risk | Voices: ${parsed.voiceCount}`);

        return parsed;

    } catch (error) {
        console.error("Audio Analysis Failed:", error.message);
        // Fallback - assume clean if analysis fails
        return {
            voiceCount: 1,
            primaryVoice: { detected: true, gender: "unknown", confidence: 50 },
            additionalVoices: [],
            anomalies: {
                coachingDetected: false,
                dictationDetected: false,
                backgroundConversation: false,
                deviceAudio: false,
                unusualSilence: false
            },
            riskLevel: "low",
            riskScore: 0,
            summary: "Audio analysis unavailable",
            flagReason: null,
            error: "Analysis temporarily unavailable"
        };
    }
}

/**
 * Quick voice check for continuous monitoring
 * Lighter-weight than full analysis
 * @param {Buffer} audioBuffer - Short audio clip (5-10 seconds)
 * @param {string} mimeType - Audio MIME type
 * @returns {Promise<Object>} - Quick check result
 */
async function quickVoiceCheck(audioBuffer, mimeType = "audio/webm") {
    try {
        // Validate MIME type
        const supportedMimeTypes = ['audio/webm', 'audio/mp4', 'audio/wav'];
        if (!supportedMimeTypes.includes(mimeType)) {
            console.warn(`⚠️ Unsupported MIME type: ${mimeType}. Defaulting to audio/webm`);
            mimeType = 'audio/webm';
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const base64Audio = audioBuffer.toString('base64');

        const prompt = `
            QUICK VOICE CHECK - Analyze this short audio clip.
            
            Answer these questions:
            1. How many distinct voices are CLEARY audible near the mic? (0, 1, or 2+)
            2. Is there any whispering or quiet speaking?
            3. Does any voice sound AI-generated?
            4. Is there sound coming from another device (phone, speaker)?

            IGNORE:
            - Distant background noise (traffic, unrelated office noise).
            - Typing sounds, mouse clicks, chair squeaks.
            - Short coughs or breathing sounds.
            
            Return JSON only:
            {
               "voiceCount": number,
               "clean": true | false,
               "suspiciousActivity": "none" | "whispering" | "multiple_voices" | "device_audio" | "coaching",
               "integrityPenalty": 0-20,
               "reason": "Brief explanation if suspicious, else null"
            }
        `;

        const result = await model.generateContent([
            { inlineData: { mimeType, data: base64Audio } },
            { text: prompt }
        ]);

        const responseText = result.response.text();
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanedJson);

    } catch (error) {
        console.error("Quick Voice Check Failed:", error.message);
        return {
            voiceCount: 1,
            clean: true,
            suspiciousActivity: "none",
            integrityPenalty: 0,
            reason: null,
            error: "Check unavailable"
        };
    }
}

/**
 * Analyze voice consistency across multiple clips
 * Detects if the same person is answering throughout
 * @param {Array<Buffer>} audioClips - Array of audio buffers
 * @returns {Promise<Object>} - Consistency check result
 */
async function analyzeVoiceConsistency(audioClips) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // For now, analyze each clip and aggregate
        const results = await Promise.all(
            audioClips.map(clip => quickVoiceCheck(clip.buffer, clip.mimeType || "audio/webm"))
        );

        // Aggregate results
        const multipleVoiceClips = results.filter(r => r.voiceCount > 1).length;
        const suspiciousClips = results.filter(r => !r.clean).length;
        const totalPenalty = results.reduce((sum, r) => sum + (r.integrityPenalty || 0), 0);

        return {
            clipsAnalyzed: audioClips.length,
            multipleVoiceClips,
            suspiciousClips,
            consistent: multipleVoiceClips === 0 && suspiciousClips <= 1,
            overallRisk: suspiciousClips > 2 ? "high" : (suspiciousClips > 0 ? "medium" : "low"),
            totalIntegrityPenalty: Math.min(totalPenalty, 50),
            details: results
        };

    } catch (error) {
        console.error("Voice Consistency Analysis Failed:", error);
        return {
            clipsAnalyzed: audioClips.length,
            multipleVoiceClips: 0,
            suspiciousClips: 0,
            consistent: true,
            overallRisk: "low",
            totalIntegrityPenalty: 0,
            error: "Analysis failed"
        };
    }
}

module.exports = {
    analyzeAudioIntegrity,
    quickVoiceCheck,
    analyzeVoiceConsistency
};
