import { useEffect, useRef } from "react";
import { fetchCurrentUser } from "../../services/auth.api";
import { useAuthStore } from "../../features/auth/auth.store";

export default function AuthBootstrap({ children }) {
  const setUser = useAuthStore((s) => s.setUser);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const initAuth = async () => {
      try {
        const user = await fetchCurrentUser();
        if (user) {
          setUser(user);
        }
      } catch {
        // ❗ DO NOTHING
        // No logout on refresh
      }
    };

    initAuth();
  }, [setUser]);

  return children;
}
