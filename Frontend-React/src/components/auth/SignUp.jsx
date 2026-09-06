import { useState } from "react";
import { signup, fetchCurrentUser } from "../../services/auth.api";
import { useAuthStore } from "../../features/auth/auth.store";

export default function Signup({ onSuccess }) {
  const { setUser, clearAuthRequired } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await signup({
        username: username.trim(),
        password,
      });

      const freshUser = await fetchCurrentUser();
      setUser(freshUser);
      clearAuthRequired();
      onSuccess?.();
    } catch (err) {
      if (err?.response?.status === 400) {
        setError("Username already exists");
      } else {
        setError("Signup failed. Please try again.");
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

      <input
        type={showPassword ? "text" : "password"}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="
          w-full px-4 py-2.5 rounded-xl
          border border-slate-300
          focus:outline-none focus:ring-2 focus:ring-blue-500
          transition
        "
      />

      {error && (
        <p className="text-red-600 text-sm font-medium">
          {error}
        </p>
      )}

      <button
        onClick={handleSignup}
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
        {loading ? "Signing up..." : "Sign Up"}
      </button>
    </div>
  );
}
