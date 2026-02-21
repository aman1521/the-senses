import api from "./apiClient";

// Start test with AI-generated questions based on profile
export const startTest = async (profileId = "general", difficulty = "medium") => {
    try {
        // Generate AI questions for the selected profile
        const response = await api.post("/questions-ai/generate", {
            profileId,
            difficulty,
            count: 30
        });

        return response;
    } catch (error) {
        console.error("Failed to generate questions:", error);
        // Fallback to old system if AI generation fails
        return api.post("/game/start");
    }
};

// Submit test answers
export const submitTest = (answers) =>
    api.post("/game/submit", { answers });

// Get available profiles
export const getProfiles = () =>
    api.get("/questions-ai/profiles");
