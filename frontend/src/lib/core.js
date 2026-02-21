// Local ESM shim for core logic to avoid CJS/ESM interop issues in the browser.
// Synced from packages/core/src.

export function calculateArchetype({ finalScore, baseBadge, meta = {} }) {
  let archetype = baseBadge || "Analyst";

  const avgReaction = Array.isArray(meta.reactionTimes) && meta.reactionTimes.length > 0
    ? meta.reactionTimes.reduce((a, b) => a + b, 0) / meta.reactionTimes.length
    : 0;

  if (avgReaction > 0 && avgReaction < 450 && finalScore > 80) {
    archetype = "Rapid Strategist";
  } else if (meta.memoryScore > 40 && finalScore > 85) {
    archetype = "Visionary Architect";
  } else if (avgReaction > 0 && avgReaction < 400) {
    archetype = "Quick Thinker";
  } else if (meta.memoryScore > 50) {
    archetype = "Visual Savant";
  }

  return archetype;
}

const ARCHETYPES = {
  "Rapid Strategist": {
    strengths: ["Fast Decision Making", "Strategic Adaptability", "Pattern Recognition"],
    biases: ["Action Bias", "Overconfidence"],
    description: "You excel at making quick, accurate decisions under pressure."
  },
  "Visionary Architect": {
    strengths: ["Long-term Planning", "Structural thinking", "Creative Problem Solving"],
    biases: ["Analysis Paralysis", "Idealism"],
    description: "You see the big picture and design robust systems."
  },
  "Quick Thinker": {
    strengths: ["Speed", "Agility", "Crisis Management"],
    biases: ["Impulsivity", "Surface-level Analysis"],
    description: "Your reaction time is exceptional."
  },
  "Visual Savant": {
    strengths: ["Spatial Reasoning", "Memory", "Visual Processing"],
    biases: ["Pattern Overfitting", "Detail Obsession"],
    description: "You have an incredible visual memory."
  },
  "Analyst": {
    strengths: ["Data Analysis", "Logical Reasoning", "Consistency"],
    biases: ["Confirmation Bias", "Anchoring"],
    description: "You are methodical and logical."
  }
};

export function getInsights(archetype) {
  return ARCHETYPES[archetype] || ARCHETYPES["Analyst"];
}

const TRUST_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 50
};

export function getTrustColor(score) {
  if (score >= TRUST_THRESHOLDS.HIGH) return "#10b981";
  if (score >= TRUST_THRESHOLDS.MEDIUM) return "#f59e0b";
  return "#ef4444";
}

export function getTrustBgColor(score) {
  if (score >= TRUST_THRESHOLDS.HIGH) return "rgba(16, 185, 129, 0.1)";
  if (score >= TRUST_THRESHOLDS.MEDIUM) return "rgba(245, 158, 11, 0.1)";
  return "rgba(239, 68, 68, 0.1)";
}

const ACTIONS = {
  START_TEST: "START_TEST",
  SET_QUESTIONS: "SET_QUESTIONS",
  ANSWER_QUESTION: "ANSWER_QUESTION",
  NEXT_QUESTION: "NEXT_QUESTION",
  PREV_QUESTION: "PREV_QUESTION",
  CHANGE_STEP: "CHANGE_STEP",
  TICK_TIMER: "TICK_TIMER",
  FLAG_INTEGRITY: "FLAG_INTEGRITY",
  RECORD_REACTION: "RECORD_REACTION",
  SET_MEMORY_SCORE: "SET_MEMORY_SCORE",
  SET_VISION_SCORE: "SET_VISION_SCORE",
  SET_REFLEX_METRICS: "SET_REFLEX_METRICS",
  COMPLETE_TEST: "COMPLETE_TEST"
};

export const testMachine = {
  // Initial State
  initialState: {
    status: "idle", // idle, running, paused, completed
    currentStep: "intro", // intro, skill, reflex, memory, psych, result

    questions: [],
    currentIndex: 0,
    answers: {}, // map of questionId -> answer

    startTime: null,
    timeRemaining: 0,

    integrityScore: 100,
    flags: [],

    reactionTimes: [],
    memoryScore: 0,
    visionScore: 0,
    tabSwitches: 0,
    reflexMetrics: null
  },

  ACTIONS,

  testReducer(state, action) {
    switch (action.type) {
      case ACTIONS.START_TEST:
        return {
          ...state,
          status: "running",
          startTime: Date.now(),
          timeRemaining: action.payload.duration || 1800,
          currentStep: "skill"
        };
      case ACTIONS.SET_QUESTIONS:
        return {
          ...state,
          questions: action.payload
        };
      case ACTIONS.ANSWER_QUESTION:
        return {
          ...state,
          answers: {
            ...state.answers,
            [action.payload.questionId]: action.payload.answer
          }
        };
      case ACTIONS.NEXT_QUESTION: {
        const nextIndex = state.currentIndex + 1;
        if (nextIndex >= state.questions.length) {
          return { ...state, currentIndex: 0 };
        }
        return { ...state, currentIndex: nextIndex };
      }
      case ACTIONS.PREV_QUESTION:
        return {
          ...state,
          currentIndex: Math.max(0, state.currentIndex - 1)
        };
      case ACTIONS.CHANGE_STEP:
        return {
          ...state,
          currentStep: action.payload,
          currentIndex: 0
        };
      case ACTIONS.TICK_TIMER:
        if (state.status !== "running") return state;
        return { ...state, timeRemaining: Math.max(0, state.timeRemaining - 1) };
      case ACTIONS.FLAG_INTEGRITY:
        return {
          ...state,
          integrityScore: Math.max(0, state.integrityScore - (action.payload.penalty || 0)),
          flags: [...state.flags, action.payload.reason],
          tabSwitches: action.payload.isTabSwitch ? state.tabSwitches + 1 : state.tabSwitches
        };
      case ACTIONS.RECORD_REACTION:
        return { ...state, reactionTimes: [...state.reactionTimes, action.payload] };
      case ACTIONS.SET_MEMORY_SCORE:
        return { ...state, memoryScore: action.payload };
      case ACTIONS.SET_VISION_SCORE:
        return { ...state, visionScore: action.payload };
      case ACTIONS.SET_REFLEX_METRICS:
        return { ...state, reflexMetrics: action.payload };
      case ACTIONS.COMPLETE_TEST:
        return { ...state, status: "completed" };
      default:
        return state;
    }
  }
};
