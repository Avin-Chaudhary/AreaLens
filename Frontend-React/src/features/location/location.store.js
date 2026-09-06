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
      })
    );
  } catch {}
};

const persisted = loadFromStorage();

export const useLocationStore = create((set, get) => ({
  // ─── Persisted State ───────────────────────────────
  selectedCoords: persisted?.selectedCoords ?? null,
  selectedRadius: persisted?.selectedRadius ?? null,
  overview: persisted?.overview ?? null,

  // ─── UI / Control State ────────────────────────────
  loading: false,
  error: null,
  hasInteracted: false, // 🆕 STEP 1

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

  setLoading: (value) =>
    set({
      loading: value,
    }),

  setError: (message) =>
    set({
      error: message,
      loading: false,
    }),

  // 🆕 STEP 1: mark real user interaction
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
      loading: false,
      error: null,
      hasInteracted: false, // 🆕 reset interaction
    });
  },
}));
