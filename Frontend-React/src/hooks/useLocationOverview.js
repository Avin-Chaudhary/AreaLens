import { useEffect } from "react";
import { fetchLocationOverview } from "../features/location/location.api";
import { useLocationStore } from "../features/location/location.store";
import { useAuthStore } from "../features/auth/auth.store";

export default function useLocationOverview() {
  const {
    selectedCoords,
    selectedRadius,
    setOverview,
    setChatbotData,
    setLoading,
    setError,
  } = useLocationStore();

  const { isAuthenticated, requireAuth, clearAuthRequired } = useAuthStore();

  useEffect(() => {
    // No marker or radius selected.
    if (!selectedCoords || !selectedRadius) {
      clearAuthRequired();
      return;
    }

    // Ask authentication only after marker + radius.
    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    // Authenticated → fetch AreaLens data.
    setLoading(true);

    fetchLocationOverview(
      selectedCoords.lat,
      selectedCoords.lng,
      selectedRadius,
    )
      .then((data) => {
        // Existing AreaLens data.
        setOverview(data);

        // New chatbot context for ONLY this area.
        setChatbotData(data?.chatbotdata ?? null);
      })
      .catch((err) => {
        console.error("Location overview error:", err);

        // If request fails, don't leave chatbot
        // context from a previous successful request.
        setChatbotData(null);

        setError("Failed to load insights");
      });
  }, [
    selectedCoords,
    selectedRadius,
    isAuthenticated,
    requireAuth,
    clearAuthRequired,
    setOverview,
    setChatbotData,
    setLoading,
    setError,
  ]);
}
