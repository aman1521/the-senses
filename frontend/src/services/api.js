import axios from "axios";

const normalizeUrl = (value) =>
  typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";

const isLocalHost = (hostname) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

export const resolveApiBaseURL = () => {
  const configuredUrl = normalizeUrl(
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE
  );

  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window !== "undefined" && isLocalHost(window.location.hostname)) {
    return "http://localhost:5000";
  }

  return "";
};

const baseURL = resolveApiBaseURL();

export const API = axios.create({
  ...(baseURL ? { baseURL } : {}),
  withCredentials: true,
  timeout: 15000,
});

if (!baseURL && typeof window !== "undefined") {
  console.warn(
    "API base URL is not configured. Set VITE_API_URL (or VITE_BACKEND_URL) for production deployments."
  );
}

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor for Phase 1 Normalization Compatibility
API.interceptors.response.use(
  (response) => {
    // Check if it's a normalized V1 response (has success:true AND data property)
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      const inner = response.data.data;

      // If inner data is an object, inject 'success' for compatibility with code checking data.success
      if (typeof inner === 'object' && inner !== null && !Array.isArray(inner)) {
        inner.success = true;

        // Also inject 'message' if present
        if (response.data.message) {
          inner.message = response.data.message;
        }

        response.data = inner;
      } else if (Array.isArray(inner)) {
        // If it's an array (e.g. questions list), just unwrap it
        response.data = inner;
      }
    }
    return response;
  },
  (error) => {
    // Standardize error messages
    if (error.response && error.response.data) {
      // If standardized V1 error (has message field), map it to 'error' field for legacy compatibility
      if (error.response.data.message && !error.response.data.error) {
        error.response.data.error = error.response.data.message;
      }
    }
    return Promise.reject(error);
  }
);

export const sendOnboardingMessage = (message, isFinal = false) =>
  API.post("/api/v1/chat/onboarding", { message, isFinal });

export const getQuestions = () => API.get("/api/v1/questions");

export const submitTest = (data) =>
  API.post("/api/v1/intelligence/evaluate", {
    // Legacy format for psychometric engine
    answers: data.answers?.reduce((acc, ans, idx) => {
      // If score exists (psych), use it. If selectedOption (skill), map to dummy or calculate? 
      // ideally the backend engine handles different test types.
      // For now, preserve existing behavior if 'score' is present.
      acc[`q${idx + 1}`] = ans.score || (ans.isCorrect ? 10 : 0);
      return acc;
    }, {}) || {},

    // New detailed format for history and results
    detailedAnswers: data.answers?.map(ans => ({
      questionId: ans._id || ans.questionId,
      questionText: ans.question || ans.text,
      userAnswer: ans.selectedOption || ans.score,
      correctAnswer: ans.correctAnswer,
      isCorrect: ans.isCorrect, // Frontend often calculates this for immediate feedback, or backend can.
      timeSpent: ans.timeSpent || 0,
      topic: ans.topic
    })) || [],

    difficulty: data.difficulty || "medium",
    jobProfile: data.jobProfile || "developer",
    meta: data.meta || {},
    userId: localStorage.getItem("userId"), // Auth middleware handles this but good for context
    userName: localStorage.getItem("userName"),
    country: localStorage.getItem("country") || "global",
  });

export const getLeaderboard = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.verifiedOnly) params.append('verifiedOnly', 'true');
  if (filters.badge) params.append('badge', filters.badge);
  if (filters.minTrustScore) params.append('minTrustScore', filters.minTrustScore);
  if (filters.jobProfile && filters.jobProfile !== 'global') params.append('jobProfile', filters.jobProfile);

  const queryString = params.toString();
  return API.get(`/api/v1/leaderboard${queryString ? '?' + queryString : ''}`);
};

export const fetchProfileIntelligence = (name) =>
  API.post("/api/v1/intelligence/profile", { name });

// Duel API
export const createDuel = (challengerId, opponentId, difficulty, jobProfile) =>
  API.post("/api/v1/duels/challenge", { challengerId, opponentId, difficulty, jobProfile });

