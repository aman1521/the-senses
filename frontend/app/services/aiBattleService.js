import api from "./apiClient";

export const getAIProfiles = () =>
    api.get("/ai-battles/profiles");

export const simulateAIBattle = (ai1Id, ai2Id, difficulty) =>
    api.post("/ai-battles/simulate", { ai1Id, ai2Id, difficulty });

export const getAIBattleHistory = () =>
    api.get("/ai-battles/history");
