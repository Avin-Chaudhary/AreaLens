import { useState } from "react";
import { updatePassword } from "../../services/auth.api";
import { useAuthStore } from "../../features/auth/auth.store";

export default function UpdatePasswordModal({ onClose }) {
  const { user } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await updatePassword({
        username: user.username,
        password: currentPassword,
        newPassword,
      });

      setSuccess("Password updated successfully");

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      setError("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
      <div className="bg-white w-[420px] rounded-2xl p-6 shadow-xl animate-scaleIn">

        <h2 className="text-xl font-semibold text-blue-600 mb-4">
          Update Password
        </h2>

        {/* Current Password */}
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Current password"
          className="
            w-full px-4 py-2.5 rounded-xl mb-3
            border border-slate-300
            focus:outline-none focus:ring-2 focus:ring-blue-500
            transition
          "
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        {/* New Password */}
        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New password"
            className="
              w-full px-4 py-2.5 pr-10 rounded-xl
              border border-slate-300
              focus:outline-none focus:ring-2 focus:ring-blue-500
              transition
            "
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Confirm New Password */}
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm new password"
          className="
            w-full px-4 py-2.5 rounded-xl mb-3
            border border-slate-300
            focus:outline-none focus:ring-2 focus:ring-blue-500
            transition
          "
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
        />

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
            onClick={handleUpdate}
            disabled={loading}
            className="
              px-5 py-2 rounded-xl
              bg-blue-600 text-white font-semibold
              shadow-md
              hover:bg-blue-700 hover:-translate-y-0.5
              transition-all
              disabled:opacity-60
            "
          >
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
