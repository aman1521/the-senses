import api from "./apiClient";

export const generateShareCard = () =>
    api.get("/profile/share/card"); // Adjusted path based on profileRoutes registration
