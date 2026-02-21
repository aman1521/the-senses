const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse'); // Renamed for clarity
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Config
const KNOWLEDGE_DIR = path.join(__dirname, '../../data/knowledge_base');
const OUTPUT_FILE = path.join(__dirname, '../../data/psychology_context.json');
const CHUNK_SIZE = 2000; // Characters per chunk for summarization
const MAX_CONTEXT_LENGTH = 30000; // Limit total context to avoid token limits

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log("API Key Status:", process.env.GEMINI_API_KEY ? "Present" : "MISSING", process.env.GEMINI_API_KEY ? `(${process.env.GEMINI_API_KEY.slice(0, 4)}...)` : "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Match questionGenerator.js

async function ingestPDFs() {
    console.log("📚 Starting Knowledge Ingestion...");

    if (!fs.existsSync(KNOWLEDGE_DIR)) {
        console.error("❌ Knowledge directory not found:", KNOWLEDGE_DIR);
        return;
    }

    const files = fs.readdirSync(KNOWLEDGE_DIR).filter(file =>
        file.endsWith('.pdf') &&
        !file.startsWith('5458') // Skip known corrupt/encrypted file
    );
    console.log(`Found ${files.length} PDF files.`);

    let combinedSummary = [];

    for (const file of files) {
        console.log(`\nProcessing: ${file}...`);
        try {
            const dataBuffer = fs.readFileSync(path.join(KNOWLEDGE_DIR, file));

            // 1. Parse PDF Text
            const data = await pdfParse(dataBuffer);
            const text = data.text;
            console.log(`   - Extracted ${text.length} characters.`);

            if (!text || text.trim().length < 100) {
                console.warn(`   ⚠️ Warning: No usable text extracted from ${file}. It might be empty or image-based.`);
                continue;
            }

            // 2. Intelligent Summarization
            console.log(`   - Generating insights with AI...`);

            // Limit text sent to AI.
            // Ensure we don't slice out of bounds
            const length = text.length;
            const startChunk = text.slice(0, Math.min(6000, length));
            // Only take middle chunk if text is long enough
            const midStart = Math.floor(length / 2);
            const midChunk = length > 12000 ? text.slice(midStart, Math.min(midStart + 6000, length)) : "";

            const meaningfulText = startChunk + (midChunk ? "\n...[SECTION BREAK]...\n" + midChunk : "");

            const prompt = `
                Analyze the following text excerpts from a Psychology/Case Study book ("${file}").
                Extract 5-10 Key Insight Objects in JSON format.
                Focus on:
                1. Specific psychological theories (e.g. Cognitive Dissonance)
                2. Famous relevant case studies or experiments
                3. "Mind Reading" or subtle cue definitions (Body language, micro-expressions)
                4. Historical industry failures if present.

                Return strictly a JSON array of objects: 
                [{ "topic": "Theory Name", "content": "Detailed explanation...", "type": "theory|case_study" }]

                Text:
                ${meaningfulText}
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const jsonText = cleanJson(response.text());

            const insights = JSON.parse(jsonText);
            console.log(`   - Extracted ${insights.length} insights.`);

            combinedSummary.push(...insights);

        } catch (error) {
            console.error(`   ❌ Failed to process ${file}:`, error.message);
        }
    }

    // Save to JSON file for the Generator to use
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(combinedSummary, null, 2));
    console.log(`\n✅ Ingestion Complete! Saved ${combinedSummary.length} knowledge contexts to ${OUTPUT_FILE}`);
}

function cleanJson(text) {
    if (text.startsWith("```json")) return text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    if (text.startsWith("```")) return text.replace(/```\n?/g, "");
    return text;
}

ingestPDFs();