export const acceptDuel = (duelId, opponentId, answers, difficulty, jobProfile) =>
  API.post(`/api/v1/duels/${duelId}/accept`, { opponentId, answers, difficulty, jobProfile });

export const completeDuel = (duelId, challengerId, answers, difficulty, jobProfile) =>
  API.post(`/api/v1/duels/${duelId}/complete`, { challengerId, answers, difficulty, jobProfile });

export const getDuel = (duelId) =>
  API.get(`/api/v1/duels/${duelId}`);

export const getUserDuels = (userId) =>
  API.get(`/api/v1/duels/user/${userId}`);

// AI Battle API
export const getAIProfiles = () =>
  API.get("/api/v1/ai-battles/profiles");

export const simulateAIBattle = (ai1Id, ai2Id, prompt) =>
  API.post("/api/v1/ai-battles/simulate", { ai1Id, ai2Id, prompt });

export const getAIBattleHistory = () =>
  API.get("/api/v1/ai-battles/history");

export const submitAIBattleVote = (ai1Id, ai2Id, winnerId, score1, score2) =>
  API.post("/api/v1/ai-battles/vote", { ai1Id, ai2Id, winnerId, score1, score2 });


export const getMyProfile = () =>
  API.get("/api/v1/users/me");

export const getCareerAdvice = () =>
  API.get("/api/v1/dashboard/career-advice");

// AI Question System
export const generateQuestions = (profileId, difficulty = "medium", count = 30) =>
  API.post("/api/v1/questions-ai/generate", { profileId, difficulty, count });

export const getJobProfiles = () =>
  API.get("/api/v1/questions-ai/profiles");

// Payment API
export const createCheckoutSession = (resultId) =>
  API.post("/api/v1/payments/create-checkout-session", { resultId });


export const downloadCertificate = (resultId) =>
  API.get(`/api/v1/payments/certificate/${resultId}`, { responseType: 'blob' });

// Result Review
export const getReviewResult = (sessionId) =>
  API.get(`/api/v1/intelligence/review/${sessionId}`);


// --- Social & Bubbles API ---
// --- Social Features (Feed, Posts, Interactions) ---
// { type: 'foryou' | 'following' | 'elite' | 'trending' }
export const getSocialFeed = async (params) => {
  return API.get('/api/v1/feed', { params });
};

// Updated createPost to accept type and debateStance
export const createPost = async (data) => {
  return API.post('/api/v1/create-post', data);
};

export const likePost = async (postId) => {
  return API.post('/api/v1/like-post', { postId });
};

export const sharePost = async (postId, data) => {
  return API.post('/api/v1/share-post', { postId, ...data });
};

export const createBubble = async (data) => {
  return API.post('/api/v1/bubbles', data);
};

export const getTrendingBubbles = async () => {
  return API.get('/api/v1/trending');
};

export const getBubble = async (bubbleId) => {
  return API.get(`/api/v1/bubbles/${bubbleId}`);
};

export const commentOnPost = async (data) => {
  return API.post('/api/v1/comment', data);
};

export const getComments = async (postId) => {
  return API.get(`/api/v1/comments/${postId}`);
};

export const getPostDetail = async (postId) => {
  return API.get(`/api/v1/post/${postId}`);
};

// --- User Profile & Dashboard API ---
export const getPublicProfile = async (username) => {
  return API.get(`/api/v1/users/profile/${username}`);
};

export const getUserPosts = async (username) => {
  return API.get(`/api/v1/users/profile/${username}/posts`);
};

export const getUserActivity = async (username) => {
  return API.get(`/api/v1/users/profile/${username}/activity`);
};

export const updateProfile = async (data) => {
  return API.patch('/api/v1/users/me', data);
};

export const addCertification = async (data) => {
  return API.post('/api/v1/users/certifications', data);
};

export const deleteCertification = async (id) => {
  return API.delete(`/api/v1/users/certifications/${id}`);
};

export const followUser = async (userIdToFollow) => {
  return API.post('/api/v1/follow', { userIdToFollow });
};
