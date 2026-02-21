// ai-agents/questions/questionGenerator.js
// AI-Powered Question Generation System
// Phase 2.5: Dynamic Profile-Specific Questions

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { JOB_PROFILES, getProfileById } = require("../../data/jobProfiles");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate questions for a specific job profile using AI
 * @param {string} profileId - Job profile ID
 * @param {number} count - Number of questions to generate (default: 30)
 * @param {string} difficulty - Difficulty level: easy, medium, hard
 * @returns {Promise<Array>} Array of generated questions
 */
const AIMetrics = require("../../models/AIMetrics");

/**
 * Generate questions for a specific job profile using AI
 * @param {string} profileId - Job profile ID
 * @param {number} count - Number of questions to generate (default: 30)
 * @param {string} difficulty - Difficulty level: easy, medium, hard
 * @returns {Promise<Array>} Array of generated questions
 */
async function generateQuestionsForProfile(profileId, count = 30, difficulty = "medium", experienceLevel = "mid") {
    const startTime = Date.now();
    let modelName = "gemini-1.5-flash";

    try {
        let profile = getProfileById(profileId);

        // --- DYNAMIC PROFILE SUPPORT ---
        if (!profile) {
            // Treat profileId as a custom role name
            const roleName = profileId
                .split(/[-_ ]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            console.log(`✨ Creating dynamic profile for: ${roleName}`);

            profile = {
                id: profileId,
                name: roleName,
                category: "general",
                description: `Professional role focused on ${roleName}`,
                skills: [`${roleName} Core Skills`, "Problem Solving", "Critical Thinking"],
                questionTopics: ["Core Concepts", "Practical Scenarios", "Advanced Application", "Industry Standards"]
            };
        }

        console.log(`🤖 Generating ${count} ${difficulty} questions for ${profile.name} (${experienceLevel} Level)...`);

        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = buildQuestionPrompt(profile, count, difficulty, experienceLevel);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract token usage if available
        const usage = response.usageMetadata || {};

        // Log success metric
        await AIMetrics.create({
            operation: 'generate_questions',
            model: modelName,
            latencyMs: Date.now() - startTime,
            tokenCount: {
                prompt: usage.promptTokenCount || 0,
                completion: usage.candidatesTokenCount || 0,
                total: usage.totalTokenCount || 0
            },
            success: true,
            metadata: {
                profileId,
                difficulty,
                questionCount: count
            }
        });

        // Parse the AI response into structured questions
        const questions = parseAIResponse(text, profile, difficulty);

        console.log(`✅ Generated ${questions.length} questions for ${profile.name}`);

        return questions;

    } catch (error) {
        console.error("❌ Question generation error:", error);

        // Log failure metric
        await AIMetrics.create({
            operation: 'generate_questions',
            model: modelName,
            latencyMs: Date.now() - startTime,
            success: false,
            error: error.message,
            metadata: {
                profileId,
                difficulty,
                questionCount: count
            }
        }).catch(e => console.error("Failed to log AI metric:", e));

        // Fallback to template-based questions if AI fails
        console.log("⚠️ Falling back to template questions...");
        return generateTemplateQuestions(profileId, count, difficulty);
    }
}

/**
 * Build the AI prompt for question generation
 */
function buildQuestionPrompt(profile, count, difficulty, experienceLevel = "mid") {
    const difficultyGuide = {
        easy: "suitable for beginners or entry-level professionals",
        medium: "suitable for mid-level professionals with 2-5 years experience",
        hard: "suitable for senior professionals or experts with 5+ years experience"
    };

    const levelContext = {
        intern: "Focus on fundamental concepts, definitions, and basic problem solving. Avoid complex architecture.",
        junior: "Focus on practical application of standard tasks, debugging, and common scenarios.",
        mid: "Focus on best practices, optimizations, trade-off analysis, and system integration.",
        senior: "Focus on complex system design, scalability, strategic decision making, and edge cases.",
        executive: "Focus on high-level strategy, industry trends, risk management, and resource allocation."
    };

    const contextInstruction = levelContext[experienceLevel] || levelContext.mid;

    return `You are an expert test designer creating a professional intelligence assessment for ${profile.name} professionals.

**Target Audience:** ${experienceLevel.toUpperCase()} Level ${profile.name}
**Context:** ${contextInstruction}

**Profile Details:**
- Role: ${profile.name}
- Category: ${profile.category}
- Description: ${profile.description}
- Key Skills: ${profile.skills.join(", ")}
- Question Topics: ${profile.questionTopics.join(", ")}

**Task:**
Generate ${count} HIGH-QUALITY, UNIQUE multiple-choice questions that assess cognitive ability, problem-solving, and domain-specific intelligence for ${profile.name} professionals.

**Critical Quality Requirements:**
1. **UNIQUENESS**: Each question must be distinctly different. Avoid repetitive patterns.
2. **PLAUSIBLE DISTRACTORS**: Wrong answers should be believable and require thought to eliminate. They should:
   - Be related to the topic but incorrect
   - Avoid obviously absurd or unrelated options
   - Test understanding, not just memorization
3. **CONTEXTUAL RELEVANCE**: All options must make sense within the ${profile.name} domain
4. **VARIETY**: Use different question patterns, scenarios, and knowledge areas

**Question Format Specifications:**
- Difficulty: ${difficulty} (${difficultyGuide[difficulty]})
- Each question must have:
  - A clear, concise question statement (avoid ambiguity)
  - 4 answer options (A, B, C, D) - all plausible within the domain
  - One definitively correct answer
  - Questions should test: Domain expertise, problem-solving, decision-making, and practical application

**Content Distribution (Strictly enforced):**
   - 30% Practical Problem-Solving \u0026 Real-World Scenarios
   - 25% Core Domain Knowledge \u0026 Best Practices
   - 20% Analytical Thinking \u0026 Trade-off Analysis
   - 15% Historical Case Studies (failures, successes, lessons learned)
   - 10% Cross-Domain Insights (how other industries inform this role)

**Quality Guidelines:**
✅ DO:
- Create realistic, practical scenarios professionals face
- Use industry-standard terminology correctly
- Make wrong answers tempting to those who partially understand
- Test application of knowledge, not just recall
- Include edge cases and nuanced decisions

❌ DON'T:
- Repeat similar question patterns
- Use obviously wrong options (e.g., "Do nothing" as a choice in professional scenarios)
- Include options from completely unrelated domains
- Make questions overly theoretical or academic
- Use trick questions or deliberately confusing wording

**Example of GOOD Question:**
{
  "question": "A production system is experiencing intermittent slowdowns. Initial monitoring shows CPU usage at 60%. What should be your FIRST diagnostic step?",
  "options": [
    "Check for memory leaks and garbage collection patterns",
    "Increase CPU allocation immediately",
    "Restart the entire system",
    "Wait to see if it resolves itself"
  ],
  "correctAnswer": 0,
  "topic": "System Troubleshooting",
  "explanation": "Before adding resources, proper diagnosis requires checking memory and GC, as these often cause CPU spikes even when utilization seems moderate."
}

**Example of BAD Question (DO NOT DO THIS):**
{
  "question": "Which skill is important for a Software Engineer?",
  "options": [
    "Programming",
    "Surgery",
    "Dancing",
    "Cooking"
  ]
  ❌ Problem: Options are absurdly unrelated and don't test knowledge
}

**Output Format (JSON):**
Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "The actual question asking for analysis or decision",
    "questionType": "standard | case_study | failure_analysis | cross_industry",
    "context": "For case studies: detailed scenario paragraph. Otherwise: empty string.",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "topic": "One of: ${profile.questionTopics.join(", ")}",
    "difficulty": "${difficulty}",
    "explanation": "Why this answer is correct and others are not",
    "intent": "problem_solving | knowledge_recall | analytical_thinking | decision_making | pattern_recognition | application",
    "cognitiveType": "fluid | crystallized | spatial | verbal | logical | numerical"
  }
]

**Intent & Cognitive Type Guidelines:**
- **Intent**: What skill does this question test?
  - problem_solving: Real-world scenarios requiring solutions
  - knowledge_recall: Domain facts and concepts
  - analytical_thinking: Evaluation and comparison
  - decision_making: Trade-offs and judgment
  - pattern_recognition: Logic and sequences
  - application: Applying concepts to new situations

- **Cognitive Type**: Which cognitive ability is engaged?
  - fluid: Novel problem solving, adaptability
  - crystallized: Learned expertise and facts
  - spatial: Visual-spatial reasoning
  - verbal: Language and communication
  - logical: Deductive reasoning
  - numerical: Quantitative analysis


**Important:**
- Make each question test a different concept or scenario
- Ensure no two questions have similar structure or wording
- Distractors should be contextually relevant to ${profile.name}
- Focus on practical judgment, not trivia

Generate ${count} diverse, high-quality questions now:`;
}

/**
 * Parse AI response into structured question objects
 */
function parseAIResponse(text, profile, difficulty) {
    try {
        // Extract JSON from response (AI might wrap it in markdown code blocks)
        let jsonText = text.trim();

        // Remove markdown code blocks if present
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/```\n?/g, "");
        }

        const questions = JSON.parse(jsonText);

        // Validate and enhance each question
        return questions.map((q, index) => ({
            // id: ... removed to let Mongoose generate _id
            profileId: profile.id,
            profileName: profile.name,
            question: q.question,
            questionType: q.questionType || "standard",
            contextData: q.context || "", // Map context to contextData
            options: q.options,
            correctAnswer: q.correctAnswer,
            topic: q.topic || profile.questionTopics[0],
            difficulty: q.difficulty || difficulty,
            explanation: q.explanation || "",
            // NEW PHASE 0: Classification fields
            intent: q.intent || 'knowledge_recall',
            cognitiveType: q.cognitiveType || 'crystallized',
            aiGenerated: true,
            generatedAt: new Date(),
            usageCount: 0
        }));

    } catch (error) {
        console.error("❌ Failed to parse AI response:", error);
        console.log("Raw response:", text);
        throw new Error("Failed to parse AI-generated questions");
    }
}

/**
 * Fallback: Generate template-based questions if AI fails
 */
/**
 * Fallback: Generate template-based questions if AI fails
 * Uses a "Deck System" to generate all possible unique questions first, 
 * then shuffles and selects 'count' items. 
 * Includes generic logical reasoning questions to ensure high volume.
 */
function generateTemplateQuestions(profileId, count, difficulty) {
    let profile = getProfileById(profileId);

    // Fallback for dynamic profiles
    if (!profile) {
        const roleName = profileId
            .split(/[-_ ]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        profile = {
            id: profileId,
            name: roleName,
            category: "general",
            description: `Professional role focused on ${roleName}`,
            skills: [`${roleName} Knowledge`, "Analysis"],
            questionTopics: ["General"]
        };
    }

    console.log(`⚠️ Generating ${count} questions for ${profile.name} using Enhanced Fallback Engine...`);

    const potentialQuestions = [];

    // Helper: Get skills from RELATED profiles only (same or adjacent categories)
    const getRelatedSkills = () => {
        const relatedProfiles = JOB_PROFILES.filter(p =>
            p.id !== profile.id &&
            (p.category === profile.category || Math.abs(p.id.length - profile.id.length) < 3)
        );
        return [...new Set(relatedProfiles.flatMap(p => p.skills))];
    };

    const relatedSkills = getRelatedSkills();

    // 1. POSITIVE SKILL QUESTIONS (Enhanced with better distractors)
    // "Which skill is essential for a [Role]?"
    profile.skills.forEach(skill => {
        // Get semi-plausible distractors from related profiles
        const semiPlausible = relatedSkills.filter(s =>
            s !== skill &&
            !profile.skills.includes(s) &&
            // Only use skills that share at least one word or are from same domain
            (s.toLowerCase().includes(skill.split(' ')[0].toLowerCase()) ||
                skill.toLowerCase().includes(s.split(' ')[0].toLowerCase()) ||
                relatedSkills.includes(s))
        );

        // If we have semi-plausible ones, use them; otherwise create generic ones
        let distractors;
        if (semiPlausible.length >= 3) {
            distractors = shuffleArray(semiPlausible).slice(0, 3);
        } else {
            // Create contextual distractors based on skill type
            distractors = generateContextualDistractors(skill, profile.category);
        }

        if (distractors.length === 3) {
            const options = shuffleArray([skill, ...distractors]);
            potentialQuestions.push({
                question: `Which of the following is a core skill for a successful ${profile.name}?`,
                options: options,
                correctAnswer: options.indexOf(skill),
                topic: "Core Skills",
                explanation: `${skill} is fundamental to the ${profile.name} role.`,
                intent: 'knowledge_recall',      // Testing domain knowledge
                cognitiveType: 'crystallized'   // Using learned expertise
            });
        }
    });

    // 2. SCENARIO-BASED QUESTIONS (Role-specific)
    const roleScenarios = generateRoleScenarios(profile);
    potentialQuestions.push(...roleScenarios);

    // 3. BEST PRACTICES QUESTIONS
    const bestPractices = generateBestPracticeQuestions(profile);
    potentialQuestions.push(...bestPractices);

    // 4. TOOL/TECHNOLOGY QUESTIONS (if applicable)
    if (profile.category === 'technology' || profile.category === 'engineering') {
        const techQuestions = generateTechQuestions(profile);
        potentialQuestions.push(...techQuestions);
    }

    // 5. GENERIC LOGIC & APTITUDE (Domain-neutral, always valid)
    const logicQuestions = getGenericLogicQuestions();
    potentialQuestions.push(...logicQuestions);

    // --- FINALIZE ---
    const deck = shuffleArray(potentialQuestions);
    const selected = [];

    for (let i = 0; i < count; i++) {
        const template = deck[i % deck.length];
        selected.push({
            profileId: profile.id,
            profileName: profile.name,
            question: template.question,
            options: template.options,
            correctAnswer: template.correctAnswer,
            topic: template.topic,
            difficulty: difficulty,
            explanation: template.explanation,
            // NEW PHASE 0: Add intelligent defaults for classification
            intent: template.intent || 'knowledge_recall',
            cognitiveType: template.cognitiveType || 'crystallized',
            aiGenerated: false,
            generatedAt: new Date(),
            usageCount: 0
        });
    }

    return selected;
}

/**
 * Generate contextual distractors based on the skill and category
 */
function generateContextualDistractors(skill, category) {
    const skillLower = skill.toLowerCase();
    const distractors = [];

    // Technology/Engineering category
    if (category === 'technology' || category === 'engineering') {
        if (skillLower.includes('programming') || skillLower.includes('coding')) {
            distractors.push('Advanced Typography', 'Color Theory Mastery', 'Print Media Design');
        } else if (skillLower.includes('database') || skillLower.includes('sql')) {
            distractors.push('Frontend Animation', 'UI Wireframing', 'Graphic Composition');
        } else if (skillLower.includes('testing') || skillLower.includes('qa')) {
            distractors.push('Sales Negotiation', 'Brand Positioning', 'Market Research');
        } else {
            distractors.push('Traditional Accounting', 'Manual Bookkeeping', 'Paper-based Filing');
        }
    }
    // Business category
    else if (category === 'business') {
        if (skillLower.includes('analysis')) {
            distractors.push('Creative Writing', 'Artistic Design', 'Musical Composition');
        } else {
            distractors.push('Software Debugging', 'Code Compilation', 'Algorithm Optimization');
        }
    }
    // Creative category
    else if (category === 'creative') {
        distractors.push('Binary Code Analysis', 'Database Normalization', 'Network Protocol Design');
    }
    // Default fallback
    else {
        distractors.push('Unrelated Skill A', 'Unrelated Skill B', 'Unrelated Skill C');
    }

    return shuffleArray(distractors).slice(0, 3);
}

/**
 * Generate role-specific scenario questions
 */
function generateRoleScenarios(profile) {
    const scenarios = [];

    // Generic professional scenarios that work for all roles
    const universalScenarios = [
        {
            q: `As a ${profile.name}, you discover a critical flaw in an important deliverable hours before the deadline. What should you do?`,
            a: "Immediately notify stakeholders and propose solutions",
            distractors: ["Hide it and hope no one notices", "Blame a team member", "Ignore it and submit anyway"]
        },
        {
            q: `A client/stakeholder requests changes that conflict with best practices in your ${profile.name} role. How do you respond?`,
            a: "Explain the risks and suggest evidence-based alternatives",
            distractors: ["Refuse without explanation", "Agree immediately to avoid conflict", "Delegate the decision to someone else"]
        },
        {
            q: `You need to learn a new skill or technology for your ${profile.name} role. What's the most effective approach?`,
            a: "Combine hands-on practice with documentation and expert guidance",
            distractors: ["Wait for formal training before starting", "Only read about it without practicing", "Ignore it until forced to learn"]
        }
    ];

    universalScenarios.forEach(s => {
        const opts = shuffleArray([s.a, ...s.distractors]);
        scenarios.push({
            question: s.q,
            options: opts,
            correctAnswer: opts.indexOf(s.a),
            topic: "Professional Judgment",
            explanation: "This demonstrates sound professional judgment and stakeholder management.",
            intent: 'decision_making',        // Practical decision scenarios
            cognitiveType: 'fluid'            // Novel situation reasoning
        });
    });

    return scenarios;
}

