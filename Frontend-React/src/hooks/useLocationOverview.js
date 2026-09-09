import { useEffect } from "react";
import { fetchLocationOverview } from "../features/location/location.api";
import { useLocationStore } from "../features/location/location.store";
import { useAuthStore } from "../features/auth/auth.store";

export default function useLocationOverview() {
  const {
    selectedCoords,
    selectedRadius,
    setOverview,
    setSessionId,
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
    //
    // Node will:
    // 1. Collect/process the AreaLens data.
    // 2. Create the temporary RAG session.
    // 3. Return the session_id along with the normal overview data.
    setLoading(true);

    fetchLocationOverview(
      selectedCoords.lat,
      selectedCoords.lng,
      selectedRadius,
    )
      .then((data) => {
        // Existing AreaLens data.
        setOverview(data);

        // Store ONLY the session ID for chatbot/RAG.
        //
        // React does not need to receive or store chatbotdata anymore.
        setSessionId(data?.session_id ?? null);
      })
      .catch((err) => {
        console.error("Location overview error:", err);

        // If the AreaLens request fails,
        // don't keep a previous RAG session alive in React.
        setSessionId(null);

        setError("Failed to load insights");
      });
  }, [
    selectedCoords,
    selectedRadius,
    isAuthenticated,
    requireAuth,
    clearAuthRequired,
    setOverview,
    setSessionId,
    setLoading,
    setError,
  ]);
}
