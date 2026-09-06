import { useState } from "react";
import { signin, fetchCurrentUser } from "../../services/auth.api";
import { useAuthStore } from "../../features/auth/auth.store";

export default function Signin({ onSuccess }) {
  const { setUser, clearAuthRequired } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignin = async () => {
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await signin({
        username: username.trim(),
        password,
      });

      const freshUser = await fetchCurrentUser();
      setUser(freshUser);
      clearAuthRequired();
      onSuccess?.();
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("Invalid username or password");
      } else {
        setError("Signin failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <input
        placeholder="User ID"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="
          w-full px-4 py-2.5 rounded-xl
          border border-slate-300
          focus:outline-none focus:ring-2 focus:ring-blue-500
          transition
        "
      />

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="
            w-full px-4 py-2.5 pr-10 rounded-xl
            border border-slate-300
            focus:outline-none focus:ring-2 focus:ring-blue-500
            transition
          "
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 transition"
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-sm font-medium">
          {error}
        </p>
      )}

      <button
        onClick={handleSignin}
        disabled={loading}
        className="
          w-full py-3 rounded-xl
          bg-blue-600 text-white font-semibold
          shadow-md
          hover:bg-blue-700 hover:-translate-y-0.5
          transition-all
          disabled:opacity-60
        "
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </div>
  );
}