/**
 * Generate best practice questions
 */
function generateBestPracticeQuestions(profile) {
    const questions = [];

    profile.skills.slice(0, 3).forEach(skill => {
        questions.push({
            question: `What is a fundamental principle when applying ${skill} in a ${profile.name} role?`,
            options: shuffleArray([
                "Balance efficiency with quality and maintainability",
                "Always choose the fastest option regardless of consequences",
                "Avoid documentation to save time",
                "Never question established methods"
            ]),
            correctAnswer: 0, // Will be recalculated after shuffle
            topic: "Best Practices",
            explanation: `Professional ${profile.name} work requires balancing multiple factors.`
        });
    });

    // Fix correct answer index after shuffle
    return questions.map(q => {
        const correctOpt = "Balance efficiency with quality and maintainability";
        return {
            ...q,
            correctAnswer: q.options.indexOf(correctOpt),
            intent: 'knowledge_recall',      // Testing best practice knowledge
            cognitiveType: 'crystallized'    // Learned expertise
        };
    });
}

/**
 * Generate technology/tool questions for tech roles
 */
function generateTechQuestions(profile) {
    const questions = [];

    questions.push({
        question: `In ${profile.name}, when choosing between multiple solutions, what is most important?`,
        options: shuffleArray([
            "Understanding trade-offs and selecting based on requirements",
            "Always using the newest technology available",
            "Choosing the solution you're most familiar with",
            "Following whatever is most popular"
        ]),
        correctAnswer: 0,
        topic: "Technical Decision Making",
        explanation: "Good technical decisions are based on informed trade-off analysis."
    });

    return questions.map(q => {
        const correctOpt = "Understanding trade-offs and selecting based on requirements";
        return {
            ...q,
            correctAnswer: q.options.indexOf(correctOpt),
            intent: 'analytical_thinking',   // Evaluating options
            cognitiveType: 'logical'         // Logical analysis
        };
    });
}

