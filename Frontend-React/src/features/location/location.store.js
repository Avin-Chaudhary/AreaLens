import { create } from "zustand";

const STORAGE_KEY = "location-reviewer:lastState";

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveToStorage = (state) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedCoords: state.selectedCoords,
        selectedRadius: state.selectedRadius,
        overview: state.overview,
      }),
    );
  } catch {
    return null;
  }
};

const persisted = loadFromStorage();

export const useLocationStore = create((set) => ({
  // ─── Persisted State ───────────────────────────────
  selectedCoords: persisted?.selectedCoords ?? null,
  selectedRadius: persisted?.selectedRadius ?? null,
  overview: persisted?.overview ?? null,

  // ─── Temporary Chatbot State ───────────────────────
  // Only stores chatbot data for the CURRENT area.
  // This is intentionally NOT persisted to localStorage.
  chatbotData: null,

  // ─── UI / Control State ────────────────────────────
  loading: false,
  error: null,
  hasInteracted: false,

  // ─── Actions ───────────────────────────────────────

  setSelectedCoords: (coords) =>
    set((state) => {
      const sameLocation =
        state.selectedCoords &&
        state.selectedCoords.lat === coords.lat &&
        state.selectedCoords.lng === coords.lng;

      const next = {
        selectedCoords: coords,
        selectedRadius: sameLocation ? state.selectedRadius : null,
        overview: null,

        // New location = old chatbot context is invalid.
        chatbotData: null,

        error: null,
      };

      saveToStorage({ ...state, ...next });

      return next;
    }),

  setSelectedRadius: (radius) =>
    set((state) => {
      const next = {
        selectedRadius: radius,
        overview: null,

        // New radius = new AreaLens request,
        // therefore old chatbot context must disappear.
        chatbotData: null,

        error: null,
      };

      saveToStorage({ ...state, ...next });

      return next;
    }),

  setOverview: (data) =>
    set((state) => {
      const next = {
        overview: data,
        loading: false,
      };

      saveToStorage({ ...state, ...next });

      return next;
    }),

  // Stores chatbot data only in memory.
  setChatbotData: (data) =>
    set({
      chatbotData: data ?? null,
    }),

  clearChatbotData: () =>
    set({
      chatbotData: null,
    }),

  setLoading: (value) =>
    set({
      loading: value,
    }),

  setError: (message) =>
    set({
      error: message,
      loading: false,
    }),

  // Mark real user interaction.
  setHasInteracted: () =>
    set({
      hasInteracted: true,
    }),

  // ─── Reset ─────────────────────────────────────────

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);

    set({
      selectedCoords: null,
      selectedRadius: null,
      overview: null,

      // Also remove temporary chatbot context.
      chatbotData: null,

      loading: false,
      error: null,
      hasInteracted: false,
    });
  },
}));
