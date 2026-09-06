import { useState } from "react";
import { deleteAccount } from "../../services/auth.api";
import { useAuthStore } from "../../features/auth/auth.store";
import { useLocationStore } from "../../features/location/location.store";

export default function DeleteAccountModal({ onClose }) {
  const { user, clearUser } = useAuthStore();
  const clearLocation = useLocationStore((s) => s.clearAll);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await deleteAccount({
        username: user.username,
        password,
      });

      setSuccess("Account deleted successfully");

      setTimeout(() => {
        clearUser();
        clearLocation();
        onClose();
      }, 1500);
    } catch {
      setError("Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
      <div className="bg-white w-[420px] rounded-2xl p-6 shadow-xl animate-scaleIn">

        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Delete Account
        </h2>

        <p className="text-sm text-slate-600 mb-4">
          This action is permanent. Please confirm your password to continue.
        </p>

        {/* Password */}
        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm password"
            className="
              w-full px-4 py-2.5 pr-10 rounded-xl
              border border-slate-300
              focus:outline-none focus:ring-2 focus:ring-red-500
              transition
            "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-600"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-2">
            {error}
          </p>
        )}

        {success && (
          <p className="text-emerald-600 text-sm mb-2">
            {success}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="
              px-5 py-2 rounded-xl
              bg-red-600 text-white font-semibold
              shadow-md
              hover:bg-red-700 hover:-translate-y-0.5
              transition-all
              disabled:opacity-60
            "
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
