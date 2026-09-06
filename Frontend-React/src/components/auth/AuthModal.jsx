import { useState } from "react";
import { useAuthStore } from "../../features/auth/auth.store";
import SignIn from "./SignIn";
import SignUp from "./SignUp";

export default function AuthModal() {
  const { authRequired, clearAuthRequired } = useAuthStore();
  const [activeTab, setActiveTab] = useState("signin");

  if (!authRequired) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[420px] rounded-lg shadow-lg relative">
        {/* Close */}
        <button
          onClick={clearAuthRequired}
          className="absolute top-3 right-4 text-2xl text-gray-500 hover:text-black"
        >
          ×
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <h2 className="text-xl font-semibold text-center mb-4">
            Arealens
          </h2>

          {/* Tabs */}
          <div className="flex justify-center gap-8">
            <button
              onClick={() => setActiveTab("signin")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "signin"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-400"
              }`}
            >
              Sign In
            </button>

            <button
              onClick={() => setActiveTab("signup")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "signup"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-400"
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {activeTab === "signin" ? <SignIn /> : <SignUp />}
        </div>
      </div>
    </div>
  );
}
