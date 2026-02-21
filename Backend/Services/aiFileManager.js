const { GoogleAIFileManager } = require("@google/generative-ai/server");
const fs = require("fs");
const path = require("path");

// Initialize Google AI File Manager
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

/**
 * Uploads a file buffer to Google AI for processing
 * Note: Gemini requires a file path, so we temporarily write the buffer to disk.
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - e.g. "video/webm"
 * @returns {Promise<Object>} - The uploaded file object
 */
async function uploadToGemini(buffer, mimeType) {
    const tempPath = path.join(__dirname, `../../temp-${Date.now()}.webm`);

    try {
        // 1. Write buffer to temp file
        fs.writeFileSync(tempPath, buffer);

        // 2. Upload to Gemini
        const uploadResponse = await fileManager.uploadFile(tempPath, {
            mimeType: mimeType,
            displayName: "Test Session Intro",
        });

        console.log(`Uploaded file ${uploadResponse.file.displayName} as: ${uploadResponse.file.uri}`);
        return uploadResponse.file;

    } catch (error) {
        console.error("Gemini Upload Error:", error);
        throw error;
    } finally {
        // 3. Cleanup temp file
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    }
}

module.exports = { uploadToGemini };
