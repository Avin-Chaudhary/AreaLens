import { useEffect } from "react";
import { fetchCurrentUser } from "../services/auth.api";
import { wakeBackend } from "../services/wakeup";
import { useAuthStore } from "../features/auth/auth.store";

const LOGOUT_FLAG = "arealens:loggedOut";

export default function AppInitializer() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Always wake backend (health check)
    wakeBackend();

    const wasLoggedOut = localStorage.getItem(LOGOUT_FLAG);

    // If user explicitly logged out → do not rehydrate
    if (wasLoggedOut) return;

    // Attempt session restore
    fetchCurrentUser()
      .then((data) => {
        if (data?.user || data) {
          // ✅ user is authenticated again → clear logout flag
          localStorage.removeItem(LOGOUT_FLAG);
          setUser(data.user ?? data);
        }
      })
      .catch(() => {
        // silent failure is correct
      });
  }, [setUser]);

  return null;
}
