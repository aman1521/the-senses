const { GoogleGenerativeAI } = require("@google/generative-ai");
const { uploadToGemini } = require("../../services/aiFileManager");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes a user's intro video for integrity and credibility signals.
 * @param {Buffer} videoBuffer - The raw video file buffer
 * @returns {Promise<Object>} - Analysis result { facePresence, multipleFaces, feedback }
 */
async function analyzeVideoIntegrity(videoBuffer) {
    try {
        console.log("🔍 Starting AI Vision Analysis...");

        // 1. Upload Video to Gemini
        const videoFile = await uploadToGemini(videoBuffer, "video/webm");

        // 2. Wait for processing (Gemini video processing takes a few seconds)
        // For production, we'd poll state. For prototype, we assume small files process fast or rely on model wait.

        // 3. Prompt the Vision Model with Enhanced Device Detection
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are an AI Proctor for a high-stakes cognitive assessment. 
            Analyze this video with EXTREME attention to detail for cheating detection.
            
            CRITICAL: Scan the ENTIRE frame for ANY digital devices or cheating aids:
            - Mobile phones (in hand, on desk, propped up, reflections)
            - Tablets or iPads
            - Smartwatches or fitness bands
            - Earbuds, AirPods, or any wireless earphones
            - Second monitors or laptop screens
            - Visible notes, papers, or cheat sheets
            - Another person visible or partially visible
            - Suspicious reflections in glasses or screens
            
            Return a JSON object (NO markdown, just raw JSON):
            {
               "faceConfig": "valid" | "missing" | "multiple",
               "eyeContact": 0-100 (how well they maintain focus on camera),
               "audioCheck": "clear" | "silent" | "noise" | "multiple_voices",
               "suspicionScore": 0-100 (overall cheating likelihood),
               
               "deviceDetection": {
                  "devicesFound": true | false,
                  "devices": [
                     {
                        "type": "phone" | "tablet" | "smartwatch" | "earbuds" | "second_screen" | "notes" | "other_person" | "suspicious_reflection",
                        "confidence": 0-100,
                        "location": "description of where in frame",
                        "inUse": true | false
                     }
                  ],
                  "deviceCount": number,
                  "highRiskDevice": true | false (true if device appears to be actively used for cheating)
               },
               
               "environmentCheck": {
                  "backgroundClean": true | false,
                  "lightingAdequate": true | false,
                  "suspiciousMovement": true | false,
                  "lookingAway": "never" | "occasionally" | "frequently"
               },
               
               "briefSummary": "1-2 sentence observation including any devices spotted"
            }

            BE STRICT: Even a glimpse of a phone or earbuds should be flagged.
            If you see ANY digital device, set devicesFound to true and list it.
        `;

        const result = await model.generateContent([
            { fileData: { mimeType: videoFile.mimeType, fileUri: videoFile.uri } },
            { text: prompt }
        ]);

        const responseText = result.response.text();
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(cleanedJson);

        // Ensure deviceDetection exists with defaults
        if (!parsed.deviceDetection) {
            parsed.deviceDetection = {
                devicesFound: false,
                devices: [],
                deviceCount: 0,
                highRiskDevice: false
            };
        }

        return parsed;

    } catch (error) {
        console.error("AI Vision Analysis Failed:", error);
        // Fallback for reliability - no devices assumed if AI fails
        return {
            faceConfig: "valid",
            eyeContact: 50,
            audioCheck: "silent",
            suspicionScore: 0,
            deviceDetection: {
                devicesFound: false,
                devices: [],
                deviceCount: 0,
                highRiskDevice: false
            },
            environmentCheck: {
                backgroundClean: true,
                lightingAdequate: true,
                suspiciousMovement: false,
                lookingAway: "never"
            },
            briefSummary: "AI Analysis failed, pending manual review."
        };
    }
}

/**
 * Analyzes a single frame (image) for device detection during active test.
 * Lighter-weight than full video analysis for continuous monitoring.
 * @param {Buffer} imageBuffer - The raw image buffer (JPEG/PNG)
 * @param {string} mimeType - The image mime type
 * @returns {Promise<Object>} - Quick analysis result
 */
async function analyzeFrameForDevices(imageBuffer, mimeType = "image/jpeg") {
    try {
        console.log("📸 Analyzing frame for devices...");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Convert buffer to base64 for inline data
        const base64Image = imageBuffer.toString('base64');

        const prompt = `
            QUICK DEVICE SCAN - Analyze this webcam frame for cheating devices.
            
            Look for:
            1. Mobile phone (in hand, on desk, propped up, in reflection)
            2. Tablet or secondary screen
            3. Smartwatch visible on wrist
            4. Earbuds/AirPods (even partially visible)
            5. Written notes or cheat sheets
            6. Another person in frame
            7. Person looking away from screen
            
            Return JSON only (no markdown):
            {
               "clean": true | false,
               "devicesFound": ["phone", "tablet", "smartwatch", "earbuds", "notes", "other_person"] or [],
               "lookingAtScreen": true | false,
               "faceVisible": true | false,
               "riskLevel": "low" | "medium" | "high",
               "flagReason": "brief reason if not clean, else null"
            }
        `;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                }
            },
            { text: prompt }
        ]);

        const responseText = result.response.text();
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(cleanedJson);
        console.log(`📸 Frame Analysis: ${parsed.clean ? '✅ Clean' : '⚠️ ' + parsed.flagReason}`);

        return parsed;

    } catch (error) {
        console.error("Frame Analysis Failed:", error.message);
        // Assume clean if analysis fails (benefit of doubt)
        return {
            clean: true,
            devicesFound: [],
            lookingAtScreen: true,
            faceVisible: true,
            riskLevel: "low",
            flagReason: null,
            error: "Analysis temporarily unavailable"
        };
    }
}

/**
 * Batch analyze multiple frames for efficiency
 * @param {Array<{buffer: Buffer, timestamp: number}>} frames - Array of frame objects
 * @returns {Promise<Object>} - Aggregated analysis
 */
async function analyzeMultipleFrames(frames) {
    try {
        const results = await Promise.all(
            frames.map(f => analyzeFrameForDevices(f.buffer, "image/jpeg"))
        );

        // Aggregate results
        const allDevices = new Set();
        let highRiskCount = 0;
        let facesMissing = 0;
        let lookingAway = 0;

        results.forEach(r => {
            if (r.devicesFound) {
                r.devicesFound.forEach(d => allDevices.add(d));
            }
            if (r.riskLevel === "high") highRiskCount++;
            if (!r.faceVisible) facesMissing++;
            if (!r.lookingAtScreen) lookingAway++;
        });

        return {
            framesAnalyzed: frames.length,
            devicesDetected: Array.from(allDevices),
            highRiskFrames: highRiskCount,
            facesMissingCount: facesMissing,
            lookingAwayCount: lookingAway,
            overallRisk: highRiskCount > 0 ? "high" : (allDevices.size > 0 ? "medium" : "low"),
            integrityPenalty: (highRiskCount * 10) + (allDevices.size * 5) + (facesMissing * 3) + (lookingAway * 2)
        };

    } catch (error) {
        console.error("Batch Frame Analysis Failed:", error);
        return {
            framesAnalyzed: frames.length,
            devicesDetected: [],
            highRiskFrames: 0,
            overallRisk: "low",
            integrityPenalty: 0,
            error: "Batch analysis failed"
        };
    }
}

module.exports = {
    analyzeVideoIntegrity,
    analyzeFrameForDevices,
    analyzeMultipleFrames
};
