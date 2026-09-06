import { useEffect } from "react";
import { fetchLocationOverview } from "../features/location/location.api";
import { useLocationStore } from "../features/location/location.store";
import { useAuthStore } from "../features/auth/auth.store";

export default function useLocationOverview() {
  const {
    selectedCoords,
    selectedRadius,
    setOverview,
    setLoading,
    setError,
  } = useLocationStore();

  const {
    isAuthenticated,
    requireAuth,
    clearAuthRequired,
  } = useAuthStore();

  useEffect(() => {
    // ❌ Do NOTHING if marker or radius not selected
    if (!selectedCoords || !selectedRadius) {
      clearAuthRequired();
      return;
    }

    // ❌ Ask auth ONLY after marker + radius
    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    // ✅ User authenticated → fetch insights
    setLoading(true);

    fetchLocationOverview(
      selectedCoords.lat,
      selectedCoords.lng,
      selectedRadius
    )
      .then((data) => {
        setOverview(data);
      })
      .catch(() => {
        setError("Failed to load insights");
      });
  }, [
    selectedCoords,
    selectedRadius,
    isAuthenticated,
    requireAuth,
    clearAuthRequired,
    setOverview,
    setLoading,
    setError,
  ]);
}
