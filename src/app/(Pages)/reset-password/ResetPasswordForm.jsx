"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound, CheckCircle2 } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function ResetPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't reset your password.");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-green-500 focus:bg-white dark:border-ink-700 dark:bg-ink-800 dark:text-white dark:focus:border-green-400";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-xl dark:border-ink-800 dark:bg-ink-900">
      {showLogin && (
        <AuthModal mode="login" onClose={() => setShowLogin(false)} onSwitch={() => {}} />
      )}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
          {done ? (
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          ) : (
            <KeyRound className="h-6 w-6 text-green-600 dark:text-green-400" />
          )}
        </div>
        <h1 className="font-winky text-2xl font-extrabold text-gray-900 dark:text-white">
          {done ? "Password updated" : "Choose a new password"}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-ink-400">
          {done
            ? "You can now log in with your new password."
            : token
            ? "Enter a new password for your InkShelf account."
            : "This reset link is missing its token. Request a new one from the login screen."}
        </p>
      </div>

      {done ? (
        <button
          onClick={() => setShowLogin(true)}
          className="w-full rounded-xl bg-black py-3 font-semibold text-white hover:bg-gray-800 dark:bg-green-500 dark:text-black dark:hover:bg-green-400"
        >
          Log in
        </button>
      ) : token ? (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="New password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-black py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-green-500 dark:text-black dark:hover:bg-green-400"
          >
            {loading ? "Saving…" : "Update password"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
