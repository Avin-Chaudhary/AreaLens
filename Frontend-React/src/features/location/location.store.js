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

  // ─── Temporary Chatbot / RAG State ─────────────────

  // Session ID belongs to the currently selected area.
  // It is intentionally NOT persisted to localStorage.
  sessionId: null,

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

        // New location = old RAG session is no longer valid.
        sessionId: null,

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

        // New radius = new AreaLens analysis,
        // therefore create/use a new RAG session.
        sessionId: null,

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

  // Stores the temporary RAG session ID.
  setSessionId: (sessionId) =>
    set({
      sessionId: sessionId ?? null,
    }),

  clearSessionId: () =>
    set({
      sessionId: null,
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

      // Remove the temporary RAG session.
      sessionId: null,

      loading: false,
      error: null,
      hasInteracted: false,
    });
  },
}));
