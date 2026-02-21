import { create } from "zustand";

export const useTestStore = create((set) => ({
    questions: [],
    answers: {},
    started: false,
    submitted: false,

    setQuestions: (questions) => set({ questions, started: true }),
    answerQuestion: (id, value) =>
        set((state) => ({
            answers: { ...state.answers, [id]: value },
        })),

    resetTest: () =>
        set({
            questions: [],
            answers: {},
            started: false,
            submitted: false,
        }),
}));