/**
 * Helper: Shuffle an array using Fisher-Yates
 */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Large bank of generic logic/aptitude questions
 */
function getGenericLogicQuestions() {
    return [
        { q: "Complete the series: 2, 4, 8, 16, ...", a: "32", opts: ["30", "32", "24", "64"], t: "Pattern Recognition", expl: "Double the previous number." },
        { q: "If all Bloops are Razzies and some Razzies are Zuzus, are all Bloops definitely Zuzus?", a: "No", opts: ["Yes", "No", "Maybe", "Impossible to tell"], t: "Logical Reasoning", expl: "Set theory does not guarantee the overlap." },
        { q: "Which number does not belong: 2, 3, 5, 7, 9, 11?", a: "9", opts: ["5", "7", "9", "11"], t: "Math Logic", expl: "9 is the only non-prime number in the list." },
        { q: "Complete the analogy: Finger is to Hand as Leaf is to...", a: "Branch", opts: ["Tree", "Branch", "Root", "Forest"], t: "Verbal Reasoning", expl: "A finger is a part attached to the hand; a leaf is attached to a branch." },
        { q: "Review: 'The quick brown fox jumps over the lazy dog'. How many vowels are in the last word?", a: "1", opts: ["1", "2", "3", "0"], t: "Attention to Detail", expl: "'Dog' has one vowel (o)." },
        { q: "If you have 30 coins and lose half, then find 5, how many do you have?", a: "20", opts: ["15", "20", "25", "10"], t: "Math Logic", expl: "30 / 2 = 15. 15 + 5 = 20." },
        { q: "What comes next: Monday, Wednesday, Friday, ...", a: "Sunday", opts: ["Saturday", "Sunday", "Tuesday", "Thursday"], t: "Pattern Recognition", expl: "Skip one day sequence." },
        { q: "Identify the pattern: A, C, E, G, ...", a: "I", opts: ["H", "I", "J", "K"], t: "Pattern Recognition", expl: "Skip one letter in alphabet." },
        { q: "100, 95, 85, 70, ... What comes next?", a: "50", opts: ["55", "50", "45", "60"], t: "Math Logic", expl: "Subtract increasing multiples of 5: -5, -10, -15, -20." },
        { q: "Which shape is most stable?", a: "Triangle", opts: ["Circle", "Square", "Triangle", "Rectangle"], t: "Spatial Reasoning", expl: "Triangle is geometrically the rigid shape." },
        { q: "Code : Programmer :: Paint : ...", a: "Artist", opts: ["Wall", "Brush", "Artist", "Shop"], t: "Verbal Reasoning", expl: "Programmer uses Code; Artist uses Paint." },
        { q: "Select the odd one out.", a: "Apple", opts: ["Carrot", "Potato", "Apple", "Onion"], t: "Classification", expl: "Apple is a fruit; others are vegetables/roots." },
        { q: "If A > B and B > C, then:", a: "A > C", opts: ["A < C", "A = C", "A > C", "Relationship unknown"], t: "Logical Reasoning", expl: "Transitive property." },
        { q: "A car travels 60 miles in 1.5 hours. What is its speed?", a: "40 mph", opts: ["45 mph", "30 mph", "40 mph", "50 mph"], t: "Math Logic", expl: "60 / 1.5 = 40." },
        { q: "What is 15% of 200?", a: "30", opts: ["20", "25", "30", "35"], t: "Math Logic", expl: "10% is 20, 5% is 10. Total 30." }
    ].map(item => {
        const options = shuffleArray(item.opts);
        // Determine intent and cognitive type based on question topic
        let intent = 'pattern_recognition';
        let cogType = 'logical';
        if (item.t.includes('Math')) { intent = 'problem_solving'; cogType = 'numerical'; }
        if (item.t.includes('Verbal') || item.t.includes('Attention')) { intent = 'knowledge_recall'; cogType = 'verbal'; }

        return {
            question: item.q,
            options: options,
            correctAnswer: options.indexOf(item.a),
            topic: item.t,
            explanation: item.expl,
            intent: intent,
            cognitiveType: cogType
        };
    });
}

/**
 * Batch generate questions for multiple profiles
 */
async function batchGenerateQuestions(profileIds, count = 30, difficulty = "medium") {
    const results = {};

    for (const profileId of profileIds) {
        try {
            results[profileId] = await generateQuestionsForProfile(profileId, count, difficulty);
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500)); // Reduced for local fallback speed
        } catch (error) {
            console.error(`Failed to generate questions for ${profileId}:`, error);
            results[profileId] = { error: error.message };
        }
    }

    return results;
}

/**
 * Generate questions for all active profiles
 */
async function generateQuestionsForAllProfiles(count = 30, difficulty = "medium") {
    const activeProfiles = JOB_PROFILES.filter(p => p.active);
    const profileIds = activeProfiles.map(p => p.id);

    console.log(`🚀 Generating questions for ${profileIds.length} profiles...`);

    return await batchGenerateQuestions(profileIds, count, difficulty);
}

module.exports = {
    generateQuestionsForProfile,
    batchGenerateQuestions,
    generateQuestionsForAllProfiles,
    parseAIResponse,
    buildQuestionPrompt
};
