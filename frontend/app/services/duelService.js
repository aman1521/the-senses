import api from "./apiClient";

export const getDuels = () => api.get("/duels");
export const createDuel = (challengerId, opponentId, difficulty, jobProfile) =>
    api.post("/duels/challenge", { challengerId, opponentId, difficulty, jobProfile });

export const acceptDuel = (duelId, opponentId, answers, difficulty, jobProfile) =>
    api.post(`/duels/${duelId}/accept`, { opponentId, answers, difficulty, jobProfile });

export const completeDuel = (duelId, challengerId, answers, difficulty, jobProfile) =>
    api.post(`/duels/${duelId}/complete`, { challengerId, answers, difficulty, jobProfile });

export const getDuel = (duelId) =>
    api.get(`/duels/${duelId}`);

export const getUserDuels = (userId) =>
    api.get(`/duels/user/${userId}`);
