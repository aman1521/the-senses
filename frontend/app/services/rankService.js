import api from "./apiClient";

export const getResultSummary = () =>
    api.get("/rank/summary");

export const getMyRank = () => api.get("/rank/me");

export const getLeaderboard = () =>
    api.get("/leaderboard/global");
