import api from "./apiClient";

export const fetchProfileIntelligence = (name) =>
    api.post("/intelligence/profile", { name });
